export interface BasicEmailDto {
  to: string[];
  subject: string;
  message: string;
  template: string;
  attachment?: Record<string, Uint8Array>;
}