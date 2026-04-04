import type { UserDto } from './user.model';

export interface EditorTrackRef {
  id: string;
  name: string;
}

export interface EditorDto {
  id: string;
  track: EditorTrackRef;
  user?: UserDto;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}