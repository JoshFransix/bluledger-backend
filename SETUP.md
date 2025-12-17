# BluLedger Backend - Setup & Installation

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
cd bluledger-backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bluledger?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-secret-key-change-in-production"
REFRESH_TOKEN_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3001
```

### 3. Set Up Database

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

This will create all necessary database tables.

### 4. Start the Server

**Development mode with hot reload:**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001/api/v1`

### 5. Access Swagger Documentation

Open your browser and navigate to:
```
http://localhost:3001/api/docs
```

## Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

Save the `accessToken` from the response.

### 3. Create an Organization

```bash
curl -X POST http://localhost:3001/api/v1/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "My Company"
  }'
```

Save the organization `id` from the response.

### 4. Create an Account (requires x-org-id header)

```bash
curl -X POST http://localhost:3001/api/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-org-id: YOUR_ORG_ID" \
  -d '{
    "name": "Cash Account",
    "type": "ASSET",
    "currency": "USD",
    "description": "Primary cash account"
  }'
```

### 5. Create a Transaction (requires x-org-id header)

```bash
curl -X POST http://localhost:3001/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-org-id: YOUR_ORG_ID" \
  -d '{
    "type": "INCOME",
    "amount": 1000,
    "description": "Monthly salary",
    "category": "Salary",
    "toAccountId": "YOUR_ACCOUNT_ID"
  }'
```

## Project Structure

```
bluledger-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── dto/               # Data transfer objects
│   │   ├── guards/            # JWT auth guard
│   │   ├── strategies/        # Passport JWT strategy
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/                 # Users module
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── organizations/         # Organizations module (multi-tenancy)
│   │   ├── dto/
│   │   ├── organizations.controller.ts
│   │   ├── organizations.service.ts
│   │   └── organizations.module.ts
│   ├── accounts/              # Accounts module
│   │   ├── dto/
│   │   ├── accounts.controller.ts
│   │   ├── accounts.service.ts
│   │   └── accounts.module.ts
│   ├── transactions/          # Transactions module
│   │   ├── dto/
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   └── transactions.module.ts
│   ├── common/                # Shared code
│   │   ├── decorators/        # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── org-id.decorator.ts
│   │   └── guards/            # Custom guards
│   │       └── org-access.guard.ts
│   ├── prisma/                # Prisma service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── .env.example               # Environment variables template
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

## Key Features Implemented

### ✅ Authentication
- Email/password registration and login
- JWT access tokens (15 min expiry)
- Refresh token rotation (7 day expiry)
- HTTP-only cookies for refresh tokens
- Secure logout

### ✅ Multi-Tenancy
- Users can belong to multiple organizations
- Organization-scoped data access via `x-org-id` header
- Role-based membership (admin, member, viewer)
- Data isolation enforced at service level

### ✅ REST API
- Versioned endpoints (`/api/v1`)
- Swagger documentation
- Validation with class-validator
- Standardized DTOs

### ✅ Database Models
- User
- Organization
- OrganizationMember
- Account (with balance tracking)
- Transaction (with automatic balance updates)
- RefreshToken

### ✅ Business Logic
- Automatic account balance updates on transactions
- Transaction type validation (INCOME, EXPENSE, TRANSFER)
- Account ownership verification
- Organization access control

## API Endpoints Summary

### Auth
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update current user

### Organizations
- `POST /api/v1/organizations` - Create organization
- `GET /api/v1/organizations` - List user's organizations
- `GET /api/v1/organizations/:id` - Get organization
- `PATCH /api/v1/organizations/:id` - Update organization

### Accounts (requires `x-org-id` header)
- `POST /api/v1/accounts` - Create account
- `GET /api/v1/accounts` - List accounts
- `GET /api/v1/accounts/:id` - Get account
- `PATCH /api/v1/accounts/:id` - Update account
- `DELETE /api/v1/accounts/:id` - Delete account

### Transactions (requires `x-org-id` header)
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/:id` - Get transaction
- `PATCH /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

## Security Considerations

1. **Change default secrets** in production
2. **Use HTTPS** in production
3. **Configure CORS** appropriately for your frontend domain
4. **Implement rate limiting** for authentication endpoints
5. **Enable secure cookies** in production (already configured)
6. **Regular security audits** of dependencies

## Next Steps (Out of Scope)

The following features are NOT implemented yet (as requested):
- Analytics and reporting
- Background jobs
- WebSockets for real-time updates
- Advanced filtering and pagination
- File uploads
- Email notifications
- Two-factor authentication

The foundation is now complete and ready for frontend integration!
