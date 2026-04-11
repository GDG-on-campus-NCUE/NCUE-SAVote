#!/bin/bash

cd apps/api/prisma
npx prisma generate
cd ../../../
docker compose exec api npx prisma db push --schema=apps/api/prisma/schema.prisma
docker compose exec api npx prisma generate --schema=apps/api/prisma/schema.prisma