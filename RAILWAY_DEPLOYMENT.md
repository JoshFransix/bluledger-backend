# Railway Deployment Guide for BluLedger Backend

## Prerequisites
- GitHub repository connected to Railway
- PostgreSQL database provisioned in Railway

## Environment Variables to Set in Railway

In your Railway project dashboard, add these environment variables:

### Required Variables:

```bash
# Database (Railway will provide this automatically if you add PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-characters-long
REFRESH_TOKEN_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# Redis (optional - add if you're using Redis)
REDIS_URL=redis://host:port
```

## Steps to Deploy

### 1. Add PostgreSQL Database
1. In Railway dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically set `DATABASE_URL` environment variable

### 2. Set Environment Variables
1. Go to your backend service in Railway
2. Click "Variables" tab
3. Add all the environment variables listed above
4. Use strong, random secrets for JWT_SECRET and REFRESH_TOKEN_SECRET

**Generate secure secrets using:**
```bash
# On Linux/Mac
openssl rand -hex 64

# On Windows (PowerShell)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Configure Build & Start Commands

Railway should auto-detect your NestJS app, but if needed, set:

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
npx prisma migrate deploy && npm run start:prod
```

### 4. Deploy
1. Push your code to GitHub
2. Railway will automatically deploy
3. Check logs for any errors

## Troubleshooting

### "JwtStrategy requires a secret or key"
- Ensure `JWT_SECRET` is set in Railway environment variables
- Check that the variable name matches exactly (case-sensitive)
- Restart the deployment after adding variables

### Database Connection Issues
- Verify `DATABASE_URL` is correctly formatted
- Ensure Prisma schema is generated: `npx prisma generate`
- Run migrations: `npx prisma migrate deploy`

### Build Failures
- Check that all dependencies are in `package.json` (not devDependencies)
- Ensure `@nestjs/config` is installed
- Verify Node version compatibility

## Environment Variable Checklist

- [ ] DATABASE_URL (auto-set by Railway PostgreSQL)
- [ ] JWT_SECRET (minimum 32 characters)
- [ ] REFRESH_TOKEN_SECRET (minimum 32 characters)
- [ ] JWT_EXPIRES_IN
- [ ] REFRESH_TOKEN_EXPIRES_IN
- [ ] NODE_ENV=production
- [ ] PORT=3001
- [ ] FRONTEND_URL (your frontend domain)

## Testing Deployment

Once deployed, test your API:

```bash
# Health check
curl https://your-backend.railway.app/

# Test auth endpoint
curl -X POST https://your-backend.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```
