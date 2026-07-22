function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

export interface MeshIdentity {
  publicKey: string
  privateKey: string
  fingerprint: string
}

function hexFromBuf(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function generateEd25519Keypair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  ) as Promise<CryptoKeyPair>
}

export async function createMeshIdentity(): Promise<MeshIdentity> {
  const keypair = await generateEd25519Keypair()

  const rawPublic = await crypto.subtle.exportKey('raw', keypair.publicKey)
  const rawPrivate = await crypto.subtle.exportKey('pkcs8', keypair.privateKey)

  const publicB64 = bufToBase64(rawPublic)
  const privateB64 = bufToBase64(rawPrivate)
  const fingerprint = hexFromBuf(rawPublic).slice(0, 16)

  return { publicKey: publicB64, privateKey: privateB64, fingerprint }
}

export function getStoredIdentity(): MeshIdentity | null {
  try {
    const stored = localStorage.getItem('staticquo-mesh-identity')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function storeIdentity(identity: MeshIdentity): void {
  localStorage.setItem('staticquo-mesh-identity', JSON.stringify(identity))
}

export async function getOrCreateIdentity(): Promise<MeshIdentity> {
  const existing = getStoredIdentity()
  if (existing) return existing
  const identity = await createMeshIdentity()
  storeIdentity(identity)
  return identity
}
