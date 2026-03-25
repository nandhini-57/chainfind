import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function Reputation({ wallet }) {
  const [board, setBoard] = useState([])
  const [me, setMe] = useState(null)
  useEffect(() => {
    api.get('/reputation/leaderboard').then(r=>setBoard(r.data)).catch(()=>{})
    if (wallet) api.get('/reputation/me').then(r=>setMe(r.data)).catch(()=>{})
  }, [wallet])

  const rankIcon = r => r===1?'🏆':r===2?'🥈':'🥉'

  // Get badge info based on score
  const getBadgeInfo = (score) => {
    if (score >= 500) return { name: 'Gold Finder', color: '#fbbf24', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)', icon: '👑' }
    if (score >= 200) return { name: 'Silver Finder', color: '#94a3b8', gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', icon: '🥈' }
    return { name: 'Bronze Finder', color: '#cd7f32', gradient: 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)', icon: '🥉' }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="card">
          <div className="card-title">⭐ Top Finders</div>
          <div className="flex flex-col gap-3">
            {board.map((f,i) => {
              return (
                <div key={f.wallet_address} className="flex items-center gap-3 rounded-xl p-4 border" style={{background:'linear-gradient(135deg,rgba(251,191,36,0.04),transparent)',borderColor:'rgba(251,191,36,0.15)'}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{background: i===0 ? 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' : i===1 ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)'}}>
                    {i<3 ? rankIcon(i+1) : i+1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm" style={{color:'#fef3c7'}}>{f.display_name || f.wallet_address.slice(0,12)+'...'}</div>
                    <div className="mono text-[10px]" style={{color:'#78716c'}}>{f.wallet_address.slice(0,16)}...</div>
                    <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{background:'#292524'}}>
                      <div className="h-full rounded-full" style={{width:`${Math.min((f.total_score/1000)*100,100)}%`,background:'linear-gradient(90deg, #fbbf24, #f97316)'}}/>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {(f.badges||[]).map(b=><span key={b} className="text-[10px] px-2 py-0.5 rounded-full border" style={{background:'rgba(251,191,36,0.1)',borderColor:'rgba(251,191,36,0.3)',color:'#fbbf24'}}>{b}</span>)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-2xl font-extrabold" style={{background:'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{f.total_score}</div>
                    <div className="text-xs" style={{color:'#fbbf24'}}>★ {f.avg_rating?.toFixed(1)||'0.0'}</div>
                    <div className="text-xs" style={{color:'#78716c'}}>{f.return_count} returns</div>
                  </div>
                </div>
              )
            })}
            {!board.length && <div className="text-center py-12" style={{color:'#78716c'}}><div className="text-4xl mb-2">⭐</div><div>No finders yet</div></div>}
          </div>
        </div>
      </div>
      <div>
        <div className="card mb-5">
          <div className="card-title">🎴 Your Reputation Badge</div>
          {me ? (
            <div>
              <div className="text-center py-6">
                <div className="text-6xl mb-3">{getBadgeInfo(me.total_score).icon}</div>
                <div className="font-extrabold text-xl mb-2">Your Reputation</div>
                <div className="mono text-xs mb-4" style={{color:'#78716c'}}>{wallet?.slice(0,16)}...{wallet?.slice(-4)}</div>
                <div className="mono text-5xl font-extrabold mb-2" style={{background:'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{me.total_score}</div>
                <div style={{color:'#fbbf24'}}>{'★'.repeat(Math.min(Math.round(me.avg_rating||0),5))}{'☆'.repeat(5-Math.min(Math.round(me.avg_rating||0),5))}</div>
                <div className="text-sm mt-2" style={{color:'#78716c'}}>{me.return_count} items returned</div>
                
                {/* Badge Display */}
                <div className="mt-4 p-4 rounded-xl" style={{background:getBadgeInfo(me.total_score).gradient}}>
                  <div className="text-lg font-bold text-black">{getBadgeInfo(me.total_score).name}</div>
                  <div className="text-sm text-black/70">{me.total_score >= 500 ? 'Elite Finder' : me.total_score >= 200 ? 'Trusted Finder' : 'New Finder'}</div>
                </div>
              </div>
              <div className="border-t pt-4" style={{borderColor:'#44403c'}}>
                {[['Badge ID',me.sbt_token_id||'BADGE-'+wallet?.slice(2,6).toUpperCase()],['Network','Secure Blockchain'],['Permanent','Yes (Cannot be transferred)']].map(([k,v])=>(
                  <div key={k} className="flex justify-between py-2 border-b text-sm" style={{borderColor:'rgba(255,255,255,0.04)'}}>
                    <span style={{color:'#78716c'}}>{k}</span><span className="mono text-xs" style={{color:'#fef3c7'}}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">{(me.badges||[]).map(b=><span key={b} className="badge badge-registered">{b}</span>)}</div>
            </div>
          ) : (
            <div className="text-center py-12" style={{color:'#78716c'}}><div className="text-4xl mb-2">🔌</div><div>Connect wallet to view your profile</div></div>
          )}
        </div>
        <div className="card">
          <div className="card-title">📊 How Points Work</div>
          {[['Successful Return','+50 pts'],['Owner Rating 5★','+20 pts'],['Fast Response <2hrs','+10 pts'],['Gold Finder (500+ pts)','👑 Special Badge'],['Silver Finder (200+ pts)','🥈 Premium Badge'],['False Report','-100 pts']].map(([k,v])=>(
            <div key={k} className="flex justify-between py-2 border-b text-sm" style={{borderColor:'rgba(255,255,255,0.04)'}}>
              <span style={{color:'#a8a29e'}}>{k}</span><span className="mono text-xs font-bold" style={{color:'#fbbf24'}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

