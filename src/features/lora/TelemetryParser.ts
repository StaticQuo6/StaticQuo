import { parseFromRadioPacket } from './MeshtasticBLE'

export interface ParsedTelemetry {
  nodeId: string
  type: 'position' | 'telemetry' | 'text' | 'nodeinfo'
  data: Record<string, unknown>
  raw: number[]
}

export function decodeTelemetry(payload: Uint8Array): ParsedTelemetry {
  const parsed = parseFromRadioPacket(payload)
  return {
    nodeId: String(parsed.data.nodeId ?? 'unknown'),
    type: parsed.type as ParsedTelemetry['type'],
    data: parsed.data,
    raw: Array.from(payload),
  }
}

export function decodeTextMessage(payload: Uint8Array): string {
  return new TextDecoder().decode(payload)
}

export function decodePosition(payload: Uint8Array): {
  latitude: number
  longitude: number
  altitude: number
} {
  const parsed = parseFromRadioPacket(payload)
  return {
    latitude: (parsed.data.latitude as number) / 1e7 || 0,
    longitude: (parsed.data.longitude as number) / 1e7 || 0,
    altitude: (parsed.data.altitude as number) || 0,
  }
}
