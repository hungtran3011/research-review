import type { TrackDto } from "./track.model";

export interface UserDto {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarId: string;
  institutionId: string;
  track: TrackDto;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}