# BluLedger Backend API Documentation

## Base URL
```
http://localhost:3001/api/v1
```

## API Documentation (Swagger)
```
http://localhost:3001/api/docs
```

---

## Authentication

All endpoints except `/auth/*` require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

Endpoints requiring organization context also need:
```
x-org-id: <organization_id>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Notes:**
- Refresh token is set as HTTP-only cookie
- Password must be at least 8 characters

---

### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Notes:**
- Refresh token is set as HTTP-only cookie
- Old refresh tokens are invalidated (rotation)

---

### POST /auth/refresh
Refresh access token using refresh token cookie.

**Headers:**
```
Cookie: refreshToken=<refresh_token>
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Notes:**
- New refresh token is set as HTTP-only cookie
- Old refresh token is invalidated (rotation)

---

### POST /auth/logout
Logout and invalidate refresh token.

**Headers:**
```
Cookie: refreshToken=<refresh_token>
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

**Notes:**
- Refresh token cookie is cleared

---

## User Endpoints

### GET /users/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "clx123...",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /users/me
Update current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "newemail@example.com"
}
```

**Response:** `200 OK`
```json
{
  "id": "clx123...",
  "email": "newemail@example.com",
  "name": "Jane Doe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

## Organization Endpoints

### POST /organizations
Create a new organization.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "My Company Inc."
}
```

**Response:** `201 Created`
```json
{
  "id": "clx456...",
  "name": "My Company Inc.",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Notes:**
- Creator is automatically assigned as admin

---

### GET /organizations
Get all organizations for current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "clx456...",
    "name": "My Company Inc.",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "clx789...",
    "name": "Another Org",
    "role": "member",
    "createdAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

---

### GET /organizations/:id
Get organization details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "clx456...",
  "name": "My Company Inc.",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /organizations/:id
Update organization (admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Company Name"
}
```

