import * as snarkjs from 'snarkjs';
// @ts-ignore
import { buildPoseidon } from 'circomlibjs';
import verificationKey from './verification_key.json';

export interface ProofInput {
    root: string;
    electionId: string;
    vote: string;
    secret: string;
    pathIndices: number[];
    siblings: string[];
}

export interface FullProof {
    proof: any;
    publicSignals: string[];
}

export async function verifyVoteProof(proof: any, publicSignals: string[]): Promise<boolean> {
    try {
        const res = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
        return res;
    } catch (error) {
        console.error('Proof verification failed:', error);
        return false;
    }
}

export async function generateNullifier(secret: bigint, electionId: bigint): Promise<string> {
    const poseidon = await buildPoseidon();
    const hash = poseidon([secret, electionId]);
    return poseidon.F.toString(hash);
}

export async function generateVoteProof(
    input: ProofInput, 
    wasmPath: string, 
    zkeyPath: string
): Promise<FullProof> {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
    return { proof, publicSignals };
}
