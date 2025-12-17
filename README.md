# BluLedger Backend API

NestJS backend for BluLedger financial management system.

## Features

- **Authentication**: JWT-based auth with refresh token rotation
- **Multi-tenancy**: Organization-scoped requests via `x-org-id` header
- **REST API**: Versioned endpoints at `/api/v1`
- **Swagger**: API documentation at `/api/docs`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run Prisma migrations:
```bash
npm run prisma:migrate
npm run prisma:generate
```

4. Start the server:
```bash
npm run start:dev
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update current user

### Organizations
- `GET /api/v1/organizations` - List user's organizations
- `POST /api/v1/organizations` - Create organization
- `GET /api/v1/organizations/:id` - Get organization
- `PATCH /api/v1/organizations/:id` - Update organization

### Accounts
- `GET /api/v1/accounts` - List accounts (org-scoped)
- `POST /api/v1/accounts` - Create account
- `GET /api/v1/accounts/:id` - Get account
- `PATCH /api/v1/accounts/:id` - Update account
- `DELETE /api/v1/accounts/:id` - Delete account

### Transactions
- `GET /api/v1/transactions` - List transactions (org-scoped)
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/:id` - Get transaction
- `PATCH /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

## Multi-Tenancy

All requests (except auth endpoints) require the `x-org-id` header to scope data to an organization.

```bash
curl -H "Authorization: Bearer <token>" -H "x-org-id: <org-id>" http://localhost:3001/api/v1/accounts
```
