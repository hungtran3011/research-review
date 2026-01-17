import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { institutionService } from '../services/institution.service';
import { trackService } from '../services/track.service';
import { useBusinessToast } from './businessToast';
import type { BaseResponseDto, InstitutionDto, TrackDto, TrackRequestDto } from '../models';
import type { AxiosError } from 'axios';

/**
 * Hook for fetching all institutions
 */
export const useInstitutions = (page: number = 0, size: number = 100) => {
  return useQuery({
    queryKey: ['institutions', page, size],
    queryFn: () => institutionService.getAll(page, size),
  });
};

/**
 * Hook for fetching a single institution by ID
 */
export const useInstitution = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['institution', id],
    queryFn: () => institutionService.getById(id),
    enabled: enabled && !!id,
  });
};

/**
 * Hook for fetching all tracks
 */
export const useTracks = () => {
  return useQuery({
    queryKey: ['tracks'],
    queryFn: () => trackService.getAll(),
  });
};

/**
 * Hook for fetching a single track by ID
 */
export const useTrack = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['track', id],
    queryFn: () => trackService.getById(id),
    enabled: enabled && !!id,
  });
};

/**
 * Hook for creating a track (admin)
 */
export const useCreateTrack = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation<
    BaseResponseDto<TrackDto>,
    AxiosError<BaseResponseDto<null>>,
    TrackRequestDto
  >({
    mutationFn: (data) => trackService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      showSuccess(response, 'Tạo track thành công', [200]);
    },
    onError: (err) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi tạo track');
    },
  });
};

/**
 * Hook for updating a track (admin)
 */
export const useUpdateTrack = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation<
    BaseResponseDto<TrackDto>,
    AxiosError<BaseResponseDto<null>>,
    { id: string; data: TrackRequestDto }
  >({
    mutationFn: ({ id, data }) => trackService.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      showSuccess(response, 'Cập nhật track thành công', [200]);
    },
    onError: (err) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi cập nhật track');
    },
  });
};

/**
 * Hook for deleting a track (admin)
 */
export const useDeleteTrack = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation<
    BaseResponseDto<string>,
    AxiosError<BaseResponseDto<null>>,
    string
  >({
    mutationFn: (id) => trackService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      showSuccess(response, 'Xóa track thành công', [200]);
    },
    onError: (err) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi xóa track');
    },
  });
};

/**
 * Hook for creating an institution (admin)
 */
export const useCreateInstitution = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation<
    BaseResponseDto<InstitutionDto>,
    AxiosError<BaseResponseDto<null>>,
    InstitutionDto
  >({
    mutationFn: (data) => institutionService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      showSuccess(response, 'Tạo nơi công tác thành công', [200]);
    },
    onError: (err) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi tạo nơi công tác');
    },
  });
};

/**
 * Hook for updating an institution (admin)
 */
export const useUpdateInstitution = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation<
    BaseResponseDto<InstitutionDto>,
    AxiosError<BaseResponseDto<null>>,
    { id: string; data: InstitutionDto }
  >({
    mutationFn: ({ id, data }) => institutionService.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      showSuccess(response, 'Cập nhật nơi công tác thành công', [200]);
    },
    onError: (err) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi cập nhật nơi công tác');
    },
  });
};

/**
 * Hook for deleting an institution (admin)
 */
export const useDeleteInstitution = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation<
    BaseResponseDto<string>,
    AxiosError<BaseResponseDto<null>>,
    string
  >({
    mutationFn: (id) => institutionService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      showSuccess(response, 'Xóa nơi công tác thành công', [200]);
    },
    onError: (err) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi xóa nơi công tác');
    },
  });
};
