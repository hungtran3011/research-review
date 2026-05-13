# GitHub Actions CI/CD for DigitalOcean Droplet

This project now includes a CI/CD workflow at:

- `.github/workflows/ci-cd-digitalocean.yml`

It does:

1. Build Docker images for backend and frontend
2. Push images to DigitalOcean Container Registry (DOCR)
3. SSH into your Droplet and redeploy with Docker Compose

## 1. DigitalOcean Prerequisites Setup

Before setting up GitHub Actions, you need to prepare your DigitalOcean (DO) environment:

### A. Create a Container Registry
1. Go to **DigitalOcean Control Panel** -> **Container Registry**.
2. Create a new registry (e.g., `research-review-repo`).
3. Note down the registry name. This will be your `DOCR_REGISTRY_NAME`.

### B. Generate a Personal Access Token
1. Go to **API** -> **Tokens/Keys**.
2. Click **Generate New Token**. Give it both **Read** and **Write** scopes.
3. Copy the token immediately. This will be your `DOCR_TOKEN`.

### C. Create a Droplet (Server)
1. Go to **Droplets** -> **Create Droplet**.
2. Choose **Ubuntu** (e.g., 22.04 LTS or newer).
3. Under **Authentication**, choose **SSH Key**. Create a new SSH Key pair on your local machine if you don't have one, and add the Public Key here.
4. Create the Droplet and note down its IP address (`DO_SSH_HOST`).
5. SSH into your new droplet: `ssh root@<DROPLET_IP>`
6. Install Docker and Docker Compose on the Droplet (if not already installed):
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose-v2 -y
   ```

## 2. Required GitHub Secrets

Add these in **GitHub Repo → Settings → Secrets and variables → Actions**:

- `DOCR_TOKEN`: The DigitalOcean personal access token you generated in Step 1B.
- `DOCR_REGISTRY_NAME`: The registry name from Step 1A.
- `DO_SSH_HOST`: Droplet IP address.
- `DO_SSH_USER`: SSH user on Droplet (typically `root`).
- `DO_SSH_KEY`: The **PRIVATE** SSH key content (`~/.ssh/id_rsa` or similar) matching the public key you added to the Droplet.
- `DO_SSH_PORT`: SSH port (optional, default `22`).

## 3. First-time Droplet Environment Setup

Run this once on your Droplet via SSH to prepare the deployment directory:

```bash
sudo mkdir -p /opt/research-review
cd /opt/research-review
```

Create backend env file used by compose:

```bash
nano /opt/research-review/.env.backend
```

Put your backend runtime env vars there (DB, Redis, JWT, etc).

At minimum, include these for database and cache connections:

```env
# Database (Supabase)
SPRING_DATASOURCE_URL=jdbc:postgresql://<SUPABASE_HOST>:5432/postgres?user=postgres.[your-project]&password=[your-password]

# Cache (Upstash)
SPRING_REDIS_HOST=<UPSTASH_HOST>
SPRING_REDIS_PORT=<UPSTASH_PORT>
SPRING_REDIS_PASSWORD=<UPSTASH_PASSWORD>
SPRING_REDIS_SSL=true
```

## Triggering deploy

- Automatic on push to `master`
- Manual from Actions tab using `workflow_dispatch`

## Notes

- Deployment compose file is: `.github/deploy/docker-compose.prod.yml`
- Services are exposed as:
  - Frontend: `80`
  - Backend: `8080`
- External dependencies needed:
  - PostgreSQL (e.g. Supabase) via `SPRING_DATASOURCE_URL`
  - Redis (e.g. Upstash) via `SPRING_REDIS_*` variables
- If your backend should not be public, remove `8080:8080` and route through reverse proxy.
