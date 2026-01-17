export interface AdminCreateUserRequestDto {
  name: string;
  email: string;
  role: string;
  institutionId?: string | null;
  trackId?: string | null;
  avatarId?: string | null;
}
