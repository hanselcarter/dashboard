import { useState, useCallback, useMemo, useReducer } from "react";
import {
  DataRecord,
  DashboardState,
  SortConfig,
  FilterConfig,
  TransformationParameters,
} from "../types";

// Dashboard action types
type DashboardAction =
  | { type: "SET_ORIGINAL_DATA"; payload: DataRecord[] }
  | { type: "SET_TRANSFORMED_DATA"; payload: DataRecord[] }
  | { type: "SET_TRANSFORMATION"; payload: string }
  | { type: "SET_PARAMETERS"; payload: TransformationParameters }
  | {
      type: "SET_LOADING";
      payload: { isLoading: boolean; error: string | null };
    }
  | { type: "SET_SORT"; payload: SortConfig | null }
  | { type: "ADD_FILTER"; payload: FilterConfig }
  | { type: "REMOVE_FILTER"; payload: number }
  | { type: "CLEAR_FILTERS" }
  | { type: "RESET_STATE" };

// Dashboard reducer for complex state management
const dashboardReducer = (
  state: DashboardState,
  action: DashboardAction
): DashboardState => {
  switch (action.type) {
    case "SET_ORIGINAL_DATA":
      return { ...state, originalData: action.payload };

    case "SET_TRANSFORMED_DATA":
      return { ...state, transformedData: action.payload };

    case "SET_TRANSFORMATION":
      return {
        ...state,
        selectedTransformation: action.payload,
        parameters: {},
      };

    case "SET_PARAMETERS":
      return {
        ...state,
        parameters: { ...state.parameters, ...action.payload },
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_SORT":
      return { ...state, sortConfig: action.payload };

    case "ADD_FILTER":
      return { ...state, filters: [...state.filters, action.payload] };

    case "REMOVE_FILTER":
      return {
        ...state,
        filters: state.filters.filter((_, index) => index !== action.payload),
      };

    case "CLEAR_FILTERS":
      return { ...state, filters: [] };

    case "RESET_STATE":
      return {
        originalData: [],
        transformedData: [],
        selectedTransformation: "",
        parameters: {},
        loading: { isLoading: false, error: null },
        sortConfig: null,
        filters: [],
      };

    default:
      return state;
  }
};

// Initial dashboard state
const initialState: DashboardState = {
  originalData: [],
  transformedData: [],
  selectedTransformation: "",
  parameters: {},
  loading: { isLoading: false, error: null },
  sortConfig: null,
  filters: [],
};

export const useDashboard = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Client-side sorting with memoization for performance
  const sortedData = useMemo(() => {
    if (!state.sortConfig) return state.transformedData;

    const { key, direction } = state.sortConfig;
    return [...state.transformedData].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [state.transformedData, state.sortConfig]);

  // Client-side filtering with memoization
  const filteredAndSortedData = useMemo(() => {
    if (state.filters.length === 0) return sortedData;

    return sortedData.filter((record) => {
      return state.filters.every((filter) => {
        const value = record[filter.column];
        const filterValue = filter.value.toLowerCase();

        switch (filter.operator) {
          case "contains":
            return String(value).toLowerCase().includes(filterValue);

          case "equals":
            return String(value).toLowerCase() === filterValue;

          case "greater":
            return (
              typeof value === "number" && value > parseFloat(filter.value)
            );

          case "less":
            return (
              typeof value === "number" && value < parseFloat(filter.value)
            );

          default:
            return true;
        }
      });
    });
  }, [sortedData, state.filters]);

  // Get unique column names for filtering/sorting
  const availableColumns = useMemo(() => {
    if (state.transformedData.length === 0) return [];
    return Object.keys(state.transformedData[0]);
  }, [state.transformedData]);

  // Get numeric columns for normalization
  const numericColumns = useMemo(() => {
    if (state.originalData.length === 0) return [];

    const firstRecord = state.originalData[0];
    return Object.keys(firstRecord).filter(
      (key) => typeof firstRecord[key] === "number"
    );
  }, [state.originalData]);

  // Action creators with useCallback for performance
  const setOriginalData = useCallback((data: DataRecord[]) => {
    dispatch({ type: "SET_ORIGINAL_DATA", payload: data });
  }, []);

  const setTransformedData = useCallback((data: DataRecord[]) => {
    dispatch({ type: "SET_TRANSFORMED_DATA", payload: data });
  }, []);

  const setTransformation = useCallback((type: string) => {
    dispatch({ type: "SET_TRANSFORMATION", payload: type });
  }, []);

  const setParameters = useCallback((params: TransformationParameters) => {
    dispatch({ type: "SET_PARAMETERS", payload: params });
  }, []);

  const setLoading = useCallback(
    (loading: { isLoading: boolean; error: string | null }) => {
      dispatch({ type: "SET_LOADING", payload: loading });
    },
    []
  );

  const handleSort = useCallback(
    (key: string) => {
      const currentSort = state.sortConfig;
      let newSort: SortConfig | null;

      if (!currentSort || currentSort.key !== key) {
        newSort = { key, direction: "asc" };
      } else if (currentSort.direction === "asc") {
        newSort = { key, direction: "desc" };
      } else {
        newSort = null; // Remove sorting
      }

      dispatch({ type: "SET_SORT", payload: newSort });
    },
    [state.sortConfig]
  );

  const addFilter = useCallback((filter: FilterConfig) => {
    dispatch({ type: "ADD_FILTER", payload: filter });
  }, []);

  const removeFilter = useCallback((index: number) => {
    dispatch({ type: "REMOVE_FILTER", payload: index });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: "RESET_STATE" });
  }, []);

  return {
    // State
    ...state,

    // Computed values
    displayData: filteredAndSortedData,
    availableColumns,
    numericColumns,

    // Actions
    setOriginalData,
    setTransformedData,
    setTransformation,
    setParameters,
    setLoading,
    handleSort,
    addFilter,
    removeFilter,
    clearFilters,
    resetState,
  };
};
