import React, { useEffect, useCallback } from "react";
import { Activity, AlertCircle } from "lucide-react";
import { useDashboard } from "./hooks/useDashboard";
import { useApi } from "./hooks/useApi";
import { generateSampleData } from "./services/api";
import DataTable from "./components/DataTable";
import TransformationPanel from "./components/TransformationPanel";
import FilterBar from "./components/FilterBar";
import MetadataPanel from "./components/MetadataPanel";

function App() {
  const dashboard = useDashboard();
  const api = useApi();

  useEffect(() => {
    api.healthCheck();
  }, []);

  const handleLoadSample = useCallback(
    (type: "sales" | "users" | "products") => {
      const sampleData = generateSampleData(type);
      dashboard.setOriginalData(sampleData);
      dashboard.setTransformedData(sampleData);
    },
    [dashboard]
  );

  const handleExecuteTransformation = useCallback(async () => {
    if (
      !dashboard.selectedTransformation ||
      dashboard.originalData.length === 0
    ) {
      return;
    }

    const apiParameters = { ...dashboard.parameters };
    if (apiParameters.pivot_columns) {
      (apiParameters as any).columns = apiParameters.pivot_columns;
      delete apiParameters.pivot_columns;
    }

    const request = {
      data: dashboard.originalData,
      transformation_type: dashboard.selectedTransformation as any,
      parameters: apiParameters,
    };

    const result = await api.transformData(request);
    if (result) {
      dashboard.setTransformedData(result.data);
    }
  }, [dashboard, api]);

  const handleReset = useCallback(() => {
    dashboard.resetState();
  }, [dashboard]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Data Transformation Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Interactive data transformation with real-time preview
                </p>
              </div>
            </div>

            {api.loading.isLoading && (
              <div className="flex items-center text-primary-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <TransformationPanel
              selectedTransformation={dashboard.selectedTransformation}
              parameters={dashboard.parameters}
              availableColumns={dashboard.availableColumns}
              numericColumns={dashboard.numericColumns}
              isLoading={api.loading.isLoading}
              onTransformationChange={dashboard.setTransformation}
              onParametersChange={dashboard.setParameters}
              onExecute={handleExecuteTransformation}
              onReset={handleReset}
              onLoadSample={handleLoadSample}
            />

            {dashboard.transformedData.length > 0 && (
              <MetadataPanel
                metadata={{}}
                processingTime={0}
                originalCount={dashboard.originalData.length}
                transformedCount={dashboard.transformedData.length}
              />
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {api.loading.error && (
              <div className="card p-4 border-red-200 bg-red-50">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Transformation Error
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      {api.loading.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {dashboard.transformedData.length > 0 && (
              <FilterBar
                availableColumns={dashboard.availableColumns}
                filters={dashboard.filters}
                onAddFilter={dashboard.addFilter}
                onRemoveFilter={dashboard.removeFilter}
                onClearFilters={dashboard.clearFilters}
              />
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {dashboard.originalData.length > 0
                    ? "Data Preview"
                    : "No Data Loaded"}
                </h2>
                {dashboard.displayData.length !==
                  dashboard.transformedData.length && (
                  <span className="text-sm text-gray-500">
                    Filtered: {dashboard.displayData.length} of{" "}
                    {dashboard.transformedData.length} records
                  </span>
                )}
              </div>

              <DataTable
                data={dashboard.displayData}
                sortConfig={dashboard.sortConfig}
                onSort={dashboard.handleSort}
                isLoading={api.loading.isLoading}
              />
            </div>

            {dashboard.originalData.length === 0 && (
              <div className="card p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to Data Transformation Dashboard
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by loading sample data or selecting a
                  transformation type.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handleLoadSample("sales")}
                    className="btn-primary"
                  >
                    Load Sales Data
                  </button>
                  <button
                    onClick={() => handleLoadSample("users")}
                    className="btn-secondary"
                  >
                    Load User Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
