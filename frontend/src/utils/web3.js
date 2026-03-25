import { ethers } from 'ethers'

export const CHAIN_ID = 80002
export const CHAIN_CONFIG = {
  chainId: '0x13882',
  chainName: 'Polygon Amoy Testnet',
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
}

export async function connectWallet() {
  // if no provider, return a random dummy address for development/demo
  if (!window.ethereum) {
    const fake = '0x' + Array.from({length:40},()=>Math.floor(Math.random()*16).toString(16)).join('')
    return { provider: null, signer: null, address: fake }
  }
  const provider = new ethers.BrowserProvider(window.ethereum)
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  // Switch to Polygon Amoy (network selection is optional)
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_CONFIG.chainId }] })
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [CHAIN_CONFIG] })
    }
  }
  return { provider, signer, address }
}

export async function signMessage(signer, message) {
  return signer.signMessage(message)
}

export function shortAddr(addr) {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

export function generateTokenId() {
  return 'NFT-' + Date.now().toString(36).toUpperCase()
}
