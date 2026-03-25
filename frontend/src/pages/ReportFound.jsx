import { useState, useEffect, useRef } from 'react'
import api from '../utils/api'
import { toast } from '../utils/toast'
import { useNavigate } from 'react-router-dom'

export default function ReportFound() {
  const [form, setForm] = useState({ location:'', description:'', category:'Wallet / Purse', matched_token:'' })
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState([])
  const [cameraMode, setCameraMode] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const nav = useNavigate()
  const cats = ['Wallet / Purse','Phone / Tablet','Keys','Bag / Backpack','Jewellery','Documents','Electronics','Other']

  useEffect(() => { api.get('/found').then(r => setReports(r.data)).catch(()=>{}) }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraMode(true)
      }
    } catch(e) {
      toast('Camera access denied', 'error')
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      setCameraMode(false)
    }
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.8))
      stopCamera()
    }
  }

  async function submit() {
    if (!form.description || !form.location) { toast('Fill description and location', 'error'); return }
    setLoading(true)
    try {
      await api.post('/found/report', { ...form, image: capturedImage })
      toast('✅ Found report submitted! Owner notified anonymously.')
      setForm({ location:'', description:'', category:'Wallet / Purse', matched_token:'' })
      setCapturedImage(null)
      api.get('/found').then(r => setReports(r.data)).catch(()=>{})
    } catch(e) { toast(e.response?.data?.detail || 'Failed', 'error') }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="card">
          <div className="card-title">✅ Report Found Item</div>
          
          {/* Camera Section */}
          <div className="form-group">
            <label>📸 Item Photo (Optional)</label>
            {!cameraMode && !capturedImage && (
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={startCamera} className="btn btn-primary flex-1" style={{background:'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)'}}>
                  📷 Take Photo
                </button>
                <label className="btn btn-secondary flex-1" style={{cursor:'pointer'}}>
                  📁 Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => setCapturedImage(reader.result)
                      reader.readAsDataURL(file)
                    }
                  }} hidden />
                </label>
              </div>
            )}
            {cameraMode && (
              <div className="relative rounded-xl overflow-hidden mb-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" />
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={capturePhoto} className="btn btn-primary flex-1">📸 Capture</button>
                  <button type="button" onClick={stopCamera} className="btn btn-secondary flex-1">✕ Cancel</button>
                </div>
              </div>
            )}
            {capturedImage && (
              <div className="relative rounded-xl overflow-hidden mb-3">
                <img src={capturedImage} alt="Captured" className="w-full rounded-xl" />
                <button type="button" onClick={()=>setCapturedImage(null)} className="absolute top-2 right-2 btn btn-secondary text-xs" style={{padding:'6px 12px'}}>🔄 Retake</button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="p-3 rounded-xl border text-xs mb-5" style={{background:'rgba(251,191,36,0.06)',borderColor:'rgba(251,191,36,0.2)',color:'#a8a29e'}}>
            🔒 <strong style={{color:'#fef3c7'}}>Your identity is protected.</strong> Only the owner can contact you after submission. No personal details shared.
          </div>
          <div className="form-group"><label>Where did you find it? *</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Platform 3, Chennai Central Railway Station"/></div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              {cats.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Describe what you found *</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Color, type, any visible markings or contents..."/></div>
          <div className="form-group"><label>Matched Item ID (if known)</label><input value={form.matched_token} onChange={e=>setForm({...form,matched_token:e.target.value})} placeholder="e.g. ITEM-001 (from AI matcher)"/></div>
          <button className="btn btn-primary btn-full mb-3" onClick={submit} disabled={loading} style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
            {loading ? <span className="spin">⟳</span> : '✅'} {loading ? 'Submitting...' : 'Submit Found Report'}
          </button>
          <button className="btn btn-secondary btn-full" onClick={()=>nav('/match')}>🤖 Find Matches First</button>
        </div>
      </div>
      <div>
        <div className="card">
          <div className="card-title">📋 Recent Found Reports ({reports.length})</div>
          <div className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
            {reports.map(r => (
              <div key={r.id} className="rounded-xl p-4 border" style={{background:'linear-gradient(135deg,rgba(16,185,129,0.05),transparent)',borderColor:'rgba(16,185,129,0.2)',boxShadow:'inset 3px 0 0 #10b981'}}>
                <div className="badge badge-found mb-2">FOUND</div>
                <div className="text-sm font-bold mb-1" style={{color:'#fef3c7'}}>{r.description?.slice(0,50)}...</div>
                <div className="text-xs" style={{color:'#a8a29e'}}>📍 {r.location}</div>
                {r.ai_match_score && <div className="mono text-xs mt-1" style={{color:'#fbbf24'}}>🤖 AI Match: {r.ai_match_score}%</div>}
                <div className="mono text-[10px] mt-2" style={{color:'#78716c'}}>{r.id?.slice(0,18)}...</div>
              </div>
            ))}
            {!reports.length && <div className="text-center py-12 text-sm" style={{color:'#78716c'}}>No found reports yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

