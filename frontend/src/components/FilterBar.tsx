import React, { useState } from "react";
import { Filter, X, Plus } from "lucide-react";
import { FilterConfig } from "../types";

interface FilterBarProps {
  availableColumns: string[];
  filters: FilterConfig[];
  onAddFilter: (filter: FilterConfig) => void;
  onRemoveFilter: (index: number) => void;
  onClearFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  availableColumns,
  filters,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
}) => {
  const [newFilter, setNewFilter] = useState<Partial<FilterConfig>>({
    column: "",
    operator: "contains",
    value: "",
  });

  const handleAddFilter = () => {
    if (newFilter.column && newFilter.value) {
      onAddFilter(newFilter as FilterConfig);
      setNewFilter({ column: "", operator: "contains", value: "" });
    }
  };

  const operatorLabels = {
    contains: "Contains",
    equals: "Equals",
    greater: "Greater than",
    less: "Less than",
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="w-4 h-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">
            Client-side Filters
          </h3>
        </div>
        {filters.length > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <select
          className="input-field text-sm"
          value={newFilter.column || ""}
          onChange={(e) =>
            setNewFilter({ ...newFilter, column: e.target.value })
          }
        >
          <option value="">Select column</option>
          {availableColumns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>

        <select
          className="input-field text-sm"
          value={newFilter.operator || "contains"}
          onChange={(e) =>
            setNewFilter({
              ...newFilter,
              operator: e.target.value as FilterConfig["operator"],
            })
          }
        >
          {Object.entries(operatorLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="input-field text-sm"
          placeholder="Filter value"
          value={newFilter.value || ""}
          onChange={(e) =>
            setNewFilter({ ...newFilter, value: e.target.value })
          }
          onKeyPress={(e) => e.key === "Enter" && handleAddFilter()}
        />

        <button
          onClick={handleAddFilter}
          disabled={!newFilter.column || !newFilter.value}
          className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {filters.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <div
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
              >
                <span className="font-medium">{filter.column}</span>
                <span className="mx-1">{operatorLabels[filter.operator]}</span>
                <span className="font-medium">"{filter.value}"</span>
                <button
                  onClick={() => onRemoveFilter(index)}
                  className="ml-2 hover:text-primary-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
