// API Types
export interface DataRecord {
  [key: string]: any;
}

export interface TransformationParameters {
  // Aggregate parameters
  group_by?: string[];
  aggregations?: Record<
    string,
    "sum" | "mean" | "count" | "min" | "max" | "std"
  >;

  // Filter parameters
  conditions?: FilterCondition | FilterCondition[];

  // Normalize parameters
  columns?: string[];
  method?: "min_max" | "z_score" | "robust";

  // Pivot parameters
  index?: string;
  pivot_columns?: string;
  values?: string;
  aggfunc?: "sum" | "mean" | "count" | "min" | "max";
}

export interface FilterCondition {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "in";
  value: any;
}

export interface TransformationRequest {
  data: DataRecord[];
  transformation_type: "aggregate" | "filter" | "normalize" | "pivot";
  parameters: TransformationParameters;
}

export interface TransformationResponse {
  message: string;
  data: DataRecord[];
  metadata: Record<string, any>;
  processing_time_ms: number;
}

export interface ApiError {
  detail?: string;
  error?: string;
  message?: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  column: string;
  value: string;
  operator: "contains" | "equals" | "greater" | "less";
}

// Dashboard State
export interface DashboardState {
  originalData: DataRecord[];
  transformedData: DataRecord[];
  selectedTransformation: string;
  parameters: TransformationParameters;
  loading: LoadingState;
  sortConfig: SortConfig | null;
  filters: FilterConfig[];
}
