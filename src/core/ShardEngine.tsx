import { useState } from 'react'
import { getVaultDb } from '../shared/db/DatabaseService'
import { useVaultStore } from './useVaultStore'
import { deriveKey } from '../shared/crypto/KeyDerivation'
import { decrypt, encrypt } from '../shared/crypto/CryptoService'

export function ShardEngine({ recordId }: { recordId: string }) {
  const { vaultPin } = useVaultStore()
  const [sharding, setSharding] = useState(false)

  const handleShard = async () => {
    if (!vaultPin) return
    setSharding(true)

    try {
      const db = getVaultDb()
      if (!db) return

      const result = await db.query(
        'SELECT encrypted_data, iv, auth_tag FROM vault_records WHERE id = ?',
        [recordId]
      )
      if (!result.values || result.values.length === 0) return

      const row = result.values[0] as {
        encrypted_data: string
        iv: string
        auth_tag: string
      }

      const { key } = await deriveKey(vaultPin)
      const plaintext = await decrypt(
        { iv: row.iv, ciphertext: row.encrypted_data, authTag: row.auth_tag },
        key
      )

      const numChunks = 5
      const chunkSize = Math.ceil(plaintext.length / numChunks)
      const fragments: { index: number; total: number; data: string }[] = []

      for (let i = 0; i < numChunks; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, plaintext.length)
        const chunk = plaintext.slice(start, end)
        const encrypted = await encrypt(
          JSON.stringify({ index: i, total: numChunks, recordId, data: btoa(chunk) }),
          key
        )
        fragments.push({ index: i, total: numChunks, data: JSON.stringify(encrypted) })
      }

      const fakePeers = Array.from({ length: numChunks }, (_, i) => ({
        fingerprint: `peer-${i + 1}`,
      }))

      const now = Date.now()
      for (let i = 0; i < fragments.length; i++) {
        await db.run(
          `INSERT INTO shard_registry (shard_id, record_id, peer_fingerprint, shard_index, total_shards, distributed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`${recordId}-shard-${i}`, recordId, fakePeers[i].fingerprint, i, fragments[i].total, now]
        )
      }

      await db.run("UPDATE vault_records SET shard_status = 'distributed' WHERE id = ?", [recordId])

      const store = useVaultStore.getState()
      const updated = store.records.map((r) =>
        r.id === recordId ? { ...r, shardStatus: 'distributed' as const } : r
      )
      useVaultStore.setState({ records: updated })
    } catch (e) {
      console.error('Sharding failed:', e)
    } finally {
      setSharding(false)
    }
  }

  return (
    <button
      onClick={handleShard}
      disabled={sharding}
      className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-500 active:bg-gray-700 disabled:opacity-30"
    >
      {sharding ? 'Sharding...' : 'Shard'}
    </button>
  )
}
