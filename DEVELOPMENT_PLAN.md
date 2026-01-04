# Development Plan: SAVote (Secure Anonymous Voting)

This document outlines the detailed development steps to complete the NCUESA Anonymous Voting System, ensuring alignment with the architecture defined in `README.md` (formerly `Docs.md`).

## Phase 1: Core ZK Infrastructure (Backend)

**Goal:** Enable the backend to support Merkle Tree-based eligibility verification and ZK proof submission.

### 1.1 Merkle Tree Service
*   **Objective:** Build a Merkle Tree from the list of `EligibleVoters` for a specific election.
*   **Implementation:**
    *   Create `MerkleTreeService` in `apps/api/src/elections`.
    *   Use `merkletreejs` library.
    *   **Leaves:** `Hash(studentId)` (or `Hash(studentId + salt)` if salt is managed securely). *Decision needed: How to salt the student ID to prevent rainbow table attacks if the tree is public.*
    *   **Storage:** Store the `root` in the `Election` table.
    *   **Caching:** Cache the tree or leaves in Redis for performance.

### 1.2 Merkle Proof Endpoint
*   **Objective:** Allow a logged-in user to retrieve their specific Merkle Proof (sibling path) to prove eligibility without revealing their identity during the vote.
*   **Endpoint:** `GET /elections/:id/merkle-proof`
*   **Access Control:** Protected by `JwtAuthGuard`. User must be in the `EligibleVoter` list.
*   **Logic:**
    1.  Get `user.studentId` from JWT.
    2.  Find the leaf index for this student in the election's Merkle Tree.
    3.  Generate the proof (path indices and siblings).
    4.  Return: `{ root, pathIndices, siblings }`.

### 1.3 Nullifier Enforcement
*   **Objective:** Prevent double voting.
*   **Logic:**
    *   In `VotesController.submitVote`, check if a vote with the same `nullifierHash` already exists for this `electionId`.
    *   This is already partially implemented but needs to be rigorously tested with the circuit output.

## Phase 2: Client-Side Identity & ZK Integration

**Goal:** Enable the frontend to generate ZK proofs using a locally stored secret.

### 2.1 Nullifier Secret Management
*   **Objective:** Generate and store a persistent secret for the user on their device.
*   **Implementation:**
    *   **First Login:** Check `localStorage` for `savote_nullifier_secret`.
    *   **If Missing:**
        *   Generate 32-byte random entropy using `window.crypto.getRandomValues`.
        *   Prompt user to "Setup Identity" (save secret).
        *   Store in `localStorage` (consider encryption with a user pin/password for extra security, though `Docs.md` specifies `localStorage` for simplicity).
    *   **Recovery:** Provide a UI to "Restore Identity" by pasting the secret (for new devices/cleared cache).

### 2.2 ZK Worker Integration
*   **Objective:** Connect the React UI to the ZK Web Worker.
*   **Implementation:**
    *   Update `apps/web/src/features/voting/hooks/useVoteProof.ts`.
    *   **Flow:**
        1.  Call `GET /elections/:id/merkle-proof` to get `siblings` and `pathIndices`.
        2.  Get `nullifier_secret` from `localStorage`.
        3.  Construct Circuit Input:
            ```json
            {
                "root": "...",
                "electionId": "...",
                "vote": "candidate_index",
                "secret": "nullifier_secret",
                "pathIndices": [...],
                "siblings": [...]
            }
            ```
        4.  Send to `proof.worker.ts`.
        5.  Receive `proof` and `publicSignals`.

### 2.3 Vote Submission UI
*   **Objective:** Submit the proof to the backend.
*   **Implementation:**
    *   Call `POST /votes/submit` with the worker output.
    *   Handle errors (e.g., "Already voted", "Invalid Proof").
    *   Show "Vote Receipt" (Nullifier Hash) upon success.

## Phase 3: Verification & Auditing

**Goal:** Provide tools for users and admins to verify the election integrity.

### 3.1 Receipt & User Verification
*   **Objective:** Allow users to check if their vote was counted.
*   **UI:** "Verification Center" page.
*   **Input:** User pastes their `Nullifier Hash`.
*   **Backend:** `GET /votes/:electionId/verify/:nullifierHash`.
*   **Response:** `Found` / `Not Found`.

### 3.2 Public Audit
*   **Objective:** Allow independent verification of the entire election.
*   **Endpoint:** `GET /votes/:electionId/logs` (Already exists).
*   **Tooling:** Provide a standalone script (or frontend page) that:
    1.  Downloads all proofs and public signals.
    2.  Verifies every proof against the `verification_key.json`.
    3.  Re-calculates the tally from the valid proofs.

## Phase 4: Security Hardening (Critical)

*   **Review Identity Commitment:** Re-evaluate if using `Hash(StudentId)` as the Merkle Leaf is secure enough.
    *   *Risk:* If the Merkle Tree is public, and Student IDs are predictable/known, an attacker might be able to deduce which leaf corresponds to which student, potentially compromising anonymity if they can also correlate the "path" used in the proof (though the path is private input, the root is public).
    *   *Mitigation:* Ensure `pathIndices` and `siblings` are strictly private inputs to the circuit and NOT sent in the `publicSignals`.
    *   *Advanced Mitigation:* Move to a "Commitment Scheme" where the user registers a `Hash(RandomSecret)` (Identity Commitment) to the tree, instead of using Student ID directly. This would require an extra "Voter Registration" phase.

## Technical Tasks Breakdown

1.  [Backend] Implement `MerkleTreeService` and `ElectionsController.getMerkleProof`.
2.  [Frontend] Implement `NullifierSecretContext` to manage the local secret.
3.  [Frontend] Update `VotingPage` to fetch proof params and trigger the worker.
4.  [Frontend] Build "Vote Success" page with Receipt download.
5.  [Backend] Add integration tests for the full ZK flow.
