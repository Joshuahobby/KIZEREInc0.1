# KIZERE Platform

A comprehensive digital platform for intelligent item management, focusing on lost and found reporting with advanced user experience and robust authentication mechanisms.

## Project Structure

The project follows a modern architecture with clear separation of concerns:

```text
├── client/                 # Frontend React application
├── server/                 # Backend Express server
│   ├── middleware/         # Express middleware
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic layer
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utilities and helpers
├── shared/                 # Shared code between client/server
```

## Key Technologies

- **Frontend**: React with TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Express.js, PostgreSQL, Drizzle ORM
- **Authentication**: Firebase Auth with custom session management
- **Security**: Helmet, express-rate-limit, CSRF protection, content sanitization
- **Infrastructure**: vercel or netlify or firebase for hosting and deployment

## Architecture

The application follows a service-oriented architecture with the following layers:

1. **Presentation Layer**: React components and hooks
2. **Service Layer**: Business logic in service classes
3. **Repository Layer**: Data access with repository pattern
4. **Infrastructure Layer**: Database, caching, logging, and external services

## Key Features

- User authentication and role-based access control
- Item registration and tracking
- Lost and found item reporting
- Payment processing (Flutterwave)
- Admin dashboard for monitoring and management
- Secure API endpoints with rate limiting

## Security Features

- Helmet for HTTP headers hardening
- XSS protection with sanitize-html and xss-clean
- Rate limiting for auth and API endpoints
- Consistent error handling with detailed logging
- Input validation and sanitization pipeline

## Performance Optimizations

- In-memory caching for frequently accessed data
- Optimized database queries with pagination
- Repository pattern for consistent data access
- Type-safe data handling with TypeScript and Zod

## Deployment Strategy

We use a multi-environment CI/CD pipeline to ensure data safety and feature reliability.

### Environments
- **Staging**: `staging.kizere.rw` - Used for final QA and E2E testing.
- **Production**: `kizere.rw` - The live user-facing application.

### CI/CD Workflow
1. **Pull Requests**: Every PR triggers automated type checks, unit tests, and E2E tests via GitHub Actions.
2. **Staging Review**: Once tests pass and code is merged to `main`, it is automatically deployed to the Staging environment.
3. **Production Promotion**: After manual verification on Staging, the build is promoted to Production.

For more details, see the [Production Migration Strategy](file:///C:/Users/Joesure/.gemini/antigravity/brain/bd3d3145-1830-4bf8-8565-4f92766db41b/migration_strategy.md).

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the development server: `npm run dev`

## Contributing

Please follow the established patterns when contributing:

1. Use TypeScript for all new code
2. Follow the repository pattern for data access
3. Add service classes for business logic
4. Add tests for new features
5. Document your changes

## License

All rights reserved.
