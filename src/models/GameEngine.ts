import { ref, computed } from 'vue'
import type {
  GameState, Player, Position, ActionType,
  GameAction, Weapon
} from '../types.ts'
import type { GameStateInterface } from './states/GameStatePattern';
import { PlayersActionSelectionState } from './states/GameStatePattern';
import type { ActionResult } from '../types';

export class GameEngine {
  private state = ref<GameState>({
    players: {},
    terrain: [],
    currentTurn: '',
    turnNumber: 0,
    actionHistory: []
  })

  // Текущие состояния игроков (выбранные действия)
  private pendingActions = ref<GameAction[]>([]);
  
  // Текущее состояние игры
  private currentState: GameStateInterface;

  // Геттеры состояния
  public readonly gameState = computed(() => this.state.value);

  constructor(initialState?: Partial<GameState>) {
    if (initialState) {
      this.state.value = { ...this.state.value, ...initialState }
    }
    this.initializeGame()

    // Инициализация начального состояния
    this.currentState = new PlayersActionSelectionState(this);
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
   * Добавляет ожидающее действие игрока
   * @param action Действие игрока
   * @returns true, если действие успешно добавлено
   */
  public storePendingAction(action: GameAction): boolean {
    // Проверяем, не выбрал ли игрок уже действие
    const existingActionIndex = this.pendingActions.value.findIndex(
      a => a.playerId === action.playerId
    );
    
    if (existingActionIndex !== -1) {
      // Если игрок уже выбрал действие, заменяем его
      this.pendingActions.value[existingActionIndex] = action;
    } else {
      // Иначе добавляем новое действие
      this.pendingActions.value.push(action);
    }
    
    // Записываем действие в историю
    this.recordAction(action);
    
    return true;
  }

  /**
   * Сбрасывает все ожидающие действия
   */
  public resetPendingActions(): void {
    this.pendingActions.value = [];
    
    // Сброс статуса защиты всех игроков перед новым раундом
    Object.values(this.state.value.players).forEach(player => {
      player.isDefending = false;
    });
  }

  /**
   * Проверяет, выбрали ли оба игрока свои действия
   * @returns true, если оба игрока выбрали действия
   */
  public areBothPlayersReady(): boolean {
    const playerIds = Object.keys(this.state.value.players);
    return this.pendingActions.value.length === playerIds.length;
  }

  /**
   * Получает все ожидающие действия
   * @returns Массив ожидающих действий
   */
  public getPendingActions(): GameAction[] {
    return [...this.pendingActions.value];
  }

  /**
   * Выполнение действия игрока с поддержкой паттерна "Состояние"
   * @param action Действие игрока
   * @returns Результат выполнения действия
   */
  public executeAction(action: GameAction): ActionResult {
    const player = this.state.value.players[action.playerId];

    // Проверка существования игрока
    if (!player) {
      return {
        success: false,
        affectedPositions: [],
        message: 'Игрок не найден'
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
   * Увеличивает номер раунда
   */
  public incrementRound(): void {
    this.state.value.turnNumber += 1;
  }

  /**
   * Получение доступных действий для игрока
   * @param playerId ID игрока
   * @returns Массив доступных действий
   */
  public getAvailableActions(playerId: string): ActionType[] {
    return this.currentState.getAvailableActions(playerId);
  }

  /**
   * Получение доступных клеток для перемещения
   * @param playerId ID игрока
   * @returns Массив доступных позиций
   */
  public getAvailableMoves(playerId: string): Position[] {
    return this.currentState.getAvailableMoves(playerId);
  }

  /**
   * Получение доступных целей для атаки
   * @param playerId ID игрока
   * @returns Массив доступных позиций
   */
  public getAvailableTargets(playerId: string): Position[] {
    return this.currentState.getAvailableTargets(playerId);
  }

  /**
   * Проверяет, завершили ли оба игрока действия в текущем раунде
   * @returns true, если раунд завершен
   */
  public isRoundComplete(): boolean {
    return this.currentState.isRoundComplete();
  }

  /**
   * Проверяет, выбрал ли игрок действие в текущем раунде
   * @param playerId ID игрока
   * @returns true, если игрок выбрал действие
   */
  public hasPlayerSelected(playerId: string): boolean {
    return this.pendingActions.value.some(action => action.playerId === playerId);
  }

  /**
   * Получает выбранное действие игрока
   * @param playerId ID игрока
   * @returns Выбранное действие или null
   */
  public getPlayerAction(playerId: string): ActionType | null {
    const action = this.pendingActions.value.find(a => a.playerId === playerId);
    return action ? action.type : null;
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

    // Первый игрок по умолчанию, но это значение в новой модели используется только
    // для сохранения совместимости с существующим кодом
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