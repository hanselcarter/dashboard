"""
URL configuration for data transformation API.
"""

from django.urls import path
from . import views

app_name = 'data_transform'

urlpatterns = [
    # Main transformation endpoint
    path(
        'transform/',
        views.DataTransformationView.as_view(),
        name='transform'
    ),

    # Batch transformation endpoint
    path(
        'batch-transform/',
        views.batch_transform,
        name='batch_transform'
    ),

    # Utility endpoints
    path(
        'health/',
        views.health_check,
        name='health_check'
    ),

    path(
        'types/',
        views.transformation_types,
        name='transformation_types'
    ),
]
