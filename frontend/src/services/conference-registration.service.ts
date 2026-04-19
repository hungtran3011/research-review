import { api } from './api';
import type { BaseResponseDto, ConferenceMembershipDto } from '../models';

export const conferenceRegistrationService = {
  register: async (conferenceId: string): Promise<BaseResponseDto<ConferenceMembershipDto>> => {
    const response = await api.post<BaseResponseDto<ConferenceMembershipDto>>(
      `/conferences/${conferenceId}/registrations`
    );
    return response.data;
  },
};
