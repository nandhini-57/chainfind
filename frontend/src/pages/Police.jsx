import { useState, useEffect, useRef } from 'react'
import api from '../utils/api'
import { toast } from '../utils/toast'

export default function Police({ wallet }) {
  const [form, setForm] = useState({ station_id:'GRP-CHN-001', station_name:'Chennai Central GRP', description:'', category:'Wallet / Purse', location:'', case_number:'' })
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [cameraMode, setCameraMode] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cats = ['Wallet / Purse','Phone / Tablet','Keys','Bag / Backpack','Jewellery','Documents','Electronics','Other']

  useEffect(() => { api.get('/police/log').then(r=>setLogs(r.data)).catch(()=>{}) }, [])

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
    if (!form.description||!form.location||!form.case_number) { toast('Fill all fields','error'); return }
    setLoading(true)
    try {
      await api.post('/police/log', { ...form, image: capturedImage })
      toast('🚔 Item logged with station authority')
      setForm({...form, description:'', location:'', case_number:''})
      setCapturedImage(null)
      api.get('/police/log').then(r=>setLogs(r.data)).catch(()=>{})
    } catch(e) { toast(e.response?.data?.detail||'Failed','error') }
    setLoading(false)
  }

  const btnStyle = {
    background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(249,115,22,0.2))',
    border: '1px solid rgba(251,191,36,0.4)',
    color: '#fbbf24'
  }

  return (
    <div>
      <div className="card mb-5" style={{background:'linear-gradient(135deg,rgba(251,191,36,0.05),transparent)',borderColor:'rgba(251,191,36,0.2)'}}>
        <div className="card-title" style={{background:'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>🚔 Police Station Access</div>
        <p className="text-sm" style={{color:'#a8a29e'}}>Verified police stations can add items found by police into the system, connecting physical and digital records.</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="card">
            <div className="card-title">📝 Add Found Item</div>
            <div className="form-group">
              <label>📸 Item Photo</label>
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
            <div className="p-3 rounded-xl border text-xs mb-4" style={{background:'rgba(251,191,36,0.06)',borderColor:'rgba(251,191,36,0.2)'}}>
              🏛️ Station: <span style={{color:'#fcd34d'}}>{form.station_name}</span> · <span style={{color:'#fbbf24'}}>{form.station_id}</span> · Verified ✓
            </div>
            <div className="form-group"><label>Item Description *</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Full description of found item..."/></div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {cats.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Found At / Submitted By *</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Location where item was turned in"/></div>
            <div className="form-group"><label>Police Case Number *</label><input value={form.case_number} onChange={e=>setForm({...form,case_number:e.target.value})} placeholder="e.g. GRP/CHN/2025/1847"/></div>
            <button className="btn btn-full" style={btnStyle} onClick={submit} disabled={loading}>
              {loading?<span className="spin">⟳</span>:'🚔'} {loading?'Adding...':'Add Item with Police Authority'}
            </button>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-title">📋 Station Items ({logs.length})</div>
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {logs.map(l => (
                <div key={l.id} className="rounded-xl p-4 border" style={{background:'linear-gradient(135deg,rgba(251,191,36,0.04),transparent)',borderColor:'rgba(251,191,36,0.15)'}}>
                  <div className="font-bold text-sm mb-2" style={{color:'#fef3c7'}}>{l.description}</div>
                  {[['Found At',l.location],['Case No.',l.case_number],['Logged',new Date(l.created_at).toLocaleString()]].map(([k,v])=>(
                    <div key={k} className="flex justify-between py-1 text-xs"><span style={{color:'#78716c'}}>{k}</span><span className="mono">{v}</span></div>
                  ))}
                  <div className="mono text-[10px] mt-2 break-all" style={{color:'#78716c'}}>📄 {l.ipfs_hash}</div>
                </div>
              ))}
              {!logs.length && <div className="text-center py-12" style={{color:'#78716c'}}><div className="text-4xl mb-2">📋</div><div>No items logged yet</div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

