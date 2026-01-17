# SAVote Project Plan

## 1. Roadmap & Sprints

**Status**: Phase 3 Completed (OIDC & ZK Integration)

### Phase 0: Foundation
- [x] Monorepo Setup.
- [x] Docker Infrastructure.
- [x] CI/CD Pipelines.

### Phase 1: ZK Core
- [x] `vote.circom` Implementation.
- [x] Trusted Setup (Powers of Tau).
- [x] `crypto-lib` Wrapper (Poseidon).

### Phase 2: Backend & Auth
- [x] **Auth Migration**: NCUE OIDC Integration.
- [x] Election CRUD & Snapshot.
- [x] **Core**: Vote Submission (`/votes/submit`) & Proof Verification.
- [x] Double Voting Prevention (`nullifierHash`).

### Phase 3: Frontend & UI
- [x] Login & OIDC Flow.
- [x] Key Setup & Commitment Registration.
- [x] **Core**: Client-side Proof Generation (Web Worker).
- [x] Voting Booth UI.

### Phase 4: Audit & Deploy
- [ ] E2E System Testing.
- [ ] Security Audit.
- [ ] Production Deployment (Script Ready).

---

## 2. Risk Management

| Risk | Mitigation |
| :--- | :--- |
| **Private Key Loss** | User must backup secret manually. No recovery after election starts. |
| **Double Voting** | ZK Nullifier + DB Unique Constraint. |
| **Frontend Tampering** | HTTPS + SRI. |