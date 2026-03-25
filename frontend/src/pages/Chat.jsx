import { useState, useEffect, useRef } from 'react'
import api from '../utils/api'
import { toast } from '../utils/toast'

export default function Chat({ wallet }) {
  const [caseId, setCaseId] = useState('')
  const [cases, setCases] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    api.get('/items?status=found').then(r => setCases(r.data)).catch(()=>{})
  }, [wallet])

  useEffect(() => {
    if (caseId) loadMessages()
  }, [caseId])

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  async function loadMessages() {
    setLoading(true)
    try {
      const r = await api.get('/chat/' + caseId)
      setMessages(r.data)
    } catch(e) { if (e.response && e.response.status !== 403) toast('Could not load messages', 'error') }
    setLoading(false)
  }

  async function send() {
    if (!input.trim() || !caseId) return
    setSending(true)
    try {
      await api.post('/chat/send', { case_id: caseId, message: input })
      setInput('')
      await loadMessages()
    } catch(e) { toast('Send failed', 'error') }
    setSending(false)
  }

  const currentCase = cases.find(c => c.token_id === caseId)

  const ownerMsgStyle = {
    background: 'rgba(251, 191, 36, 0.12)',
    border: '1px solid rgba(251, 191, 36, 0.2)'
  }

  const finderMsgStyle = {
    background: '#1c1917',
    border: '1px solid #44403c'
  }

  const gradientTextStyle = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }

  const primaryBtnStyle = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)'
  }

  const chatContainerStyle = {
    background: '#1c1917',
    borderColor: '#44403c',
    height: '18rem',
    overflowY: 'auto'
  }

  const renderMessages = () => {
    if (loading) {
      return <div className="text-center text-sm py-8" style={{color:'#78716c'}}>Loading messages...</div>
    }
    if (!caseId) {
      return <div className="text-center text-sm py-8" style={{color:'#78716c'}}>Select a case to view messages</div>
    }
    if (messages.length === 0) {
      return <div className="text-center text-sm py-8" style={{color:'#78716c'}}>No messages yet. Start the conversation.</div>
    }
    return messages.map(m => {
      const isOwner = m.role === 'owner'
      return (
        <div key={m.id} className={isOwner ? 'self-end rounded-br-sm' : 'self-start rounded-bl-sm'} 
          style={isOwner ? ownerMsgStyle : finderMsgStyle}>
          <div>{m.message}</div>
          <div className="mono text-[10px] mt-1" style={{color:'#78716c'}}>
            {isOwner ? 'You (Owner)' : 'Finder'} · {new Date(m.timestamp).toLocaleTimeString()} · 🔐
          </div>
        </div>
      )
    })
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="card">
          <div className="card-title" style={gradientTextStyle}>🔐 Secure Chat</div>
          <div className="flex items-center gap-2 text-xs mb-4" style={{color:'#fbbf24'}}>
            🔐 Secure & Private · Your identity is protected
          </div>
          <div className="form-group mb-4">
            <label>Select Active Case</label>
            <select value={caseId} onChange={e => setCaseId(e.target.value)}>
              <option value="">-- Select a case --</option>
              {cases.map(c => <option key={c.token_id} value={c.token_id}>{c.token_id} — {c.name}</option>)}
            </select>
          </div>
          <div className="rounded-xl border p-4 flex flex-col gap-2 mb-3" style={chatContainerStyle}>
            {renderMessages()}
            <div ref={bottomRef}/>
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send() }}
              placeholder="Type a message... (identity protected)" disabled={!caseId}/>
            <button className="btn btn-primary" onClick={send} disabled={sending || !caseId} style={primaryBtnStyle}>
              {sending ? <span className="spin">⟳</span> : '💬'}
            </button>
          </div>
          <div className="mono text-[10px] mt-2" style={{color:'#78716c'}}>🔐 Messages are secure. Only you and the other person can read them.</div>
        </div>
      </div>
      <div>
        <div className="card mb-5">
          <div className="card-title">📋 Case Details</div>
          {currentCase ? (
            <div>
              <div className="flex justify-between py-2 border-b text-sm" style={{borderColor:'rgba(255,255,255,0.04)'}}>
                <span style={{color:'#78716c'}}>Item</span>
                <span className="mono text-xs" style={{color:'#fef3c7'}}>{currentCase.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm" style={{borderColor:'rgba(255,255,255,0.04)'}}>
                <span style={{color:'#78716c'}}>Item ID</span>
                <span className="mono text-xs" style={{color:'#fef3c7'}}>{currentCase.token_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm" style={{borderColor:'rgba(255,255,255,0.04)'}}>
                <span style={{color:'#78716c'}}>Status</span>
                <span className="mono text-xs" style={{color:'#fef3c7'}}>{currentCase.status ? currentCase.status.toUpperCase() : 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm py-4" style={{color:'#78716c'}}>Select a case to view details</div>
          )}
        </div>
        {currentCase && (
          <div className="card">
            <div className="card-title">✅ Confirm Return & Release Reward</div>
            <p className="text-sm mb-4 leading-relaxed" style={{color:'#a8a29e'}}>Once you've received your item back, confirm to release the reward to the finder.</p>
            <button className="btn btn-primary btn-full" onClick={async () => {
              try {
                await api.post('/found/confirm-return', { token_id: caseId })
                toast('🏆 Reward sent! Thank you for confirming.')
              } catch(e) { toast(e.response && e.response.data && e.response.data.detail || 'Failed', 'error') }
            }} style={primaryBtnStyle}>✅ Confirm Return & Release Reward</button>
          </div>
        )}
      </div>
    </div>
  )
}

