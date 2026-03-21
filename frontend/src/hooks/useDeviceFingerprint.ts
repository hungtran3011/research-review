import { useState, useEffect, useRef } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

interface DeviceFingerprintResult {
  fingerprint: string | null
  isLoading: boolean
  error: Error | null
}

/**
 * Custom hook to generate a unique device fingerprint using FingerprintJS.
 * The fingerprint is cached in memory to avoid regeneration on every render.
 * 
 * @returns {DeviceFingerprintResult} Object containing fingerprint, loading state, and error
 * 
 * @example
 * const { fingerprint, isLoading, error } = useDeviceFingerprint()
 * 
 * if (isLoading) return <Spinner />
 * if (error) console.warn('Fingerprint generation failed:', error)
 * // Use fingerprint in API calls
 */
export function useDeviceFingerprint(): DeviceFingerprintResult {
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Use ref to prevent regeneration if already loaded
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Skip if already loaded
    if (hasLoadedRef.current) {
      return
    }

    const generateFingerprint = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load FingerprintJS agent
        const fp = await FingerprintJS.load()
        
        // Get fingerprint result
        const result = await fp.get()
        
        // Extract visitor ID as fingerprint
        const visitorId = result.visitorId
        
        setFingerprint(visitorId)
        hasLoadedRef.current = true
        
        console.log('[useDeviceFingerprint] Fingerprint generated:', visitorId.substring(0, 8) + '...')
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate fingerprint')
        setError(error)
        console.warn('[useDeviceFingerprint] Failed to generate fingerprint:', error.message)
        // Set null fingerprint on error (graceful degradation)
        setFingerprint(null)
      } finally {
        setIsLoading(false)
      }
    }

    void generateFingerprint()
  }, [])

  return { fingerprint, isLoading, error }
}
