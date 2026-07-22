import { useState, useEffect } from 'react'
import { initVaultDb, getVaultDb } from '../shared/db/DatabaseService'
import { deriveKey } from '../shared/crypto/KeyDerivation'
import { encrypt } from '../shared/crypto/CryptoService'
import { useVaultStore } from './useVaultStore'

export function VaultGate({ children }: { children: React.ReactNode }) {
  const { isUnlocked, unlock, vaultPin } = useVaultStore()
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isUnlocked && vaultPin) {
      initVaultDb(vaultPin).catch(() => {})
    }
  }, [isUnlocked, vaultPin])

  const handleDigit = (d: string) => {
    if (input.length < 8) setInput((p) => p + d)
  }

  const handleSubmit = async () => {
    if (input.length < 4) return
    setLoading(true)
    setError(false)

    try {
      const db = await initVaultDb(input)
      const result = await db.query('SELECT value FROM vault_meta WHERE key = ?', ['vault_key_salt'])

      if (result.values && result.values.length > 0) {
        const salt = result.values[0].value as string
        const testResult = await db.query(
          'SELECT value FROM vault_meta WHERE key = ?',
          ['vault_test_ciphertext']
        )

        if (testResult.values && testResult.values.length > 0) {
          const { key } = await deriveKey(input, salt)
          const ct = testResult.values[0].value as string
          await encrypt('staticquo-vault-ok', key)
          unlock(input)
          setInput('')
        } else {
          setError(true)
          setInput('')
        }
      } else {
        const { key, salt } = await deriveKey(input)
        const ciphertext = await encrypt('staticquo-vault-ok', key)
        await db.execute('INSERT INTO vault_meta (key, value) VALUES (?, ?)', [
          'vault_key_salt',
          salt,
        ])
        await db.execute('INSERT INTO vault_meta (key, value) VALUES (?, ?)', [
          'vault_test_ciphertext',
          ciphertext.ciphertext,
        ])
        unlock(input)
        setInput('')
      }
    } catch {
      setError(true)
      setInput('')
    } finally {
      setLoading(false)
    }
  }

  if (isUnlocked) return <>{children}</>

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-xs text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold text-white mb-2">Detention Vault</h1>
        <p className="text-sm text-gray-400 mb-8">
          {loading ? 'Decrypting...' : 'Enter your vault PIN to access encrypted records'}
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < input.length ? 'bg-red-500' : 'bg-gray-700'
              } ${error ? 'animate-pulse bg-red-500' : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-4">Incorrect vault PIN</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(String(n))}
              className="h-16 rounded-2xl bg-gray-800 text-white text-xl font-medium active:bg-gray-700 transition-colors"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-gray-800 text-white text-xl font-medium active:bg-gray-700 transition-colors"
          >
            0
          </button>
          <button
            onClick={() => setInput((p) => p.slice(0, -1))}
            className="h-16 rounded-2xl bg-gray-800 text-gray-400 text-lg active:bg-gray-700 transition-colors"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={input.length < 4 || loading}
          className="w-full mt-4 h-12 rounded-xl bg-red-600 text-white font-medium disabled:opacity-30 active:bg-red-500 transition-colors"
        >
          Unlock Vault
        </button>
      </div>
    </div>
  )
}
