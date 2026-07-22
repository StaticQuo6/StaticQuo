export interface MeshEnvelope {
  id: string
  src: string
  dst: string
  ttl: number
  payload: string
  iv: string
  authTag: string
  timestamp: number
}

export function createEnvelope(
  src: string,
  dst: string,
  payload: string,
  key: CryptoKey
): Promise<MeshEnvelope> {
  return encryptEnvelope(src, dst, payload, key)
}

async function encryptEnvelope(
  src: string,
  dst: string,
  payload: string,
  key: CryptoKey
): Promise<MeshEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify({ payload, src }))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  const ciphertext = new Uint8Array(encrypted.slice(0, encrypted.byteLength - 16))
  const authTag = new Uint8Array(encrypted.slice(encrypted.byteLength - 16))

  return {
    id: crypto.randomUUID(),
    src,
    dst,
    ttl: 5,
    payload: btoa(String.fromCharCode(...ciphertext)),
    iv: btoa(String.fromCharCode(...iv)),
    authTag: btoa(String.fromCharCode(...authTag)),
    timestamp: Date.now(),
  }
}

export async function decryptEnvelope(
  envelope: MeshEnvelope,
  key: CryptoKey
): Promise<{ payload: string; src: string } | null> {
  try {
    const iv = Uint8Array.from(atob(envelope.iv), (c) => c.charCodeAt(0))
    const ciphertext = Uint8Array.from(atob(envelope.payload), (c) => c.charCodeAt(0))
    const authTag = Uint8Array.from(atob(envelope.authTag), (c) => c.charCodeAt(0))

    const combined = new Uint8Array(ciphertext.length + authTag.length)
    combined.set(ciphertext, 0)
    combined.set(authTag, ciphertext.length)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      combined
    )

    const parsed = JSON.parse(new TextDecoder().decode(decrypted))
    return { payload: parsed.payload, src: parsed.src }
  } catch {
    return null
  }
}

export function envelopeToBytes(envelope: MeshEnvelope): Uint8Array {
  const json = JSON.stringify(envelope)
  return new TextEncoder().encode(json)
}

export function envelopeFromBytes(bytes: Uint8Array): MeshEnvelope | null {
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}
