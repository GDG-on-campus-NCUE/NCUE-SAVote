# SAVote Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-26

## Active Technologies

- React 18
- Vite
- NestJS
- PostgreSQL
- Circom (ZKP)
- SnarkJS

## Project Structure

```text
/
├── apps/
│   ├── web/                 # Frontend (React)
│   ├── api/                 # Backend (NestJS)
│   └── admin/               # Admin Panel
├── packages/
│   ├── circuits/            # ZK Circuits
│   ├── shared-types/        # Shared TypeScript types
│   └── crypto-lib/          # Crypto utilities
├── .specify/                # Spec-Driven Development artifacts
│   ├── memory/
│   ├── scripts/
│   ├── specs/
│   └── templates/
├── PLAN.md                  # Master Plan
└── README.md
```

## Commands

- `/speckit.constitution`: Create or update project governing principles.
- `/speckit.specify`: Define what you want to build.
- `/speckit.plan`: Create technical implementation plans.
- `/speckit.tasks`: Generate actionable task lists.
- `/speckit.implement`: Execute tasks.

## Code Style

- TypeScript
- ESLint
- Prettier

## Recent Changes

- Initialized Spec-Driven Development structure.
- Created Master Plan (PLAN.md).

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
