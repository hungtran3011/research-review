# GitHub Actions CI/CD for DigitalOcean Droplet

This project now includes a CI/CD workflow at:

- `.github/workflows/ci-cd-digitalocean.yml`

It does:

1. Build Docker images for backend and frontend
2. Push images to DigitalOcean Container Registry (DOCR)
3. SSH into your Droplet and redeploy with Docker Compose

## Required GitHub Secrets

Add these in **GitHub Repo → Settings → Secrets and variables → Actions**:

- `DOCR_TOKEN`: DigitalOcean personal access token (with registry access)
- `DOCR_REGISTRY_NAME`: your DO container registry name (e.g. `my-registry`)
- `DO_SSH_HOST`: Droplet IP or hostname
- `DO_SSH_USER`: SSH user on Droplet (e.g. `root`)
- `DO_SSH_KEY`: private SSH key content for the Droplet
- `DO_SSH_PORT`: SSH port (optional, default `22`)

## First-time Droplet setup

Run once on your Droplet:

```bash
sudo mkdir -p /opt/research-review
cd /opt/research-review
```

Create backend env file used by compose:

```bash
nano /opt/research-review/.env.backend
```

Put your backend runtime env vars there (DB, Redis, JWT, etc).

At minimum, include these for database startup consistency:

```env
DB=research_review
DB_USER=postgres
DB_PASS=your_strong_password
```

## Triggering deploy

- Automatic on push to `master`
- Manual from Actions tab using `workflow_dispatch`

## Notes

- Deployment compose file is: `.github/deploy/docker-compose.prod.yml`
- Services are exposed as:
  - Frontend: `80`
  - Backend: `8080`
- Internal services started by compose:
  - PostgreSQL (`postgres`) with persistent volume `postgres-data`
  - Redis (`redis`) with persistent volume `redis-data`
- If your backend should not be public, remove `8080:8080` and route through reverse proxy.
