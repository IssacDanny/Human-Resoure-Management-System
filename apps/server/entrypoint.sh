#!/bin/sh
set -e # Exit immediately if a command exits with a non-zero status.

echo "--- Initializing Database ---"
# Use --accept-data-loss to ensure it runs non-interactively if there are warnings
npx prisma db push --accept-data-loss

echo "--- Seeding Database ---"
# npm run seed will now work because tsx is in production dependencies
npm run seed

echo "--- Starting Application ---"
npm run start:prod
