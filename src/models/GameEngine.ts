import { ref, computed } from 'vue'
import type {
  GameState, Player, Position, ActionType,
  GameAction, Weapon
} from '../types.ts'
import type { GameStateInterface } from './states/GameStatePattern';
import { PlayerActionSelectionState } from './states/GameStatePattern';
import type { ActionResult } from '../types';

export class GameEngine {
  private state = ref<GameState>({
    players: {},
    terrain: [],
    currentTurn: '',
    turnNumber: 0,
    actionHistory: []
  })

  private currentState: GameStateInterface;


  // Геттеры состояния
  public readonly currentPlayer = computed(() =>
    this.state.value.players[this.state.value.currentTurn])

  public readonly gameState = computed(() => this.state.value)

  constructor(initialState?: Partial<GameState>) {
    if (initialState) {
      this.state.value = { ...this.state.value, ...initialState }
    }
    this.initializeGame()

      // Инициализация начального состояния
      this.currentState = new PlayerActionSelectionState(this);
      this.currentState.enter();
  }

  /**
 * Изменяет текущее состояние игры
 * @param newState Новое состояние
 */
public changeState(newState: GameStateInterface): void {
  this.currentState.exit();
  this.currentState = newState;
  this.currentState.enter();
}

/**
 * Выполнение действия игрока с поддержкой паттерна "Состояние"
 * @param action Действие игрока
 * @returns Результат выполнения действия
 */
public executeAction(action: GameAction): ActionResult {
  const player = this.state.value.players[action.playerId];

  // Проверка валидности хода
  if (action.playerId !== this.state.value.currentTurn || !player) {
    return {
      success: false,
      affectedPositions: [],
      message: 'Сейчас не ваш ход'
    };
  }

  // Делегирование обработки текущему состоянию
  return this.currentState.handleAction(action);
}

/**
 * Регистрация действия в истории
 * @param action Действие игрока
 */
public recordAction(action: GameAction): void {
  this.state.value.actionHistory.push(action);
}

/**
 * Переход хода к следующему игроку
 */
public nextTurn(): void {
  // Сброс статуса защиты предыдущего игрока
  const currentPlayer = this.state.value.players[this.state.value.currentTurn];
  if (currentPlayer.isDefending) {
    currentPlayer.isDefending = false;
  }

  // Смена текущего игрока
  const playerIds = Object.keys(this.state.value.players);
  const currentIndex = playerIds.indexOf(this.state.value.currentTurn);
  const nextIndex = (currentIndex + 1) % playerIds.length;

  this.state.value.currentTurn = playerIds[nextIndex];
  this.state.value.turnNumber += 1;
  
  // Сброс состояния на выбор действия для нового игрока
  this.changeState(new PlayerActionSelectionState(this));
}

/**
 * Получение доступных действий для текущего игрока
 * @returns Массив доступных действий
 */
public getAvailableActions(): ActionType[] {
  return this.currentState.getAvailableActions();
}

/**
 * Получение доступных клеток для перемещения
 * @returns Массив доступных позиций
 */
public getAvailableMoves(): Position[] {
  return this.currentState.getAvailableMoves();
}

/**
 * Получение доступных целей для атаки
 * @returns Массив доступных позиций
 */
public getAvailableTargets(): Position[] {
  return this.currentState.getAvailableTargets();
}

  private initializeGame(): void {
    // Создание игрового поля 3x3 + 3x3
    this.state.value.terrain = Array(6).fill(null).map(() =>
      Array(3).fill(null).map(() => ({ type: 'empty' }))
    )

    // Инициализация игроков (базовый пример)
    const player1: Player = {
      id: 'player1',
      position: { x: 1, y: 1 },
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
      position: { x: 4, y: 1 }, // Начальная позиция на противоположной стороне
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
          range: 5, // Увеличенная дальность для стрельбы через поле
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
          range: 5, // Через всё поле
          ammoPerShot: 3,
          attackPattern: [{ x: 0, y: 0 }] // Прямой выстрел в одну клетку
        }
    }
  }
}