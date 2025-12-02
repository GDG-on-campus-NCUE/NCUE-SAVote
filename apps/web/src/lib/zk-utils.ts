export const uuidToBigInt = (uuid: string): bigint => {
    // Remove dashes and convert to BigInt
    const hex = uuid.replace(/-/g, '');
    // Ensure valid hex string
    if (!/^[0-9a-f]{32}$/i.test(hex)) {
        throw new Error(`Invalid UUID format: ${uuid}`);
    }
    return BigInt('0x' + hex);
};

export const bigIntToUuid = (bi: bigint): string => {
    const hex = bi.toString(16).padStart(32, '0');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
