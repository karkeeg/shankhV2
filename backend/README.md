# Backend Service

Express + Prisma service for study plans, activities, attempts, and validation.

## Setup

1. Copy env template:

```bash
copy .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Prisma setup:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Run service:

```bash
npm run dev
```

## Scripts

- `npm run dev` - start dev server with watch
- `npm run build` - compile TypeScript
- `npm run start` - run built server
- `npm run test` - run validator tests
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run migrations
- `npm run prisma:seed` - seed base data
