import { getVaultDb } from '../shared/db/DatabaseService'
import { useVaultStore } from './useVaultStore'
import { deriveKey } from '../shared/crypto/KeyDerivation'
import { decrypt, encrypt } from '../shared/crypto/CryptoService'
import { relayEngine } from '../features/mesh/RelayEngine'
import { createEnvelope } from '../features/mesh/MeshEnvelope'
import { getOrCreateIdentity } from '../features/mesh/MeshIdentity'
import { SHARD_TOTAL, SHARD_THRESHOLD, encodeShardPayload, type ShardPayload } from '../shared/shard/ShardProtocol'

export async function distributeShards(recordId: string): Promise<void> {
  const vaultPin = useVaultStore.getState().vaultPin
  if (!vaultPin) throw new Error('Vault locked')

  const db = getVaultDb()
  if (!db) throw new Error('No database')

  const result = await db.query(
    'SELECT encrypted_data, iv, auth_tag FROM vault_records WHERE id = ?',
    [recordId]
  )
  if (!result.values || result.values.length === 0) throw new Error('Record not found')

  const row = result.values[0] as { encrypted_data: string; iv: string; auth_tag: string }
  const { key } = await deriveKey(vaultPin)
  const plaintext = await decrypt(
    { iv: row.iv, ciphertext: row.encrypted_data, authTag: row.auth_tag },
    key
  )

  const chunkSize = Math.ceil(plaintext.length / SHARD_TOTAL)
  const meshIdentity = await getOrCreateIdentity()
  const fragmentKeys = await Promise.all(
    Array.from({ length: SHARD_TOTAL }, () => deriveKey(vaultPin + recordId + String(Math.random())))
  )

  for (let i = 0; i < SHARD_TOTAL; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, plaintext.length)
    const chunk = plaintext.slice(start, end)

    const fragmentEncrypted = await encrypt(
      JSON.stringify({ index: i, total: SHARD_TOTAL, recordId, data: btoa(chunk) }),
      fragmentKeys[i].key
    )

    const payload: ShardPayload = {
      type: 'shard',
      recordId,
      shardIndex: i,
      totalShards: SHARD_TOTAL,
      threshold: SHARD_THRESHOLD,
      data: JSON.stringify(fragmentEncrypted),
      nonce: fragmentKeys[i].salt,
    }

    const envelope = await createEnvelope(
      meshIdentity.fingerprint,
      '*',
      encodeShardPayload(payload),
      key
    )

    relayEngine.receiveEnvelope(envelope)

    await db.run(
      `INSERT OR REPLACE INTO shard_registry (shard_id, record_id, peer_fingerprint, shard_index, total_shards, distributed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`${recordId}-shard-${i}`, recordId, `mesh:${meshIdentity.fingerprint.slice(0, 8)}`, i, SHARD_TOTAL, Date.now()]
    )
  }

  await db.run("UPDATE vault_records SET shard_status = 'distributed' WHERE id = ?", [recordId])

  const store = useVaultStore.getState()
  const updated = store.records.map((r) =>
    r.id === recordId ? { ...r, shardStatus: 'distributed' as const } : r
  )
  useVaultStore.setState({ records: updated })
}
