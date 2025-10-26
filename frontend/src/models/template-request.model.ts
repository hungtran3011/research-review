export interface TemplateRequestDto {
  name: string;
  description?: string;
  htmlContent: string;
  variables?: string[];
}