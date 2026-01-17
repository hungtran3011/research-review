import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { refreshTokens } from '../services/auth.service'

function AuthBootstrap() {
  const setTokens = useAuthStore((state) => state.setTokens)
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const setBootstrapped = useAuthStore((state) => state.setBootstrapped)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const hasBootstrapped = useRef(false)

  useEffect(() => {
    if (hasBootstrapped.current) {
      return
    }
    hasBootstrapped.current = true

    const hydrate = async () => {
      try {
        const response = await refreshTokens()
        const payload = response.data
        if (payload?.accessToken) {
          setTokens(payload.accessToken, null)
          setAuthenticated(true)
        } else {
          clearAuth()
        }
      } catch {
        clearAuth()
      } finally {
        setBootstrapped(true)
      }
    }

    void hydrate()
  }, [clearAuth, setAuthenticated, setBootstrapped, setTokens])

  return null
}

export default AuthBootstrap
