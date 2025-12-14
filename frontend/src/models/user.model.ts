import type { TrackDto } from "./track.model";
import type { InstitutionDto } from "./institution.model";

export interface UserDto {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarId: string;
  institutionId: string;
  institutionName: string;
  institution?: InstitutionDto;
  trackId: string;
  track?: TrackDto;
  gender: string;
  nationality: string;
  academicStatus: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}