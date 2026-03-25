import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function Blockchain() {
  const [txs, setTxs] = useState([])
  
  useEffect(() => { 
    api.get('/txlog').then(r=>setTxs(r.data)).catch(()=>{}) 
  }, [])

  const typeStyles = (txType) => {
    const styles = {
      mint: { background: 'rgba(251, 191, 36, 0.15)', borderColor: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' },
      lost: { background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' },
      found: { background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' },
      reward: { background: 'rgba(249, 115, 22, 0.15)', borderColor: 'rgba(249, 115, 22, 0.3)', color: '#fdba74' },
      police_log: { background: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }
    }
    return styles[txType] || { background: '#1c1917', borderColor: '#44403c', color: '#78716c' }
  }

  const gradientTextStyle = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }

  return (
    <div className="card">
      <div className="card-title" style={gradientTextStyle}>📋 Activity Log</div>
      <div className="flex items-center gap-2 mb-5">
        <span className="mono text-xs" style={{color:'#78716c'}}>Smart Contract:</span>
        <span className="mono text-xs border px-3 py-1 rounded break-all" style={{background:'#1c1917',borderColor:'#44403c',color:'#78716c'}}>0x4f8a2e1b3c9d7f0e6a5b2c8d1e4f7a0b3c6d9e2f</span>
      </div>
      <div>
        {txs.map((tx, i) => {
          const style = typeStyles(tx.tx_type)
          return (
            <div key={tx.id || i} className="flex gap-3 py-3 border-b items-start" style={{borderColor:'#292524'}}>
              <span className="mono text-[10px] px-2 py-1 rounded font-bold tracking-widest whitespace-nowrap" style={style}>
                {tx.tx_type ? tx.tx_type.toUpperCase() : 'UNKNOWN'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{color:'#fef3c7'}}>{tx.description}</div>
                {tx.tx_hash && <div className="mono text-xs mt-0.5 truncate" style={{color:'#fbbf24'}}>{tx.tx_hash}</div>}
              </div>
              <div className="mono text-xs whitespace-nowrap" style={{color:'#78716c'}}>
                {tx.created_at ? new Date(tx.created_at).toLocaleTimeString() : ''}
              </div>
            </div>
          )
        })}
        {!txs.length && (
          <div className="text-center py-12" style={{color:'#78716c'}}>
            <div className="text-4xl mb-2">📋</div>
            <div>No activity yet</div>
          </div>
        )}
      </div>
    </div>
  )
}

