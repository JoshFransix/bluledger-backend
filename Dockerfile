# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

# ---------- Build ----------
FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- Production ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Railway listens on 0.0.0.0
ENV HOST=0.0.0.0
ENV PORT=3001

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy only required files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma

# Security: non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3001

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main.js"]