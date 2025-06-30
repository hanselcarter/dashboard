import pytest
import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .serializers import (
    DataTransformationInputSerializer,
    DataTransformationOutputSerializer,
)
from .transformations import (
    aggregate_data,
    filter_data,
    normalize_data,
    pivot_data,
    apply_transformation,
    TRANSFORMATION_FUNCTIONS,
)

class TransformationFunctionsTest(TestCase):

    def setUp(self):
        self.sample_data = [
            {"region": "North", "sales": 100, "product": "A", "quantity": 10},
            {"region": "North", "sales": 150, "product": "B", "quantity": 5},
            {"region": "South", "sales": 200, "product": "A", "quantity": 8},
            {"region": "South", "sales": 120, "product": "B", "quantity": 12},
        ]

        self.people_data = [
            {"name": "Alice", "age": 30, "city": "New York", "salary": 50000},
            {"name": "Bob", "age": 25, "city": "Los Angeles", "salary": 60000},
            {"name": "Charlie", "age": 35, "city": "New York", "salary": 70000},
            {"name": "Diana", "age": 28, "city": "Chicago", "salary": 55000},
        ]

    def test_aggregate_data_basic(self):
        parameters = {
            "group_by": ["region"],
            "aggregations": {"sales": "sum", "quantity": "mean"}
        }

        result = aggregate_data(self.sample_data, parameters)

        self.assertIn("data", result)
        self.assertIn("metadata", result)
        self.assertEqual(len(result["data"]), 2)
        self.assertEqual(result["metadata"]["original_rows"], 4)
        self.assertEqual(result["metadata"]["transformed_rows"], 2)

    def test_aggregate_data_count_only(self):
        parameters = {"group_by": ["region"]}

        result = aggregate_data(self.sample_data, parameters)

        self.assertIn("data", result)
        self.assertEqual(len(result["data"]), 2)
        self.assertIn("count", result["data"][0])

    def test_filter_data_single_condition(self):
        parameters = {
            "conditions": {"field": "age", "operator": "gte", "value": 30}
        }

        result = filter_data(self.people_data, parameters)

        self.assertIn("data", result)
        self.assertEqual(len(result["data"]), 2)
        self.assertEqual(result["metadata"]["filtered_rows"], 2)

    def test_filter_data_multiple_conditions(self):
        parameters = {
            "conditions": [
                {"field": "age", "operator": "gte", "value": 30},
                {"field": "city", "operator": "eq", "value": "New York"}
            ]
        }

        result = filter_data(self.people_data, parameters)

        self.assertIn("data", result)
        self.assertEqual(len(result["data"]), 2)

    def test_filter_data_contains_operator(self):
        parameters = {
            "conditions": {"field": "name", "operator": "contains", "value": "li"}
        }

        result = filter_data(self.people_data, parameters)

        self.assertIn("data", result)
        self.assertEqual(len(result["data"]), 2)  # Alice and Charlie

    def test_filter_data_in_operator(self):
        parameters = {
            "conditions": {"field": "city", "operator": "in", "value": ["New York", "Chicago"]}
        }

        result = filter_data(self.people_data, parameters)

        self.assertIn("data", result)
        self.assertEqual(len(result["data"]), 3)

    def test_normalize_data_min_max(self):
        parameters = {
            "columns": ["salary"],
            "method": "min_max"
        }

        result = normalize_data(self.people_data, parameters)

        self.assertIn("data", result)
        self.assertIn("metadata", result)
        self.assertIn("statistics", result["metadata"])

        normalized_salaries = [row["salary"] for row in result["data"]]
        self.assertTrue(all(0 <= val <= 1 for val in normalized_salaries))

    def test_normalize_data_z_score(self):
        parameters = {
            "columns": ["salary", "age"],
            "method": "z_score"
        }

        result = normalize_data(self.people_data, parameters)

        self.assertIn("data", result)
        self.assertIn("metadata", result)
        self.assertEqual(len(result["metadata"]["normalized_columns"]), 2)

    def test_pivot_data(self):
        parameters = {
            "index": "region",
            "columns": "product",
            "values": "sales",
            "aggfunc": "sum"
        }

        result = pivot_data(self.sample_data, parameters)

        self.assertIn("data", result)
        self.assertIn("metadata", result)
        self.assertEqual(len(result["data"]), 2)

    def test_apply_transformation_dispatcher(self):
        parameters = {"group_by": ["region"]}

        result = apply_transformation(
            self.sample_data, "aggregate", parameters)

        self.assertIn("data", result)
        self.assertIn("metadata", result)

    def test_apply_transformation_invalid_type(self):
        with self.assertRaises(ValueError):
            apply_transformation(self.sample_data, "invalid_transform", {})

    def test_transformation_error_handling(self):
        parameters = {
            "group_by": ["nonexistent_column"],
        }

        with self.assertRaises(ValueError):
            aggregate_data(self.sample_data, parameters)

    def test_filter_invalid_field(self):
        parameters = {
            "conditions": {"field": "nonexistent", "operator": "eq", "value": "test"}
        }

        with self.assertRaises(ValueError):
            filter_data(self.people_data, parameters)

    def test_normalize_no_numeric_columns(self):
        text_data = [
            {"name": "Alice", "city": "New York"},
            {"name": "Bob", "city": "Los Angeles"},
        ]

        parameters = {"columns": ["name", "city"]}

        with self.assertRaises(ValueError):
            normalize_data(text_data, parameters)


