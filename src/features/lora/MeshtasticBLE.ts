export const MESH_SERVICE_UUID = '6ba1b218-15a8-461f-9fa8-5dcae273eafd'
export const TORADIO_UUID = 'f75c76d2-129e-4dad-a1dd-7866124401e7'
export const FROMRADIO_UUID = '2c55e69e-4993-11ed-b878-0242ac120002'
export const FROMNUM_UUID = 'ed9da18c-a800-4f66-a670-aa7547e34453'
const RECOMMENDED_MTU = 512

export function getMeshtasticServiceUuid(): string {
  return MESH_SERVICE_UUID
}

export function getMeshtasticCharacteristics() {
  return {
    toRadio: TORADIO_UUID,
    fromRadio: FROMRADIO_UUID,
    fromNum: FROMNUM_UUID,
  }
}

export function getRecommendedMtu(): number {
  return RECOMMENDED_MTU
}

export function encodeWantConfig(nonce: number): ArrayBuffer {
  const payload = new Uint8Array(5)
  payload[0] = 0x03
  payload[1] = nonce & 0xff
  payload[2] = (nonce >> 8) & 0xff
  payload[3] = (nonce >> 16) & 0xff
  payload[4] = (nonce >> 24) & 0xff
  return payload.buffer
}

export function encodeMeshPacket(payload: Uint8Array, dest: number): ArrayBuffer {
  const frame = new Uint8Array(1 + 4 + payload.length)
  frame[0] = 0x01
  frame[1] = dest & 0xff
  frame[2] = (dest >> 8) & 0xff
  frame[3] = (dest >> 16) & 0xff
  frame[4] = (dest >> 24) & 0xff
  frame.set(payload, 5)
  return frame.buffer
}

export const PortNum = {
  TEXT_MESSAGE_APP: 1,
  TELEMETRY_APP: 2,
  POSITION_APP: 3,
  NODEINFO_APP: 4,
  REPLY_APP: 32,
} as const

export function parseFromRadioPacket(bytes: Uint8Array): {
  type: string
  data: Record<string, unknown>
} {
  try {
    if (bytes.length < 2) return { type: 'unknown', data: {} }

    const packetType = bytes[0]

    switch (packetType) {
      case 0x01: {
        const nodeId = bytes[1]
        return { type: 'node_info', data: { nodeId, raw: Array.from(bytes.slice(2)) } }
      }
      case 0x02: {
        return {
          type: 'position',
          data: {
            latitude: bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24),
            longitude: bytes[5] | (bytes[6] << 8) | (bytes[7] << 16) | (bytes[8] << 24),
            altitude: bytes[9] | (bytes[10] << 8),
          },
        }
      }
      case 0x03: {
        return {
          type: 'telemetry',
          data: {
            batteryLevel: bytes[1],
            temperature: bytes[2],
            humidity: bytes[3],
            pressure: bytes[4] | (bytes[5] << 8),
          },
        }
      }
      case 0x04: {
        return {
          type: 'config_complete',
          data: { id: bytes[1] },
        }
      }
      default:
        return { type: 'raw', data: { bytes: Array.from(bytes) } }
    }
  } catch {
    return { type: 'unknown', data: {} }
  }
}
