# railway.json for True Escrow

**Location**: Repository root  
**Purpose**: Railway deployment configuration

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

**Configuration**:
- Uses Dockerfile for build
- Health check on `/actuator/health`
- Auto-restart on failure
- Max 10 retries
