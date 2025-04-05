import { ref, computed } from 'vue'
import type {
  GameState, Player, Position, ActionType,
  GameAction, Weapon
} from '../types.ts'

export class GameEngine {
  private state = ref<GameState>({
    players: {},
    terrain: [],
    currentTurn: '',
    turnNumber: 0,
    actionHistory: []
  })

  // Геттеры состояния
  public readonly currentPlayer = computed(() =>
    this.state.value.players[this.state.value.currentTurn])

  public readonly gameState = computed(() => this.state.value)

  constructor(initialState?: Partial<GameState>) {
    if (initialState) {
      this.state.value = { ...this.state.value, ...initialState }
    }
    this.initializeGame()
  }

  private initializeGame(): void {
    // Создание игрового поля 3x3 + 3x3
    this.state.value.terrain = Array(6).fill(null).map(() =>
      Array(3).fill(null).map(() => ({ type: 'empty' }))
    )

    // Инициализация игроков (базовый пример)
    const player1: Player = {
      id: 'player1',
      position: { x: 0, y: 0 },
      resources: {
        ammo: 10,
        shield: 3,
        health: 100
      },
      weapons: [this.createWeapon('pistol')],
      activeWeapon: 'pistol',
      isDefending: false
    }

    const player2: Player = {
      id: 'player2',
      position: { x: 3, y: 0 }, // Начальная позиция на противоположной стороне
      resources: {
        ammo: 10,
        shield: 3,
        health: 100
      },
      weapons: [this.createWeapon('pistol')],
      activeWeapon: 'pistol',
      isDefending: false
    }

    this.state.value.players = {
      player1,
      player2
    }

    this.state.value.currentTurn = 'player1'
  }

