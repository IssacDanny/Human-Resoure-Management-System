# 🎩 HRMS Monorepo: The Master Manual

Welcome, This repository houses the **Human Resource Management System (HRMS)**, a PERN-stack designed for Small and Medium Enterprises. It follows an **API-First** philosophy, governed by **SOLID** principles and a **Modular Layered Architecture**.

---

## 🏗 System Architecture

This is a **Monorepo** managed via NPM Workspaces:
*   **`apps/server`**: The Brain (NestJS, TypeScript, Prisma).
*   **`apps/client`**: The Face (React, Vite, TypeScript) — *Under Construction*.
*   **`apps/cli`**: The Reference Client (A terminal-based interface for all endpoints).

---

## 🛠 Prerequisites

Before commencing, ensure your station is equipped with the following:
*   **Node.js (LTS v20+)**
*   **NPM (v10+)**
*   **Docker & Docker Compose** (To house the PostgreSQL spirit)
*   **A stiff upper lip and a commitment to quality.**

---

## 📥 Step 1: Establishing the Foundation (Setup)

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd hrms-monorepo
    ```

2.  **Install Requisitions:**
    Run this at the root. NPM Workspaces will distribute the dependencies to all applications automatically.
    ```bash
    npm install
    ```

3.  **Awaken the Database:**
    Start the PostgreSQL container using Docker.
    ```bash
    docker-compose up -d
    ```

4.  **Initialize the Archivist (Prisma):**
    Navigate to the server and push the schema to the database.
    ```bash
    cd apps/server
    npx prisma generate
    npx prisma db push
    ```
5. **Populate Dummy Data:**
    To instantly fill your local database with realistic users, attendance records, and leave requests:
    ```bash
    # From the apps/server of the monorepo
    npm run seed
    ```

    **Default Credentials:**
    *   **Admin:** `admin@hrms.internal`
    *   **Any other user:** Check the database or logs for their email.
    *   **Password for ALL users:** `Welcome123!`

---

## ⚙️ Step 2: Engaging the Machinery (Running)

To start the entire ecosystem (Backend and Frontend) simultaneously from the root:
```bash
npm run dev
```

*   **Server:** [http://localhost:3000](http://localhost:3000)
*   **Client:** [http://localhost:5173](http://localhost:5173)
*   **API Docs:** [http://localhost:3000/docs](http://localhost:3000/docs) (Once Redoc is wired)

---

## 🕹 Step 3: Engaging the Endpoints (CLI Interaction)

For a demonstration of every endpoint in the system, we have provided a **Terminal Client**. This serves as the reference implementation for the frontend team.

1.  **Open a new terminal.**
2.  **Launch the CLI:**
    ```bash
    cd apps/cli
    npm start
    ```
    
### Interactive Guide:

| Module | Purpose | Operations Included |
| :--- | :--- | :--- |
| **🔐 Auth** | The Gatekeeper | Login to acquire the JWT Bearer Token. |
| **👥 Employees** | The Registrar | List, View, Create, and Update employee identities. |
| **⏰ Attendance** | The Timekeeper | Submit daily logs and view monthly summaries. |
| **🌴 Leave** | The Supervisor | Submit requests and manage the Approval State Machine. |
| **💰 Payroll** | The Bursar | Generate payroll, view payslips, and **Export Excel Reports**. |

**Special Instruction for Excel:**
When using the **Payroll Export**, the CLI will download a genuine `.xlsx` file to the `apps/cli/` directory. This demonstrates how to handle binary streams in the frontend.

---

## 📜 Governance (The Style Guide)

We do not write code on a whim. All changes must respect the **API Contract**:
*   **Naming:** `kebab-case` for URLs, `camelCase` for JSON properties.
*   **Security:** All requests (except login) require an `Authorization: Bearer <token>` header.
*   **Errors:** All failures return the standard `{ traceId, code, message }` format.

---

## 🤝 Contribution Protocol

1.  **Contract First:** Update the OpenAPI spec in `api-contracts` and get approval.
2.  **Skeleton First:** Define your DTOs and Service interfaces.
3.  **Logic Last:** Fill in the `// TODO` implementation details.