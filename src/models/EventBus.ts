type GameEventTypes = 
  | 'playerMoved'
  | 'playerAttacked'
  | 'playerDefended'
  | 'actionExecuted'
  | 'roundStarted'
  | 'gameOver'
  | 'damageDealt'
  | 'custom'

interface GameEventPayload {
  [key: string]: any
}

type EventCallback = (payload: GameEventPayload) => void

export class EventBus {
  private handlers: Map<GameEventTypes, Set<EventCallback>> = new Map()

  on(type: GameEventTypes, cb: EventCallback) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(cb)
  }

  off(type: GameEventTypes, cb: EventCallback) {
    this.handlers.get(type)?.delete(cb)
  }

  emit(type: GameEventTypes, payload: GameEventPayload = {}) {
    this.handlers.get(type)?.forEach(cb => cb(payload))
  }
}
