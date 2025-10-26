import type { EditorDto } from './editor.model';

export interface TrackDto {
  id: string;
  name: string;
  editors: EditorDto[];
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}