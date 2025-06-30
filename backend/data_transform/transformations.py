

import pandas as pd
import numpy as np
from typing import Any, Dict, List, Callable, Union
from functools import reduce, partial
import operator
import logging

logger = logging.getLogger(__name__)


def safe_transform(func: Callable) -> Callable:
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Transformation error in {func.__name__}: {str(e)}")
            raise ValueError(f"Transformation failed: {str(e)}")
    return wrapper


def to_dataframe(data: List[Dict[str, Any]]) -> pd.DataFrame:
    if not data:
        raise ValueError("Data cannot be empty")

    return pd.DataFrame(data)


def from_dataframe(df: pd.DataFrame) -> List[Dict[str, Any]]:
    df_clean = df.where(pd.notnull(df), None)
    return df_clean.to_dict('records')


def compose(*functions):
    return reduce(lambda f, g: lambda x: f(g(x)), functions, lambda x: x)


def pipe(data, *functions):
    return reduce(lambda result, func: func(result), functions, data)



@safe_transform
def aggregate_data(data: List[Dict[str, Any]], parameters: Dict[str, Any]) -> Dict[str, Any]:

    df = to_dataframe(data)
    group_by = parameters['group_by']
    aggregations = parameters.get('aggregations', {})

    # Functional approach to aggregation
    if not aggregations:
        # Default: count records per group
        result_df = df.groupby(group_by).size().reset_index(name='count')
    else:
        # Apply specific aggregations
        agg_funcs = {
            'sum': 'sum',
            'mean': 'mean',
            'count': 'count',
            'min': 'min',
            'max': 'max',
            'std': 'std'
        }

        # Create aggregation dictionary
        agg_dict = {
            col: agg_funcs[func] for col, func in aggregations.items()
            if col in df.columns and func in agg_funcs
        }

        if not agg_dict:
            raise ValueError("No valid aggregation functions specified")

        result_df = df.groupby(group_by).agg(agg_dict).reset_index()

        # Flatten column names if needed
        if isinstance(result_df.columns, pd.MultiIndex):
            result_df.columns = ['_'.join(str(col).strip() for col in cols if col != '')
                                 for cols in result_df.columns.values]

    transformed_data = from_dataframe(result_df)

    metadata = {
        'original_rows': len(data),
        'transformed_rows': len(transformed_data),
        'group_by_columns': group_by,
        'aggregation_functions': list(aggregations.keys()) if aggregations else ['count']
    }

    return {
        'data': transformed_data,
        'metadata': metadata
    }


@safe_transform
def filter_data(data: List[Dict[str, Any]], parameters: Dict[str, Any]) -> Dict[str, Any]:

    df = to_dataframe(data)
    conditions = parameters['conditions']

    # Functional approach to filtering
    def create_condition(condition):
        field = condition['field']
        operator_name = condition['operator']
        value = condition['value']

        if field not in df.columns:
            raise ValueError(f"Field '{field}' not found in data")

        # Operator mapping using functional approach
        operators = {
            'eq': lambda col, val: col == val,
            'ne': lambda col, val: col != val,
            'gt': lambda col, val: col > val,
            'gte': lambda col, val: col >= val,
            'lt': lambda col, val: col < val,
            'lte': lambda col, val: col <= val,
            'contains': lambda col, val: col.astype(str).str.contains(str(val), na=False),
            'in': lambda col, val: col.isin(val if isinstance(val, list) else [val])
        }

        if operator_name not in operators:
            raise ValueError(f"Unknown operator: {operator_name}")

        return operators[operator_name](df[field], value)

    # Apply all conditions using functional composition
    if isinstance(conditions, list):
        # Multiple conditions - combine with AND
        condition_results = list(map(create_condition, conditions))
        final_condition = reduce(operator.and_, condition_results)
    else:
        # Single condition
        final_condition = create_condition(conditions)

    filtered_df = df[final_condition]
    transformed_data = from_dataframe(filtered_df)

    metadata = {
        'original_rows': len(data),
        'filtered_rows': len(transformed_data),
        'conditions_applied': len(conditions) if isinstance(conditions, list) else 1,
        'filter_ratio': len(transformed_data) / len(data) if len(data) > 0 else 0
    }

    return {
        'data': transformed_data,
        'metadata': metadata
    }


