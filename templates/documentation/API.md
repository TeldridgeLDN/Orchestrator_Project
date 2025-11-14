# API Documentation

**Version**: 1.0.0  
**Base URL**: `https://api.example.com/v1`  
**Last Updated**: YYYY-MM-DD

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [User Management](#user-management)
  - [Data Operations](#data-operations)
- [Response Formats](#response-formats)
- [Webhooks](#webhooks)
- [SDKs & Libraries](#sdks--libraries)

---

## Authentication

### API Key Authentication

Include your API key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.example.com/v1/users
```

### JWT Token Authentication

For user-specific operations, obtain a JWT token:

```bash
# Login to get token
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}

# Use token in requests
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  https://api.example.com/v1/users/me
```

### API Key Management

- Obtain keys: [Dashboard → API Keys](https://dashboard.example.com/api-keys)
- Rotate keys: Recommended every 90 days
- Never commit keys to version control

---

## Rate Limiting

**Limits**:
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Enterprise: Custom limits

**Headers**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1635724800
```

**Exceeding Limits**:
```json
{
  "error": "rate_limit_exceeded",
  "message": "You have exceeded your rate limit. Try again in 15 minutes.",
  "retryAfter": 900
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "email",
    "issue": "Email address is already in use"
  },
  "requestId": "req_abc123",
  "documentation": "https://docs.example.com/errors/email_in_use"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Temporary service disruption |

### Common Error Codes

| Error Code | Description | Resolution |
|-----------|-------------|------------|
| `invalid_request` | Malformed request | Check request format |
| `unauthorized` | Missing/invalid auth | Verify API key or token |
| `resource_not_found` | Resource doesn't exist | Check resource ID |
| `validation_error` | Input validation failed | Review error details |
| `rate_limit_exceeded` | Too many requests | Wait for rate limit reset |

---

## Endpoints

### User Management

#### Get Current User

```http
GET /v1/users/me
```

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2024-11-14T08:45:00Z"
}
```

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.example.com/v1/users/me
```

---

#### List Users

```http
GET /v1/users
```

**Authentication**: Required (Admin role)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `sort` | string | No | Sort field (default: `createdAt`) |
| `order` | string | No | Sort order: `asc` or `desc` (default: `desc`) |
| `role` | string | No | Filter by role: `admin`, `user`, `guest` |

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "usr_abc123",
      "email": "user1@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "usr_xyz789",
      "email": "user2@example.com",
      "name": "Jane Smith",
      "role": "admin",
      "createdAt": "2024-01-10T14:20:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://api.example.com/v1/users?page=1&limit=10&role=admin"
```

---

#### Create User

```http
POST /v1/users
```

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "SecurePassword123!",
  "role": "user"
}
```

**Validation Rules**:
- `email`: Valid email format, unique
- `name`: 2-100 characters
- `password`: Min 8 characters, must include uppercase, lowercase, number
- `role`: One of `admin`, `user`, `guest`

**Response** (201 Created):
```json
{
  "id": "usr_new456",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "user",
  "createdAt": "2024-11-14T09:00:00Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "validation_error",
  "message": "Validation failed",
  "details": {
    "email": "Email address is already in use",
    "password": "Password must be at least 8 characters"
  }
}
```

**Example**:
```bash
curl -X POST https://api.example.com/v1/users \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "password": "SecurePassword123!",
    "role": "user"
  }'
```

---

#### Update User

```http
PATCH /v1/users/:id
```

**Authentication**: Required (Admin or own profile)

**Path Parameters**:
- `id`: User ID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

**Response** (200 OK):
```json
{
  "id": "usr_abc123",
  "email": "updated@example.com",
  "name": "Updated Name",
  "role": "user",
  "updatedAt": "2024-11-14T09:15:00Z"
}
```

---

#### Delete User

```http
DELETE /v1/users/:id
```

**Authentication**: Required (Admin role)

**Path Parameters**:
- `id`: User ID

**Response** (204 No Content)

**Example**:
```bash
curl -X DELETE https://api.example.com/v1/users/usr_abc123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### Data Operations

#### Get Data Items

```http
GET /v1/items
```

**Authentication**: Required

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20) |
| `search` | string | No | Search query |
| `category` | string | No | Filter by category |
| `status` | string | No | Filter by status: `active`, `inactive` |

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "item_123",
      "title": "Item Title",
      "description": "Item description",
      "category": "category1",
      "status": "active",
      "createdAt": "2024-11-14T08:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## Response Formats

### Success Response

```json
{
  "data": { ... },  // Resource or array of resources
  "meta": {         // Optional metadata
    "page": 1,
    "total": 100
  }
}
```

### Error Response

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": { ... }  // Optional additional details
}
```

---

## Webhooks

### Subscribing to Events

Configure webhooks in [Dashboard → Webhooks](https://dashboard.example.com/webhooks)

**Available Events**:
- `user.created`
- `user.updated`
- `user.deleted`
- `data.item.created`
- `data.item.updated`

### Webhook Payload

```json
{
  "event": "user.created",
  "timestamp": "2024-11-14T09:00:00Z",
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com"
  }
}
```

### Verifying Webhooks

Webhooks include an `X-Signature` header:

```javascript
import crypto from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}
```

---

## SDKs & Libraries

### Official SDKs

- **JavaScript/Node.js**: `npm install @example/api-client`
- **Python**: `pip install example-api-client`
- **Ruby**: `gem install example-api-client`

### JavaScript Example

```javascript
import { ExampleClient } from '@example/api-client';

const client = new ExampleClient({ apiKey: 'YOUR_API_KEY' });

// Get current user
const user = await client.users.me();

// List users
const users = await client.users.list({ page: 1, limit: 10 });

// Create user
const newUser = await client.users.create({
  email: 'newuser@example.com',
  name: 'New User',
  password: 'SecurePassword123!'
});
```

---

## Changelog

### v1.0.0 (2024-11-14)
- Initial API release
- User management endpoints
- Data operations endpoints
- Webhook support

---

## Support

- **Documentation**: [https://docs.example.com](https://docs.example.com)
- **Status Page**: [https://status.example.com](https://status.example.com)
- **Support**: support@example.com
- **Issues**: [GitHub Issues](https://github.com/example/api/issues)

---

**API Version**: 1.0.0  
**Last Updated**: YYYY-MM-DD  
**Maintained By**: [Your Team]

