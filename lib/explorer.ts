// Arbiscan explorer links for on-chain proof verification
import { CHAIN } from './types';

export function txExplorerUrl(txHash: string): string {
  if (CHAIN.chainId === 421614) {
    return `https://sepolia.arbiscan.io/tx/${txHash}`;
  }
  return `https://arbiscan.io/tx/${txHash}`;
}

export function blockExplorerUrl(blockNumber: number): string {
  if (CHAIN.chainId === 421614) {
    return `https://sepolia.arbiscan.io/block/${blockNumber}`;
  }
  return `https://arbiscan.io/block/${blockNumber}`;
}

export function contractExplorerUrl(address: string): string {
  if (CHAIN.chainId === 421614) {
    return `https://sepolia.arbiscan.io/address/${address}`;
  }
  return `https://arbiscan.io/address/${address}`;
}

export function addressExplorerUrl(address: string): string {
  return contractExplorerUrl(address);
}
