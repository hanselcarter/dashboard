import { useState, useCallback } from "react";
import { ApiService } from "../services/api";
import {
  TransformationRequest,
  TransformationResponse,
  LoadingState,
} from "../types";
import toast from "react-hot-toast";

export const useApi = () => {
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      successMessage?: string,
      errorMessage?: string
    ): Promise<T | null> => {
      setLoading({ isLoading: true, error: null });

      try {
        const result = await apiCall();
        setLoading({ isLoading: false, error: null });

        if (successMessage) {
          toast.success(successMessage);
        }

        return result;
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setLoading({ isLoading: false, error: errorMsg });

        if (errorMessage) {
          toast.error(`${errorMessage}: ${errorMsg}`);
        } else {
          toast.error(errorMsg);
        }

        return null;
      }
    },
    []
  );

  const transformData = useCallback(
    async (
      request: TransformationRequest
    ): Promise<TransformationResponse | null> => {
      return execute(
        () => ApiService.transformData(request),
        `Data transformed successfully (${request.transformation_type})`,
        "Transformation failed"
      );
    },
    [execute]
  );

  const batchTransform = useCallback(
    async (
      requests: TransformationRequest[]
    ): Promise<TransformationResponse[] | null> => {
      return execute(
        () => ApiService.batchTransform(requests),
        `Batch transformation completed (${requests.length} operations)`,
        "Batch transformation failed"
      );
    },
    [execute]
  );

  const healthCheck = useCallback(async () => {
    return execute(
      () => ApiService.healthCheck(),
      undefined,
      "Health check failed"
    );
  }, [execute]);

  const getTransformationTypes = useCallback(async () => {
    return execute(
      () => ApiService.getTransformationTypes(),
      undefined,
      "Failed to fetch transformation types"
    );
  }, [execute]);

  return {
    loading,
    transformData,
    batchTransform,
    healthCheck,
    getTransformationTypes,
  };
};
