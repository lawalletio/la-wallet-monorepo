import { useState } from 'react';

export interface StatusVarsTypes {
  error: string;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

export interface UseStatusVarsReturns extends StatusVarsTypes {
  handleMarkSuccess: () => void;
  handleMarkError: (message?: string) => void;
  handleMarkLoading: (bool: boolean) => void;
}

type UseStatusVarsParameters = {
  initialState?: {
    isError?: boolean;
    isSuccess?: boolean;
    isLoading?: boolean;
  };
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

type InformationTypes = {
  loading: boolean;
  error: {
    existError: boolean;
    message: string;
  };
  success: boolean;
};

const defaultError = {
  existError: false,
  message: '',
};

export const useStatusVars = (params?: UseStatusVarsParameters): UseStatusVarsReturns => {
  const [information, setInformation] = useState<InformationTypes>({
    loading: params?.initialState?.isLoading ?? false,
    error: {
      existError: params?.initialState?.isError ?? false,
      message: '',
    },
    success: params?.initialState?.isSuccess ?? false,
  });

  const handleMarkSuccess = () => {
    setInformation((prev) => {
      return {
        ...prev,
        error: defaultError,
        loading: false,
        success: true,
      };
    });

    if (params?.onSuccess) params.onSuccess();
  };

  const handleMarkError = (message: string = '') => {
    setInformation({
      error: {
        existError: true,
        message,
      },
      loading: false,
      success: false,
    });

    if (params?.onError) params.onError(message);
  };

  const handleMarkLoading = (bool: boolean) => {
    setInformation((prev) => {
      return {
        ...prev,
        loading: bool,
      };
    });
  };

  return {
    isSuccess: information.success,
    isLoading: information.loading,
    isError: information.error.existError,
    error: information.error.message,
    handleMarkSuccess,
    handleMarkError,
    handleMarkLoading,
  };
};
