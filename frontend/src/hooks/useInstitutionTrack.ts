import { useQuery } from '@tanstack/react-query';
import { institutionService } from '../services/institution.service';
import { trackService } from '../services/track.service';

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
