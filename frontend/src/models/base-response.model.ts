export interface BaseResponseDto<T> {
  code: number;
  message: string;
  data?: T;
}