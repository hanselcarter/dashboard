from rest_framework import serializers
from typing import Any, Dict, List, Union
import pandas as pd
import numpy as np


class DataTransformationInputSerializer(serializers.Serializer):
    data = serializers.ListField(
        child=serializers.DictField(),
        help_text="Array of objects to transform",
        min_length=1,
        max_length=10000  # Limit for performance
    )

    transformation_type = serializers.ChoiceField(
        choices=[
            ('aggregate', 'Aggregate data by key'),
            ('filter', 'Filter data based on conditions'),
            ('normalize', 'Normalize numerical values'),
            ('pivot', 'Pivot data structure'),
        ],
        help_text="Type of transformation to apply"
    )

    parameters = serializers.DictField(
        required=False,
        default=dict,
        help_text="Additional parameters for transformation"
    )

    def validate_data(self, value: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not value:
            raise serializers.ValidationError("Data cannot be empty")

        first_keys = set(value[0].keys())
        for i, obj in enumerate(value[1:], 1):
            if set(obj.keys()) != first_keys:
                raise serializers.ValidationError(
                    f"Object at index {i} has different keys than first object. "
                    f"Expected keys: {first_keys}, got: {set(obj.keys())}"
                )

        return value

    def validate_parameters(self, value: Dict[str, Any]) -> Dict[str, Any]:
        transformation_type = self.initial_data.get('transformation_type')

        if transformation_type == 'aggregate' and 'group_by' not in value:
            raise serializers.ValidationError(
                "Aggregate transformation requires 'group_by' parameter"
            )

        if transformation_type == 'filter' and 'conditions' not in value:
            raise serializers.ValidationError(
                "Filter transformation requires 'conditions' parameter"
            )

        if transformation_type == 'normalize' and 'columns' not in value:
            raise serializers.ValidationError(
                "Normalize transformation requires 'columns' parameter"
            )

        if transformation_type == 'pivot' and not all(
            key in value for key in ['index', 'columns', 'values']
        ):
            raise serializers.ValidationError(
                "Pivot transformation requires 'index', 'columns', and 'values' parameters"
            )

        return value


class DataTransformationOutputSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    message = serializers.CharField()
    data = serializers.ListField(
        child=serializers.DictField(),
        help_text="Transformed data"
    )
    metadata = serializers.DictField(
        help_text="Transformation metadata and statistics"
    )
    processing_time_ms = serializers.FloatField(
        help_text="Processing time in milliseconds"
    )


class FilterConditionSerializer(serializers.Serializer):
    field = serializers.CharField(help_text="Field name to filter on")
    operator = serializers.ChoiceField(
        choices=['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in'],
        help_text="Comparison operator"
    )
    value = serializers.JSONField(help_text="Value to compare against")


class AggregationSerializer(serializers.Serializer):
    group_by = serializers.ListField(
        child=serializers.CharField(),
        help_text="Fields to group by"
    )
    aggregations = serializers.DictField(
        child=serializers.ChoiceField(
            choices=['sum', 'mean', 'count', 'min', 'max', 'std']
        ),
        help_text="Field to aggregation function mapping"
    )


class NormalizationSerializer(serializers.Serializer):
    columns = serializers.ListField(
        child=serializers.CharField(),
        help_text="Columns to normalize"
    )
    method = serializers.ChoiceField(
        choices=['min_max', 'z_score', 'robust'],
        default='min_max',
        help_text="Normalization method"
    )


class PivotSerializer(serializers.Serializer):
    index = serializers.CharField(help_text="Column to use as index")
    columns = serializers.CharField(help_text="Column to use as columns")
    values = serializers.CharField(help_text="Column to use as values")
    aggfunc = serializers.ChoiceField(
        choices=['sum', 'mean', 'count', 'min', 'max'],
        default='sum',
        help_text="Aggregation function for duplicate entries"
    )
