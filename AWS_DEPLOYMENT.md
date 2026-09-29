# SecHindsight — AWS Deployment Guide

This guide outlines the production deployment setup for **SecHindsight** on **AWS EC2** using **Docker** and **Docker Compose**.

---

## 1. Prerequisites & AWS Architecture

- **AWS Instance:** `t3.medium` or `t2.micro` (AWS Free Tier eligible)
- **OS:** Ubuntu Server 22.04 LTS
- **Services:**
  - **FastAPI Backend:** Containerized on port `8000`
  - **Next.js Frontend:** Containerized on port `3000`
  - **Database:** Supabase PostgreSQL or local SQLite/Postgres
  - **Memory Service:** Hindsight Cloud API (`https://api.hindsight.ai/v1`)
  - **LLM Service:** Groq API (`https://api.groq.com/openai/v1`)

---

## 2. AWS EC2 Security Group Configuration

Configure your EC2 Security Group rules as follows:

| Type | Protocol | Port Range | Source | Description |
|---|---|---|---|---|
| SSH | TCP | 22 | `Your-IP/32` | Administrative Access |
| HTTP | TCP | 80 | `0.0.0.0/0` | Web Access |
| HTTPS | TCP | 443 | `0.0.0.0/0` | Secure Web Access |
| Custom TCP | TCP | 3000 | `0.0.0.0/0` | Next.js Frontend |
| Custom TCP | TCP | 8000 | `0.0.0.0/0` | FastAPI Backend API |

---

## 3. Server Initialization & Docker Installation

SSH into your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@ec2-xx-xx-xx-xx.compute-1.amazonaws.com
```

Update system & install Docker:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git curl

# Enable Docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

---

## 4. Clone Repository & Setup Environment

```bash
git clone https://github.com/your-org/SecHindsight.git
cd SecHindsight

# Create Backend .env
cat << 'EOF' > backend/.env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
HINDSIGHT_API_KEY=hs_your_hindsight_api_key_here
HINDSIGHT_API_URL=https://api.hindsight.ai/v1
HINDSIGHT_BANK_ID=sec-hindsight-soc-bank
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_role_key
DATABASE_URL=sqlite+aiosqlite:///./sec_hindsight.db
CORS_ORIGINS=http://localhost:3000,http://ec2-xx-xx-xx-xx.compute-1.amazonaws.com:3000
ENVIRONMENT=production
LOG_LEVEL=INFO
EOF
```

---

## 5. Build and Launch Containers

```bash
# Launch containers in detached mode
docker-compose up -d --build

# Verify container health
docker-compose ps
```

---

## 6. Health Checks & Log Inspection

Verify API backend health endpoint:
```bash
curl http://localhost:8000/api/v1/health
```

View live container logs:
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend
```

---

## 7. Restarting & Rollback Instructions

Restarting services:
```bash
docker-compose restart
```

Rolling back or stopping services:
```bash
docker-compose down
```

---

## 8. Cost Safety & Free Tier Optimization

- Uses external Groq API & Hindsight Cloud API for inference and memory, avoiding heavy local GPU instances.
- Fits safely within standard AWS EC2 Free Tier allowances.
