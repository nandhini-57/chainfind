import { useState, useEffect } from 'react'
import api from '../utils/api'
import { toast } from '../utils/toast'

export default function ReportLost({ wallet }) {
  const [items, setItems] = useState([])
  const [reports, setReports] = useState([])
  const [form, setForm] = useState({ token_id:'', location:'', details:'', reward_amount:'', lost_at:'' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (wallet) api.get('/items/my').then(r => setItems(r.data.filter(i=>i.status==='registered'))).catch(()=>{})
    api.get('/lost/active').then(r => setReports(r.data)).catch(()=>{})
  }, [wallet])

  async function submit() {
    if (!form.token_id || !form.location) { toast('Select item and enter location', 'error'); return }
    setLoading(true)
    try {
      await api.post('/lost/report', { ...form, reward_amount: parseFloat(form.reward_amount)||0 })
      toast(`🚨 Lost report filed! ₹${form.reward_amount||0} escrowed.`)
      setForm({ token_id:'', location:'', details:'', reward_amount:'', lost_at:'' })
      api.get('/lost/active').then(r => setReports(r.data)).catch(()=>{})
      if (wallet) api.get('/items/my').then(r => setItems(r.data.filter(i=>i.status==='registered'))).catch(()=>{})
    } catch(e) { toast(e.response?.data?.detail || 'Failed', 'error') }
    setLoading(false)
  }

  // Calculate days remaining until expiry
  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return null
    const expires = new Date(expiresAt)
    const now = new Date()
    const diff = Math.ceil((expires - now) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="card">
          <div className="card-title">🚨 Report Lost Item</div>
          <div className="form-group">
            <label>Choose Your Registered Item</label>
            <select value={form.token_id} onChange={e=>setForm({...form,token_id:e.target.value})}>
              <option value="">-- Select your item --</option>
              {items.map(i=><option key={i.token_id} value={i.token_id}>{i.token_id} — {i.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Last Seen Location *</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Chennai Central Railway Station, Platform 3"/></div>
          <div className="form-group"><label>When Did You Lose It?</label><input type="datetime-local" value={form.lost_at} onChange={e=>setForm({...form,lost_at:e.target.value})}/></div>
          <div className="form-group"><label>More Details</label><textarea value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Describe what happened, any special features..."/></div>
          <div className="form-group"><label>Reward Amount (₹)</label><input type="number" value={form.reward_amount} onChange={e=>setForm({...form,reward_amount:e.target.value})} placeholder="e.g. 500" min="0"/></div>
          <div className="p-3 rounded-xl border text-xs mb-4" style={{background:'rgba(251,191,36,0.06)',borderColor:'rgba(251,191,36,0.2)',color:'#a8a29e'}}>
            💰 Reward will be <strong style={{color:'#fef3c7'}}>held securely</strong> and given to the person who returns your item. <br/>
            ⏰ Report expires in <strong style={{color:'#fbbf24'}}>90 days</strong> if item is not found.
          </div>
          <button className="btn btn-danger btn-full" onClick={submit} disabled={loading} style={{background:'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}}>
            {loading ? <span className="spin">⟳</span> : '🚨'} {loading ? 'Submitting...' : 'Submit Lost Report'}
          </button>
        </div>
      </div>
      <div>
        <div className="card">
          <div className="card-title">📋 Active Lost Reports ({reports.length})</div>
          <div className="flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1">
            {reports.map(r => {
              const daysLeft = getDaysRemaining(r.item.expires_at)
              return (
                <div key={r.item.token_id} className="rounded-xl p-4 border" style={{background:'linear-gradient(135deg,rgba(239,68,68,0.05),transparent)',borderColor:'rgba(239,68,68,0.2)',boxShadow:'inset 3px 0 0 #ef4444'}}>
                  <div className="badge badge-lost mb-2">LOST</div>
                  <div className="font-bold text-sm" style={{color:'#fef3c7'}}>{r.item.name}</div>
                  <div className="text-xs my-1" style={{color:'#a8a29e'}}>📍 {r.report.location}</div>
                  {r.item.reward_amount > 0 && <div className="mono text-xs font-bold" style={{background:'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>🏆 ₹{r.item.reward_amount} reward</div>}
                  <div className="mono text-[10px] mt-2" style={{color:'#78716c'}}>{r.item.token_id}</div>
                  {daysLeft !== null && (
                    <div className="mt-2 text-xs" style={{color: daysLeft <= 7 ? '#ef4444' : '#fbbf24'}}>
                      ⏰ {daysLeft} days remaining until expiry
                    </div>
                  )}
                </div>
              )
            })}
            {!reports.length && <div className="text-center py-12" style={{color:'#78716c'}}><div className="text-4xl mb-2">🎉</div><div>No active lost reports!</div></div>}
          </div>
        </div>
      </div>
    </div>
  )
}

