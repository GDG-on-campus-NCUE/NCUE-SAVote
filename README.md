# NCUESA Decentralized Anonymous Voting System (NCUESA 學生會選舉系統)

A secure, anonymous, and verifiable electronic voting system based on **Groth16 Zero-Knowledge Proofs (ZKP)**. This system ensures voter privacy while maintaining public verifiability of the election results.

---

## 📖 Overview

The NCUESA Voting System is designed to solve the core challenges of online voting: **Anonymity** and **Verifiability**. By leveraging Zero-Knowledge Proofs, the system allows students to prove their eligibility to vote without revealing their identity or their specific vote choice to the server.

### Key Features
*   **SAML SSO Integration**: Seamless login using existing school credentials.
*   **Zero-Knowledge Privacy**: Uses Groth16 zk-SNARKs to hide voter choices.
*   **Client-Side Proof Generation**: Proofs are generated in the user's browser (via Web Workers), ensuring the server never sees the raw vote.
*   **Nullifier Mechanism**: Prevents double voting without linking votes to user identities.
*   **Verifiable Results**: Anyone can verify the validity of the votes using the public proofs and the election's verification key.
*   **Merkle Tree Eligibility**: Efficiently manages eligible voter lists using Merkle Trees.

---

## 🏗 Architecture

The project is structured as a **Monorepo** using **Turborepo**.

### Directory Structure
```text
/
├── apps/
│   ├── web/                 # Frontend (React + Vite + TailwindCSS)
│   │   ├── src/features/voting/workers  # ZK Proof Generation Web Worker
│   │   └── ...
│   ├── api/                 # Backend (NestJS + Prisma + PostgreSQL)
│   └── admin/               # (Planned) Admin Dashboard
├── packages/
│   ├── circuits/            # Circom Circuits & ZK Scripts
│   ├── shared-types/        # Shared TypeScript Interfaces
│   └── crypto-lib/          # (Planned) Shared Crypto Utilities
├── tools/                   # DevOps & CI/CD tools
└── ...
```

### Tech Stack
*   **Core (ZKP)**: Circom 2.0, SnarkJS, Groth16, BN128 Curve.
*   **Backend**: NestJS, PostgreSQL, Prisma ORM, Redis (Session).
*   **Frontend**: React 18, Vite, Zustand, Web Crypto API.
*   **Infrastructure**: Docker, Nginx (Planned).

---

## 🔒 Security & Privacy Flow

The system employs a rigorous privacy model:

1.  **Identity Setup**:
    *   Upon first login (SAML), a random **Nullifier Secret** is generated in the user's browser.
    *   This secret is stored **ONLY** in the browser's LocalStorage (encrypted). It is **NEVER** sent to the server.

2.  **Eligibility Check**:
    *   The server maintains a **Merkle Tree** of eligible voters (e.g., hashed Student IDs).
    *   The user requests a **Merkle Proof** (sibling path) from the server to prove they are in the tree.

3.  **Vote Submission**:
    *   The user selects a candidate.
    *   The browser (Web Worker) inputs the `Nullifier Secret`, `Merkle Proof`, and `Vote Choice` into the ZK Circuit.
    *   **Output**: A ZK Proof and a deterministic `Nullifier Hash`.
    *   The Proof proves: "I know a secret valid in the Merkle Tree, and I haven't voted in this election yet (Nullifier Hash is unique)."
    *   The backend verifies the Proof and checks if the `Nullifier Hash` has been used. If valid, the vote is recorded.

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js**: v20+ (LTS)
*   **pnpm**: v9+
*   **Docker**: For PostgreSQL and Redis.
*   **OS**: Windows (preferred for dev scripts), Linux, macOS.

### Quick Start

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Start Development Environment**:
    We provide a helper script to set up the database, generate keys, and start the app.
    ```cmd
    start-dev.bat
    ```
    *This will start PostgreSQL (Docker), run Prisma migrations, and launch the API (localhost:3000) and Web (localhost:5173).*

3.  **Manual Start (Alternative)**:
    ```bash
    # 1. Start Database
    docker-compose up -d
    
    # 2. Run Migrations
    cd apps/api
    npx prisma migrate deploy
    cd ../..
    
    # 3. Start Apps
    pnpm dev
    ```

---

## 🗺 Development Roadmap

Based on the latest analysis, the following steps are planned:

### Phase 1: Core ZK Infrastructure (Backend)
- [ ] **Merkle Tree Service**: Implement logic to build/maintain the Merkle Tree from `EligibleVoters`.
- [ ] **Merkle Proof Endpoint**: Add `GET /elections/:id/merkle-proof` to serve the sibling path to the client.
- [ ] **Nullifier Enforcement**: Ensure `submitVote` strictly enforces unique Nullifier Hashes.

### Phase 2: Client-Side Identity & ZK Integration
- [ ] **Nullifier Secret Management**: Implement the frontend logic (Web Crypto API) to generate and securely store the `Nullifier Secret` in LocalStorage on first login.
- [ ] **Connect ZK Worker**: Hook up the existing `proof.worker.ts` to the voting UI. Fetch the Merkle Proof from the API and pass it to the worker.
- [ ] **Vote Submission**: Update the frontend to submit the generated Proof and Public Signals to `/votes/submit`.

### Phase 3: Verification & Auditing
- [ ] **Receipt Generation**: Allow users to download their `Nullifier Hash` as a receipt.
- [ ] **Verification Portal**: Create a page where users can check if their `Nullifier Hash` is in the tally.
- [ ] **Admin Audit**: Tools to export all proofs for external verification.

---

## 📚 API Reference

### User & Auth
*   `POST /users/verify`: Verify SAML Identity.
*   `GET /users/me`: Get current user info.

### Elections
*   `GET /elections`: List all elections.
*   `GET /elections/:id`: Get election details.
*   `POST /elections`: Create election (Admin).
*   `POST /elections/:id/candidates`: Add candidate (Admin).

### Votes
*   `POST /votes/submit`: Submit a ZK Vote.
    *   Body: `{ proof, publicSignals: [nullifierHash, voteHash, root, ...] }`
*   `GET /votes/:eid/result`: Get election results.
*   `GET /votes/:eid/logs`: Get audit logs.

---

## 🗄 Database Schema

*   **Users**: SAML identity data (hashed Student ID, class).
*   **Sessions**: JWT refresh tokens.
*   **Elections**: Election config, start/end times, `MerkleRootHash`.
*   **EligibleVoters**: List of students allowed to vote (used to build the Merkle Tree).
*   **Candidates**: Candidates for each election.
*   **Votes**: Stores the **ZK Proof** and **Nullifier**. *Does not link to User ID.*

---

*This project is maintained by the NCUESA System Development Team.*
