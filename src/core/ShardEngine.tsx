import { useState } from 'react'
import { distributeShards } from './ShardDistributor'

export function ShardEngine({ recordId }: { recordId: string }) {
  const [sharding, setSharding] = useState(false)

  const handleShard = async () => {
    setSharding(true)
    try {
      await distributeShards(recordId)
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
