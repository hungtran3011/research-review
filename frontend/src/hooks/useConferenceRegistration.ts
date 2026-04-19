import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { BaseResponseDto, ConferenceMembershipDto } from '../models';
import { conferenceRegistrationService } from '../services/conference-registration.service';
import { useBasicToast, getApiSuccessMessage, getApiErrorMessage } from './useBasicToast';

export const useRegisterConference = () => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: (conferenceId: string) => conferenceRegistrationService.register(conferenceId),
    onSuccess: (response) => {
      success(getApiSuccessMessage(response, 'Conference registration completed'));
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (err: AxiosError<BaseResponseDto<ConferenceMembershipDto>>) => {
      error(getApiErrorMessage(err, 'Unable to register this conference'));
    },
  });
};
