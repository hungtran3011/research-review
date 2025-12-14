import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { refreshTokens } from '../services/auth.service'

function AuthBootstrap() {
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const setTokens = useAuthStore((state) => state.setTokens)
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const hasBootstrapped = useRef(false)

  useEffect(() => {
    if (hasBootstrapped.current) {
      return
    }
    hasBootstrapped.current = true

    const hydrate = async () => {
      if (!refreshToken) {
        return
      }
      try {
        const response = await refreshTokens(refreshToken)
        const payload = response.data
        if (payload?.accessToken && payload?.refreshToken) {
          setTokens(payload.accessToken, payload.refreshToken)
          setAuthenticated(true)
        } else {
          clearAuth()
        }
      } catch {
        clearAuth()
      }
    }

    void hydrate()
  }, [clearAuth, refreshToken, setAuthenticated, setTokens])

  return null
}

export default AuthBootstrap
