import axios, { AxiosError } from "axios";
import {
  TransformationRequest,
  TransformationResponse,
  ApiError,
  DataRecord,
} from "../types";

const API_BASE_URL = "/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    console.error(
      `❌ API Error: ${error.response?.status} ${error.config?.url}`,
      error.response?.data
    );
    return Promise.reject(error);
  }
);

export class ApiService {
  static async transformData(
    request: TransformationRequest
  ): Promise<TransformationResponse> {
    try {
      const response = await apiClient.post<TransformationResponse>(
        "/transform/",
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async batchTransform(
    requests: TransformationRequest[]
  ): Promise<TransformationResponse[]> {
    try {
      const response = await apiClient.post<TransformationResponse[]>(
        "/batch-transform/",
        {
          transformations: requests,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await apiClient.get("/health/");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getTransformationTypes(): Promise<Record<string, string>> {
    try {
      const response = await apiClient.get("/types/");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private static handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      const errorMessage =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        "An unexpected error occurred";

      return new Error(errorMessage);
    }

    return error instanceof Error ? error : new Error("Unknown error occurred");
  }
}

export const generateSampleData = (
  type: "sales" | "users" | "products" = "sales"
): DataRecord[] => {
  switch (type) {
    case "sales":
      return [
        { region: "North", sales: 100, product: "A", quarter: "Q1" },
        { region: "North", sales: 150, product: "B", quarter: "Q1" },
        { region: "South", sales: 200, product: "A", quarter: "Q1" },
        { region: "South", sales: 120, product: "B", quarter: "Q1" },
        { region: "North", sales: 180, product: "A", quarter: "Q2" },
        { region: "North", sales: 220, product: "B", quarter: "Q2" },
        { region: "South", sales: 160, product: "A", quarter: "Q2" },
        { region: "South", sales: 190, product: "B", quarter: "Q2" },
      ];

    case "users":
      return [
        { name: "Alice", age: 30, city: "New York", score: 85 },
        { name: "Bob", age: 25, city: "Los Angeles", score: 92 },
        { name: "Charlie", age: 35, city: "New York", score: 78 },
        { name: "Diana", age: 28, city: "Chicago", score: 88 },
        { name: "Eve", age: 32, city: "Los Angeles", score: 95 },
        { name: "Frank", age: 29, city: "New York", score: 82 },
      ];

    case "products":
      return [
        {
          name: "Product A",
          price: 100,
          quantity: 10,
          category: "Electronics",
        },
        { name: "Product B", price: 200, quantity: 5, category: "Electronics" },
        { name: "Product C", price: 150, quantity: 8, category: "Clothing" },
        { name: "Product D", price: 80, quantity: 15, category: "Clothing" },
        { name: "Product E", price: 300, quantity: 3, category: "Electronics" },
      ];

    default:
      return [];
  }
};
