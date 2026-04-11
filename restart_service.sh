#!/bin/bash

docker compose down
#docker compose build web --no-cache
docker compose up -d --build