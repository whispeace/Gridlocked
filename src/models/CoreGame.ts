import type { Player, GameState, Position, GameAction, Terrain } from '../types'

/**
 * Ядро данных игры: состояние, игроки, ресурсы, ландшафт.
 * Без логики обработки правил и анимаций
 */
export class CoreGame {
  public state: GameState

  constructor(initialState?: Partial<GameState>) {
    this.state = {
      players: {},
      terrain: [],
      currentTurn: '',
      turnNumber: 1,
      actionHistory: [],
      ...initialState
    }

    if (!this.state.terrain.length) {
      // 6 x 3 поле, пустое
      this.state.terrain = Array(6).fill(null).map(() =>
        Array(3).fill(null).map(() => ({ type: 'empty' }))
      )
    }
  }

  getPlayer(id: string): Player | undefined {
    return this.state.players[id]
  }

  setPlayer(player: Player): void {
    this.state.players[player.id] = player
  }

  movePlayer(id: string, pos: Position): void {
    const p = this.getPlayer(id)
    if (p) p.position = { ...pos }
  }

  updateResources(id: string, delta: Partial<Player['resources']>) {
    const p = this.getPlayer(id)
    if (!p) return
    p.resources = {
      ...p.resources,
      ...Object.fromEntries(
        Object.entries(delta).map(([k, v]) => [k, Math.max(0, (p.resources as any)[k] + (v ?? 0))])
      )
    }
  }

  applyDamage(id: string, damage: number) {
    const p = this.getPlayer(id)
    if (!p) return

    // shield
    if (p.isDefending && p.resources.shield > 0) {
      p.resources.shield = Math.max(0, p.resources.shield - 1)
    } else {
      p.resources.health = Math.max(0, p.resources.health - damage)
    }
  }

  getTerrain(x: number, y: number): Terrain {
    return this.state.terrain[x]?.[y] ?? { type: 'empty' }
  }

  setTerrain(x: number, y: number, terrain: Terrain) {
    if (this.state.terrain[x]) {
      this.state.terrain[x][y] = terrain
    }
  }

  recordAction(action: GameAction) {
    this.state.actionHistory.push(action)
  }

  resetPlayersDefense() {
    Object.values(this.state.players).forEach(p => p.isDefending = false)
  }
}
