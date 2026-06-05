import { defineChain } from 'viem';

export const ZKSYNC_CHAIN_ID = 324;

export const supportedChains = [
  defineChain({
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://eth.drpc.org'] } },
    blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
  }),
  defineChain({
    id: 8453,
    name: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
    blockExplorers: { default: { name: 'Basescan', url: 'https://basescan.org' } },
  }),
  defineChain({
    id: 57073,
    name: 'Ink',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc-gel.inkonchain.com'] } },
    blockExplorers: { default: { name: 'Ink Explorer', url: 'https://explorer.inkonchain.com' } },
  }),
  defineChain({
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] } },
    blockExplorers: { default: { name: 'Arbiscan', url: 'https://arbiscan.io' } },
  }),
  defineChain({
    id: 10,
    name: 'OP Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://mainnet.optimism.io'] } },
    blockExplorers: { default: { name: 'Optimism Explorer', url: 'https://optimistic.etherscan.io' } },
  }),
  defineChain({
    id: 137,
    name: 'Polygon',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    rpcUrls: { default: { http: ['https://polygon.drpc.org'] } },
    blockExplorers: { default: { name: 'Polygonscan', url: 'https://polygonscan.com' } },
  }),
  defineChain({
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: { default: { http: ['https://bsc-dataseed.bnbchain.org'] } },
    blockExplorers: { default: { name: 'BscScan', url: 'https://bscscan.com' } },
  }),
  defineChain({
    id: 100,
    name: 'Gnosis Chain',
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.gnosischain.com'] } },
    blockExplorers: { default: { name: 'Gnosisscan', url: 'https://gnosisscan.io' } },
  }),
  defineChain({
    id: 59144,
    name: 'Linea',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.linea.build'] } },
    blockExplorers: { default: { name: 'Lineascan', url: 'https://lineascan.build' } },
  }),
  defineChain({
    id: 81457,
    name: 'Blast',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.blast.io'] } },
    blockExplorers: { default: { name: 'Blastscan', url: 'https://blastscan.io' } },
  }),
  defineChain({
    id: 34443,
    name: 'Mode',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://mode.drpc.org'] } },
    blockExplorers: { default: { name: 'Modescan', url: 'https://modescan.io' } },
  }),
  defineChain({
    id: 1868,
    name: 'Soneium',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.soneium.org'] } },
    blockExplorers: { default: { name: 'Soneium Explorer', url: 'https://soneium.blockscout.com' } },
  }),
  defineChain({
    id: 324,
    name: 'zkSync Era',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://mainnet.era.zksync.io'] } },
    blockExplorers: { default: { name: 'zkSync Explorer', url: 'https://era.zksync.network' } },
  }),
  defineChain({
    id: 80094,
    name: 'Berachain',
    nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
    rpcUrls: { default: { http: ['https://berachain.drpc.org'] } },
    blockExplorers: { default: { name: 'Berascan', url: 'https://berascan.com' } },
  }),
  defineChain({
    id: 130,
    name: 'Unichain',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://mainnet.unichain.org'] } },
    blockExplorers: { default: { name: 'Uniscan', url: 'https://uniscan.xyz' } },
  }),
  defineChain({
    id: 480,
    name: 'World Chain',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] } },
    blockExplorers: { default: { name: 'World Chain Explorer', url: 'https://worldchain-mainnet.explorer.alchemy.com' } },
  }),
  defineChain({
    id: 1135,
    name: 'Lisk',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.api.lisk.com'] } },
    blockExplorers: { default: { name: 'Lisk Explorer', url: 'https://blockscout.lisk.com' } },
  }),
  defineChain({
    id: 60808,
    name: 'Bob',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.gobob.xyz'] } },
    blockExplorers: { default: { name: 'Bob Explorer', url: 'https://explorer.gobob.xyz' } },
  }),
  defineChain({
    id: 98866,
    name: 'Plume',
    nativeCurrency: { name: 'Plume', symbol: 'PLUME', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.plume.org'] } },
    blockExplorers: { default: { name: 'Plume Explorer', url: 'https://explorer.plume.org' } },
  }),
  defineChain({
    id: 7777777,
    name: 'Zora',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.zora.energy'] } },
    blockExplorers: { default: { name: 'Zora Explorer', url: 'https://explorer.zora.energy' } },
  }),
];

// Сети с предупреждениями
export const CHAIN_WARNINGS: Record<number, string> = {
  324: '⚠️ zkSync Era may not fully support EIP-7702. Transaction may fail.',
};

export function getChainById(id: number) {
  return supportedChains.find((c) => c.id === id) ?? null;
}

export function getChainWarning(id: number): string | null {
  return CHAIN_WARNINGS[id] ?? null;
}
