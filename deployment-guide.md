# 🚀 HRMS Deployment Guide: From Zero to Production (100% Free)

This guide provides a step-by-step roadmap to deploy your HRMS Monorepo using the "2026 Free Tier Stack." Follow these instructions precisely to achieve a professional, automated CI/CD pipeline.

---

## 🛠 Step 1: Persistence Layer (Database)
We will use **Supabase** for a managed PostgreSQL instance.

1.  **Create Account**: Sign up at [supabase.com](https://supabase.com).
2.  **New Project**: Create a project named `hrms-prod`.
3.  **Get Connection String**:
    *   Go to **Project Settings** > **Database**.
    *   Copy the **URI** (Transaction pooler, mode: `transaction`).
    *   *Note:* Replace `[YOUR-PASSWORD]` with your actual database password.
4.  **Save for later**: This is your `DATABASE_URL`.

---

## ☁️ Step 2: Infrastructure (Backend VPS)
We will use **Oracle Cloud (OCI)** for its "Always Free" ARM Compute.

1.  **Sign Up**: Register at [oracle.com/cloud/free/](https://www.oracle.com/cloud/free/).
2.  **Create Instance**:
    *   **Image**: Canonical Ubuntu 22.04 or 24.04.
    *   **Shape**: `VM.Standard.A1.Flex` (ARM-based).
    *   **Resources**: Allocate 2 OCPUs and 12GB RAM (well within free limits).
    *   **SSH Keys**: Generate or upload your public key. **Download the private key** (`.key` or `.pem`).
3.  **Network Configuration**:
    *   In the VCN's Security List, add an **Ingress Rule**:
        *   Source CIDR: `0.0.0.0/0`
        *   Destination Port: `3000` (Your NestJS port).
4.  **Install Docker**: Once logged in via SSH, run:
    ```bash
    sudo apt update && sudo apt install -y docker.io docker-compose
    sudo usermod -aG docker $USER
    ```

---

## 🎨 Step 3: Frontend Hosting
We will use **Vercel** for its seamless Vite integration.

1.  **Connect GitHub**: Log in to [vercel.com](https://vercel.com) and import your repository.
2.  **Project Settings**:
    *   **Framework Preset**: Vite.
    *   **Root Directory**: `apps/client`.
    *   **Build Command**: `npm run build`.
    *   **Output Directory**: `dist`.
3.  **Environment Variables**:
    *   Add `VITE_API_URL`: `http://[YOUR-ORACLE-IP]:3000`.

---

## 🔒 Step 4: Secrets & GitHub Configuration
Configure your repository to communicate with the cloud providers.

1.  **GitHub Secrets**: Go to your Repo > **Settings** > **Secrets and variables** > **Actions**. Add:
    *   `DATABASE_URL`: Your Supabase URI.
    *   `JWT_SECRET`: A long, random string.
    *   `REMOTE_HOST`: The Public IP of your Oracle VM.
    *   `REMOTE_USER`: Usually `ubuntu`.
    *   `REMOTE_SSH_KEY`: The **entire content** of your private SSH key (`.key`).
2.  **GHCR Token**: No manual token needed; GitHub Actions uses `GITHUB_TOKEN` automatically for the Container Registry.

---

## 🐳 Step 5: Dockerization
Ensure `apps/server/Dockerfile` exists at the project root or within the server directory. (We will assume a standard multi-stage build).

---

## 🤖 Step 6: The CI/CD Pipeline
Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 1. Login to GitHub Container Registry
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 2. Build and Push Server Image
      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/server/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/hrms-server:latest

      # 3. Deploy to Oracle Cloud via SSH
      - name: Deploy to OCI
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.REMOTE_HOST }}
          username: ${{ secrets.REMOTE_USER }}
          key: ${{ secrets.REMOTE_SSH_KEY }}
          script: |
            docker pull ghcr.io/${{ github.repository_owner }}/hrms-server:latest
            docker stop hrms-server || true
            docker rm hrms-server || true
            docker run -d --name hrms-server \
              -p 3000:3000 \
              -e DATABASE_URL="${{ secrets.DATABASE_URL }}" \
              -e JWT_SECRET="${{ secrets.JWT_SECRET }}" \
              ghcr.io/${{ github.repository_owner }}/hrms-server:latest
```

---

## ✅ Deployment Checklist (The "A to Z" TODO)

Keep track of your progress as you go through the steps.

### 1. Database & Persistence (Supabase)
- [X] Create Supabase account.
- [X] Create `hrms-prod` project.
- [X] Set database password and save it securely.

### 2. Infrastructure & Networking (Oracle Cloud)
- [ ] Sign up for Oracle Cloud (Always Free).
- [ ] Launch `VM.Standard.A1.Flex` instance (Ubuntu).
- [ ] Save Private SSH Key (`.key` or `.pem`) locally.
- [ ] Add Ingress Rule for Port `3000` in Security List.
- [ ] SSH into VM and install `docker` & `docker-compose`.

### 3. Frontend & Environment (Vercel)
- [ ] Connect repository to Vercel.
- [ ] Configure `apps/client` as the root directory.
- [ ] Set `VITE_API_URL` to your Oracle VM's Public IP.
- [ ] Run first build and verify the Vercel URL is live.

### 4. Code & Workflow Preparation
- [ ] Verify `apps/server/Dockerfile` exists and is correct.
- [ ] Create `.github/workflows/deploy.yml` with the provided YAML.
- [ ] Commit and push these changes to a temporary branch (optional).

### 5. GitHub Secrets (The Security Handshake)
- [ ] Add `DATABASE_URL` secret.
- [ ] Add `JWT_SECRET` secret.
- [ ] Add `REMOTE_HOST` (Oracle IP) secret.
- [ ] Add `REMOTE_USER` (`ubuntu`) secret.
- [ ] Add `REMOTE_SSH_KEY` (The full private key) secret.

### 6. The Grand Finale (First Deployment)
- [ ] Merge/Push all changes to the `main` branch.
- [ ] Monitor the **GitHub Actions** tab for successful build/push/deploy.
- [ ] Run `docker ps` on the Oracle VM to verify the container is running.
- [ ] Visit your live Vercel URL and perform a test login.

---

Congratulations! You have successfully deployed a professional HRMS without spending a single cent.
