import type { TrackDto } from "./track.model";
import type { InstitutionDto } from "./institution.model";
import type { ConferenceMembershipDto } from './conference-membership.model';

export interface UserDto {
  id: string;
  name: string;
  globalRole: string;
  email: string;
  avatarId?: string | null;
  institution?: InstitutionDto | null;
  track?: TrackDto | null;
  conferences?: ConferenceMembershipDto[];
  gender?: string | null;
  nationality?: string | null;
  academicStatus?: string | null;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}