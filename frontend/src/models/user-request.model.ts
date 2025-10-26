export interface UserRequestDto {
  name: string;
  email: string;
  role: string;
  avatarId: string;
  institutionId: string;
  institutionName?: string;
}