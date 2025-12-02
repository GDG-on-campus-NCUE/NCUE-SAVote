declare module 'circom_tester' {
    export function wasm(path: string): Promise<any>;
}

declare module 'circomlibjs' {
    export function buildPoseidon(): Promise<any>;
}
