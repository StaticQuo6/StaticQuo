export const SHARD_MESH_PORT = 'shard' as const
export const SHARD_THRESHOLD = 3
export const SHARD_TOTAL = 5

export interface ShardPayload {
  type: 'shard'
  recordId: string
  shardIndex: number
  totalShards: number
  threshold: number
  data: string
  nonce: string
}

export function encodeShardPayload(shard: ShardPayload): string {
  return JSON.stringify(shard)
}

export function decodeShardPayload(raw: string): ShardPayload | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.type === 'shard') return parsed as ShardPayload
    return null
  } catch {
    return null
  }
}

export function isShardComplete(
  collected: Map<number, ShardPayload>,
  total: number
): boolean {
  let count = 0
  for (let i = 0; i < total; i++) {
    if (collected.has(i)) count++
  }
  return count >= SHARD_THRESHOLD
}
