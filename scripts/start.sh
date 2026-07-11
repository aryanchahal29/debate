#!/bin/bash
echo "Starting AI Council in production mode..."
export COMPOSE_PROFILES=production
docker-compose up -d --build