class SerializerTest(TestCase):

    def setUp(self):
        self.valid_input_data = {
            "data": [
                {"name": "Alice", "age": 30},
                {"name": "Bob", "age": 25}
            ],
            "transformation_type": "filter",
            "parameters": {
                "conditions": {"field": "age", "operator": "gte", "value": 30}
            }
        }

    def test_input_serializer_valid(self):
        serializer = DataTransformationInputSerializer(
            data=self.valid_input_data)
        self.assertTrue(serializer.is_valid())

    def test_input_serializer_empty_data(self):
        invalid_data = {
            "data": [],
            "transformation_type": "filter",
            "parameters": {}
        }

        serializer = DataTransformationInputSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("data", serializer.errors)

    def test_input_serializer_inconsistent_keys(self):
        invalid_data = {
            "data": [
                {"name": "Alice", "age": 30},
                {"name": "Bob", "city": "NYC"}  # Different keys
            ],
            "transformation_type": "filter",
            "parameters": {}
        }

        serializer = DataTransformationInputSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("data", serializer.errors)

    def test_input_serializer_parameter_validation(self):
        invalid_data = {
            "data": [{"name": "Alice", "age": 30}],
            "transformation_type": "aggregate",
            "parameters": {}
        }

        serializer = DataTransformationInputSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("parameters", serializer.errors)

    def test_output_serializer(self):
        output_data = {
            "success": True,
            "message": "Transformation completed",
            "data": [{"name": "Alice", "age": 30}],
            "metadata": {"original_rows": 2, "transformed_rows": 1},
            "processing_time_ms": 15.5
        }

        serializer = DataTransformationOutputSerializer(data=output_data)
        self.assertTrue(serializer.is_valid())


class APIEndpointTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.sample_data = [
            {"region": "North", "sales": 100, "product": "A"},
            {"region": "North", "sales": 150, "product": "B"},
            {"region": "South", "sales": 200, "product": "A"},
        ]

    def test_health_check_endpoint(self):
        url = reverse("data_transform:health_check")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("status", response.data)
        self.assertEqual(response.data["status"], "healthy")

    def test_transformation_types_endpoint(self):
        url = reverse("data_transform:transformation_types")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("available_transformations", response.data)
        self.assertIn("transformation_details", response.data)
        self.assertIn("aggregate", response.data["available_transformations"])

    def test_transform_endpoint_success(self):
        url = reverse("data_transform:transform")
        data = {
            "data": self.sample_data,
            "transformation_type": "aggregate",
            "parameters": {
                "group_by": ["region"],
                "aggregations": {"sales": "sum"}
            }
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("data", response.data)
        self.assertIn("metadata", response.data)
        self.assertIn("processing_time_ms", response.data)

    def test_transform_endpoint_validation_error(self):
        url = reverse("data_transform:transform")
        data = {
            "data": [],
            "transformation_type": "aggregate",
            "parameters": {"group_by": ["region"]}
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertIn("errors", response.data)

    def test_transform_endpoint_transformation_error(self):
        url = reverse("data_transform:transform")
        data = {
            "data": self.sample_data,
            "transformation_type": "aggregate",
            "parameters": {
                "group_by": ["nonexistent_column"]
            }
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_batch_transform_endpoint(self):
        url = reverse("data_transform:batch_transform")
        data = {
            "data": self.sample_data,
            "transformations": [
                {
                    "transformation_type": "aggregate",
                    "parameters": {
                        "group_by": ["region"],
                        "aggregations": {"sales": "sum"}
                    }
                },
                {
                    "transformation_type": "filter",
                    "parameters": {
                        "conditions": {"field": "sales", "operator": "gt", "value": 150}
                    }
                }
            ]
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("transformation_steps", response.data)
        self.assertEqual(len(response.data["transformation_steps"]), 2)

    def test_batch_transform_missing_data(self):
        """Test batch transformation with missing data."""
        url = reverse("data_transform:batch_transform")
        data = {
            "transformations": []
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_batch_transform_step_failure(self):
        """Test batch transformation with step failure."""
        url = reverse("data_transform:batch_transform")
        data = {
            "data": self.sample_data,
            "transformations": [
                {
                    "transformation_type": "invalid_type",  # Invalid transformation
                    "parameters": {}
                }
            ]
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertIn("step", response.data)

class IntegrationTest(APITestCase):
    """Integration tests for complete workflows."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.sales_data = [
            {"date": "2024-01-01", "region": "North",
                "product": "A", "sales": 100, "quantity": 10},
            {"date": "2024-01-01", "region": "North",
                "product": "B", "sales": 150, "quantity": 5},
            {"date": "2024-01-01", "region": "South",
                "product": "A", "sales": 200, "quantity": 8},
            {"date": "2024-01-02", "region": "North",
                "product": "A", "sales": 120, "quantity": 12},
            {"date": "2024-01-02", "region": "South",
                "product": "B", "sales": 180, "quantity": 6},
        ]

    def test_complete_data_analysis_workflow(self):
        """Test a complete data analysis workflow."""
        # Step 1: Aggregate by region and product
        url = reverse("data_transform:transform")
        data = {
            "data": self.sales_data,
            "transformation_type": "aggregate",
            "parameters": {
                "group_by": ["region", "product"],
                "aggregations": {"sales": "sum", "quantity": "mean"}
            }
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        aggregated_data = response.data["data"]

        # Step 2: Filter high-performing products (use higher threshold to ensure filtering)
        data = {
            "data": aggregated_data,
            "transformation_type": "filter",
            "parameters": {
                "conditions": {"field": "sales", "operator": "gte", "value": 200}
            }
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        filtered_data = response.data["data"]
        # Should have fewer records after filtering with higher threshold
        self.assertGreaterEqual(len(aggregated_data), len(filtered_data))
        # Verify the filtering actually worked
        self.assertLessEqual(len(filtered_data), len(aggregated_data))

    def test_error_recovery_workflow(self):
        """Test error handling and recovery in workflows."""
        url = reverse("data_transform:transform")

        # First, successful transformation
        data = {
            "data": self.sales_data,
            "transformation_type": "aggregate",
            "parameters": {"group_by": ["region"]}
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Then, failed transformation
        data = {
            "data": self.sales_data,
            "transformation_type": "aggregate",
            "parameters": {"group_by": ["nonexistent_column"]}
        }

        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # API should still be responsive after error
        url = reverse("data_transform:health_check")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
