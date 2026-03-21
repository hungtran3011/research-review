import { useState, useEffect, useCallback, useRef } from 'react'

interface ResendTimerConfig {
  /** Email address to track (used as storage key) */
  email: string | null
  /** Cooldown duration in seconds (default: 60) */
  cooldownSeconds?: number
  /** Custom localStorage key prefix (default: 'resend_timer') */
  storageKeyPrefix?: string
}

interface ResendTimerResult {
  /** Whether user can resend email (cooldown expired) */
  canResend: boolean
  /** Remaining seconds until can resend (0 if can resend) */
  secondsRemaining: number
  /** Call this after successfully sending email to start cooldown */
  markResent: () => void
  /** Reset/clear the timer completely */
  reset: () => void
  /** Format seconds as MM:SS string */
  formatTime: (seconds: number) => string
}

interface StoredTimerData {
  email: string
  lastResentAt: number // Unix timestamp in milliseconds
}

/**
 * Custom hook to manage email resend cooldown timer with localStorage persistence.
 * 
 * Features:
 * - Persists timer state across page refreshes
 * - Automatically calculates remaining time from stored timestamp
 * - Initial state: can resend immediately (no countdown on first load)
 * - After resend: starts cooldown timer
 * - Automatically cleans up localStorage when timer expires
 * 
 * @param config - Configuration object
 * @returns ResendTimerResult object with timer state and controls
 * 
 * @example
 * const { canResend, secondsRemaining, markResent, formatTime } = useResendTimer({ 
 *   email: 'user@example.com',
 *   cooldownSeconds: 60 
 * })
 * 
 * // After successful resend:
 * markResent()
 * 
 * // Display:
 * {canResend ? 'Resend now' : `Wait ${formatTime(secondsRemaining)}`}
 */
export function useResendTimer(config: ResendTimerConfig): ResendTimerResult {
  const {
    email,
    cooldownSeconds = 60,
    storageKeyPrefix = 'resend_timer',
  } = config

  const [secondsRemaining, setSecondsRemaining] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Generate storage key based on email
  const getStorageKey = useCallback(() => {
    if (!email) return null
    return `${storageKeyPrefix}_${email}`
  }, [email, storageKeyPrefix])

  // Calculate remaining time from stored timestamp
  const calculateRemainingTime = useCallback((): number => {
    const storageKey = getStorageKey()
    if (!storageKey) return 0

    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return 0

      const data: StoredTimerData = JSON.parse(stored)
      
      // Verify email matches (security check)
      if (data.email !== email) {
        localStorage.removeItem(storageKey)
        return 0
      }

      const now = Date.now()
      const elapsedMs = now - data.lastResentAt
      const elapsedSeconds = Math.floor(elapsedMs / 1000)
      const remaining = Math.max(0, cooldownSeconds - elapsedSeconds)

      // Clean up localStorage if timer expired
      if (remaining === 0) {
        localStorage.removeItem(storageKey)
      }

      return remaining
    } catch (err) {
      console.warn('[useResendTimer] Failed to parse stored timer data:', err)
      // Clean up corrupted data
      localStorage.removeItem(storageKey)
      return 0
    }
  }, [getStorageKey, email, cooldownSeconds])

  // Initialize timer on mount or when email changes
  useEffect(() => {
    const remaining = calculateRemainingTime()
    setSecondsRemaining(remaining)
  }, [email, calculateRemainingTime])

  // Update timer every second if counting down
  useEffect(() => {
    if (secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer expired, clean up
            const storageKey = getStorageKey()
            if (storageKey) {
              localStorage.removeItem(storageKey)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [secondsRemaining, getStorageKey])

  // Mark email as resent (start cooldown)
  const markResent = useCallback(() => {
    const storageKey = getStorageKey()
    if (!storageKey || !email) {
      console.warn('[useResendTimer] Cannot mark resent: no email provided')
      return
    }

    try {
      const data: StoredTimerData = {
        email,
        lastResentAt: Date.now(),
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
      setSecondsRemaining(cooldownSeconds)
      
      console.log(`[useResendTimer] Started ${cooldownSeconds}s cooldown for ${email}`)
    } catch (err) {
      console.error('[useResendTimer] Failed to save timer data:', err)
    }
  }, [getStorageKey, email, cooldownSeconds])

  // Reset timer (clear localStorage and state)
  const reset = useCallback(() => {
    const storageKey = getStorageKey()
    if (storageKey) {
      localStorage.removeItem(storageKey)
    }
    setSecondsRemaining(0)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    console.log('[useResendTimer] Timer reset')
  }, [getStorageKey])

  // Format seconds as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }, [])

  return {
    canResend: secondsRemaining === 0,
    secondsRemaining,
    markResent,
    reset,
    formatTime,
  }
}
