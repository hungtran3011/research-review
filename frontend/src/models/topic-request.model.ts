export interface TopicCreateRequestDto {
  name: string;
  description?: string | null;
  isActive?: boolean;
  orderIndex?: number;
  trackId?: string | null;
}

export interface TopicUpdateRequestDto {
  name: string;
  description?: string | null;
  isActive: boolean;
  orderIndex: number;
  trackId?: string | null;
}
