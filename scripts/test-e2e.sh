#!/bin/bash

# Load test environment variables
export $(grep -v '^#' .env.test | xargs)

# Run E2E tests
NODE_ENV=test npx jest --config ./test/jest-e2e.json --runInBand --detectOpenHandles "$@"
