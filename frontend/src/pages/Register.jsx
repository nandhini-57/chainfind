import { useEffect, useRef, useState } from 'react'
import api, { BACKEND_BASE_URL } from '../utils/api'
import { generateTokenId } from '../utils/web3'
import { toast } from '../utils/toast'

export default function Register({ wallet, onConnect, connecting }) {
  const [form, setForm] = useState({ name:'', category:'Wallet / Purse', description:'', serial_number:'', latitude:'', longitude:'' })
  const [loading, setLoading] = useState(false)
  const [myItems, setMyItems] = useState([])
  const [cameraMode, setCameraMode] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cats = ['Wallet / Purse','Phone / Tablet','Keys','Bag / Backpack','Jewellery','Documents','Electronics','Other']
  const icons = { 'Wallet / Purse':'👛', 'Phone / Tablet':'📱', 'Keys':'🔑', 'Bag / Backpack':'🎒', 'Jewellery':'💍', 'Documents':'📄', 'Electronics':'💻', 'Other':'📦' }

  async function loadMyItems() {
    if (!wallet) {
      setMyItems([])
      return
    }
    api.get('/items/my').then(r => setMyItems(r.data)).catch(() => {})
  }

  useEffect(() => {
    loadMyItems()
  }, [wallet])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraMode(true)
      }
    } catch (e) {
      toast('Camera access denied. Please allow camera permissions.', 'error')
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

  function retakePhoto() {
    setCapturedImage(null)
    startCamera()
  }

  async function uploadToIPFS() {
    if (!capturedImage) return null
    setUploading(true)
    try {
      const base64 = capturedImage.split(',')[1]
      const blob = atob(base64)
      const array = []
      for (let i = 0; i < blob.length; i++) {
        array.push(blob.charCodeAt(i))
      }
      const file = new Blob([new Uint8Array(array)], { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('file', file, 'item.jpg')

      const res = await fetch(`${BACKEND_BASE_URL}/ipfs/upload`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Upload failed')
      return await res.json()
    } catch (e) {
      toast('Failed to upload image', 'error')
      return null
    } finally {
      setUploading(false)
    }
  }

  async function submit() {
    if (!form.name.trim() || !form.description.trim()) {
      toast('Fill all required fields', 'error')
      return
    }

    let activeWallet = wallet
    if (!activeWallet && typeof onConnect === 'function') {
      activeWallet = await onConnect()
    }
    if (!activeWallet) {
      toast('Connect your wallet before registering an item', 'error')
      return
    }

    let ipfsData = null
    if (capturedImage) {
      ipfsData = await uploadToIPFS()
      if (capturedImage && !ipfsData) return
    }

    setLoading(true)
    try {
      const token_id = generateTokenId()
      await api.post('/items/register', {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        serial_number: form.serial_number.trim(),
        token_id,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        ipfs_hash: ipfsData?.hash || null,
        ipfs_url: ipfsData?.url || null
      })
      toast(`${token_id} registered successfully`)
      setForm({ name:'', category:'Wallet / Purse', description:'', serial_number:'', latitude:'', longitude:'' })
      setCapturedImage(null)
      loadMyItems()
    } catch (e) {
      toast(e.response?.data?.detail || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="card">
          <div className="card-title">📦 Register New Item</div>
          {wallet ? (
            <div className="flex items-center gap-2 p-3 rounded-xl border mb-5 text-sm" style={{background:'rgba(251,191,36,0.1)',borderColor:'rgba(251,191,36,0.3)'}}>
              <span>🔗</span>
              <div>
                <div className="text-xs font-bold" style={{color:'#fcd34d'}}>Wallet Connected</div>
                <div className="mono text-xs" style={{color:'#fbbf24'}}>{wallet.slice(0,12)}...{wallet.slice(-4)}</div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border mb-5 text-sm" style={{background:'rgba(239,68,68,0.08)',borderColor:'rgba(239,68,68,0.2)',color:'#fca5a5'}}>
              Connect your wallet to register and save items.
            </div>
          )}

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
                <button type="button" onClick={retakePhoto} className="absolute top-2 right-2 btn btn-secondary text-xs" style={{padding:'6px 12px'}}>
                  🔄 Retake
                </button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {[{k:'name',label:'Item Name *',ph:'e.g. Black Leather Wallet'},{k:'serial_number',label:'Serial No. / Unique Marks',ph:'e.g. SN-2847 or initials carved inside'},{k:'latitude',label:'Current Location Lat',ph:'13.0827'},{k:'longitude',label:'Current Location Lng',ph:'80.2707'}].map(f => (
            <div className="form-group" key={f.k}>
              <label>{f.label}</label>
              <input value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.ph}/>
            </div>
          ))}

          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Color, brand, identifying marks..."/>
          </div>

          <div className="p-3 rounded-xl border text-xs mb-4" style={{background:'rgba(251,191,36,0.04)',borderColor:'rgba(251,191,36,0.2)',color:'#a8a29e'}}>
            📄 Item details will be <strong style={{color:'#fef3c7'}}>securely stored</strong>. Only essential information is kept for matching.
          </div>

          <button className="btn btn-primary btn-full" onClick={submit} disabled={loading || uploading || connecting}>
            {loading || uploading || connecting ? <span className="spin">⟳</span> : '📦'} {loading ? 'Registering...' : uploading ? 'Uploading...' : connecting ? 'Connecting...' : 'Register Item'}
          </button>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-title">🎴 Your Registered Items ({myItems.length})</div>
          {myItems.length ? (
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
              {myItems.map(item => (
                <div key={item.token_id} className="rounded-xl p-4 border relative overflow-hidden" style={{background:'linear-gradient(135deg,#1a1a28,rgba(251,191,36,0.08))',borderColor:'rgba(251,191,36,0.25)'}}>
                  {item.ipfs_url && (
                    <img src={item.ipfs_url} alt={item.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  <div className="absolute top-3 right-3 mono text-[10px] px-2 py-0.5 rounded font-bold tracking-widest" style={{background:'rgba(251,191,36,0.3)',color:'#fbbf24'}}>ITEM</div>
                  <div className="text-3xl mb-2">{icons[item.category] || '📦'}</div>
                  <div className="font-bold" style={{color:'#fef3c7'}}>{item.name}</div>
                  <div className="mono text-[10px] mt-1" style={{color:'#78716c'}}>ID: {item.token_id}</div>
                  <div className="text-xs mt-2 line-clamp-2" style={{color:'#a8a29e'}}>{item.description}</div>
                  <div className="flex items-center justify-between mt-3">
                    <div className={`badge ${item.status === 'lost' ? 'badge-lost' : item.status === 'found' ? 'badge-found' : item.status === 'returned' ? 'badge-returned' : 'badge-registered'}`}>{item.status?.toUpperCase()}</div>
                    {item.created_at && (
                      <div className="mono text-[10px]" style={{color:'#78716c'}}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" style={{color:'#78716c'}}>
              <div className="text-5xl mb-3">🎴</div>
              <div className="font-bold mb-1" style={{color:'#fef3c7'}}>No items yet</div>
              <div className="text-sm">Register your first item to get started</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
