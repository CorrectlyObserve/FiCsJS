const textEncoder: TextEncoder = new TextEncoder()

export const getByteLength = (str: string): number => textEncoder.encode(str).byteLength
