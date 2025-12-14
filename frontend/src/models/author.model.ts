import type { InstitutionDto } from './institution.model';
import type { UserDto } from './user.model';

export interface AuthorDto {
  id?: string;
  name: string;
  email: string;
  institution: Pick<InstitutionDto, 'id' | 'name' | 'country' | 'website' | 'logo'>;
  user?: UserDto;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}