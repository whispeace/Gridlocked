import { CoreGame } from './CoreGame'
import { RuleEngine } from './RuleEngine'
import { EventBus } from './EventBus'
import { ActionManager } from './ActionManager'
import { PlayersActionSelectionState, type GameStateInterface } from './states/GameStatePattern'

import type { GameAction, ActionType, Position, ActionResult, Player, Weapon } from '../types'

/**
 * GameEngine теперь фасад над CoreGame, RuleEngine и ActionManager
 */
export class GameEngine {
  public core: CoreGame
  public rules: RuleEngine
  public actionManager: ActionManager
  public events: EventBus
  public currentState: GameStateInterface | null = null;
  private pendingActions: Record<string, GameAction | null> = { player1: null, player2: null };

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

    this.pendingActions = { player1: null, player2: null };
    this.changeState(new PlayersActionSelectionState(this))    // <<< FSM старт
  }

  changeState(newState: GameStateInterface) {
    if(this.currentState) this.currentState.exit();
    this.currentState = newState;
    this.currentState.enter();
  }

  resetPendingActions() {
    this.pendingActions = { player1: null, player2: null };
  }

  getPendingActions(): GameAction[] {
    return Object.values(this.pendingActions).filter(Boolean) as GameAction[]
  }

  areBothPlayersReady(): boolean {
    return !!(this.pendingActions.player1 && this.pendingActions.player2);
  }

  storePendingAction(action: GameAction): boolean {
    const playerId = action.playerId;
    if(this.pendingActions[playerId]) return false; // уже выбран ход
    this.pendingActions[playerId] = action;
    return true;
  }

  handleAction(action: GameAction): ActionResult {
    if (!this.currentState) throw new Error('Game state is not initialized');
    return this.currentState.handleAction(action);
  }
  
  getAvailableActions(playerId: string): ActionType[] {
    return this.currentState?.getAvailableActions(playerId) ?? [];
  }

  getAvailableMoves(playerId: string): Position[] {
    return this.currentState?.getAvailableMoves(playerId) ?? [];
  }

  getAvailableTargets(playerId: string): Position[] {
    return this.currentState?.getAvailableTargets(playerId) ?? [];
  }

  incrementRound() {
    this.core.state.turnNumber++;
    this.resetPendingActions();
  }

  hasPlayerSelected(playerId: string) {
    return !!this.actionManager['queue'].find(ga => ga.playerId === playerId)
  }

  get gameState() {
    return this.core.state
  }
}
