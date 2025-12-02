import * as snarkjs from 'snarkjs';

self.onmessage = async (e: MessageEvent) => {
    const { input, wasmPath, zkeyPath } = e.data;

    try {
        console.log('Worker: Starting proof generation...');
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        console.log('Worker: Proof generated successfully');
        self.postMessage({ type: 'SUCCESS', proof, publicSignals });
    } catch (error) {
        console.error('Worker: Proof generation failed', error);
        self.postMessage({ type: 'ERROR', error: (error as Error).message });
    }
};