  // Создание оружия с предопределенными параметрами
  private createWeapon(type: 'pistol' | 'shotgun' | 'sniper' | 'machinegun'): Weapon {
    switch (type) {
      case 'pistol':
        return {
          type: 'pistol',
          damage: 20,
          range: 2,
          ammoPerShot: 1,
          attackPattern: [{ x: 0, y: 0 }] // Точное попадание в одну клетку
        }
      case 'shotgun':
        return {
          type: 'shotgun',
          damage: 15,
          range: 1,
          ammoPerShot: 2,
          attackPattern: [
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }
          ] // Конус поражения
        }
      case 'sniper':
        return {
          type: 'sniper',
          damage: 40,
          range: 6, // Через всё поле
          ammoPerShot: 2,
          attackPattern: [{ x: 0, y: 0 }] // Точное дальнее попадание
        }
      case 'machinegun':
        return {
          type: 'machinegun',
          damage: 10,
          range: 2,
          ammoPerShot: 3,
          attackPattern: [
            { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }
          ] // Площадь поражения
        }
    }
  }

  // Выполнение действия игрока
  public executeAction(action: GameAction): boolean {
    const player = this.state.value.players[action.playerId]

    // Проверка валидности хода
    if (action.playerId !== this.state.value.currentTurn || !player) {
      return false
    }

    switch (action.type) {
      case 'move':
        return this.executeMove(player, action.payload as Position)
      case 'attack':
        return this.executeAttack(player, action.payload as Position)
      case 'defend':
        return this.executeDefend(player)
      default:
        return false
    }
  }

  private executeMove(player: Player, targetPosition: Position): boolean {
    // Проверка валидности перемещения (только в свою зону 3x3)
    const isPlayerOne = player.id === 'player1'
    const validXRange = isPlayerOne ? [0, 1, 2] : [3, 4, 5]

    if (
      !validXRange.includes(targetPosition.x) ||
      targetPosition.y < 0 ||
      targetPosition.y > 2
    ) {
      return false
    }

    // Проверка дистанции хода (можно перемещаться только на 1 клетку)
    const distX = Math.abs(targetPosition.x - player.position.x)
    const distY = Math.abs(targetPosition.y - player.position.y)

    if (distX + distY !== 1) {
      return false
    }

    // Выполнение перемещения
    player.position = { ...targetPosition }

    // Регистрация действия и переход хода
    this.recordAction({
      playerId: player.id,
      type: 'move',
      payload: targetPosition,
      timestamp: Date.now()
    })

    this.nextTurn()
    return true
  }

  private executeAttack(player: Player, targetPosition: Position): boolean {
    const weapon = player.weapons.find(w => w.type === player.activeWeapon)

    if (!weapon) {
      return false
    }

    // Проверка наличия достаточного количества патронов
    if (player.resources.ammo < weapon.ammoPerShot) {
      return false
    }

    // Проверка дистанции атаки
    const distX = Math.abs(targetPosition.x - player.position.x)
    const distY = Math.abs(targetPosition.y - player.position.y)

    if (distX + distY > weapon.range) {
      return false
    }

    // Расчёт клеток поражения на основе шаблона оружия
    const affectedPositions = weapon.attackPattern.map(offset => ({
      x: targetPosition.x + offset.x,
      y: targetPosition.y + offset.y
    }))

    // Определение цели атаки (другой игрок в зоне поражения)
    const targetPlayers = Object.values(this.state.value.players).filter(p =>
      p.id !== player.id &&
      affectedPositions.some(pos => pos.x === p.position.x && pos.y === p.position.y)
    )

    // Применение урона к целям
    targetPlayers.forEach(target => {
      // Если цель защищается, урон идёт по щитам
      if (target.isDefending && target.resources.shield > 0) {
        target.resources.shield -= 1
      } else {
        // Иначе урон идёт по здоровью
        target.resources.health -= weapon.damage
      }

      // Проверка поражения цели
      if (target.resources.health <= 0) {
        // Тут можно добавить логику завершения игры или удаления игрока
        console.log(`Игрок ${target.id} повержен!`)
      }
    })

    // Расход патронов
    player.resources.ammo -= weapon.ammoPerShot

    // Регистрация действия и переход хода
    this.recordAction({
      playerId: player.id,
      type: 'attack',
      payload: {
        targetPosition,
        affectedPositions,
        damage: weapon.damage,
        weaponType: weapon.type
      },
      timestamp: Date.now()
    })

    this.nextTurn()
    return true
  }

  private executeDefend(player: Player): boolean {
    // Активация защиты
    player.isDefending = true

    // Регистрация действия и переход хода
    this.recordAction({
      playerId: player.id,
      type: 'defend',
      payload: null,
      timestamp: Date.now()
    })

    this.nextTurn()
    return true
  }

  private recordAction(action: GameAction): void {
    this.state.value.actionHistory.push(action)
  }

  private nextTurn(): void {
    // Сброс статуса защиты предыдущего игрока
    const currentPlayer = this.state.value.players[this.state.value.currentTurn]
    if (currentPlayer.isDefending) {
      currentPlayer.isDefending = false
    }

    // Смена текущего игрока
    const playerIds = Object.keys(this.state.value.players)
    const currentIndex = playerIds.indexOf(this.state.value.currentTurn)
    const nextIndex = (currentIndex + 1) % playerIds.length

    this.state.value.currentTurn = playerIds[nextIndex]
    this.state.value.turnNumber += 1
  }

  // Получение доступных действий для текущего игрока
  public getAvailableActions(): ActionType[] {
    const player = this.currentPlayer.value
    const actions: ActionType[] = ['move', 'defend']

    // Проверка возможности атаки (наличие патронов)
    const weapon = player.weapons.find(w => w.type === player.activeWeapon)
    if (weapon && player.resources.ammo >= weapon.ammoPerShot) {
      actions.push('attack')
    }

    return actions
  }

  // Получение доступных клеток для перемещения
  public getAvailableMoves(): Position[] {
    const player = this.currentPlayer.value
    const { x, y } = player.position

    // Определение зоны игрока
    const isPlayerOne = player.id === 'player1'
    const minX = isPlayerOne ? 0 : 3
    const maxX = isPlayerOne ? 2 : 5

    // Проверка соседних клеток
    const possibleMoves: Position[] = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 }
    ]

    // Фильтрация по границам поля
    return possibleMoves.filter(pos =>
      pos.x >= minX && pos.x <= maxX &&
      pos.y >= 0 && pos.y <= 2
    )
  }

  // Получение доступных целей для атаки
  public getAvailableTargets(): Position[] {
    const player = this.currentPlayer.value
    const weapon = player.weapons.find(w => w.type === player.activeWeapon)

    if (!weapon || player.resources.ammo < weapon.ammoPerShot) {
      return []
    }

    // Рассчет всех возможных клеток в пределах дальности
    const targets: Position[] = []

    // Для простоты берем манхэттенское расстояние
    for (let dx = -weapon.range;dx <= weapon.range;dx++) {
      for (let dy = -weapon.range;dy <= weapon.range;dy++) {
        if (Math.abs(dx) + Math.abs(dy) <= weapon.range) {
          const targetX = player.position.x + dx
          const targetY = player.position.y + dy

          // Проверка границ поля
          if (targetX >= 0 && targetX < 6 && targetY >= 0 && targetY < 3) {
            targets.push({ x: targetX, y: targetY })
          }
        }
      }
    }

    return targets
  }
}