/// <reference types="vite/client" />
/// <reference types="vitest" />

declare module 'snarkjs';

declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<any>;
  export function buildEddsa(): Promise<any>;
  export function buildBabyJub(): Promise<any>;
}

