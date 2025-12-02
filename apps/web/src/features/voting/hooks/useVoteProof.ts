import { useState, useEffect, useRef } from 'react';

interface ProofResult {
    proof: any;
    publicSignals: string[];
}

interface UseVoteProofReturn {
    generateProof: (input: any) => Promise<ProofResult>;
    isLoading: boolean;
    error: string | null;
}

export const useVoteProof = (): UseVoteProofReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(new URL('../workers/proof.worker.ts', import.meta.url), {
            type: 'module',
        });

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const generateProof = (input: any): Promise<ProofResult> => {
        return new Promise((resolve, reject) => {
            if (!workerRef.current) {
                reject(new Error('Worker not initialized'));
                return;
            }

            setIsLoading(true);
            setError(null);

            const handleMessage = (e: MessageEvent) => {
                const { type, proof, publicSignals, error: workerError } = e.data;

                if (type === 'SUCCESS') {
                    setIsLoading(false);
                    resolve({ proof, publicSignals });
                } else if (type === 'ERROR') {
                    setIsLoading(false);
                    setError(workerError);
                    reject(new Error(workerError));
                }
                
                // Clean up listener to avoid leaks/duplicates for this promise
                workerRef.current?.removeEventListener('message', handleMessage);
            };

            workerRef.current.addEventListener('message', handleMessage);

            // Send data to worker
            workerRef.current.postMessage({
                input,
                wasmPath: '/zk/vote.wasm',
                zkeyPath: '/zk/vote_final.zkey',
            });
        });
    };

    return { generateProof, isLoading, error };
};
