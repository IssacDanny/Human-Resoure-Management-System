### Architectural Analysis

1.  **Monorepo Strategy**: The use of NPM workspaces for `apps/server`, `apps/client`, and `apps/cli` is ideal for maintaining internal consistency and potentially sharing types across the stack.
2.  **Backend (NestJS)**: The server uses a **Modular Domain-Driven Design**. The inclusion of the **Strategy Pattern** (e.g., `StandardVietnameseStrategy`) for payroll is a high-signal architectural choice, allowing the system to scale to other tax jurisdictions without core logic changes.
3.  **Persistence Layer**: Prisma ORM provides type-safe queries. The **Repository Pattern** is correctly implemented, decoupling the database logic from the services.
4.  **Frontend (React + Vite)**: A modern, high-performance SPA. The choice of **Vanilla CSS** with variables over a heavy framework like Tailwind ensures maximum performance and a unique design system.
5.  **Interface Segregation**: The `IWorkforce` and `IPayable` interfaces in the server demonstrate a strong understanding of SOLID principles, ensuring modules only depend on the data they need.

---

### 100% Free CI/CD & Deployment Plan (2026 Edition)

To deploy this professional-grade system without incurring costs, we will leverage the most generous "Forever Free" tiers available in the 2026 ecosystem.

#### 1. Infrastructure Stack
*   **Database (PostgreSQL)**: **Supabase** or **Neon**.
    *   *Why:* Both provide a managed PostgreSQL instance with a generous free tier. Supabase is preferred if you later want to use their Realtime features for notifications.
*   **Backend (NestJS)**: **Oracle Cloud Infrastructure (OCI) - Ampere A1 Compute**.
    *   *Why:* While Render/Fly.io have restricted their free tiers, Oracle Cloud continues to offer "Always Free" ARM instances (up to 4 OCPUs and 24GB RAM). This is enough to run your NestJS API and several other services.
*   **Frontend (React)**: **Vercel**.
    *   *Why:* Best-in-class DX for Vite-based apps, automatic SSL, and a global CDN.
*   **Source Control & CI**: **GitHub**.

#### 2. CI/CD Pipeline (GitHub Actions)
Create a `.github/workflows/main.yml` to orchestrate the lifecycle:

*   **Phase 1: Validation (On Push/PR)**
    *   Run `npm install` at root.
    *   Parallel execution of `npm run lint` and `npm run test` for both `client` and `server`.
*   **Phase 2: Build & Deploy Frontend (On Merge to Main)**
    *   Trigger Vercel's native GitHub integration. It will build the `apps/client` directory and deploy it to a production URL.
*   **Phase 3: Build & Deploy Backend (On Merge to Main)**
    *   **Dockerize**: Build a lightweight production image of the server.
    *   **Registry**: Push to **GitHub Container Registry (GHCR)** (Free for public/private).
    *   **Deploy**: Use a simple SSH action to pull the new image on your Oracle Cloud VM and restart the container via `docker-compose`.

#### 3. Secrets Management
Store the following in **GitHub Actions Secrets**:
- `DATABASE_URL`: Connection string for Supabase.
- `JWT_SECRET`: A secure string for your `AuthConstants`.
- `VERCEL_TOKEN`: To trigger deployments.
- `REMOTE_SSH_KEY`: For deploying to the OCI instance.

### Summary of Benefits
*   **Zero Cost**: Total monthly spend is $0.00.
*   **Production Quality**: Uses managed DB and a high-performance VPS.
*   **Scalability**: The architecture is ready for a "pay-as-you-grow" model if the enterprise expands.
