import { getChainById } from './networks';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

interface Authorization {
  chainId: number;
  address: `0x${string}`;
  nonce: number;
  r: `0x${string}`;
  s: `0x${string}`;
  yParity: number;
}

const GAS_FALLBACK: Record<number, bigint> = {
  1:       200000n,
  8453:    200000n,
  57073:   200000n, // Ink
  42161:   200000n,
  10:      200000n,
  137:     2000000n,
  56:      500000n,
  100:     300000n,
  59144:   300000n,
  81457:   300000n,
  34443:   300000n,
  1868:    300000n,
  324:     500000n,
  80094:   2000000n,
  130:     200000n,
  480:     200000n,
  1135:    200000n,
  60808:   200000n,
  7777777: 200000n,
};

const DEFAULT_GAS = 300000n;

function getFallbackGas(chainId: number): bigint {
  return GAS_FALLBACK[chainId] ?? DEFAULT_GAS;
}

export async function getNonce(address: `0x${string}`, chainId: number): Promise<number> {
  const chain = getChainById(chainId);
  const res = await fetch(chain!.rpcUrls.default.http[0], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', method: 'eth_getTransactionCount',
      params: [address, 'pending'], id: 1,
    }),
  });
  const data = await res.json();
  return parseInt(data.result, 16);
}

export async function checkDelegation(
  address: `0x${string}`,
  chainId: number,
): Promise<{ delegated: boolean; delegateTo: string | null }> {
  const chain = getChainById(chainId);
  const res = await fetch(chain!.rpcUrls.default.http[0], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', method: 'eth_getCode',
      params: [address, 'latest'], id: 1,
    }),
  });
  const data = await res.json();
  const code: string = data.result ?? '0x';
  const delegated = typeof code === 'string' && code.toLowerCase().startsWith('0xef0100');
  const delegateTo = delegated ? `0x${code.slice(8)}` : null;
  return { delegated, delegateTo };
}

export async function sendSponsoredRevoke(
  sponsorPrivateKey: `0x${string}`,
  targetAddress: `0x${string}`,
  authorization: Authorization,
  chainId: number,
): Promise<string> {
  const chain = getChainById(chainId);
  if (!chain) throw new Error(`Unknown chain ${chainId}`);

  const sponsorAccount = privateKeyToAccount(sponsorPrivateKey);
  const rpcUrl = chain.rpcUrls.default.http[0];

  const walletClient = createWalletClient({
    account: sponsorAccount,
    chain,
    transport: http(rpcUrl),
  });

  // Gas estimation через прямой RPC
  let gas = getFallbackGas(chainId);
  try {
    const estimateRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_estimateGas',
        params: [{
          from: sponsorAccount.address,
          to: targetAddress,
          value: '0x0',
          data: '0x',
          authorizationList: [{
            chainId: `0x${authorization.chainId.toString(16)}`,
            address: authorization.address,
            nonce: `0x${authorization.nonce.toString(16)}`,
            r: authorization.r,
            s: authorization.s,
            yParity: `0x${authorization.yParity.toString(16)}`,
          }],
        }],
        id: 1,
      }),
    });
    const estimateData = await estimateRes.json();
    if (estimateData.result) {
      const estimated = BigInt(estimateData.result);
      gas = (estimated * 150n) / 100n;
      if (chainId === 137 && gas < 2000000n) gas = 2000000n;
      if (chainId === 80094 && gas < 2000000n) gas = 2000000n;
    }
  } catch { }

  // Fee estimation
  let maxFeePerGas = 300000000n;
  let maxPriorityFeePerGas = 100000000n;
  try {
    const blockRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'eth_getBlockByNumber',
        params: ['latest', false], id: 1,
      }),
    });
    const blockData = await blockRes.json();
    if (blockData.result?.baseFeePerGas) {
      const base = BigInt(blockData.result.baseFeePerGas);
      maxPriorityFeePerGas = 100000000n;
      maxFeePerGas = (base * 2n) + maxPriorityFeePerGas;
    }
  } catch { }

  // Polygon минимальный priority fee 30 gwei
  if (chainId === 137) {
    const minPriority = 30000000000n;
    if (maxPriorityFeePerGas < minPriority) {
      maxPriorityFeePerGas = minPriority;
      maxFeePerGas = maxFeePerGas + minPriority;
    }
  }

  // BSC минимальный priority fee 3 gwei
  if (chainId === 56) {
    const minPriority = 3000000000n;
    if (maxPriorityFeePerGas < minPriority) {
      maxPriorityFeePerGas = minPriority;
      maxFeePerGas = maxFeePerGas + minPriority;
    }
  }

  const txHash = await walletClient.sendTransaction({
    to: targetAddress,
    authorizationList: [authorization],
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  return txHash;
}
