# SAVote Development Guidelines

Last updated: 2026-01-18

## Active Technologies

- **Frontend:** React 18, Vite, TailwindCSS
- **Backend:** NestJS, Prisma, OIDC
- **ZK:** Circom 2.1, SnarkJS (Groth16), Poseidon

## Project Structure

```text
/
├── apps/
│   ├── web/                 # Frontend (React + Web Worker)
│   ├── api/                 # Backend (NestJS + Prisma)
├── packages/
│   ├── circuits/            # ZK Circuits (.circom)
│   ├── shared-types/        # Shared Types
│   └── crypto-lib/          # Shared Crypto Utils
├── scripts/                 # Deploy scripts
└── docs/                    # Architecture & Plans
```

## Recent Changes

- **OIDC Migration:** Replaced SAML with NCUE OIDC.
- **ZK Integration:** Implemented `Poseidon(studentIdHash, secret)` commitment scheme.
- **Database:** Added `identityCommitment` to `EligibleVoter`.
- **Frontend:** Fixed Proof Generation in `VotingBooth` and `KeySetupPage`.