import { CoreGame } from './CoreGame'
import { RuleEngine } from './RuleEngine'
import { EventBus } from './EventBus'
import { ActionManager } from './ActionManager'

import type { GameAction, ActionType, Position, ActionResult, Player, Weapon } from '../types'

/**
 * GameEngine теперь фасад над CoreGame, RuleEngine и ActionManager
 */
export class GameEngine {
  public core: CoreGame
  public rules: RuleEngine
  public actionManager: ActionManager
  public events: EventBus

  constructor(initialState?: Partial<CoreGame['state']>) {
    this.core = new CoreGame(initialState)
    this.rules = new RuleEngine(this.core)
    this.events = new EventBus()
    this.actionManager = new ActionManager(this.core, this.rules, this.events)

    this.newGame()
  }

  newGame() {
    const pistol: Weapon = {
      type: 'pistol',
      damage: 20,
      range: 5,
      ammoPerShot: 1,
      attackPattern: [{ x:0, y:0 }]
    }

    const p1: Player = {
      id: 'player1',
      position: { x:1, y:1 },
      resources: { health: 100, shield:3, ammo:10 },
      weapons: [pistol],
      activeWeapon: 'pistol',
      isDefending: false
    }

    const p2: Player = {
      id: 'player2',
      position: { x:4, y:1 },
      resources: { health: 100, shield:3, ammo:10 },
      weapons: [pistol],
      activeWeapon: 'pistol',
      isDefending: false
    }

    this.core.state.currentTurn = 'player1'
    this.core.state.turnNumber = 1
    this.core.state.actionHistory = []
    this.core.state.players = { player1: p1, player2: p2 }

    this.core.resetPlayersDefense()
    this.actionManager.clearQueue()
    this.events.emit('roundStarted', { turn: 1 })
  }

  submitAction(action: GameAction) {
    this.actionManager.queueAction(action)
  }

  bothPlayersReady() {
    return this.actionManager.bothPlayersReady()
  }

  processTurn(): ActionResult[] {
    const results = this.actionManager.executeQueue()
    this.core.resetPlayersDefense()
    this.actionManager.clearQueue()
    this.core.state.turnNumber +=1
    this.events.emit('roundStarted', { turn: this.core.state.turnNumber })
    return results
  }

  getAvailableActions(playerId: string): ActionType[] {
    const p = this.core.getPlayer(playerId)
    if (!p) return []

    const list: ActionType[] = ['move','defend']
    if (this.rules.canAttack(p)) list.push('attack')
    return list
  }

  getAvailableMoves(playerId: string): Position[] {
    const p = this.core.getPlayer(playerId)
    if (!p) return []

    const { x,y } = p.position
    const candidates = [
      { x: x-1, y },
      { x: x+1, y },
      { x, y: y-1 },
      { x, y: y+1 }
    ]
    return candidates.filter(pos => this.rules.canMove(p, pos))
  }

  getAvailableTargets(playerId: string): Position[] {
    const p = this.core.getPlayer(playerId)
    if (!p) return []

    return this.rules.getAttackTargets(p)
  }

  hasPlayerSelected(playerId: string) {
    return !!this.actionManager['queue'].find(ga => ga.playerId === playerId)
  }

  get gameState() {
    return this.core.state
  }
}
