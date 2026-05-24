# Contributing to DPM Calendar

Thank you for your interest in contributing to DPM Calendar! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 8.x (recommended) or npm
- **PostgreSQL** (or Supabase account)
- **Git**

### Forking and Cloning

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/dpm-calendar.git
cd dpm-calendar
```

---

## Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Required variables:
```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Optional
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed database
pnpm prisma db seed
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

---

## Project Structure

We use a **feature-first architecture**. See [ADR-001](./docs/decisions/001-feature-first-architecture.md) for details.

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related pages
│   ├── (dashboard)/       # Main app pages
│   └── api/               # API routes
├── features/              # Feature modules
│   ├── calendar/          # Calendar feature
│   │   ├── components/    # React components
│   │   ├── hooks/         # React hooks
│   │   └── server/        # tRPC routers
│   ├── tasks/
│   ├── habits/
│   ├── wellness/
│   └── ...
├── shared/                # Shared utilities
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Shared hooks
│   └── lib/               # Utility functions
├── infrastructure/        # Core infrastructure
│   ├── api/               # tRPC setup
│   ├── db/                # Prisma client
│   └── trpc/              # tRPC configuration
└── messages/              # i18n translation files
    ├── en.json
    └── fr.json
```

---

## Making Changes

### Branch Naming

Use descriptive branch names:

```
feature/add-dark-mode
fix/calendar-timezone-bug
docs/update-readme
refactor/simplify-auth-flow
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add dark mode toggle
fix: resolve timezone offset in calendar
docs: update API documentation
refactor: simplify authentication flow
test: add unit tests for task service
chore: update dependencies
```

Include issue reference when applicable:
```
feat: add push notifications (#90)
```

---

## Coding Standards

### TypeScript

- **Strict mode** enabled
- **No `any`** types (use `unknown` if needed)
- **Explicit return types** for exported functions
- Use **Zod** for runtime validation

### React

- **Functional components** with hooks
- **Server Components** by default (App Router)
- Use `"use client"` only when necessary
- Extract logic into custom hooks

### Styling

- **Tailwind CSS** for styling
- Use **shadcn/ui** components when available
- Follow existing patterns in the codebase

### File Naming

- Components: `PascalCase.tsx` (e.g., `TaskCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useTaskList.ts`)
- Utilities: `kebab-case.ts` (e.g., `date-utils.ts`)
- Types: `PascalCase.ts` or inline

### Imports

Order imports consistently:

```typescript
// 1. React/Next.js
import { useState } from "react";
import { useRouter } from "next/navigation";

// 2. External libraries
import { format } from "date-fns";
import { z } from "zod";

// 3. Internal - infrastructure
import { trpc } from "@/infrastructure/trpc/client";

// 4. Internal - features
import { TaskCard } from "@/features/tasks/components";

// 5. Internal - shared
import { Button } from "@/shared/components/ui";

// 6. Types
import type { Task } from "@prisma/client";
```

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/features/tasks/__tests__/task-service.test.ts
```

### Test Structure

```typescript
// src/features/tasks/__tests__/task-service.test.ts
import { describe, it, expect, vi } from "vitest";
import { createTask } from "../server/task-service";

describe("TaskService", () => {
  describe("createTask", () => {
    it("should create a task with valid input", async () => {
      // Arrange
      const input = { title: "Test Task" };

      // Act
      const result = await createTask(input);

      // Assert
      expect(result.title).toBe("Test Task");
    });
  });
});
```

### What to Test

- **Unit tests**: Business logic, utilities, hooks
- **Integration tests**: API routes, database operations
- **Component tests**: Complex interactive components

---

## Submitting Changes

### Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run checks locally**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

3. **Create PR**
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes

4. **Review process**
   - Address feedback promptly
   - Keep PR scope focused
   - Squash commits if requested

### PR Template

```markdown
## Summary
Brief description of changes

## Related Issues
Closes #123

## Changes
- Change 1
- Change 2

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed

## Screenshots (if UI changes)
[Add screenshots]
```

---

## Issue Guidelines

### Bug Reports

Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots or error logs

### Feature Requests

Include:
- Problem statement
- Proposed solution
- Alternatives considered
- Mockups (if applicable)

### Labels

- `bug` - Something isn't working
- `feature` - New feature request
- `docs` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: P0/P1/P2` - Priority level

---

## Development Tips

### Useful Commands

```bash
# Generate Prisma client after schema changes
pnpm prisma generate

# Open Prisma Studio (database GUI)
pnpm prisma studio

# Format code
pnpm format

# Lint and fix
pnpm lint:fix

# Type check
pnpm typecheck
```

### VS Code Extensions

Recommended:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- Error Lens

### Debugging

- Use React DevTools for component debugging
- Use `console.log` sparingly (remove before commit)
- Use VS Code debugger with `.vscode/launch.json`

---

## Questions?

- Open a [GitHub Discussion](https://github.com/ralphchrg/dpm-calendar/discussions)
- Check existing [Issues](https://github.com/ralphchrg/dpm-calendar/issues)
- Review [Architecture Decisions](./DECISIONS.md)

---

Thank you for contributing to DPM Calendar!
