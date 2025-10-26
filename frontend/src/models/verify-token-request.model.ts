export interface VerifyTokenRequestDto {
  email: string;
  token: string;
  isSignUp: boolean;
}