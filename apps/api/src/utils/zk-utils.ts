export const uuidToBigInt = (uuid: string): bigint => {
  const hex = uuid.replace(/-/g, '');
  return BigInt('0x' + hex);
};

export const bigIntToUuid = (bi: string | bigint): string => {
  const hex = BigInt(bi).toString(16).padStart(32, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
