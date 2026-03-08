import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function StatsBar() {
  const [stats, setStats] = useState({ total_registered: 0, active_lost: 0, returned: 0, total_rewards_paid: 0 })
  
  useEffect(() => { 
    api.get('/items/stats').then(r => setStats(r.data)).catch(() => {}) 
  }, [])
  
  const items = [
    { v: stats.total_registered, l: 'Items Registered', color: '#fbbf24', icon: '📦' },
    { v: stats.active_lost, l: 'Active Lost', color: '#ef4444', icon: '🚨' },
    { v: stats.returned, l: 'Items Returned', color: '#10b981', icon: '✅' },
    { v: `₹${Number(stats.total_rewards_paid || 0).toFixed(0)}`, l: 'Rewards Paid', color: '#f97316', icon: '💰' },
  ]
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {items.map((s, i) => (
        <div 
          key={i} 
          className="card text-center animate-slide-in group cursor-pointer" 
          style={{ 
            borderColor: 'rgba(251, 191, 36, 0.2)',
            animationDelay: `${i * 0.1}s`,
            transition: 'all 0.3s ease'
          }}
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
            style={{ 
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)' 
            }}
          />
          
          <div className="relative z-10">
            <div className="text-3xl mb-2 animate-float" style={{ animationDelay: `${i * 0.2}s` }}>
              {s.icon}
            </div>
            <div className="text-3xl md:text-4xl font-bold" style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>{s.v}</div>
            <div className="text-sm mt-2 font-medium" style={{ color: '#94a3b8' }}>{s.l}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

