import { buildPoseidon } from 'circomlibjs';
/**
 * 產生符合 ZK 電路要求的隨機 Secret (私鑰)
 */
export const generateZkSecret = (): string => {

    const array = new Uint8Array(31); // 31 bytes 避免超過 p
    window.crypto.getRandomValues(array);
    //console.log("Step2:ZK Secret Start " + array);
    const hex = '0x' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    //console.log("[ZK] Generated Hex Secret:","color: #ff00ff;", hex);
    return hex;
};

/**
 * 計算 Commitment (公鑰)
 */
export const calculateCommitment = async (studentIdHash: string, secret: string): Promise<string> => {
    //console.log("Step3: Poseidon");
    const poseidon = await buildPoseidon();
    const idBI = BigInt(studentIdHash.startsWith("0x") ? studentIdHash : "0x" + studentIdHash);
    const secretBI = BigInt(secret.startsWith("0x") ? secret : "0x" + secret);

    //console.log("STU_ID_HASH:",studentIdHash);
    //console.log("SECRET:",secret);

    const hash = poseidon([idBI, secretBI]);
    //console.log(hash,idBI,secretBI);
    return poseidon.F.toString(hash);
};