import { useState, useEffect } from 'react'
import { getVaultDb } from '../shared/db/DatabaseService'
import { decrypt } from '../shared/crypto/CryptoService'
import { deriveKey } from '../shared/crypto/KeyDerivation'
import { useVaultStore } from './useVaultStore'
import { ShardEngine } from './ShardEngine'

interface VaultRecord {
  id: string
  type: string
  encrypted_data: string
  iv: string
  auth_tag: string
  created_at: number
  updated_at: number
  shard_status: string
  tags: string
}

export function VaultDashboard() {
  const { vaultPin, records, addRecord, removeRecord, lock } = useVaultStore()
  const [decrypted, setDecrypted] = useState<Record<string, string>>({})
  const [showNew, setShowNew] = useState(false)
  const [newType, setNewType] = useState<'incident' | 'media' | 'note'>('incident')
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    const db = getVaultDb()
    if (!db) return
    try {
      const result = await db.query('SELECT * FROM vault_records ORDER BY created_at DESC')
      if (result.values) {
        const records = result.values as unknown as VaultRecord[]
        const state = useVaultStore.getState()
        records.forEach((r) => {
          state.addRecord({
            id: r.id,
            type: r.type as 'incident' | 'media' | 'note',
            encryptedData: r.encrypted_data,
            createdAt: r.created_at,
            shardStatus: r.shard_status as 'local' | 'distributed',
          })
        })
      }
    } catch (e) {
      console.error('Failed to load vault records:', e)
    }
  }

  const handleDecrypt = async (record: { id: string; encryptedData: string }) => {
    if (!vaultPin) return
    try {
      const db = getVaultDb()
      if (!db) return
      const result = await db.query(
        'SELECT iv, auth_tag FROM vault_records WHERE id = ?',
        [record.id]
      )
      if (!result.values || result.values.length === 0) return

      const { key } = await deriveKey(vaultPin)
      const plaintext = await decrypt(
        {
          iv: (result.values[0] as any).iv,
          ciphertext: record.encryptedData,
          authTag: (result.values[0] as any).auth_tag,
        },
        key
      )
      setDecrypted((prev) => ({ ...prev, [record.id]: plaintext }))
    } catch (e) {
      console.error('Decryption failed:', e)
    }
  }

  const handleSave = async () => {
    if (!vaultPin || !newContent.trim()) return
    setLoading(true)
    try {
      const { key } = await deriveKey(vaultPin)
      const { iv, ciphertext, authTag } = await encrypt(newContent, key)

      const db = getVaultDb()
      if (!db) return
      const id = crypto.randomUUID()
      const now = Date.now()

      await db.execute(
        `INSERT INTO vault_records (id, type, encrypted_data, iv, auth_tag, created_at, updated_at, shard_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'local')`,
        [id, newType, ciphertext, iv, authTag, now, now]
      )

      addRecord({
        id,
        type: newType,
        encryptedData: ciphertext,
        createdAt: now,
        shardStatus: 'local',
      })

      setNewContent('')
      setShowNew(false)
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const db = getVaultDb()
    if (!db) return
    await db.execute('DELETE FROM vault_records WHERE id = ?', [id])
    removeRecord(id)
    setDecrypted((prev) => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }

  const typeIcons: Record<string, string> = {
    incident: '⚠️',
    media: '📸',
    note: '📝',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span>🔐</span> Detention Vault
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNew(!showNew)}
            className="text-xs px-3 py-1 rounded-lg bg-red-600 text-white active:bg-red-500"
          >
            + New Record
          </button>
          <button
            onClick={lock}
            className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-400 active:bg-gray-700"
          >
            Lock
          </button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {showNew && (
          <div className="mb-6 p-4 rounded-2xl bg-gray-900 border border-gray-800">
            <div className="flex gap-2 mb-3">
              {(['incident', 'media', 'note'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    newType === t
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {typeIcons[t]} {t}
                </button>
              ))}
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Describe the incident, note, or observation..."
              className="w-full h-32 p-3 rounded-xl bg-gray-800 text-white border border-gray-700 text-sm resize-none focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={loading || !newContent.trim()}
                className="flex-1 h-10 rounded-xl bg-red-600 text-white font-medium disabled:opacity-30 active:bg-red-500"
              >
                {loading ? 'Encrypting...' : 'Encrypt & Save'}
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="h-10 px-4 rounded-xl bg-gray-800 text-gray-400 active:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {records.length === 0 && !showNew && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-gray-500">No records in vault</p>
            <p className="text-xs text-gray-600 mt-1">
              Tap "+ New Record" to create an encrypted entry
            </p>
          </div>
        )}

        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-2xl bg-gray-900 border border-gray-800"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{typeIcons[record.type] || '📄'}</span>
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    {record.type}
                  </span>
                  {record.shardStatus === 'distributed' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300">
                      sharded
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>
              </div>

              {decrypted[record.id] ? (
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {decrypted[record.id]}
                </p>
              ) : (
                <button
                  onClick={() => handleDecrypt(record)}
                  className="text-sm text-blue-400 active:text-blue-300"
                >
                  Tap to decrypt...
                </button>
              )}

              <div className="flex gap-2 mt-3">
                <ShardEngine recordId={record.id} />
                <button
                  onClick={() => handleDelete(record.id)}
                  className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-500 active:bg-gray-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
