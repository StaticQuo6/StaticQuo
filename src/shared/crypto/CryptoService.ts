export interface EncryptedPayload {
  iv: string
  ciphertext: string
  authTag: string
}

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  const ciphertext = encrypted.slice(0, encrypted.byteLength - 16)
  const authTag = encrypted.slice(encrypted.byteLength - 16)

  return {
    iv: bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ciphertext),
    authTag: bufToBase64(authTag),
  }
}

export async function decrypt(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const iv = new Uint8Array(base64ToBuf(payload.iv))
  const ciphertext = new Uint8Array(base64ToBuf(payload.ciphertext))
  const authTag = new Uint8Array(base64ToBuf(payload.authTag))

  const combined = new Uint8Array(ciphertext.length + authTag.length)
  combined.set(ciphertext, 0)
  combined.set(authTag, ciphertext.length)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    combined
  )

  return new TextDecoder().decode(decrypted)
}
