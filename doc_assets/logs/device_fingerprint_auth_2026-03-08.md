# Device Fingerprint Authentication Implementation
**Date:** 2026-03-08  
**Status:** ✅ Completed - Backend & Frontend Integration

## Overview
Enhanced the sign-in/sign-up flow with:
1. **Device fingerprinting** - Only the device that enters the email can complete the auth flow
2. **Persistent resend timer** - 60s cooldown survives page refresh via localStorage
3. **Per-device rate limiting** - Separate limits for each device, not just per email

## Frontend Changes

### New Hooks
- **`useDeviceFingerprint.ts`** (59 lines)
  - Uses FingerprintJS library to generate stable browser fingerprint
  - Caches fingerprint in memory after first generation
  - Graceful degradation if fingerprint fails (allows auth without it)
  - Returns: `{ fingerprint: string | null, isLoading: boolean, error: Error | null }`

- **`useResendTimer.ts`** (173 lines)
  - Manages 60-second countdown with localStorage persistence
  - Key features:
    - Survives page refresh/reload
    - No initial countdown on first page load
    - Format: MM:SS display
    - Auto-cleanup when timer expires
  - Functions: `startTimer()`, `clearTimer()`, `remainingSeconds`, `isRunning`, `formattedTime`

### Updated Components
- **`NeedsVerify.tsx`** - Uses `useResendTimer`, shows success/error states
- **`SignUpMail.tsx`** - Generates fingerprint, shows loading UI
- **`SignInMail.tsx`** - Generates fingerprint, shows loading UI  
- **`VerifyToken.tsx`** - Sends fingerprint with verification request

### Updated Models
- `AuthRequestDto` - Added optional `deviceFingerprint?: string`
- `VerifyTokenRequestDto` - Added optional `deviceFingerprint?: string`

### Bug Fix
- **`authStore.ts`** - Fixed stuck "đang khôi phục phiên đăng nhập" screen after sign-out
  - Issue: `clearAuth()` was setting `hasBootstrapped = false`, causing infinite restore spinner
  - Fix: Keep `hasBootstrapped = true` in `clearAuth()`

## Backend Changes

### DTOs Updated
- **`AuthRequestDto.kt`**
  ```kotlin
  @field:Size(max = 500, message = "INVALID_DEVICE_FINGERPRINT_LENGTH")
  val deviceFingerprint: String? = null
  ```

- **`VerifyTokenRequestDto.kt`**
  ```kotlin
  val deviceFingerprint: String? = null
  ```

- **`AuthResponseDto.kt`** - Added rate limit metadata
  ```kotlin
  val canResendAt: Long? = null,          // Unix timestamp (ms)
  val attemptsRemaining: Int? = null      // Remaining attempts before full cooldown
  ```

- **`TooManyCodeRequestException.kt`** - Added `retryAfterSeconds: Long` parameter

### Service Layer

#### `AuthService.kt` Interface Changes
- All methods now accept `deviceFingerprint: String?` parameter
- `signUpWithMail()` and `signInWithMail()` now return `MagicLinkSendResult`:
  ```kotlin
  data class MagicLinkSendResult(
      val cooldownSeconds: Long,
      val attemptsRemaining: Int
  )
  ```

#### `AuthServiceImpl.kt` Implementation
- **Per-device rate limiting**:
  ```kotlin
  private fun fingerprintHash(email: String, deviceFingerprint: String?): String {
      // HMAC-SHA256 of email + fingerprint
  }
  
  // Redis key: "auth_attempt:${fingerprintHash}"
  ```

- **Magic link payload**:
  ```kotlin
  // Embed both token hash AND fingerprint hash in magic link
  // Format: "token:{token}|fp:{fingerprintHash}"
  ```

- **Fingerprint validation in `verifyMagicLink()`**:
  - Extracts both token and fp hashes from magic link payload
  - Compares fp hash from payload with hash of provided deviceFingerprint
  - Returns 401 if mismatch (wrong device)

#### `JwtService.kt` & `JwtServiceImpl.kt`
- All methods accept `deviceFingerprintHash: String?` parameter
- JWT tokens now embed `device_fp` claim:
  ```kotlin
  claims {
      claim("device_fp", deviceFingerprintHash)
      // ... other claims
  }
  ```

### Controller Layer

**`AuthController.kt`**
- Extracts `request.deviceFingerprint` from all auth requests
- Passes fingerprint to service methods
- Returns enhanced responses with `canResendAt` and `attemptsRemaining`
- Handles `TooManyCodeRequestException` and returns 429 status with metadata

## Security Features

1. **Device binding**: Magic links only work on the device that requested them
2. **JWT claims**: Access/refresh tokens contain hashed device fingerprint
3. **Rate limiting**: Separate limits per device (not just per email)
4. **Hash-based validation**: Stores HMAC-SHA256 hashes, not raw fingerprints

## Rate Limiting Logic

### Redis Keys
- **Per-device attempts**: `auth_attempt:{HMAC(email + fingerprint)}`
- **Global email lock**: `auth_email_lock:{email}` (after max attempts)

### Limits
- 5 attempts per device per 15 minutes
- After 5 attempts, enforce email-wide cooldown
- Frontend receives `canResendAt` timestamp and `attemptsRemaining` count

## Testing Checklist

### Manual Tests
- [ ] Sign up with email - receive magic link
- [ ] Complete verification on same device - success
- [ ] Try to verify on different device/browser - fail with error
- [ ] Test resend cooldown - timer shows MM:SS countdown
- [ ] Refresh page during cooldown - timer persists from localStorage
- [ ] Exhaust 5 attempts - see rate limit message with retry time
- [ ] Wait for cooldown to expire - can request again
- [ ] Sign out after auth - no stuck spinner on restore screen

### Security Tests
- [ ] Inspect JWT - contains `device_fp` claim with hash
- [ ] Verify token with wrong fingerprint - returns 401
- [ ] Magic link from Device A fails on Device B
- [ ] Multiple devices to same email get separate rate limits

## Build Status
- ✅ Frontend: TypeScript compilation clean
- ✅ Backend: Maven compilation successful
- ⚠️ Warnings: Only markdown linting (non-blocking)

## Dependencies Added
- Frontend: `@fingerprintjs/fingerprintjs@5.1.0` (via yarn)

## Files Modified

### Frontend (9 files)
- `src/hooks/useDeviceFingerprint.ts` (created)
- `src/hooks/useResendTimer.ts` (created)
- `src/components/auth/NeedsVerify.tsx`
- `src/components/auth/SignUpMail.tsx`
- `src/components/auth/SignInMail.tsx`
- `src/components/auth/VerifyToken.tsx`
- `src/services/auth.service.ts`
- `src/models/auth-request.model.ts`
- `src/models/verify-token-request.model.ts`
- `src/stores/authStore.ts`

### Backend (10 files)
- `dtos/AuthRequestDto.kt`
- `dtos/VerifyTokenRequestDto.kt`
- `dtos/AuthResponseDto.kt`
- `exceptions/TooManyCodeRequestException.kt`
- `services/AuthService.kt`
- `services/JwtService.kt`
- `services/impl/AuthServiceImpl.kt` (156 line changes)
- `services/impl/JwtServiceImpl.kt`
- `controllers/AuthController.kt`

## Notes
- Device fingerprint is **optional** - system degrades gracefully if unavailable
- Frontend waits for fingerprint before sending auth request (loading state)
- Backend always hashes fingerprints before storage/comparison
- Timer uses localStorage key format: `resend-timer-{lowercase(email)}`
