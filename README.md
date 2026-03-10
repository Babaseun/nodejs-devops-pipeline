# Node.js DevOps Pipeline

A simple containerized Node.js web application equipped with a robust DevOps pipeline, CI/CD, Infrastructure as Code, and production-ready security practices.

## Features

- **Endpoints:**
  - `GET /health` - Returns 200 with `{ status: 'healthy', db: 'connected' }`
  - `GET /status` - Returns 200 with server uptime info
  - `POST /process` - Saves provided JSON data to PostgreSQL and returns the inserted record.

## How to Run Locally

You can run this application locally using either Docker or Node directly.

### Option 1: Using Docker (Recommended)

Make sure you have Docker and Docker Compose installed.

1. Clone the repository.
2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. The app will be available at `http://localhost:3000`. The PostgreSQL database will also be running on port `5432`.

### Option 2: Using Node.js directly

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm start
   ```

## How to Access the App

Once running locally, you can test the endpoints:

- **Health Check:** `curl http://localhost:3000/health`
- **Status Data:** `curl http://localhost:3000/status`
- **Process Data:** `curl -X POST http://localhost:3000/process -H "Content-Type: application/json" -d '{"data":"test"}'`

## How to Deploy the Application

The deployment utilizes **Terraform** for Infrastructure as Code (IaC) and **GitHub Actions** for CI/CD automation.

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

### CI/CD Pipeline

The GitHub Actions workflow `.github/workflows/ci.yml` is triggered automatically on pushes or pull requests to the `main` branch.

To enable the deployment pipeline:
1. Ensure the Terraform infrastructure is provisioned. This will create the ECR repository automatically.
2. Add your AWS credentials (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) as secrets in your GitHub repository settings.
3. Once the code is pushed to the `main` branch, GitHub actions will:
   - Run tests (`npm test`)
   - Build the Docker Image
   - Push the Image to AWS ECR.

## Key Decisions

### Security
1. **Non-Root Container:** The Dockerfile utilizes the `node` non-root user to run the application, reducing the surface area for potential container escapes or root-level exploits.
2. **Secrets Management:** We do not store any hardcoded credentials. The database password is dynamically generated and stored securely in **AWS Secrets Manager**, which the ECS service queries during runtime securely using an IAM task execution role.
3. **HTTPS / SSL:** The ALB Terraform configuration supports issuing and attaching an SSL certificate via AWS Certificate Manager (ACM), ensuring encrypted transit to the app (by passing the `domain_name` Terraform variable).

### Architecture & Infrastructure
1. **Container Orchestration (ECS on Fargate):** AWS ECS Fargate was chosen to eliminate the operational overhead of managing EC2 instances while still providing seamless container orchestration natively within AWS.
2. **Database Isolation:** An Amazon RDS PostgreSQL instance is deployed inside the VPC private subnets. Access to the DB is strictly limited to traffic originating from the ECS Tasks security group.
3. **Architectural Isolation:** The Application Load Balancer acts as the primary ingress point located in public subnets. The application containers reside entirely in private subnets, completely isolated from direct public internet access.

### CI/CD & Deployment
1. **GitHub Actions:** Selected for its tight integration with GitHub. The CI pipeline ensures tests pass successfully before image builds and registry pushes are initiated.
2. **Deployment Strategy (Rolling Updates):** The application relies on native ECS Deployment Controllers to execute zero-downtime rolling deployments, ensuring full container availability during infrastructure and software updates.
