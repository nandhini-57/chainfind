import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import Chatbot from './components/Chatbot'
import AuthModal from './components/AuthModal'
import Home from './pages/Home'
import Register from './pages/Register'
import ReportLost from './pages/ReportLost'
import ReportFound from './pages/ReportFound'
import AIMatch from './pages/AIMatch'
import MapView from './pages/MapView'
import Chat from './pages/Chat'
import Reputation from './pages/Reputation'
import Police from './pages/Police'
import Blockchain from './pages/Blockchain'
import { connectWallet, signMessage } from './utils/web3'
import { setToken, getToken } from './utils/api'
import api from './utils/api'
import { toast } from './utils/toast'

function AppContent() {
  const [wallet, setWallet] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = getToken()
    if (token && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length) setWallet(accounts[0])
      })
    }
    
    // Check if user has visited before
    const hasVisited = localStorage.getItem('chainfind_visited')
    if (!hasVisited && !wallet) {
      setTimeout(() => setShowAuthModal(true), 500)
    } else {
      setIsFirstVisit(false)
    }
  }, [])

  useEffect(() => {
    if (wallet) {
      localStorage.setItem('chainfind_visited', 'true')
      setShowAuthModal(false)
    }
  }, [wallet])

  async function handleConnect() {
    if (connecting) return wallet
    setConnecting(true)
    try {
      const { signer, address } = await connectWallet()
      if (signer) {
        const message = `ChainFind Login\nWallet: ${address}\nNonce: ${Date.now()}`
        const signature = await signMessage(signer, message)
        const res = await api.post('/auth/login', { wallet_address: address, message, signature })
        setToken(res.data.access_token)
      } else {
        const res = await api.post('/auth/dev-login', { wallet_address: address })
        setToken(res.data.access_token)
      }
      setWallet(address)
      localStorage.setItem('chainfind_visited', 'true')
      toast('Wallet connected successfully')
      return address
    } catch(e) {
      console.error('Connect failed:', e)
      toast(e?.message || 'Wallet connection failed', 'error')
      return null
    } finally {
      setConnecting(false)
    }
  }

  const pageProps = { wallet, onConnect: handleConnect, setShowAuthModal, connecting }
  const handleChatbotNavigate = (path) => navigate(path)

  return (
    <div className="min-h-screen relative">
      <Navbar wallet={wallet} onConnect={handleConnect} setShowAuthModal={setShowAuthModal} connecting={connecting} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Home {...pageProps}/>} />
          <Route path="/register" element={<Register {...pageProps}/>} />
          <Route path="/lost" element={<ReportLost {...pageProps}/>} />
          <Route path="/found" element={<ReportFound {...pageProps}/>} />
          <Route path="/match" element={<AIMatch {...pageProps}/>} />
          <Route path="/map" element={<MapView {...pageProps}/>} />
          <Route path="/chat" element={<Chat {...pageProps}/>} />
          <Route path="/reputation" element={<Reputation {...pageProps}/>} />
          <Route path="/police" element={<Police {...pageProps}/>} />
          <Route path="/blockchain" element={<Blockchain {...pageProps}/>} />
        </Routes>
      </main>
      <Toast />
      <Chatbot onNavigate={handleChatbotNavigate} />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false)
          setIsFirstVisit(false)
        }} 
        onConnect={handleConnect}
        connecting={connecting}
      />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