@safe_transform
def normalize_data(data: List[Dict[str, Any]], parameters: Dict[str, Any]) -> Dict[str, Any]:

    df = to_dataframe(data)
    columns = parameters['columns']
    method = parameters.get('method', 'min_max')

    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    valid_columns = [col for col in columns if col in numeric_columns]

    if not valid_columns:
        raise ValueError("No valid numeric columns found for normalization")

    normalizers = {
        'min_max': lambda series: (series - series.min()) / (series.max() - series.min()),
        'z_score': lambda series: (series - series.mean()) / series.std(),
        'robust': lambda series: (series - series.median()) / series.quantile(0.75) - series.quantile(0.25)
    }

    if method not in normalizers:
        raise ValueError(f"Unknown normalization method: {method}")

    normalizer = normalizers[method]

    result_df = df.copy()
    normalization_stats = {}

    for col in valid_columns:
        original_series = result_df[col]
        normalized_series = normalizer(original_series)

        normalized_series = normalized_series.replace(
            [np.inf, -np.inf], np.nan)
        normalized_series = normalized_series.fillna(0)

        result_df[col] = normalized_series

        normalization_stats[col] = {
            'original_mean': float(original_series.mean()),
            'original_std': float(original_series.std()),
            'normalized_mean': float(normalized_series.mean()),
            'normalized_std': float(normalized_series.std())
        }

    transformed_data = from_dataframe(result_df)

    metadata = {
        'normalized_columns': valid_columns,
        'normalization_method': method,
        'statistics': normalization_stats
    }

    return {
        'data': transformed_data,
        'metadata': metadata
    }


@safe_transform
def pivot_data(data: List[Dict[str, Any]], parameters: Dict[str, Any]) -> Dict[str, Any]:

    df = to_dataframe(data)
    index_col = parameters['index']
    columns_col = parameters['columns']
    values_col = parameters['values']
    aggfunc = parameters.get('aggfunc', 'sum')

    required_cols = [index_col, columns_col, values_col]
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    agg_functions = {
        'sum': 'sum',
        'mean': 'mean',
        'count': 'count',
        'min': 'min',
        'max': 'max'
    }

    if aggfunc not in agg_functions:
        raise ValueError(f"Unknown aggregation function: {aggfunc}")

    pivot_df = df.pivot_table(
        index=index_col,
        columns=columns_col,
        values=values_col,
        aggfunc=agg_functions[aggfunc],
        fill_value=0
    )

    pivot_df = pivot_df.reset_index()

    if isinstance(pivot_df.columns, pd.MultiIndex):
        pivot_df.columns = [str(col[1]) if col[1] != '' else str(col[0])
                            for col in pivot_df.columns.values]
    else:
        pivot_df.columns = [str(col) for col in pivot_df.columns]

    transformed_data = from_dataframe(pivot_df)

    metadata = {
        'original_rows': len(data),
        'pivoted_rows': len(transformed_data),
        'index_column': index_col,
        'pivot_columns': columns_col,
        'values_column': values_col,
        'aggregation_function': aggfunc
    }

    return {
        'data': transformed_data,
        'metadata': metadata
    }


TRANSFORMATION_FUNCTIONS = {
    'aggregate': aggregate_data,
    'filter': filter_data,
    'normalize': normalize_data,
    'pivot': pivot_data
}


def apply_transformation(
    data: List[Dict[str, Any]],
    transformation_type: str,
    parameters: Dict[str, Any]
) -> Dict[str, Any]:

    if transformation_type not in TRANSFORMATION_FUNCTIONS:
        raise ValueError(f"Unknown transformation type: {transformation_type}")

    transform_func = TRANSFORMATION_FUNCTIONS[transformation_type]

    parametrized_transform = partial(transform_func, parameters=parameters)

    return parametrized_transform(data)
