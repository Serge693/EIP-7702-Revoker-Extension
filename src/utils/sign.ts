export async function signAuthorizationWithPrivateKey(
  privateKey: `0x${string}`,
  chainId: number,
  contractAddress: `0x${string}`,
  nonce: number,
): Promise<{ r: `0x${string}`; s: `0x${string}`; yParity: number }> {
  const { privateKeyToAccount } = await import('viem/accounts');
  const { createWalletClient, http } = await import('viem');
  const { getChainById } = await import('./networks');

  const account = privateKeyToAccount(privateKey);
  const chain = getChainById(chainId);
  if (!chain) throw new Error(`Unknown chain ${chainId}`);

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  });

  const authorization = await walletClient.signAuthorization({
    contractAddress,
    chainId,
    nonce,
  });

  return {
    r: authorization.r,
    s: authorization.s,
    yParity: authorization.yParity ?? 0,
  };
}

export async function signAuthorizationViaProvider(
  provider: any,
  address: `0x${string}`,
  chainId: number,
  contractAddress: `0x${string}`,
  nonce: number,
): Promise<{ r: `0x${string}`; s: `0x${string}`; yParity: number }> {
  try {
    const result = await provider.request({
      method: 'wallet_signAuthorization',
      params: [{ chainId: `0x${chainId.toString(16)}`, address: contractAddress, nonce: `0x${nonce.toString(16)}` }],
    });
    return {
      r: result.r,
      s: result.s,
      yParity: typeof result.yParity === 'number' ? result.yParity : parseInt(result.yParity, 16),
    };
  } catch { }

  try {
    const result = await provider.request({
      method: 'eth_signAuthorization',
      params: [{ chainId: `0x${chainId.toString(16)}`, address: contractAddress, nonce: `0x${nonce.toString(16)}` }],
    });
    return {
      r: result.r,
      s: result.s,
      yParity: typeof result.yParity === 'number' ? result.yParity : parseInt(result.yParity, 16),
    };
  } catch { }

  throw new Error('Your wallet does not support EIP-7702 signing. Please use the Private Key option.');
}