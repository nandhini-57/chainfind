// Simple toast notification store
let listeners = []
export const toastStore = {
  subscribe: fn => { listeners.push(fn); return () => { listeners = listeners.filter(l => l !== fn) } },
  emit: (msg, type = 'success') => listeners.forEach(fn => fn({ msg, type, id: Date.now() }))
}
export const toast = (msg, type = 'success') => toastStore.emit(msg, type)
