import type { GameAction, ActionResult } from '../types'
import type { CoreGame } from './CoreGame'
import type { RuleEngine } from './RuleEngine'
import type { EventBus } from './EventBus'

/**
 * Хранит очередь, приоритет и запускает действия
 */
export class ActionManager {
  private queue: GameAction[] = []

  constructor(
    private core: CoreGame,
    private rules: RuleEngine,
    private bus: EventBus
  ) {}

  queueAction(action: GameAction) {
    const existingIdx = this.queue.findIndex(a => a.playerId === action.playerId)
    if (existingIdx >= 0) {
      this.queue[existingIdx] = action
    } else {
      this.queue.push(action)
    }
    this.core.recordAction(action)
  }

  clearQueue() {
    this.queue = []
  }

  bothPlayersReady(): boolean {
    return this.queue.length === 2
  }

  executeQueue(): ActionResult[] {
    const res: ActionResult[] = []
    // порядок: defend > attack > move
    const priority = { defend: 3, attack: 2, move:1 }

    const sorted = [...this.queue].sort(
      (a,b) => priority[b.type]-priority[a.type]
    )

    for (const act of sorted) {
      const player = this.core.getPlayer(act.playerId)!
      let result: ActionResult

      if(act.type==='move'){
        result = this.rules.processMove(player, act.payload)
        if(result.success) this.bus.emit('playerMoved', {playerId: player.id, pos: act.payload})
      }
      else if(act.type==='defend'){
        result = this.rules.processDefend(player)
        if(result.success) this.bus.emit('playerDefended', {playerId: player.id})
      }
      else if(act.type==='attack'){
        result = this.rules.processAttack(player, act.payload)
        if(result.success) this.bus.emit('playerAttacked',{playerId: player.id})
      }
      else{
        result = {success: false, affectedPositions: [], message: 'Неизвестное действие' }
      }

      res.push(result)
      this.bus.emit('actionExecuted', {playerId: player.id, type: act.type, result})
    }

    // возможна победа
    const winner = this.rules.checkWin()
    if(winner){
      this.bus.emit('gameOver', {winner})
    }
    return res
  }
}
