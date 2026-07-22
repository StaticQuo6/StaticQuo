import { decrypt, encrypt } from '../shared/crypto/CryptoService'
import { deriveKey } from '../shared/crypto/KeyDerivation'
import { useVaultStore } from './useVaultStore'
import { getVaultDb } from '../shared/db/DatabaseService'
import { decodeShardPayload, isShardComplete, type ShardPayload } from '../shared/shard/ShardProtocol'

interface PendingReassembly {
  recordId: string
  fragments: Map<number, ShardPayload>
  total: number
  startedAt: number
}

class ShardCollectorImpl {
  private pending = new Map<string, PendingReassembly>()

  private readonly COLLECTION_TIMEOUT = 30 * 60 * 1000

  ingest(rawPayload: string): 'collected' | 'waiting' | 'invalid' {
    const payload = decodeShardPayload(rawPayload)
    if (!payload) return 'invalid'

    const key = payload.recordId
    let pending = this.pending.get(key)

    if (!pending) {
      pending = {
        recordId: key,
        fragments: new Map(),
        total: payload.totalShards,
        startedAt: Date.now(),
      }
      this.pending.set(key, pending)
    }

    pending.fragments.set(payload.shardIndex, payload)

    if (isShardComplete(pending.fragments, pending.total)) {
      this.reassemble(key)
      return 'collected'
    }

    return 'waiting'
  }

  private async reassemble(recordId: string): Promise<void> {
    const pending = this.pending.get(recordId)
    if (!pending) return

    const vaultPin = useVaultStore.getState().vaultPin
    if (!vaultPin) return

    try {
      const ordered: ShardPayload[] = []
      for (let i = 0; i < pending.total; i++) {
        const fragment = pending.fragments.get(i)
        if (fragment) ordered.push(fragment)
      }

      if (ordered.length < 3) return

      const reassembled: string[] = []
      for (const frag of ordered) {
        const { key } = await deriveKey(vaultPin + recordId + frag.nonce, frag.nonce)
        const parsed = JSON.parse(frag.data)
        const decrypted = await decrypt(
          {
            iv: parsed.iv,
            ciphertext: parsed.ciphertext,
            authTag: parsed.authTag,
          },
          key
        )
        const chunkData = JSON.parse(decrypted)
        reassembled[chunkData.index] = atob(chunkData.data)
      }

      const plaintext = reassembled.join('')
      if (plaintext) {
        const { key } = await deriveKey(vaultPin)
        const encrypted = await encrypt(plaintext, key)
        const db = getVaultDb()
        if (db) {
          await db.run(
            `INSERT OR REPLACE INTO vault_records (id, type, encrypted_data, iv, auth_tag, shard_status, created_at)
             VALUES (?, ?, ?, ?, ?, 'local', ?)`,
            [recordId, 'incident', encrypted.ciphertext, encrypted.iv, encrypted.authTag, Date.now()]
          )
        }
        useVaultStore.getState().addRecord({
          id: recordId,
          type: 'incident',
          encryptedData: encrypted.ciphertext,
          createdAt: Date.now(),
          shardStatus: 'local',
        })
      }
    } catch (e) {
      console.error('Shard reassembly failed:', e)
    }

    this.pending.delete(recordId)
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, pending] of this.pending) {
      if (now - pending.startedAt > this.COLLECTION_TIMEOUT) {
        this.pending.delete(key)
      }
    }
  }
}

export const shardCollector = new ShardCollectorImpl()
