# Docker Setup Guide

This project supports two deployment modes:
1. **Full Stack (Deployment)** - App + Dependencies in Docker
2. **Local Development** - Only Dependencies in Docker, App runs in IDE

## Quick Start

### Local Development (Dependencies Only)

For local development where you run the app in your IDE:

```bash
# Start only Elasticsearch, PostgreSQL, and Redis
docker compose -f compose.local.yaml up -d

# Stop services
docker compose -f compose.local.yaml down

# Stop and remove volumes (clean state)
docker compose -f compose.local.yaml down -v
```

**IDE Configuration:**
- Set active profile to `local` in your IDE run configuration
- Or add VM option: `-Dspring.profiles.active=local`
- The app will connect to:
  - PostgreSQL: `localhost:5432`
  - Redis: `localhost:6379`
  - Elasticsearch: `localhost:9200`

### Full Deployment (App + Dependencies)

For production or full stack testing:

```bash
# 1. Create .env file from example
cp .env.example .env

# 2. Edit .env with your actual credentials
nano .env

# 3. Ensure secrets are in place
ls secrets/private_key.pem secrets/public_key.pem

# 4. Start full stack
docker compose up -d

# 5. View logs
docker compose logs -f app

# Stop services
docker compose down
```

## Port Mappings

### Local Development (compose.local.yaml)
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Elasticsearch**: `localhost:9200`, `localhost:9300`

### Full Deployment (compose.yaml)
- **App**: `localhost:8080`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Elasticsearch**: `localhost:9201` (mapped to avoid conflicts), `localhost:9301`

## Application Profiles

### `application-local.properties`
- Used for local development (IDE)
- Hardcoded values for localhost connections
- Development credentials (NOT for production)

### `application.properties`
- Used for Docker deployment
- Uses environment variables from `.env` file
- Service names (postgres, redis, elasticsearch) resolve via Docker network

## Tips

### Local Development
1. Start dependencies: `docker compose -f compose.local.yaml up -d`
2. Run app from IDE with `local` profile
3. Hot reload works normally
4. Easy debugging

### Switching Between Modes
```bash
# Stop local dev dependencies
docker compose -f compose.local.yaml down

# Start full stack
docker compose up -d

# Or vice versa
docker compose down
docker compose -f compose.local.yaml up -d
```

### Viewing Logs
```bash
# Local dependencies
docker compose -f compose.local.yaml logs -f

# Full stack - specific service
docker compose logs -f app
docker compose logs -f postgres
```

### Database Access
```bash
# Local development
psql -h localhost -U myuser -d mydatabase

# Full deployment (from host)
psql -h localhost -U myuser -d mydatabase

# Full deployment (inside container)
docker compose exec postgres psql -U myuser -d mydatabase
```

## Troubleshooting

### Port Conflicts
If ports are already in use:
- Edit `compose.local.yaml` to use different host ports
- Example: Change `5432:5432` to `5433:5432`
- Update `application-local.properties` accordingly

### Connection Issues
1. Check services are running: `docker compose ps`
2. Check app can reach services: `docker compose exec app ping postgres`
3. Verify environment variables: `docker compose config`

### Clean Start
```bash
# Remove all data and start fresh
docker compose -f compose.local.yaml down -v
docker compose -f compose.local.yaml up -d
```

