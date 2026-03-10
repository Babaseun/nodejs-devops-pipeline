# Node.js DevOps Pipeline

A robust, containerized Node.js web application built with TypeScript, featuring a fully automated DevOps pipeline, Infrastructure as Code (IaC), and secure production deployment strategies.

## Features

- **TypeScript Standardized:** Utilizing ES Modules via `tsc` transpilation for modern, static-typed development.
- **Endpoints:**
  - `GET /health` - Returns 200 with `{ status: 'healthy', db: 'connected' }`
  - `GET /status` - Returns 200 with server uptime info
  - `POST /process` - Saves provided JSON data to PostgreSQL and returns the inserted record.

## Quick Start (Local Development)

You can run this application locally using either Docker Compose or Node.js directly.

### Option 1: Docker Compose

Docker Compose is configured to automatically provision the database and application, injecting variables directly from your `.env` file.

1. Clone the repository.
2. Create your local `.env` file by copying the provided example:
   ```bash
   cp .env.example .env
   ```
   *(Feel free to update the credentials inside `.env` if desired.)*
3. Build and spin up the environment in detached mode:
   ```bash
   docker compose up -d --build
   ```
4. Run the database migration script to generate the required table:
   ```bash
   npm run db:create
   ```

### Option 2: Local Node.js / TypeScript Environment

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the TypeScript application:
   ```bash
   npm run build
   ```
3. Make sure a local PostgreSQL instance is running and matches your `.env` configuration.
4. Run table creation migrations:
   ```bash
   npm run db:create
   ```
5. Start the development server using `tsx`:
   ```bash
   npm run dev
   ```

*(Note: You can drop tables using `npm run db:drop` at any time.)*

## How to Access the App

Once running locally, you can test the endpoints:

- **Health Check:** `curl http://localhost:3000/health`
- **Status Data:** `curl http://localhost:3000/status`
- **Process Data:** `curl -X POST http://localhost:3000/process -H "Content-Type: application/json" -d '{"data":"test"}'`

## How to Deploy the Application

The deployment utilizes **Terraform** for Infrastructure as Code (IaC) and **GitHub Actions** for CI/CD automation targeting **DockerHub**.

### Infrastructure Provisioning (Terraform)

1. Ensure you have the `AWS CLI` and `Terraform` installed and configured with appropriate AWS credentials.
2. Navigate to the `terraform/` directory:
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```
3. Terraform will provision the VPC, Security Groups, ALB, ECS Cluster, and PostgreSQL database natively. The output will provide the API's Load Balancer DNS name.

### CI/CD Pipeline (DockerHub)

The GitHub Actions workflow `.github/workflows/ci.yml` triggers automatically on pushes or pull requests to the `main` branch.

To enable the deployment pipeline:
1. Ensure the Terraform infrastructure is configured to accept ECS Fargate deployments.
2. Setup OpenID Connect (OIDC) between GitHub Actions and your AWS account to assume an IAM role.
3. Add your Docker Hub username and access token to **AWS Secrets Manager** as `dockerhub/username` and `dockerhub/token`.
4. Ensure your GitHub Actions Repository Secrets contain `AWS_ACCOUNT_ID`.
5. Once code is pushed to the `main` branch, GitHub actions will:
   - Authenticate to AWS securely via OIDC.
   - Run tests (`npm run test`) validating the TypeScript build.
   - Fetch Docker Hub credentials from AWS Secrets Manager.
   - Build and Push the Docker Image directly to your Docker Hub repository.

## Key Architecture & Security Decisions

### Security
1. **Dynamic Secrets Retrieval:** We do not store any hardcoded credentials in GitHub or within the container. DockerHub registry passwords and Database passwords lie safely inside **AWS Secrets Manager**. We securely leverage OIDC for GitHub authentication.
2. **Non-Root Container:** The Dockerfile utilizes the `node` non-root user to run the application, reducing the surface area for container escapes.
3. **HTTPS / SSL:** The ALB Terraform configuration supports issuing and attaching an SSL certificate via AWS Certificate Manager (ACM), ensuring encrypted transit to the app.

### Architecture
1. **Container Orchestration (ECS on Fargate):** AWS ECS Fargate was initially chosen to eliminate the operational overhead of managing EC2 instances while still providing robust container orchestration.
2. **Database Isolation:** An Amazon RDS PostgreSQL instance is deployed inside the VPC private subnets. Access to the DB is strictly limited to traffic originating from the ECS Tasks security group.
3. **Deployment Strategy (Rolling Updates):** The application architecture relies on native ECS Deployment Controllers to execute zero-downtime rolling deployments, ensuring full container availability during software updates.
