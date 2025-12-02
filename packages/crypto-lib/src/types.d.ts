declare module 'snarkjs' {
    export const groth16: {
        fullProve(input: any, wasmFile: string, zkeyFile: string): Promise<{ proof: any; publicSignals: any[] }>;
        verify(vKey: any, publicSignals: any[], proof: any): Promise<boolean>;
        setup(r1cs: string, ptau: string, zkey: string): Promise<any>;
    };
    export const zkey: {
        contribute(zkeyOld: string, zkeyNew: string, name: string, entropy: string): Promise<any>;
        exportVerificationKey(zkey: string): Promise<any>;
    };
}

declare module 'circomlibjs' {
    export function buildPoseidon(): Promise<any>;
}
