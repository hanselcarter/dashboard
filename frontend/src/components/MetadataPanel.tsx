import React from "react";
import { Clock, Database, TrendingUp } from "lucide-react";

interface MetadataPanelProps {
  metadata: Record<string, any>;
  processingTime?: number;
  originalCount: number;
  transformedCount: number;
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({
  metadata,
  processingTime,
  originalCount,
  transformedCount,
}) => {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatValue = (value: any): string => {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="card p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <TrendingUp className="w-4 h-4 mr-2" />
        Transformation Results
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Database className="w-6 h-6 text-gray-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-gray-900">
            {originalCount}
          </div>
          <div className="text-sm text-gray-500">Original Records</div>
        </div>

        <div className="text-center p-3 bg-primary-50 rounded-lg">
          <Database className="w-6 h-6 text-primary-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-primary-900">
            {transformedCount}
          </div>
          <div className="text-sm text-primary-600">Transformed Records</div>
        </div>

        {processingTime && (
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Clock className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-900">
              {formatTime(processingTime)}
            </div>
            <div className="text-sm text-green-600">Processing Time</div>
          </div>
        )}
      </div>

      {Object.keys(metadata).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Metadata</h4>
          <div className="space-y-2">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {key.replace(/_/g, " ")}:
                  </span>
                </div>
                <div className="text-sm text-gray-900 mt-1">
                  {typeof value === "object" && value !== null ? (
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {formatValue(value)}
                    </pre>
                  ) : (
                    <span>{formatValue(value)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetadataPanel;
