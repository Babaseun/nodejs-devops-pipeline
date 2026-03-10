variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  default     = "nodejs-devops"
}

variable "environment" {
  description = "Environment name"
  default     = "production"
}

variable "app_image" {
  description = "Docker image for ECS"
  type        = string
  default     = "nginx:latest" # Overridden in CI/CD pipeline
}

variable "app_port" {
  description = "App port"
  default     = 3000
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for HTTPS (optional)"
  type        = string
  default     = ""
}
