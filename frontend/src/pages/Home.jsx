import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import ItemCard from '../components/ItemCard'
import StatsBar from '../components/StatsBar'

export default function Home({ wallet, setShowAuthModal }) {
  const [lost, setLost] = useState([])
  const [found, setFound] = useState([])
  const [top, setTop] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    api.get('/items?status=lost').then(r => setLost(r.data.slice(0,4))).catch(()=>{})
    api.get('/found').then(r => setFound(r.data.slice(0,2))).catch(()=>{})
    api.get('/reputation/leaderboard').then(r => setTop(r.data.slice(0,3))).catch(()=>{})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      nav(`/match?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section with Real Colorful Search */}
      <div className="relative overflow-hidden rounded-3xl py-16 px-6 text-center" 
        style={{ 
          background: 'linear-gradient(180deg, #0f172a 0%, #1a1512 50%, #0c0a09 100%)',
          border: '1px solid rgba(251, 191, 36, 0.2)'
        }}>
        
        {/* Animated background effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 animate-pulse" 
            style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)', animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 animate-pulse" 
            style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)', animationDuration: '5s' }} />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" 
            style={{ 
              backgroundImage: 'linear-gradient(rgba(251, 191, 36, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 191, 36, 0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} 
          />
        </div>

        {/* Main Search Box - Real Colorful */}
        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Real colorful search icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-4"
              style={{ 
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #f97316 50%, #ea580c 75%, #fbbf24 100%)',
                backgroundSize: '300% 300%',
                animation: 'gradientMove 4s ease infinite',
                boxShadow: '0 20px 60px rgba(251, 191, 36, 0.4), inset 0 2px 10px rgba(255,255,255,0.2)'
              }}>
              <svg className="w-14 h-14 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Animated title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: '#fef3c7' }}>
            Find Anything, <span style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%',
              animation: 'gradientMove 3s ease infinite'
            }}>Anywhere</span>
          </h1>
          
          <p className="mb-8 text-lg" style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 30px' }}>
            The decentralized blockchain-powered lost & found platform
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative mb-8">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for lost or found items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-5 pl-14 pr-36 rounded-2xl text-lg"
                style={{ 
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '2px solid rgba(251, 191, 36, 0.3)',
                  color: '#f1f5f9',
                  outline: 'none',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
                }}
              />
              <svg 
                className="absolute left-5 w-6 h-6"
                style={{ color: '#fbbf24' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                  color: '#1c1917',
                  boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)'
                }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#fbbf24' }}>2,500+</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Items Registered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#f97316' }}>1,200+</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Items Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#fbbf24' }}>850+</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Happy Users</div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20" 
          style={{ background: 'linear-gradient(transparent, #0f172a)' }} 
        />
      </div>
      
      <StatsBar />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lost Items */}
        <div className="card animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-title flex items-center gap-2" style={{ borderBottomColor: '#f97316' }}>
            <span>🚨</span> Items Currently Lost
          </div>
          <div className="grid grid-cols-2 gap-4">
            {lost.map((i, index) => (
              <div key={i.token_id} className="animate-slide-in" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                <ItemCard item={i} onClick={()=>nav('/lost')} />
              </div>
            ))}
            {!lost.length && (
              <div className="col-span-2 text-center py-8 animate-fade-in" style={{ color: '#78716c' }}>
                <div className="text-4xl mb-2">🔍</div>
                <div>No lost items reported</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Found Items & Top Finders */}
        <div className="space-y-6">
          {/* Found Items */}
          <div className="card animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="card-title flex items-center gap-2" style={{ borderBottomColor: '#f97316' }}>
              <span>✅</span> Recently Found
            </div>
            <div className="space-y-3">
              {found.map((r, index) => (
                <div key={r.id} className="p-4 rounded-xl animate-slide-in" 
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)', 
                    border: '1px solid rgba(251, 191, 36, 0.1)',
                    animationDelay: `${0.4 + index * 0.1}s`
                  }}>
                  <div className="badge badge-found mb-2">FOUND</div>
                  <div className="font-medium mb-1" style={{ color: '#fef3c7' }}>{r.description?.slice(0,50)}...</div>
                  <div className="text-sm flex items-center gap-1" style={{ color: '#a8a29e' }}>
                    <span>📍</span> {r.location}
                  </div>
                </div>
              ))}
              {!found.length && (
                <div className="text-center py-6 animate-fade-in" style={{ color: '#78716c' }}>
                  No found reports yet
                </div>
              )}
            </div>
          </div>
          
          {/* Top Finders */}
          <div className="card animate-slide-in" style={{ animationDelay: '0.4s' }}>
            <div className="card-title flex items-center gap-2" style={{ borderBottomColor: '#f97316' }}>
              <span>🏆</span> Top Finders
            </div>
            <div className="space-y-3">
              {top.map((f, i) => (
                <div key={f.wallet_address} className="flex items-center gap-3 p-3 rounded-xl animate-slide-in"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)', 
                    border: '1px solid rgba(251, 191, 36, 0.1)',
                    animationDelay: `${0.5 + i * 0.1}s`
                  }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl animate-float" 
                    style={{ 
                      background: i === 0 
                        ? 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' 
                        : i === 1 
                        ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' 
                        : 'linear-gradient(135deg, #d97706 0%, #c2410c 100%)',
                      boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
                      animationDelay: `${i * 0.2}s`
                    }}>
                    {i===0?'🏆':i===1?'🥈':'🥉'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" style={{ color: '#fef3c7' }}>
                      {f.display_name || f.wallet_address.slice(0,8)+'...'}
                    </div>
                    <div className="mono text-xs" style={{ color: '#78716c' }}>{f.wallet_address.slice(0,12)}...</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg" style={{ 
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)', 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent' 
                    }}>{f.total_score}</div>
                    <div className="text-xs" style={{ color: '#78716c' }}>{f.return_count} returns</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

