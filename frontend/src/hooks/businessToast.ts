import { SpecialErrorCode } from '../constants/business-code';
import type { BaseResponseDto } from '../models';
import type { AxiosError } from 'axios';
import { useBasicToast } from './useBasicToast';

export const getSpecialErrorMessage = (code?: number): string | undefined => {
  switch (code) {
    case SpecialErrorCode.INTERNAL_ERROR:
      return 'Lỗi hệ thống, vui lòng thử lại sau.';
    case SpecialErrorCode.BAD_REQUEST:
      return 'Yêu cầu không hợp lệ.';
    case SpecialErrorCode.UNAUTHORIZED:
      return 'Bạn cần đăng nhập để thực hiện thao tác này.';
    case SpecialErrorCode.FORBIDDEN:
      return 'Bạn không có quyền thực hiện thao tác này.';
    case SpecialErrorCode.NOT_FOUND:
      return 'Không tìm thấy tài nguyên.';
    case SpecialErrorCode.GENERAL_ERROR:
      return 'Có lỗi xảy ra, vui lòng thử lại.';
    default:
      return undefined;
  }
};

export const useBusinessToast = () => {
  const { success, error } = useBasicToast();

  const showSuccess = (response: BaseResponseDto<unknown>, fallback: string, successCodes?: number[]) => {
    const ok = successCodes && successCodes.length > 0 ? successCodes.includes(response.code) : true;
    if (ok) {
      success(response.message || fallback);
    } else {
      error(response.message || fallback);
    }
  };

  const showErrorFromAxios = (err: AxiosError<BaseResponseDto<unknown>>, fallback: string) => {
    const code = err.response?.data?.code;
    const special = getSpecialErrorMessage(code);
    if (special) {
      error(special);
      return;
    }
    const msg = err.response?.data?.message || err.message || fallback;
    error(msg);
  };

  return { showSuccess, showErrorFromAxios };
};
