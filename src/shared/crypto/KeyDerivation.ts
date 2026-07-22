import { decrypt } from './CryptoService'

const PBKDF2_ITERATIONS = 100_000
const SALT_LENGTH = 16
const KEY_LENGTH = 256

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

export interface DerivedKey {
  key: CryptoKey
  salt: string
}

export async function deriveKey(
  pin: string,
  existingSalt?: string
): Promise<DerivedKey> {
  const salt = existingSalt
    ? new Uint8Array(base64ToBuf(existingSalt))
    : crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )

  return { key, salt: bufToBase64(salt.buffer) }
}

export async function verifyPinAgainstStored(
  pin: string,
  storedSalt: string,
  storedTestCiphertext: string,
  storedIv: string,
  storedAuthTag: string
): Promise<boolean> {
  try {
    const { key } = await deriveKey(pin, storedSalt)
    const decrypted = await decrypt(
      {
        iv: storedIv,
        ciphertext: storedTestCiphertext,
        authTag: storedAuthTag,
      },
      key
    )
    return decrypted === 'staticquo-vault-ok'
  } catch {
    return false
  }
}
