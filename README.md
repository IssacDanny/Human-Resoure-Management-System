# 🚀 Human-Resoure-Management-System: Installation & Setup Guide

Welcome to the Human Resource Management System (HRMS). This guide provides step-by-step instructions to install, configure, and run the project locally for evaluation purposes.

## 🛠 1. Prerequisites

Before starting, please ensure your local machine has the following software installed:
*   **Node.js** (LTS v20 or higher)
*   **NPM** (v10 or higher)
*   **Docker & Docker Compose** (Required to run the local PostgreSQL database)
*   **Git**

## 📥 2. Cloning and Installation

1. **Clone the repository** to your local machine:
   ```bash
   git clone https://github.com/IssacDanny/Human-Resoure-Management-System.git
   cd Human-Resoure-Management-System
   ```

2. **Install dependencies:**
   Because this project uses NPM Workspaces, running the install command at the root directory will automatically distribute dependencies to both the server and client applications.
   ```bash
   npm install
   ```

## ⚙️ 3. Environment Configuration

You must configure the environment variables for both the backend (server) and frontend (client) before starting the application.

1. **Server Setup:**
   ```bash
   cp apps/server/.env.example apps/server/.env
   ```
   *Open `apps/server/.env` and ensure the `DATABASE_URL` matches the local Docker database credentials(commented in file .env.example). Set a secure string for `JWT_SECRET`.*

2. **Client Setup:**
   ```bash
   cp apps/client/.env.example apps/client/.env
   ```
   *Open `apps/client/.env` and verify that `VITE_API_URL` is set to `http://localhost:3000`.*

## 🗄️ 4. Database Initialization

We use Docker to containerize the PostgreSQL database and Prisma as our ORM.

1. **Start the Database Container:**
   Ensure you are at the root of the project, then run:
   ```bash
   docker-compose up -d
   ```

2. **Initialize the Database Schema:**
   Navigate to the server directory to generate the Prisma client and push the schema to your local database.
   ```bash
   cd apps/server
   npx prisma generate
   npx prisma db push
   ```

3. **Seed the Database (Important for Evaluation):**
   To populate the database with dummy data (users, attendance records, leave requests), run the seed script while still inside the `apps/server` directory:
   ```bash
   npm run seed
   ```

## 🚀 5. Running the Application

To start the entire ecosystem (Backend API and Frontend Client) simultaneously, navigate back to the **root directory** and run the development command:

```bash
cd ../../
npm run dev
```

**Access Points:**
*   **Frontend Client:** [http://localhost:5173](http://localhost:5173)

### 🔐 Default Test Credentials
You can use the following credentials to log in and test the system:
*   **Admin Email:** `admin@hrms.internal`
*   **Password:** `Welcome123!`
*(Note: The password is the same for all seeded dummy users).*
