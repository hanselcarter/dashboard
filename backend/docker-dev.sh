#!/bin/bash

case "$1" in
    "start")
        echo "🚀 Starting dashboard development environment..."
        docker-compose up --build
        ;;
    "stop")
        echo "🛑 Stopping dashboard development environment..."
        docker-compose down
        ;;
    "clean")
        echo "🧹 Cleaning up dashboard development environment..."
        docker-compose down -v
        docker-compose down --rmi all
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "shell")
        docker-compose exec web bash
        ;;
    "test")
        echo "🧪 Running tests..."
        docker-compose exec web python manage.py test
        ;;
    *)
        echo "Dashboard Development Helper"
        echo "Usage: $0 {start|stop|clean|logs|shell|test}"
        echo ""
        echo "Commands:"
        echo "  start  - Start the development environment"
        echo "  stop   - Stop the development environment"
        echo "  clean  - Stop and remove all containers, volumes, and images"
        echo "  logs   - Show application logs"
        echo "  shell  - Open shell in web container"
        echo "  test   - Run tests"
        ;;
esac 