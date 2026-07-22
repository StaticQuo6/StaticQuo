interface GraphNode {
  id: string
  lat: number
  lng: number
  neighbors: Array<{ id: string; weight: number }>
}

interface RouteResult {
  path: Array<{ lat: number; lng: number }>
  distance: number
}

export class OfflineRouter {
  private nodes = new Map<string, GraphNode>()

  loadGraph(graphData: GraphNode[]): void {
    graphData.forEach((node) => this.nodes.set(node.id, node))
  }

  findRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): RouteResult | null {
    const startId = this.findClosestNode(startLat, startLng)
    const endId = this.findClosestNode(endLat, endLng)

    if (!startId || !endId) return null

    const openSet = new Set<string>([startId])
    const cameFrom = new Map<string, string>()
    const gScore = new Map<string, number>()
    const fScore = new Map<string, number>()

    gScore.set(startId, 0)
    fScore.set(startId, this.heuristic(startId, endId))

    while (openSet.size > 0) {
      const current = this.getLowestFScore(openSet, fScore)
      if (!current) break

      if (current === endId) {
        return this.reconstructPath(cameFrom, current)
      }

      openSet.delete(current)
      const node = this.nodes.get(current)
      if (!node) continue

      for (const neighbor of node.neighbors) {
        const tentativeG = (gScore.get(current) || 0) + neighbor.weight

        if (tentativeG < (gScore.get(neighbor.id) || Infinity)) {
          cameFrom.set(neighbor.id, current)
          gScore.set(neighbor.id, tentativeG)
          fScore.set(neighbor.id, tentativeG + this.heuristic(neighbor.id, endId))
          openSet.add(neighbor.id)
        }
      }
    }

    return null
  }

  private heuristic(nodeId: string, targetId: string): number {
    const node = this.nodes.get(nodeId)
    const target = this.nodes.get(targetId)
    if (!node || !target) return 0

    const dlat = node.lat - target.lat
    const dlng = node.lng - target.lng
    return Math.sqrt(dlat * dlat + dlng * dlng)
  }

  private findClosestNode(lat: number, lng: number): string | null {
    let closest: string | null = null
    let minDist = Infinity

    this.nodes.forEach((node, id) => {
      const dlat = node.lat - lat
      const dlng = node.lng - lng
      const dist = Math.sqrt(dlat * dlat + dlng * dlng)
      if (dist < minDist) {
        minDist = dist
        closest = id
      }
    })

    return closest
  }

  private getLowestFScore(set: Set<string>, fScore: Map<string, number>): string | null {
    let lowest: string | null = null
    let minScore = Infinity

    set.forEach((id) => {
      const score = fScore.get(id) || Infinity
      if (score < minScore) {
        minScore = score
        lowest = id
      }
    })

    return lowest
  }

  private reconstructPath(
    cameFrom: Map<string, string>,
    current: string
  ): RouteResult {
    const path: Array<{ lat: number; lng: number }> = []
    let totalDist = 0
    let node = current

    while (true) {
      const graphNode = this.nodes.get(node)
      if (!graphNode) break

      path.unshift({ lat: graphNode.lat, lng: graphNode.lng })

      const prev = cameFrom.get(node)
      if (!prev) break

      const prevNode = this.nodes.get(prev)
      if (prevNode) {
        const neighbor = graphNode.neighbors.find((n) => n.id === prev)
        if (neighbor) totalDist += neighbor.weight
      }

      node = prev
    }

    return { path, distance: totalDist }
  }
}

export const offlineRouter = new OfflineRouter()
