import React, { memo } from "react";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { DataRecord, SortConfig } from "../types";

interface DataTableProps {
  data: DataRecord[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  isLoading?: boolean;
}

const DataTable: React.FC<DataTableProps> = memo(
  ({ data, sortConfig, onSort, isLoading = false }) => {
    if (isLoading) {
      return (
        <div className="card p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="card p-6 text-center text-gray-500">
          <p>No data to display</p>
        </div>
      );
    }

    const columns = Object.keys(data[0]);

    const getSortIcon = (column: string) => {
      if (!sortConfig || sortConfig.key !== column) {
        return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
      }

      return sortConfig.direction === "asc" ? (
        <ChevronUp className="w-4 h-4 text-primary-600" />
      ) : (
        <ChevronDown className="w-4 h-4 text-primary-600" />
      );
    };

    const formatCellValue = (value: any): string => {
      if (value === null || value === undefined) {
        return "-";
      }

      if (typeof value === "number") {
        return value.toLocaleString();
      }

      if (typeof value === "boolean") {
        return value ? "Yes" : "No";
      }

      return String(value);
    };

    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => onSort(column)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.replace(/_/g, " ")}</span>
                      {getSortIcon(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {formatCellValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500">
            Showing {data.length} {data.length === 1 ? "record" : "records"}
          </div>
        )}
      </div>
    );
  }
);

DataTable.displayName = "DataTable";

export default DataTable;
