#!/bin/bash

echo "🐳 Dashboard Docker Helper"
echo "Switching to backend directory..."

# Change to backend directory and run the actual script
cd backend && ./docker-dev.sh "$@" 