import type { InstitutionDto } from './institution.model';
import type { UserDto } from './user.model';

export interface ReviewerDto {
  id: string;
  name: string;
  email: string;
  institution: InstitutionDto;
  user?: UserDto;
  displayIndex?: number; // For anonymization: Reviewer 1, Reviewer 2, etc.
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}