export interface AuthRequestDto {
  email: string;
  isSignUp?: boolean;
  deviceFingerprint?: string;
}