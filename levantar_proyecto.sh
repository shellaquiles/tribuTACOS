#!/bin/bash

# Script to start the Declara project locally

# Navigate to the project root directory
cd "$(dirname "$0")" || exit 1

echo "Starting Backend Server..."
# Start the backend server in the background
cd backend || exit 1

# Setup virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "Installing backend dependencies..."
    ./venv/bin/pip install -r requirements.txt
fi

PYTHONPATH=.. ./venv/bin/uvicorn sat_bridge:app --reload --port 8010 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Navigate back to the project root
cd ..

echo "Starting Frontend Server..."
# Start the frontend server
cd frontend || exit 1
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Function to handle script termination and clean up background processes
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM signals
trap cleanup SIGINT SIGTERM

echo ""
echo "Both servers are running in the background."
echo "Press Ctrl+C to stop the servers."

# Wait indefinitely to keep the script running, until a signal is received
wait
