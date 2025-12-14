export interface AuthResponseDto {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
}