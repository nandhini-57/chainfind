import { useState, useEffect } from 'react'
import { toastStore } from '../utils/toast'

export default function Toast() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    return toastStore.subscribe(t => {
      setToasts(p => [...p, t])
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 3500)
    })
  }, [])

  const getToastStyle = (type) => {
    if (type === 'success') {
      return {
        background: '#1c1917',
        border: '1px solid rgba(251, 191, 36, 0.4)',
        color: '#fef3c7'
      }
    }
    return {
      background: '#1c1917',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      color: '#fca5a5'
    }
  }

  const getIcon = (type) => {
    if (type === 'success') return '✅'
    if (type === 'warning') return '⚠️'
    return '❌'
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-3 px-5 py-4 rounded-xl text-sm min-w-72 shadow-2xl border animate-[slideIn_0.3s_ease]"
          style={getToastStyle(t.type)}>
          <span className="text-lg">{getIcon(t.type)}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

