import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

export function useAlertNotifications() {
  const [toasts, setToasts] = useState([])
  const permissionRef = useRef(Notification.permission)

  // Request browser notification permission on first use
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => { permissionRef.current = p })
    }
  }, [])

  // Poll for pending alerts every 30 seconds
  useEffect(() => {
    const check = async () => {
      try {
        const items = await api.getPending()
        if (!items.length) return

        items.forEach(alert => {
          const msg = `${alert.ticker} @ $${alert.price?.toFixed(2)} — ${alert.rule_name}`

          // Browser notification (works even if tab is not focused)
          if (permissionRef.current === 'granted') {
            new Notification(`🚨 Stock Alert: ${alert.ticker}`, {
              body: msg,
              icon: '/favicon.ico',
            })
          }

          // In-app toast
          const id = Date.now() + Math.random()
          setToasts(prev => [...prev, { id, ...alert, msg }])
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8000)
        })
      } catch (_) {}
    }

    check() // run immediately
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [])

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return { toasts, dismiss }
}
