import type { InstitutionDto } from './institution.model';
import type { UserDto } from './user.model';

export interface ReviewerDto {
  id: string;
  name: string;
  email: string;
  institution: InstitutionDto;
  user?: UserDto;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}