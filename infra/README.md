# Infrastructure

## Environments

### Local Development

Uses `docker-compose.yml` at the project root:

- **PostgreSQL** — local database
- **Redis** — caching and session store

Start with:

```bash
docker compose up -d
```

### Production

Target architecture on AWS:

- **AWS ECS/Fargate** — container orchestration for API and Web services
- **RDS PostgreSQL** — managed database (Supabase-hosted in practice)
- **ElastiCache Redis** — managed Redis for caching
- **S3** — file/media storage
- **CloudFront** — CDN for the web SPA and static assets

### Production-like Local

Use the production compose file for local integration testing:

```bash
docker compose -f infra/docker-compose.prod.yml up --build
```

## Deployment Pipeline

```
GitHub Actions (push to main)
  → Build Docker images
  → Push to Amazon ECR
  → Update ECS services (force new deployment)
```

Workflow: `.github/workflows/deploy.yml`

## Required AWS Resources

| Resource                                | Purpose                 |
| --------------------------------------- | ----------------------- |
| ECR repositories (`enc-api`, `enc-web`) | Docker image registry   |
| ECS Cluster (`enc-cluster`)             | Container orchestration |
| ECS Services (`enc-api`, `enc-web`)     | Service definitions     |
| RDS PostgreSQL                          | Database                |
| ElastiCache Redis                       | Caching                 |
| S3 Bucket                               | File storage            |
| CloudFront Distribution                 | CDN                     |
| IAM Role (deploy)                       | GitHub Actions OIDC     |

## Required GitHub Secrets

| Secret                | Description                  |
| --------------------- | ---------------------------- |
| `AWS_ACCOUNT_ID`      | AWS account number           |
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN for GitHub OIDC |
| `DATABASE_URL`        | PostgreSQL connection string |
| `SUPABASE_URL`        | Supabase project URL         |
| `SUPABASE_JWT_SECRET` | Supabase JWT signing secret  |
| `AWS_S3_BUCKET`       | S3 bucket name               |
| `REDIS_URL`           | Redis connection string      |
