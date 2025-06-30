import React, { useState, useCallback } from "react";
import { Play, RotateCcw, Database } from "lucide-react";
import { TransformationParameters } from "../types";

interface TransformationPanelProps {
  selectedTransformation: string;
  parameters: TransformationParameters;
  availableColumns: string[];
  numericColumns: string[];
  isLoading: boolean;
  onTransformationChange: (type: string) => void;
  onParametersChange: (params: TransformationParameters) => void;
  onExecute: () => void;
  onReset: () => void;
  onLoadSample: (type: "sales" | "users" | "products") => void;
}

const TransformationPanel: React.FC<TransformationPanelProps> = ({
  selectedTransformation,
  parameters,
  availableColumns,
  numericColumns,
  isLoading,
  onTransformationChange,
  onParametersChange,
  onExecute,
  onReset,
  onLoadSample,
}) => {
  const [localParams, setLocalParams] =
    useState<TransformationParameters>(parameters);

  React.useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  const handleParamChange = useCallback(
    (newParams: Partial<TransformationParameters>) => {
      const updated = { ...localParams, ...newParams };
      setLocalParams(updated);
      onParametersChange(updated);
    },
    [localParams, onParametersChange]
  );

  const transformationTypes = [
    {
      value: "aggregate",
      label: "Aggregate",
      description: "Group and summarize data",
    },
    {
      value: "filter",
      label: "Filter",
      description: "Filter data by conditions",
    },
    {
      value: "normalize",
      label: "Normalize",
      description: "Normalize numerical values",
    },
    { value: "pivot", label: "Pivot", description: "Pivot data structure" },
  ];

  const renderParameterInputs = () => {
    switch (selectedTransformation) {
      case "aggregate":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group By Columns
              </label>
              <select
                multiple
                className="input-field h-24"
                value={localParams.group_by || []}
                onChange={(e) => {
                  const values = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  handleParamChange({ group_by: values });
                }}
              >
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aggregations
              </label>
              {numericColumns.map((col) => (
                <div key={col} className="flex items-center space-x-2 mb-2">
                  <span className="w-24 text-sm">{col}:</span>
                  <select
                    className="input-field flex-1"
                    value={localParams.aggregations?.[col] || ""}
                    onChange={(e) => {
                      const aggs = { ...localParams.aggregations };
                      if (e.target.value) {
                        aggs[col] = e.target.value as any;
                      } else {
                        delete aggs[col];
                      }
                      handleParamChange({ aggregations: aggs });
                    }}
                  >
                    <option value="">Select function</option>
                    <option value="sum">Sum</option>
                    <option value="mean">Mean</option>
                    <option value="count">Count</option>
                    <option value="min">Min</option>
                    <option value="max">Max</option>
                    <option value="std">Std Dev</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        );

      case "filter":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Conditions
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <select className="input-field">
                    <option value="">Select field</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <select className="input-field">
                    <option value="">Operator</option>
                    <option value="eq">Equals</option>
                    <option value="ne">Not equals</option>
                    <option value="gt">Greater than</option>
                    <option value="gte">Greater or equal</option>
                    <option value="lt">Less than</option>
                    <option value="lte">Less or equal</option>
                    <option value="contains">Contains</option>
                  </select>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Value"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Advanced filtering coming soon
              </p>
            </div>
          </div>
        );

      case "normalize":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Columns to Normalize
              </label>
              <select
                multiple
                className="input-field h-24"
                value={localParams.columns || []}
                onChange={(e) => {
                  const values = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  handleParamChange({ columns: values });
                }}
              >
                {numericColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Normalization Method
              </label>
              <select
                className="input-field"
                value={localParams.method || "min_max"}
                onChange={(e) =>
                  handleParamChange({ method: e.target.value as any })
                }
              >
                <option value="min_max">Min-Max (0-1)</option>
                <option value="z_score">Z-Score</option>
                <option value="robust">Robust</option>
              </select>
            </div>
          </div>
        );

      case "pivot":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Index Column
                </label>
                <select
                  className="input-field"
                  value={localParams.index || ""}
                  onChange={(e) => handleParamChange({ index: e.target.value })}
                >
                  <option value="">Select column</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pivot Column
                </label>
                <select
                  className="input-field"
                  value={localParams.pivot_columns || ""}
                  onChange={(e) =>
                    handleParamChange({ pivot_columns: e.target.value })
                  }
                >
                  <option value="">Select column</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Values Column
                </label>
                <select
                  className="input-field"
                  value={localParams.values || ""}
                  onChange={(e) =>
                    handleParamChange({ values: e.target.value })
                  }
                >
                  <option value="">Select column</option>
                  {numericColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aggregation Function
              </label>
              <select
                className="input-field"
                value={localParams.aggfunc || "sum"}
                onChange={(e) =>
                  handleParamChange({ aggfunc: e.target.value as any })
                }
              >
                <option value="sum">Sum</option>
                <option value="mean">Mean</option>
                <option value="count">Count</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
              </select>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Select a transformation type to configure parameters
          </div>
        );
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Data Transformation
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => onLoadSample("sales")}
            className="btn-secondary text-sm"
            disabled={isLoading}
          >
            <Database className="w-4 h-4 mr-1" />
            Load Sample
          </button>
          <button
            onClick={onReset}
            className="btn-secondary text-sm"
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Transformation Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {transformationTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => onTransformationChange(type.value)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  selectedTransformation === type.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">{type.label}</div>
                <div className="text-sm text-gray-500">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedTransformation && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Parameters
            </h3>
            {renderParameterInputs()}
          </div>
        )}

        <button
          onClick={onExecute}
          disabled={isLoading || !selectedTransformation}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Play className="w-4 h-4 mr-2" />
              Execute Transformation
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default TransformationPanel;
