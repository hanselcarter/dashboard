import time
import logging
from typing import Any, Dict

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiExample

from .serializers import (
    DataTransformationInputSerializer,
    DataTransformationOutputSerializer,
)
from .transformations import apply_transformation

logger = logging.getLogger(__name__)


class DataTransformationView(APIView):


    permission_classes = [AllowAny]  # For development

    @extend_schema(
        request=DataTransformationInputSerializer,
        responses={
            200: DataTransformationOutputSerializer,
            400: 'Bad Request - Invalid input data',
            500: 'Internal Server Error - Transformation failed'
        },
        description="Transform JSON data using various operations",
        examples=[
            OpenApiExample(
                'Aggregate Example',
                summary='Aggregate sales data by region',
                description='Group sales data by region and calculate totals',
                value={
                    "data": [
                        {"region": "North", "sales": 100, "product": "A"},
                        {"region": "North", "sales": 150, "product": "B"},
                        {"region": "South", "sales": 200, "product": "A"},
                        {"region": "South", "sales": 120, "product": "B"}
                    ],
                    "transformation_type": "aggregate",
                    "parameters": {
                        "group_by": ["region"],
                        "aggregations": {"sales": "sum"}
                    }
                }
            ),
            OpenApiExample(
                'Filter Example',
                summary='Filter data by conditions',
                description='Filter records based on specified conditions',
                value={
                    "data": [
                        {"name": "Alice", "age": 30, "city": "New York"},
                        {"name": "Bob", "age": 25, "city": "Los Angeles"},
                        {"name": "Charlie", "age": 35, "city": "New York"}
                    ],
                    "transformation_type": "filter",
                    "parameters": {
                        "conditions": [
                            {"field": "age", "operator": "gte", "value": 30},
                            {"field": "city", "operator": "eq", "value": "New York"}
                        ]
                    }
                }
            ),
            OpenApiExample(
                'Normalize Example',
                summary='Normalize numerical data',
                description='Apply normalization to numerical columns',
                value={
                    "data": [
                        {"name": "Product A", "price": 100, "quantity": 10},
                        {"name": "Product B", "price": 200, "quantity": 5},
                        {"name": "Product C", "price": 150, "quantity": 8}
                    ],
                    "transformation_type": "normalize",
                    "parameters": {
                        "columns": ["price", "quantity"],
                        "method": "min_max"
                    }
                }
            )
        ]
    )
    def post(self, request) -> Response:

        start_time = time.time()

        try:

            serializer = DataTransformationInputSerializer(data=request.data)
            if not serializer.is_valid():
                logger.warning(f"Invalid input data: {serializer.errors}")
                return Response(
                    {
                        'success': False,
                        'message': 'Invalid input data',
                        'errors': serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            validated_data = serializer.validated_data
            data = validated_data['data']
            transformation_type = validated_data['transformation_type']
            parameters = validated_data['parameters']

            logger.info(
                f"Processing {transformation_type} transformation "
                f"for {len(data)} records"
            )


            result = apply_transformation(
                data, transformation_type, parameters)


            processing_time = (time.time() - start_time) * \
                1000


            response_data = {
                'success': True,
                'message': f'Successfully applied {transformation_type} transformation',
                'data': result['data'],
                'metadata': result['metadata'],
                'processing_time_ms': round(processing_time, 2)
            }

            logger.info(
                f"Transformation completed successfully in {processing_time:.2f}ms. "
                f"Input: {len(data)} records, Output: {len(result['data'])} records"
            )

            return Response(response_data, status=status.HTTP_200_OK)

        except ValueError as e:

            processing_time = (time.time() - start_time) * 1000
            error_message = str(e)

            logger.error(f"Transformation error: {error_message}")

            return Response(
                {
                    'success': False,
                    'message': f'Transformation failed: {error_message}',
                    'data': [],
                    'metadata': {},
                    'processing_time_ms': round(processing_time, 2)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:

            processing_time = (time.time() - start_time) * 1000
            error_message = str(e)

            logger.error(
                f"Unexpected error during transformation: {error_message}", exc_info=True)

            return Response(
                {
                    'success': False,
                    'message': 'An unexpected error occurred during transformation',
                    'data': [],
                    'metadata': {},
                    'processing_time_ms': round(processing_time, 2)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request) -> Response:

    return Response(
        {
            'status': 'healthy',
            'message': 'Data transformation API is running',
            'timestamp': time.time()
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def transformation_types(request) -> Response:

    from .transformations import TRANSFORMATION_FUNCTIONS

    transformations = {
        'aggregate': {
            'description': 'Group data by specified columns and apply aggregation functions',
            'required_parameters': ['group_by'],
            'optional_parameters': ['aggregations'],
            'example_parameters': {
                'group_by': ['region', 'category'],
                'aggregations': {'sales': 'sum', 'quantity': 'mean'}
            }
        },
        'filter': {
            'description': 'Filter data based on specified conditions',
            'required_parameters': ['conditions'],
            'optional_parameters': [],
            'example_parameters': {
                'conditions': [
                    {'field': 'age', 'operator': 'gte', 'value': 18},
                    {'field': 'status', 'operator': 'eq', 'value': 'active'}
                ]
            }
        },
        'normalize': {
            'description': 'Normalize numerical columns using various methods',
            'required_parameters': ['columns'],
            'optional_parameters': ['method'],
            'example_parameters': {
                'columns': ['price', 'quantity'],
                'method': 'min_max'
            }
        },
        'pivot': {
            'description': 'Pivot data to create a cross-tabulated format',
            'required_parameters': ['index', 'columns', 'values'],
            'optional_parameters': ['aggfunc'],
            'example_parameters': {
                'index': 'date',
                'columns': 'product',
                'values': 'sales',
                'aggfunc': 'sum'
            }
        }
    }

    return Response(
        {
            'available_transformations': list(TRANSFORMATION_FUNCTIONS.keys()),
            'transformation_details': transformations,
            'supported_operators': [
                'eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in'
            ],
            'supported_aggregations': [
                'sum', 'mean', 'count', 'min', 'max', 'std'
            ],
            'supported_normalizations': [
                'min_max', 'z_score', 'robust'
            ]
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def batch_transform(request) -> Response:

    start_time = time.time()

    try:

        if not isinstance(request.data, dict):
            return Response(
                {'error': 'Request body must be a JSON object'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data.get('data', [])
        transformations = request.data.get('transformations', [])

        if not data:
            return Response(
                {'error': 'Data field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not transformations:
            return Response(
                {'error': 'Transformations field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )


        current_data = data
        transformation_results = []

        for i, transform_config in enumerate(transformations):
            transformation_type = transform_config.get('transformation_type')
            parameters = transform_config.get('parameters', {})

            if not transformation_type:
                return Response(
                    {'error': f'Transformation type missing for step {i + 1}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                result = apply_transformation(
                    current_data, transformation_type, parameters)

                current_data = result['data']

                transformation_results.append({
                    'step': i + 1,
                    'transformation_type': transformation_type,
                    'parameters': parameters,
                    'metadata': result['metadata']
                })

            except Exception as e:
                return Response(
                    {
                        'error': f'Transformation failed at step {i + 1}: {str(e)}',
                        'step': i + 1,
                        'transformation_type': transformation_type
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        processing_time = (time.time() - start_time) * 1000

        return Response(
            {
                'success': True,
                'message': f'Successfully applied {len(transformations)} transformations',
                'data': current_data,
                'transformation_steps': transformation_results,
                'processing_time_ms': round(processing_time, 2)
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Batch transformation error: {str(e)}", exc_info=True)

        return Response(
            {
                'success': False,
                'message': f'Batch transformation failed: {str(e)}',
                'processing_time_ms': round(processing_time, 2)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
