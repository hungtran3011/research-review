import type { TrackDto } from "./track.model";
import type { InstitutionDto } from "./institution.model";

export interface UserDto {
  id: string;
  name: string;
  role: string;
  roles?: string[];
  email: string;
  avatarId?: string | null;
  institution?: InstitutionDto | null;
  track?: TrackDto | null;
  gender?: string | null;
  nationality?: string | null;
  academicStatus?: string | null;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}