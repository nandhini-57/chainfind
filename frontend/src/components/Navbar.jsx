import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { shortAddr } from '../utils/web3'

const TABS = [
  { path:'/', label:'Home', icon:'🏠' },
  { path:'/register', label:'Register Item', icon:'📦' },
  { path:'/lost', label:'Report Lost', icon:'🚨' },
  { path:'/found', label:'Report Found', icon:'✅' },
  { path:'/match', label:'Find Matches', icon:'🔍' },
  { path:'/map', label:'View Map', icon:'🗺️' },
  { path:'/chat', label:'Messages', icon:'💬' },
  { path:'/reputation', label:'Trusted Users', icon:'⭐' },
  { path:'/police', label:'Police Reports', icon:'🚔' },
  { path:'/blockchain', label:'Activity Log', icon:'📋' },
]

export default function Navbar({ wallet, onConnect, setShowAuthModal }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Amber/Orange gradient text style
  const gradientTextStyle = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }

  // Amber/Orange logo gradient
  const logoGradient = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)'
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/match?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="sticky top-0 z-50" style={{ 
      background: 'rgba(15, 23, 42, 0.95)', 
      borderBottom: '1px solid rgba(251, 191, 36, 0.2)',
      backdropFilter: 'blur(20px)'
    }}>
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl animate-float group-hover:scale-110 transition-transform" style={logoGradient}>
              🔍
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
                Chain<span style={gradientTextStyle}>Find</span>
              </div>
              <div className="mono text-[9px]" style={{ color: '#f97316', letterSpacing: '0.15em' }}>DECENTRALISED</div>
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search items, categories, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-11 rounded-xl text-sm"
              style={{ 
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                color: '#f1f5f9',
                outline: 'none'
              }}
            />
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: '#fbbf24' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>
        
        <div className="flex items-center gap-3">
          {wallet ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl animate-fade-in" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)', 
                border: '1px solid rgba(251, 191, 36, 0.3)' 
              }}>
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" 
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24, #f97316)', 
                  boxShadow: '0 0 10px #f97316' 
                }}
              />
              <span className="mono text-xs font-medium" style={{ color: '#fbbf24' }}>
                {shortAddr(wallet)}
              </span>
            </div>
          ) : (
            <button 
              className="py-2 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105 hover:shadow-lg"
              onClick={() => onConnect()}
              style={{ 
                background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                color: '#1c1917',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
              }}
            >
              <span>🦊</span>
              Connect
            </button>
          )}
        </div>
      </div>
      
      <nav className="flex gap-1 px-4 py-2 overflow-x-auto" style={{ 
        background: 'rgba(15, 23, 42, 0.6)', 
        borderTop: '1px solid rgba(251, 191, 36, 0.1)' 
      }}>
        {TABS.map((t, index) => (
          <Link 
            key={t.path} 
            to={t.path}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all animate-slide-in relative group"
            style={{ 
              background: loc.pathname === t.path 
                ? 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' 
                : 'transparent',
              color: loc.pathname === t.path ? '#1c1917' : '#94a3b8',
              animationDelay: `${index * 0.03}s`
            }}
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <span className="group-hover:scale-110 transition-transform">{t.icon}</span>
              {t.label}
            </span>
            {!loc.pathname === t.path && (
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" 
                style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)' }} 
              />
            )}
          </Link>
        ))}
      </nav>
    </header>
  )
}

