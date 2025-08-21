# AgSub - Agricultural Subsidy & Program Enrollment Agent

A comprehensive web application that helps farmers enroll in USDA/NRCS programs, file forms automatically, and stay compliant with satellite monitoring.

## Features

- **Smart Program Matching**: AI-powered eligibility matching finds all programs farms qualify for
- **Automated Form Generation**: Pre-filled USDA application forms based on farm data
- **Compliance Monitoring**: Satellite and drone imagery validation of farming practices
- **Payment Tracking**: Dashboard for subsidy payments and deadlines
- **Audit Trail**: Immutable logging of all program activities
- **Multi-tenant Support**: Role-based access for farmers, consultants, and auditors

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Fastify, Prisma ORM
- **Database**: PostgreSQL 16
- **Queue**: Redis + BullMQ
- **Storage**: S3-compatible (MinIO for local dev)
- **Auth**: JWT with role-based access control
- **AI**: OpenAI API for document parsing

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- OpenAI API key (for document parsing)

## Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd AgSub
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Start infrastructure services**
```bash
docker-compose up -d
```

4. **Configure environment**
```bash
# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit .env files with your configuration
# Required: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
```

5. **Setup database**
```bash
cd apps/api
pnpm prisma:migrate
pnpm prisma:seed
```

6. **Start development servers**
```bash
# From root directory
pnpm dev

# Or run individually:
pnpm web    # Frontend at http://localhost:3000
pnpm api    # Backend at http://localhost:3001
```

## Test Accounts

After seeding the database, use these test accounts:

- **Farmer**: farmer@example.com / password123
- **Consultant**: consultant@example.com / password123
- **Auditor**: auditor@example.com / password123
- **Admin**: admin@example.com / password123

## Project Structure

```
AgSub/
├── apps/
│   ├── web/               # Next.js frontend
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/          # Utilities
│   └── api/              # Fastify backend
│       ├── src/
│       │   ├── routes/   # API endpoints
│       │   ├── services/ # Business logic
│       │   └── plugins/  # Fastify plugins
│       └── prisma/       # Database schema
├── packages/             # Shared packages
├── docker-compose.yml    # Local infrastructure
└── package.json         # Monorepo config
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Farms
- `GET /api/farms` - List farms
- `POST /api/farms` - Create farm
- `GET /api/farms/:id` - Get farm details
- `PATCH /api/farms/:id` - Update farm

### Programs
- `GET /api/programs` - List programs
- `POST /api/programs/match` - Match farm to programs

### Applications
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `POST /api/applications/generate` - Generate PDF form
- `PATCH /api/applications/:id/submit` - Submit application

### Compliance
- `GET /api/compliance` - List compliance logs
- `POST /api/compliance/log` - Log practice
- `POST /api/compliance/satellite` - Process satellite imagery

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments/add` - Add payment
- `GET /api/payments/dashboard` - Payment dashboard

### Audit
- `GET /api/audit` - Audit logs
- `GET /api/audit/farm/:farmId` - Farm audit trail
- `GET /api/audit/export/:farmId` - Export audit data

## Development

### Running Tests
```bash
pnpm test
```

### Linting
```bash
pnpm lint
```

### Building for Production
```bash
pnpm build
```

### Database Management
```bash
cd apps/api

# Create migration
pnpm prisma migrate dev --name <migration-name>

# Reset database
pnpm prisma migrate reset

# Open Prisma Studio
pnpm prisma:studio
```

## Environment Variables

### API (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for document parsing
- `S3_ENDPOINT` - S3-compatible storage endpoint
- `S3_ACCESS_KEY` - Storage access key
- `S3_SECRET_KEY` - Storage secret key

### Web (.env.local)
- `NEXTAUTH_URL` - NextAuth callback URL
- `NEXTAUTH_SECRET` - NextAuth encryption secret
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Docker Services

- **PostgreSQL**: Database on port 5432
- **Redis**: Queue/cache on port 6379
- **MinIO**: S3-compatible storage on ports 9000/9001

Access MinIO console at http://localhost:9001
- Username: minioadmin
- Password: minioadmin

## Deployment

For production deployment:

1. Set all environment variables for production
2. Use managed services (RDS, ElastiCache, S3)
3. Enable SSL/TLS for all services
4. Configure proper CORS origins
5. Set up monitoring and logging
6. Use secrets management service
7. Enable rate limiting and DDoS protection

## Security Considerations

- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days
- Role-based access control (RBAC)
- Input validation with Zod
- SQL injection protection via Prisma
- Rate limiting on API endpoints
- Audit logging for compliance

## License

MIT

## Support

For issues and questions, please open a GitHub issue.