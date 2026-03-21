export interface TopicDto {
  id: string;
  conferenceId: string;
  trackId?: string | null;
  name: string;
  description?: string | null;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}
