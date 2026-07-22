export class MbtilesTileSource {
  private tileData = new Map<string, ArrayBuffer>()

  async loadMbtiles(buffer: ArrayBuffer): Promise<void> {
    const textDecoder = new TextDecoder()

    const header = textDecoder.decode(
      new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 100))
    )

    if (!header.includes('SQLite format')) {
      console.warn('Not a valid SQLite/MBTiles file')
      return
    }

    let offset = 0
    const pageSize = 4096
    const pages = Math.floor(buffer.byteLength / pageSize)

    for (let page = 0; page < pages; page++) {
      const pageStart = page * pageSize + offset
      if (pageStart + 5 > buffer.byteLength) break

      const cellType = new Uint8Array(buffer, pageStart, 1)[0]
      if (cellType !== 0x0d) continue

      const payloadLen = new Uint8Array(buffer, pageStart + 3, 2)[0]
      const payload = buffer.slice(pageStart + 5, pageStart + 5 + payloadLen)
      const payloadStr = textDecoder.decode(new Uint8Array(payload))

      if (payloadStr.startsWith('INSERT INTO `tiles`')) {
        this.parseTileInsert(payloadStr)
      }
    }
  }

  private parseTileInsert(sql: string): void {
    const match = sql.match(/VALUES\s*\((\d+),\s*(\d+),\s*(\d+),\s*X'([0-9A-Fa-f]+)'/i)
    if (!match) return

    const z = parseInt(match[1])
    const x = parseInt(match[2])
    const y = parseInt(match[3])
    const hexData = match[4]

    const key = `${z}/${x}/${y}`
    const tileBytes = new Uint8Array(
      hexData.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || []
    )

    this.tileData.set(key, tileBytes.buffer)
  }

  getTile(z: number, x: number, y: number): ArrayBuffer | undefined {
    return this.tileData.get(`${z}/${x}/${y}`)
  }

  hasTile(z: number, x: number, y: number): boolean {
    return this.tileData.has(`${z}/${x}/${y}`)
  }

  clear(): void {
    this.tileData.clear()
  }
}

export const mbtilesSource = new MbtilesTileSource()
