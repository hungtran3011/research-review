# GitHub Actions CI/CD for DigitalOcean Droplet

This project now includes a CI/CD workflow at:

- `.github/workflows/ci-cd-digitalocean.yml`

It does:

1. Build Docker image for the **backend**
2. Push image to Docker Hub
3. SSH into your Droplet and redeploy with Docker Compose

> [!NOTE]
> The **frontend** is not deployed via this workflow. It should be hosted separately on [Vercel](https://vercel.com) by linking your GitHub repository.

## 1. Docker Hub & DigitalOcean Setup

Before setting up GitHub Actions, you need to prepare your environment:

### A. Docker Hub Setup
1. Create a [Docker Hub](https://hub.docker.com/) account if you don't have one.
2. Go to **Account Settings** -> **Security** -> **New Access Token**.
3. Create a token and copy it immediately. This will be your `DOCKERHUB_TOKEN`.
4. Your username will be your `DOCKERHUB_USERNAME`.

### C. Create a Droplet (Server)
1. Go to **Droplets** -> **Create Droplet**.
2. Choose **Ubuntu** (e.g., 22.04 LTS or newer).
3. Under **Authentication**, choose **SSH Key**. Create a new SSH Key pair on your local machine if you don't have one, and add the Public Key here.
4. Create the Droplet and note down its IP address (`DO_SSH_HOST`).
5. SSH into your new droplet as root for the initial setup: `ssh root@<DROPLET_IP>`
6. Install Docker and Docker Compose on the Droplet (if not already installed):
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose-v2 -y
   ```
7. **(Security Best Practice)** Create a non-root user named `deploy` for GitHub Actions:
   ```bash
   adduser deploy
   # Add to sudo group
   usermod -aG sudo deploy
   # Add to docker group (allows running docker without sudo)
   usermod -aG docker deploy
   # Copy SSH keys from root so GitHub Actions can login as 'deploy'
   rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
   ```

## 2. Required GitHub Secrets

Add these in **GitHub Repo → Settings → Secrets and variables → Actions**:

- `DOCKERHUB_USERNAME`: Your Docker Hub username.
- `DOCKERHUB_TOKEN`: The Docker Hub access token you generated in Step 1A.
- `DO_SSH_HOST`: Droplet IP address.
- `DO_SSH_USER`: SSH user on Droplet (use `deploy` instead of `root`).
- `DO_SSH_KEY`: The **PRIVATE** SSH key content (`~/.ssh/id_rsa` or similar) matching the public key you added to the Droplet.
- `DO_SSH_PORT`: SSH port (optional, default `22`).

## 3. First-time Droplet Environment Setup

Run this once on your Droplet via SSH to prepare the deployment directory:

```bash
sudo mkdir -p /opt/research-review/secrets
sudo chown -R deploy:deploy /opt/research-review
cd /opt/research-review
```

You must also create the JWT PEM keys on the server since they are mounted via Docker volumes:

```bash
nano /opt/research-review/secrets/public_key.pem
# Paste your public key, then save and exit

nano /opt/research-review/secrets/private_key.pem
# Paste your private key, then save and exit
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

# Frontend URL (Vercel)
FRONTEND_URL=https://your-vercel-project-url.vercel.app

# AWS S3 Storage
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_ENDPOINT=your_s3_endpoint

# JWT Secrets
JWT_SECRET_KEY=your_random_secret_string
REDIS_KEY_SECRET=your_random_redis_secret
```

## Triggering deploy

- Automatic on push to `master`
- Manual from Actions tab using `workflow_dispatch`

## Notes

- Deployment compose file is: `.github/deploy/docker-compose.prod.yml`
- Services are exposed as:
  - Backend: `8080`
- External dependencies needed:
  - PostgreSQL (e.g. Supabase) via `SPRING_DATASOURCE_URL`
  - Redis (e.g. Upstash) via `SPRING_REDIS_*` variables
- If your backend should not be public, remove `8080:8080` and route through reverse proxy.
