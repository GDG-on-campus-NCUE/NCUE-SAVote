import * as snarkjs from 'snarkjs';
// @ts-ignore
import { buildPoseidon } from 'circomlibjs';
import * as fs from 'fs';
import * as path from 'path';

// Load verification key
// We expect it to be in the same directory (copied by build script)
let verificationKey: any;
try {
    const localPath = path.join(__dirname, 'verification_key.json');
    if (fs.existsSync(localPath)) {
        verificationKey = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
    }
} catch (e) {
    console.warn('Verification key not found in crypto-lib. Verification functions might fail if key is not provided explicitly.');
}

export interface ProofInput {
    root: string;
    electionId: string;
    vote: string;
    nullifierHash: string;
    secret: string;
    studentIdHash: string;
    pathIndices: number[];
    siblings: string[];
}

export interface FullProof {
    proof: any;
    publicSignals: string[];
}

// Cache Poseidon instance
let poseidon: any = null;

export async function getPoseidon() {
    if (!poseidon) {
        poseidon = await buildPoseidon();
    }
    return poseidon;
}

export async function poseidonHash(inputs: (bigint | string | number)[]): Promise<string> {
    const p = await getPoseidon();
    const hash = p(inputs);
    return p.F.toString(hash);
}

export async function generateIdentityCommitment(studentIdHash: string, secret: string): Promise<string> {
    // commitment = Poseidon(studentIdHash, secret)
    return poseidonHash([studentIdHash, secret]);
}

export async function generateNullifierHash(secret: string, electionId: string): Promise<string> {
    // nullifier = Poseidon(secret, electionId)
    return poseidonHash([secret, electionId]);
}

export async function verifyVoteProof(proof: any, publicSignals: string[], vKey?: any): Promise<boolean> {
    const key = vKey || verificationKey;
    if (!key) {
        throw new Error('Verification key not found');
    }
    try {
        const res = await snarkjs.groth16.verify(key, publicSignals, proof);
        return res;
    } catch (error) {
        console.error('Proof verification failed:', error);
        return false;
    }
}

/**
 * Generates a full proof.
 * @param input The inputs for the circuit
 * @param wasmPath Path to the .wasm file
 * @param zkeyPath Path to the .zkey file
 */
export async function generateVoteProof(
    input: ProofInput, 
    wasmPath: string, 
    zkeyPath: string
): Promise<FullProof> {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
    return { proof, publicSignals };
}