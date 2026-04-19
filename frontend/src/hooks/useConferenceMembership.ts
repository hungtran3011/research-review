import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conferenceMembershipService } from '../services/conference-membership.service';
import { useBasicToast, getApiSuccessMessage, getApiErrorMessage } from './useBasicToast';
import type {
  BaseResponseDto,
} from '../models';
import type { AxiosError } from 'axios';

/**
 * Hook for fetching conference members
 */
export const useConferenceMembers = (conferenceId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['conferenceMembers', conferenceId],
    queryFn: () => conferenceMembershipService.getMembers(conferenceId),
    enabled: enabled && !!conferenceId,
  });
};

/**
 * Hook for assigning/updating a conference member role
 */
export const useAssignConferenceMember = () => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({
      conferenceId,
      userId,
      membershipRole,
    }: {
      conferenceId: string;
      userId: string;
      membershipRole: string;
    }) =>
      conferenceMembershipService.assignMember(conferenceId, {
        userId,
        membershipRole,
      }),
    onSuccess: (response, variables) => {
      success(getApiSuccessMessage(response, 'Công việc hoàn thành thành công!'));
      queryClient.invalidateQueries({ queryKey: ['conferenceMembers', variables.conferenceId] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      error(getApiErrorMessage(err, 'Có lỗi xảy ra'));
    },
  });
};

/**
 * Hook for removing a conference member
 */
export const useRemoveConferenceMember = () => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({
      conferenceId,
      userId,
    }: {
      conferenceId: string;
      userId: string;
    }) => conferenceMembershipService.removeMember(conferenceId, userId),
    onSuccess: (response, variables) => {
      success(getApiSuccessMessage(response, 'Xóa thành công!'));
      queryClient.invalidateQueries({ queryKey: ['conferenceMembers', variables.conferenceId] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      error(getApiErrorMessage(err, 'Có lỗi xảy ra'));
    },
  });
};
