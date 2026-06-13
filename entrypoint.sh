#!/bin/sh

set -e

# Function to wait for a service to be ready
wait_for_service() {
  host=$1
  port=$2

  echo "Waiting for $host:$port to be available..."

  until nc -z -v -w30 $host $port
  do
    echo "$host:$port is unavailable - sleeping"
    sleep 1
  done

  echo "$host:$port is available - continuing"
}

# Note: PostgreSQL is expected to be a cloud-hosted database (Neon, Supabase, RDS, etc.),
# so it is reachable on startup. No local DB wait is performed here.
# The app will fail fast with a clear connection error if DATABASE_URL is unreachable.

# Wait for RabbitMQ to be ready
echo "Waiting for RabbitMQ to be ready..."
wait_for_service rabbitmq 5672

# Start the NestJS application once RabbitMQ is ready
echo "Starting NestJS application..."
npm start