**Response:** `200 OK`
```json
{
  "id": "clx456...",
  "name": "Updated Company Name",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### GET /organizations/:id/summary
Get comprehensive organization summary with balances, stats, and net worth.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "clx456...",
  "name": "My Company",
  "stats": {
    "accountsCount": 5,
    "transactionsCount": 120,
    "membersCount": 3
  },
  "balances": {
    "USD": {
      "total": 50000.00,
      "assets": 75000.00,
      "liabilities": 25000.00
    },
    "EUR": {
      "total": 20000.00,
      "assets": 30000.00,
      "liabilities": 10000.00
    }
  },
  "netWorth": {
    "USD": 50000.00,
    "EUR": 20000.00
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Notes:**
- Ideal for dashboard overview
- Multi-currency support
- Net worth = assets - liabilities
- Only includes active accounts

---

## Account Endpoints

**All account endpoints require both Bearer token and x-org-id header.**

### POST /accounts
Create a new account.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Request Body:**
```json
{
  "name": "Cash Account",
  "type": "ASSET",
  "currency": "USD",
  "description": "Primary cash account",
  "isActive": true
}
```

**Account Types:**
- `ASSET` - Cash, bank accounts, receivables
- `LIABILITY` - Loans, payables, credit cards
- `EQUITY` - Owner's equity, retained earnings
- `REVENUE` - Sales, service income
- `EXPENSE` - Salaries, rent, utilities

**Response:** `201 Created`
```json
{
  "id": "clxabc...",
  "organizationId": "clx456...",
  "name": "Cash Account",
  "type": "ASSET",
  "balance": "0.00",
  "currency": "USD",
  "description": "Primary cash account",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /accounts
Get all accounts for organization.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Response:** `200 OK`
```json
[
  {
    "id": "clxabc...",
    "organizationId": "clx456...",
    "name": "Cash Account",
    "type": "ASSET",
    "balance": "5000.00",
    "currency": "USD",
    "description": "Primary cash account",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET /accounts/:id
Get account by ID.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Response:** `200 OK`
```json
{
  "id": "clxabc...",
  "organizationId": "clx456...",
  "name": "Cash Account",
  "type": "ASSET",
  "balance": "5000.00",
  "currency": "USD",
  "description": "Primary cash account",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /accounts/:id
Update account.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Request Body:**
```json
{
  "name": "Updated Account Name",
  "description": "Updated description",
  "isActive": false
}
```

**Response:** `200 OK`
```json
{
  "id": "clxabc...",
  "organizationId": "clx456...",
  "name": "Updated Account Name",
  "type": "ASSET",
  "balance": "5000.00",
  "currency": "USD",
  "description": "Updated description",
  "isActive": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### DELETE /accounts/:id
Delete account.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

---

## Transaction Endpoints

**All transaction endpoints require both Bearer token and x-org-id header.**

### POST /transactions
Create a new transaction.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Request Body (INCOME):**
```json
{
  "type": "INCOME",
  "amount": 1000.50,
  "currency": "USD",
  "description": "Monthly salary",
  "date": "2024-01-15T10:00:00Z",
  "category": "Salary",
  "tags": ["income", "monthly"],
  "toAccountId": "clxabc..."
}
```

**Request Body (EXPENSE):**
```json
{
  "type": "EXPENSE",
  "amount": 250.00,
  "currency": "USD",
  "description": "Office rent",
  "date": "2024-01-15T10:00:00Z",
  "category": "Rent",
  "tags": ["expense", "monthly"],
  "fromAccountId": "clxabc..."
}
```

**Request Body (TRANSFER):**
```json
{
  "type": "TRANSFER",
  "amount": 500.00,
  "currency": "USD",
  "description": "Transfer to savings",
  "date": "2024-01-15T10:00:00Z",
  "category": "Savings",
  "tags": ["transfer"],
  "fromAccountId": "clxabc...",
  "toAccountId": "clxdef..."
}
```

**Transaction Types:**
- `INCOME` - Requires `toAccountId` only
- `EXPENSE` - Requires `fromAccountId` only
- `TRANSFER` - Requires both `fromAccountId` and `toAccountId`

**Response:** `201 Created`
```json
{
  "id": "clxtxn...",
  "organizationId": "clx456...",
  "type": "INCOME",
  "amount": "1000.50",
  "currency": "USD",
  "description": "Monthly salary",
  "date": "2024-01-15T10:00:00.000Z",
  "category": "Salary",
  "tags": ["income", "monthly"],
  "fromAccountId": null,
  "toAccountId": "clxabc...",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Notes:**
- Account balances are automatically updated
- For INCOME: `toAccount.balance += amount`
- For EXPENSE: `fromAccount.balance -= amount`
- For TRANSFER: `fromAccount.balance -= amount`, `toAccount.balance += amount`

---

### GET /transactions
Get all transactions for organization.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Response:** `200 OK`
```json
[
  {
    "id": "clxtxn...",
    "organizationId": "clx456...",
    "type": "INCOME",
    "amount": "1000.50",
    "currency": "USD",
    "description": "Monthly salary",
    "date": "2024-01-15T10:00:00.000Z",
    "category": "Salary",
    "tags": ["income", "monthly"],
    "fromAccountId": null,
    "toAccountId": "clxabc...",
    "fromAccount": null,
    "toAccount": {
      "id": "clxabc...",
      "name": "Cash Account"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### GET /transactions/:id
Get transaction by ID.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Response:** `200 OK`
```json
{
  "id": "clxtxn...",
  "organizationId": "clx456...",
  "type": "INCOME",
  "amount": "1000.50",
  "currency": "USD",
  "description": "Monthly salary",
  "date": "2024-01-15T10:00:00.000Z",
  "category": "Salary",
  "tags": ["income", "monthly"],
  "fromAccountId": null,
  "toAccountId": "clxabc...",
  "fromAccount": null,
  "toAccount": {
    "id": "clxabc...",
    "name": "Cash Account"
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### PATCH /transactions/:id
Update transaction.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Request Body:**
```json
{
  "amount": 1200.00,
  "description": "Updated salary",
  "category": "Salary - Updated"
}
```

**Response:** `200 OK`
```json
{
  "id": "clxtxn...",
  "organizationId": "clx456...",
  "type": "INCOME",
  "amount": "1200.00",
  "currency": "USD",
  "description": "Updated salary",
  "date": "2024-01-15T10:00:00.000Z",
  "category": "Salary - Updated",
  "tags": ["income", "monthly"],
  "fromAccountId": null,
  "toAccountId": "clxabc...",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-16T10:00:00.000Z"
}
```

**Notes:**
- Old balance changes are reverted
- New balance changes are applied
- Ensures data integrity

---

### DELETE /transactions/:id
Delete transaction.

**Headers:**
```
Authorization: Bearer <access_token>
x-org-id: <organization_id>
```

**Response:** `200 OK`
```json
{
  "message": "Transaction deleted successfully"
}
```

**Notes:**
- Balance changes are reverted before deletion

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You do not have access to this organization",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

---

## Security Features

### JWT Access Tokens
- Short-lived (15 minutes)
- Used for API authentication
- Sent in Authorization header

### Refresh Token Rotation
- Long-lived (7 days)
- HTTP-only cookies (XSS protection)
- Automatically rotated on each refresh
- Old tokens invalidated after use

### Organization Isolation
- All data scoped to organizations
- `x-org-id` header required for org endpoints
- Verified via `OrgAccessGuard`
- Users must be members to access org data

### Password Security
- Hashed with bcrypt (10 rounds)
- Minimum 8 characters
- Never stored in plain text

---

## Example Workflow

### 1. Register & Login
```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!","name":"John Doe"}' \
  -c cookies.txt

# Save accessToken from response
```

### 2. Create Organization
```bash
curl -X POST http://localhost:3001/api/v1/organizations \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Company"}'

# Save organization.id
```

### 3. Create Accounts
```bash
# Create Cash Account
curl -X POST http://localhost:3001/api/v1/accounts \
  -H "Authorization: Bearer <accessToken>" \
  -H "x-org-id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cash","type":"ASSET"}'

# Create Bank Account
curl -X POST http://localhost:3001/api/v1/accounts \
  -H "Authorization: Bearer <accessToken>" \
  -H "x-org-id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bank Account","type":"ASSET"}'
```

### 4. Create Transactions
```bash
# Record income
curl -X POST http://localhost:3001/api/v1/transactions \
  -H "Authorization: Bearer <accessToken>" \
  -H "x-org-id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"INCOME",
    "amount":5000,
    "description":"Client payment",
    "toAccountId":"<cashAccountId>",
    "category":"Revenue"
  }'

# Record expense
curl -X POST http://localhost:3001/api/v1/transactions \
  -H "Authorization: Bearer <accessToken>" \
  -H "x-org-id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"EXPENSE",
    "amount":1000,
    "description":"Office rent",
    "fromAccountId":"<cashAccountId>",
    "category":"Rent"
  }'
```

### 5. View Accounts & Balances
```bash
curl -X GET http://localhost:3001/api/v1/accounts \
  -H "Authorization: Bearer <accessToken>" \
  -H "x-org-id: <orgId>"
```

---

## Database Schema

### User
- `id` - Unique identifier
- `email` - User email (unique)
- `password` - Hashed password
- `name` - User name (optional)

### RefreshToken
- `id` - Unique identifier
- `token` - Refresh token (unique)
- `userId` - Reference to User
- `expiresAt` - Expiration date

### Organization
- `id` - Unique identifier
- `name` - Organization name

### OrganizationMember
- `id` - Unique identifier
- `organizationId` - Reference to Organization
- `userId` - Reference to User
- `role` - User role (admin, member, viewer)

### Account
- `id` - Unique identifier
- `organizationId` - Reference to Organization
- `name` - Account name
- `type` - Account type (ASSET, LIABILITY, etc.)
- `balance` - Current balance
- `currency` - Currency code
- `isActive` - Active status

### Transaction
- `id` - Unique identifier
- `organizationId` - Reference to Organization
- `type` - Transaction type (INCOME, EXPENSE, TRANSFER)
- `amount` - Transaction amount
- `currency` - Currency code
- `description` - Description
- `date` - Transaction date
- `category` - Category
- `tags` - Tags array
- `fromAccountId` - Source account (optional)
- `toAccountId` - Destination account (optional)

---

## Development

### Run Prisma Studio
```bash
npm run prisma:studio
```

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Create Migration
```bash
npm run prisma:migrate
```

### Format Code
```bash
npm run format
```

### Lint Code
```bash
npm run lint
```
