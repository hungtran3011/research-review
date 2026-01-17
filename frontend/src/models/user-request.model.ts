export interface UserRequestDto {
  name: string;
  email: string;
  role: string;
  avatarId: string;
  institutionId: string;
  institutionName?: string;
  trackId: string;
  gender?: string;
  nationality?: string;
  academicStatus?: string;
  inviteToken?: string;
}