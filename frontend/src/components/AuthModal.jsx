import { useState, useEffect } from 'react'

export default function AuthModal({ isOpen, onClose, onConnect }) {
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      setShow(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-md mx-4 p-8 rounded-2xl"
        style={{ 
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(251, 191, 36, 0.1)',
          animation: 'modalSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Decorative glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full opacity-30" 
          style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)' }}></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-30" 
          style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)' }}></div>
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
              boxShadow: '0 10px 30px rgba(251, 191, 36, 0.4)'
            }}>
            <span className="text-4xl">🔍</span>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#fef3c7' }}>
            Welcome to ChainFind
          </h2>
          <p style={{ color: '#94a3b8' }}>
            The decentralized lost & found platform
          </p>
        </div>

        {/* Features list */}
        <div className="mb-8 space-y-3">
          {[
            { icon: '🔐', text: 'Secure blockchain verification' },
            { icon: '🤖', text: 'AI-powered item matching' },
            { icon: '🗺️', text: 'Interactive location map' },
            { icon: '💬', text: 'Anonymous chat with finders' },
            { icon: '⭐', text: 'Trust & reputation system' }
          ].map((feature, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ 
                background: 'rgba(251, 191, 36, 0.05)',
                border: '1px solid rgba(251, 191, 36, 0.1)',
                animation: `slideIn 0.3s ease-out ${i * 0.1}s both`
              }}
            >
              <span className="text-xl">{feature.icon}</span>
              <span style={{ color: '#e2e8f0' }}>{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onConnect()
              onClose()
            }}
            className="w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
              color: '#1c1917',
              boxShadow: '0 10px 30px rgba(251, 191, 36, 0.3)'
            }}
          >
            <span>🦊</span>
            Connect Wallet to Continue
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-xl font-medium transition-all hover:scale-[1.02]"
            style={{ 
              background: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8'
            }}
          >
            Browse as Guest
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs" style={{ color: '#64748b' }}>
          By continuing, you agree to our Terms of Service
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

