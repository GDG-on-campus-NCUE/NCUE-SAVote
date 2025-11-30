# Database Setup Instructions

## Prerequisites

- Docker Desktop installed and running

## Quick Start

1. **Start Docker Desktop**
   - Make sure Docker Desktop is running on your system

2. **Start PostgreSQL Database**
   ```bash
   docker-compose up -d
   ```

3. **Verify Database is Running**
   ```bash
   docker-compose ps
   ```
   You should see `savote_postgres` with status "Up"

4. **Run Database Migration**
   ```bash
   cd apps/api
   pnpm prisma migrate dev --name init
   ```

## Database Configuration

The default configuration in `apps/api/.env`:
- **Host**: localhost
- **Port**: 5432
- **Database**: savote_dev
- **User**: postgres
- **Password**: password

## Useful Commands

### View database logs
```bash
docker-compose logs -f postgres
```

### Stop database
```bash
docker-compose down
```

### Stop and remove all data
```bash
docker-compose down -v
```

### Access database shell
```bash
docker exec -it savote_postgres psql -U postgres -d savote_dev
```

## Troubleshooting

### Port 5432 already in use
If you have another PostgreSQL instance running, either:
- Stop the other instance
- Change the port mapping in `docker-compose.yml` to `"5433:5432"` and update `DATABASE_URL` in `.env`

### Docker daemon not running
Error: "Cannot connect to the Docker daemon"
- Solution: Start Docker Desktop application

## Production Setup

For production, use a managed database service (e.g., Azure Database for PostgreSQL, AWS RDS) instead of Docker. Update the `DATABASE_URL` in your production environment variables.
