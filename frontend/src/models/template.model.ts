export interface TemplateDto {
  id: string;
  name: string;
  description?: string;
  bucketPath: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  variables?: string[];
}