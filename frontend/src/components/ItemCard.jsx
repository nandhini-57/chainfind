export default function ItemCard({ item, onClick }) {
  const badges = {
    'lost': 'badge-lost',
    'found': 'badge-found',
    'registered': 'badge-registered',
    'returned': 'badge-returned'
  }
  const icons = {
    'Wallet / Purse': '👛',
    'Phone / Tablet': '📱',
    'Keys': '🔑',
    'Bag / Backpack': '🎒',
    'Jewellery': '💍',
    'Documents': '📄',
    'Electronics': '💻',
    'Other': '📦'
  }
  
  const cardStyle = {
    background: '#1c1917',
    border: '1px solid #44403c',
    transition: 'all 0.3s ease'
  }
  
  return (
    <div 
      onClick={onClick} 
      className="p-4 rounded-xl cursor-pointer transition-all hover:border-yellow-400 animate-slide-in"
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#fbbf24'
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(251, 191, 36, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#44403c'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div className={`badge ${badges[item.status] || 'badge-registered'} mb-2`}>
        {item.status ? item.status.toUpperCase() : 'REGISTERED'}
      </div>
      <div className="font-semibold mb-1" style={{ color: '#fef3c7' }}>
        {icons[item.category] || '📦'} {item.name}
      </div>
      <div className="text-sm" style={{ color: '#a8a29e' }}>
        {item.description ? item.description.slice(0, 30) + '...' : 'No description'}
      </div>
      <div className="mono text-xs mt-2" style={{ color: '#78716c' }}>{item.token_id}</div>
    </div>
  )
}

