import { ConferenceStatus } from '../models';

export const ConferenceStatusOptions = [
  { value: ConferenceStatus.DRAFT, label: 'Nháp' },
  { value: ConferenceStatus.ACTIVE, label: 'Đang mở' },
  { value: ConferenceStatus.CLOSED, label: 'Đã đóng' },
];
