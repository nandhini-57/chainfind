import { useState } from 'react'
import api from '../utils/api'
import { toast } from '../utils/toast'
import { useNavigate } from 'react-router-dom'

export default function AIMatch() {
  const [form, setForm] = useState({ description:'', location:'', category:'' })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function runMatch() {
    if (!form.description) { toast('Describe the item you found', 'error'); return }
    setLoading(true)
    try {
      const res = await api.post('/ai/match', form)
      setResults(res.data)
      if (!res.data.matches?.length) toast('No matches found — try a different description', 'error')
    } catch(e) { toast(e.response?.data?.detail || 'AI matching failed', 'error') }
    setLoading(false)
  }

  const progressBarStyle = {
    width: '100%',
    height: '6px',
    background: '#292524',
    borderRadius: '999px',
    overflow: 'hidden'
  }

  const progressFillStyle = (score) => ({
    height: '100%',
    borderRadius: '999px',
    transition: 'all 0.7s ease',
    width: score + '%',
    background: 'linear-gradient(90deg, #fbbf24, #f97316)'
  })

  const gradientTextStyle = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }

  const primaryBtnStyle = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)'
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="card">
          <div className="card-title">🤖 Find Matches</div>
          <p className="text-sm mb-5 leading-relaxed" style={{color:'#a8a29e'}}>
            Describe what you found and our smart system will match it against all lost items using advanced analysis.
          </p>
          <div className="form-group">
            <label>Describe the item you found *</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
              placeholder="e.g. Found a black leather wallet near Platform 3, has some cards inside, looks expensive..." style={{minHeight:'120px'}}/>
          </div>
          <div className="form-group"><label>Location where found</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Chennai Central Station"/></div>
          <button className="btn btn-primary btn-full" onClick={runMatch} disabled={loading} style={primaryBtnStyle}>
            {loading ? <><span className="spin">⟳</span> Finding Matches...</> : <><span>🤖</span> Find Matches</>}
          </button>
          <div className="mt-3 p-3 rounded-xl border text-xs" style={{background:'rgba(251,191,36,0.06)',borderColor:'rgba(251,191,36,0.2)',color:'#a8a29e'}}>
            🧠 Powered by <strong style={{color:'#fbbf24'}}>Advanced AI</strong> · Smart matching technology
          </div>
        </div>
      </div>
      <div>
        <div className="card">
          <div className="card-title">📊 Match Results</div>
          {loading && (
            <div className="text-center py-12" style={{color:'#78716c'}}>
              <div className="text-4xl mb-3 spin inline-block">🤖</div>
              <div>Finding matches...</div>
              <div className="text-xs mt-2">Checking {results?.total_checked || '...'} lost items</div>
            </div>
          )}
          {!loading && results && results.matches?.length > 0 && (
            <div>
              <div className="mono text-xs mb-4" style={{color:'#78716c'}}>Found {results.matches.length} matches · Checked {results.total_checked} lost items</div>
              {results.matches.map((m,i) => (
                <div key={i} className="rounded-xl p-4 border mb-3" style={{background:'linear-gradient(135deg,rgba(251,191,36,0.04),transparent)',borderColor:'rgba(251,191,36,0.2)'}}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="badge badge-lost mb-2">MATCH #{i+1}</div>
                      <div className="font-bold">{m.name}</div>
                      <div className="text-xs mt-1" style={{color:'#78716c'}}>{m.description?.slice(0,60)}...</div>
                    </div>
                    <div className="mono text-3xl font-extrabold ml-4" style={gradientTextStyle}>{m.score}%</div>
                  </div>
                  <div style={progressBarStyle}>
                    <div style={progressFillStyle(m.score)}/>
                  </div>
                  {m.reasons && (
                    <div className="text-xs mb-3" style={{color:'#a8a29e'}}>
                      <span className="font-bold" style={{color:'#fef3c7'}}>Matching: </span>{m.reasons?.join(' · ')}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="mono text-xs" style={{color:'#78716c'}}>{m.token_id} · ₹{m.reward_amount} reward</div>
                    <div className="flex gap-2">
                      <button className="btn btn-primary" style={{padding:'6px 14px',fontSize:'12px',...primaryBtnStyle}} onClick={()=>nav('/found')}>Report Found</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !results && (
            <div className="text-center py-16" style={{color:'#78716c'}}>
              <div className="text-5xl mb-3">🔍</div>
              <div className="font-bold mb-1" style={{color:'#fef3c7'}}>No search yet</div>
              <div className="text-sm">Describe what you found to see AI-powered matches</div>
            </div>
          )}
          {!loading && results && !results.matches?.length && (
            <div className="text-center py-12" style={{color:'#78716c'}}>
              <div className="text-4xl mb-2">😔</div>
              <div>No matching lost reports found</div>
              <div className="text-sm mt-1">Try a different description or submit a general found report</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

