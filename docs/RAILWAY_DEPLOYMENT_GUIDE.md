# Railway Deployment Guide for True Escrow

**Purpose**: Step-by-step guide for deploying true-escrow to Railway  
**Date**: 2026-02-02

---

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub repository: `tjddyd55-crypto/true-escrow`
3. PostgreSQL database (Railway provides)
4. Lemon Squeezy account and API keys

---

## Step 1: Repository Setup

### 1.1 Clone Repository

```bash
git clone https://github.com/tjddyd55-crypto/true-escrow.git
cd true-escrow
```

### 1.2 Create Directory Structure

```bash
mkdir -p apps/web
mkdir -p server/api server/webhooks/lemonsqueezy
mkdir -p server/services/{escrow,revenue,billing,entitlement}
mkdir -p server/db/{migrations,schema}
mkdir -p docs dev_task
```

---

## Step 2: Dockerfile Creation

Create `Dockerfile` in repository root:

```dockerfile
FROM gradle:7.6-jdk17 AS build
WORKDIR /app
COPY server/build.gradle server/settings.gradle ./
COPY server/src ./src
RUN gradle build --no-daemon -x test

FROM openjdk:17-jre-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=production
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Step 3: Railway Configuration

### 3.1 Create railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "java -jar app.jar",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/actuator/health",
    "healthcheckTimeout": 100
  }
}
```

### 3.2 Create .dockerignore

```
.git
.gitignore
README.md
docs/
dev_task/
apps/
node_modules/
*.md
.env
.env.local
```

---

## Step 4: Environment Variables

### 4.1 Create .env.example

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Lemon Squeezy
LEMON_API_KEY=your_api_key_here
LEMON_STORE_ID=your_store_id_here
LEMON_WEBHOOK_SECRET=your_webhook_secret_here
LEMON_WEBHOOK_URL=https://your-app.railway.app/api/webhooks/lemonsqueezy

# Application
APP_BASE_URL=https://your-app.railway.app
SPRING_PROFILES_ACTIVE=production

# JWT (if needed)
JWT_SECRET=your_jwt_secret_here
```

### 4.2 Update application.yml

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

lemon:
  api:
    key: ${LEMON_API_KEY}
  store:
    id: ${LEMON_STORE_ID}
  webhook:
    secret: ${LEMON_WEBHOOK_SECRET}
    url: ${LEMON_WEBHOOK_URL}
  checkout:
    base-url: https://app.lemonsqueezy.com/checkout/buy

app:
  base-url: ${APP_BASE_URL}
```

---

## Step 5: Railway Deployment

### 5.1 Create New Project

1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select `tjddyd55-crypto/true-escrow`

### 5.2 Add PostgreSQL Database

1. In Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create PostgreSQL instance
4. Note the `DATABASE_URL` from database service

### 5.3 Configure Environment Variables

In Railway project settings, add:

```
DATABASE_URL=<from PostgreSQL service>
LEMON_API_KEY=<from Lemon Squeezy>
LEMON_STORE_ID=<from Lemon Squeezy>
LEMON_WEBHOOK_SECRET=<from Lemon Squeezy>
LEMON_WEBHOOK_URL=https://<your-app-name>.railway.app/api/webhooks/lemonsqueezy
APP_BASE_URL=https://<your-app-name>.railway.app
SPRING_PROFILES_ACTIVE=production
```

### 5.4 Deploy

1. Railway will automatically detect Dockerfile
2. Build will start automatically
3. Deployment will happen after build completes
4. Check logs for any errors

---

## Step 6: Verify Deployment

### 6.1 Health Check

```bash
curl https://your-app.railway.app/actuator/health
```

Expected: `{"status":"UP"}`

### 6.2 Webhook Endpoint

```bash
curl -X POST https://your-app.railway.app/api/webhooks/lemonsqueezy \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Expected: `200 OK` (even if webhook validation fails, endpoint should respond)

### 6.3 API Endpoints

```bash
# Get API info
curl https://your-app.railway.app/api/health

# Test partner creation (if implemented)
curl -X POST https://your-app.railway.app/api/partners \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Partner", "contactEmail": "test@example.com"}'
```

---

## Step 7: Lemon Squeezy Webhook Configuration

### 7.1 Get Webhook URL

Your webhook URL: `https://your-app.railway.app/api/webhooks/lemonsqueezy`

### 7.2 Configure in Lemon Squeezy

1. Go to Lemon Squeezy dashboard
2. Navigate to Settings → Webhooks
3. Add new webhook:
   - URL: `https://your-app.railway.app/api/webhooks/lemonsqueezy`
   - Events: `order_created`, `order_updated`, `subscription_created`, etc.
   - Secret: (use same as `LEMON_WEBHOOK_SECRET`)

### 7.3 Test Webhook

Use Lemon Squeezy webhook testing tool or send test webhook:

```bash
curl -X POST https://your-app.railway.app/api/webhooks/lemonsqueezy \
  -H "X-Signature: <test-signature>" \
  -H "Content-Type: application/json" \
  -d '{"meta": {"event_name": "order_created"}, "data": {"id": "test"}}'
```

---

## Step 8: First Payment Test

### 8.1 Create Partner

```bash
curl -X POST https://your-app.railway.app/api/partners \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Partner",
    "contactEmail": "test@example.com",
    "pricingModel": "HYBRID",
    "tier": "PROFESSIONAL"
  }'
```

### 8.2 Generate Invoice

```bash
curl -X POST https://your-app.railway.app/api/invoices/generate
```

### 8.3 Get Checkout Link

```bash
curl https://your-app.railway.app/api/payments/invoices/{invoiceId}/checkout
```

### 8.4 Complete Payment

1. Open checkout link in browser
2. Complete test payment in Lemon Squeezy
3. Verify webhook received
4. Verify invoice marked as PAID
5. Verify entitlement granted

---

## Troubleshooting

### Build Fails

- Check Dockerfile syntax
- Verify build.gradle dependencies
- Check Railway build logs

### Database Connection Fails

- Verify `DATABASE_URL` is correct
- Check PostgreSQL service is running
- Verify network connectivity

### Webhook Not Received

- Verify webhook URL is correct
- Check Lemon Squeezy webhook configuration
- Verify webhook secret matches
- Check Railway logs for errors

### Application Crashes

- Check Railway logs
- Verify all environment variables set
- Check database migrations completed
- Verify Java version compatibility

---

## Monitoring

### Railway Logs

1. Go to Railway dashboard
2. Select your service
3. Click "Logs" tab
4. Monitor for errors

### Health Endpoint

```bash
curl https://your-app.railway.app/actuator/health
```

### Metrics (if configured)

```bash
curl https://your-app.railway.app/actuator/metrics
```

---

## Next Steps

1. **Production Readiness**:
   - Set up proper logging
   - Configure monitoring
   - Set up alerts

2. **Security**:
   - Enable HTTPS (Railway provides)
   - Secure environment variables
   - Review webhook security

3. **Scaling**:
   - Configure auto-scaling (if needed)
   - Set up database backups
   - Monitor resource usage

---

## Status

✅ **Railway Deployment Guide Complete**

Ready for deployment to Railway.
