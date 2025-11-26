# NCUESA Decentralized Voting System (SAVote) Constitution

## Core Principles

### I. Privacy by Design (ZKP First)
The system's primary mandate is to protect voter anonymity. We use Zero-Knowledge Proofs (Groth16) to decouple identity from votes. No database record shall ever link a Student ID to a specific ballot choice. If a feature compromises anonymity, it must be rejected or redesigned.

### II. Public Verifiability
The election process must be transparent. Anyone should be able to cryptographically verify that:
1. Their vote was counted.
2. All counted votes are valid.
3. The final tally is mathematically correct.
The system must provide public artifacts (proofs, verification keys) to enable this auditing without permission.

### III. One Person, One Vote (Integrity)
We strictly enforce uniqueness using Nullifiers. The system must prevent double voting at the protocol level (Smart Contract or ZK Circuit logic) and the database level. A valid vote requires a valid ZK proof of eligibility and a unique nullifier for the specific election.

### IV. Accessibility & Simplicity
Voting should be as easy as a Google Form. Complex cryptography must be abstracted away from the user. The UI/UX must be mobile-first, intuitive, and performant (generating proofs in < 5 seconds on average devices).

### V. Code Quality & Security
Security is non-negotiable.
- **TDD:** Core logic (especially Circuits and Auth) must be test-driven.
- **Auditable:** All code is open source.
- **Type Safety:** Full stack TypeScript with strict typing.
- **Secrets:** User secrets (Nullifier Secrets) never leave the client device in plaintext.

## Technology Constraints

### Tech Stack
- **Frontend:** React 18, Vite, TailwindCSS
- **Backend:** NestJS, PostgreSQL, Prisma
- **Cryptography:** Circom, SnarkJS (Groth16)
- **Infrastructure:** Docker, Nginx

### Monorepo Structure
All code resides in a single repository to ensure consistency between ZK circuits, frontend types, and backend validation logic. Shared libraries (`packages/`) must be used to prevent logic duplication.

## Development Workflow

### Git & Versioning
- **Branching:** Gitflow (main, develop, feature/*, fix/*).
- **Commits:** Conventional Commits (feat, fix, docs, chore, test).
- **Reviews:** All PRs require at least one peer review. CI must pass before merge.

### Documentation
- **Spec-Driven:** All major features start with a Specification (`/speckit.specify`) and Plan (`/speckit.plan`) before implementation.
- **Living Docs:** `README.md` and `COPILOT.md` must be kept up-to-date with architectural changes.

## Governance

### Amendments
This Constitution is the supreme design document. Amendments require a Pull Request with a clear rationale and must be approved by the project maintainers.

### Versioning
- **Major:** Fundamental change to privacy or verification model.
- **Minor:** New principles or significant tech stack shifts.
- **Patch:** Clarifications or wording changes.

**Version**: 1.0.0 | **Ratified**: 2025-11-26 | **Last Amended**: 2025-11-26
