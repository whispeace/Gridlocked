import type { GameEngine } from '../GameEngine';
import type { ActionType, Position, GameAction, ActionResult } from '../../types';

/**
 * Интерфейс состояния игры
 */
export interface GameStateInterface {
  /**
   * Вход в состояние
   */
  enter(): void;
  
  /**
   * Выход из состояния
   */
  exit(): void;
  
  /**
   * Обработка действия игрока
   * @param action Действие игрока
   * @returns Результат выполнения действия
   */
  handleAction(action: GameAction): ActionResult;
  
  /**
   * Получение доступных действий
   * @returns Массив доступных действий
   */
  getAvailableActions(): ActionType[];
  
  /**
   * Получение доступных целей для перемещения
   * @returns Массив доступных позиций
   */
  getAvailableMoves(): Position[];
  
  /**
   * Получение доступных целей для атаки
   * @returns Массив доступных позиций
   */
  getAvailableTargets(): Position[];
  
  /**
   * Проверка завершения хода
   * @returns true, если ход завершен
   */
  isTurnComplete(): boolean;
}

/**
 * Абстрактный класс состояния игры
 */
export abstract class GameState implements GameStateInterface {
  constructor(protected engine: GameEngine) {}
  
  abstract enter(): void;
  
  abstract exit(): void;
  
  abstract handleAction(action: GameAction): ActionResult;
  
  abstract getAvailableActions(): ActionType[];
  
  abstract getAvailableMoves(): Position[];
  
  abstract getAvailableTargets(): Position[];
  
  abstract isTurnComplete(): boolean;
}

/**
 * Состояние выбора действия игроком
 */
export class PlayerActionSelectionState extends GameState {
  enter(): void {
    // Логика при входе в состояние выбора действия
  }
  
  exit(): void {
    // Логика при выходе из состояния
  }
  
  handleAction(action: GameAction): ActionResult {
    // Обработка выбора действия игроком
    
    // В зависимости от выбранного действия переключаемся на другое состояние
    switch(action.type) {
      case 'move':
        this.engine.changeState(new PlayerMovementState(this.engine));
        break;
      case 'attack':
        this.engine.changeState(new PlayerAttackState(this.engine));
        break;
      case 'defend':
        // Сразу выполняем действие защиты
        return this.executeDefend(action);
    }
    
    return {
      success: true,
      affectedPositions: [],
      message: `Выбрано действие: ${action.type}`
    };
  }
  
  private executeDefend(action: GameAction): ActionResult {
    // Реализация действия защиты
    const player = this.engine.gameState.value.players[action.playerId];
    player.isDefending = true;
    
    // Регистрация действия и переход хода
    this.engine.recordAction(action);
    this.engine.nextTurn();
    
    return {
      success: true,
      affectedPositions: [player.position],
      message: 'Защита активирована',
      visualEffects: [{
        type: 'shield',
        position: player.position,
        duration: 1000
      }]
    };
  }
  
  getAvailableActions(): ActionType[] {
    // Получение доступных действий из движка
    const player = this.engine.currentPlayer.value;
    const actions: ActionType[] = ['move', 'defend'];
    
    // Проверка возможности атаки (наличие патронов)
    const weapon = player.weapons.find(w => w.type === player.activeWeapon);
    if (weapon && player.resources.ammo >= weapon.ammoPerShot) {
      actions.push('attack');
    }
    
    return actions;
  }
  
  getAvailableMoves(): Position[] {
    // В этом состоянии нет доступных перемещений
    return [];
  }
  
  getAvailableTargets(): Position[] {
    // В этом состоянии нет доступных целей для атаки
    return [];
  }
  
  isTurnComplete(): boolean {
    // Ход не завершен, пока игрок не выполнит действие
    return false;
  }
}

/**
 * Состояние перемещения игрока
 */
export class PlayerMovementState extends GameState {
  enter(): void {
    // Логика при входе в состояние перемещения
  }
  
  exit(): void {
    // Логика при выходе из состояния
  }
  
  handleAction(action: GameAction): ActionResult {
    if (action.type !== 'move') {
      return {
        success: false,
        affectedPositions: [],
        message: 'Ожидается действие перемещения'
      };
    }
    
    const player = this.engine.gameState.value.players[action.playerId];
    const targetPosition = action.payload as Position;
    
    // Проверка валидности перемещения
    const isValid = this.validateMove(player, targetPosition);
    
    if (!isValid) {
      return {
        success: false,
        affectedPositions: [],
        message: 'Невозможно переместиться в эту клетку'
      };
    }
    
    // Выполнение перемещения
    const oldPosition = { ...player.position };
    player.position = { ...targetPosition };
    
    // Регистрация действия и переход хода
    this.engine.recordAction(action);
    this.engine.nextTurn();
    
    // Возврат в состояние выбора действия
    this.engine.changeState(new PlayerActionSelectionState(this.engine));
    
    return {
      success: true,
      affectedPositions: [oldPosition, targetPosition],
      message: 'Перемещение выполнено'
    };
  }
  
  private validateMove(player: any, targetPosition: Position): boolean {
    // Проверка валидности перемещения (только в свою зону 3x3)
    const isPlayerOne = player.id === 'player1';
    const validXRange = isPlayerOne ? [0, 1, 2] : [3, 4, 5];
    
    if (
      !validXRange.includes(targetPosition.x) ||
      targetPosition.y < 0 ||
      targetPosition.y > 2
    ) {
      return false;
    }
    
    // Проверка дистанции хода (можно перемещаться только на 1 клетку)
    const distX = Math.abs(targetPosition.x - player.position.x);
    const distY = Math.abs(targetPosition.y - player.position.y);
    
    return distX + distY === 1;
  }
  
  getAvailableActions(): ActionType[] {
    // В этом состоянии доступно только действие перемещения
    return ['move'];
  }
  
  getAvailableMoves(): Position[] {
    const player = this.engine.currentPlayer.value;
    const { x, y } = player.position;
    
    // Определение зоны игрока
    const isPlayerOne = player.id === 'player1';
    const minX = isPlayerOne ? 0 : 3;
    const maxX = isPlayerOne ? 2 : 5;
    
    // Проверка соседних клеток
    const possibleMoves: Position[] = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 }
    ];
    
    // Фильтрация по границам поля
    return possibleMoves.filter(pos =>
      pos.x >= minX && pos.x <= maxX &&
      pos.y >= 0 && pos.y <= 2
    );
  }
  
  getAvailableTargets(): Position[] {
    // В этом состоянии нет доступных целей для атаки
    return [];
  }
  
  isTurnComplete(): boolean {
    // Ход не завершен, пока игрок не выполнит перемещение
    return false;
  }
}

/**
 * Состояние атаки игрока
 */
export class PlayerAttackState extends GameState {
  enter(): void {
    // Логика при входе в состояние атаки
  }
  
  exit(): void {
    // Логика при выходе из состояния
  }
  
  handleAction(action: GameAction): ActionResult {
    if (action.type !== 'attack') {
      return {
        success: false,
        affectedPositions: [],
        message: 'Ожидается действие атаки'
      };
    }
    
    const player = this.engine.gameState.value.players[action.playerId];
    const targetPosition = action.payload as Position;
    
    // Получение оружия
    const weapon = player.weapons.find(w => w.type === player.activeWeapon);
    
    if (!weapon) {
      return {
        success: false,
        affectedPositions: [],
        message: 'Нет активного оружия'
      };
    }
    
    // Проверка наличия достаточного количества патронов
    if (player.resources.ammo < weapon.ammoPerShot) {
      return {
        success: false,
        affectedPositions: [],
        message: 'Недостаточно патронов'
      };
    }
    
    // Проверка дистанции атаки
    const distX = Math.abs(targetPosition.x - player.position.x);
    const distY = Math.abs(targetPosition.y - player.position.y);
    
    if (distX + distY > weapon.range) {
      return {
        success: false,
        affectedPositions: [],
        message: 'Цель вне зоны досягаемости'
      };
    }
    
    // Расчёт клеток поражения на основе шаблона оружия
    const affectedPositions = weapon.attackPattern.map(offset => ({
      x: targetPosition.x + offset.x,
      y: targetPosition.y + offset.y
    }));
    
    // Определение цели атаки (другой игрок в зоне поражения)
    const targetPlayers = Object.values(this.engine.gameState.value.players).filter(p =>
      p.id !== player.id &&
      affectedPositions.some(pos => pos.x === p.position.x && pos.y === p.position.y)
    );
    
    // Применение урона к целям
    targetPlayers.forEach(target => {
      // Если цель защищается, урон идёт по щитам
      if (target.isDefending && target.resources.shield > 0) {
        target.resources.shield -= 1;
      } else {
        // Иначе урон идёт по здоровью
        target.resources.health -= weapon.damage;
      }
    });
    
    // Расход патронов
    player.resources.ammo -= weapon.ammoPerShot;
    
    // Визуальные эффекты для результатов атаки
    const visualEffects = affectedPositions.map(pos => ({
      type: targetPlayers.length > 0 ? 'explosion' : 'miss',
      position: pos,
      duration: 800
    } as const));
    
    // Регистрация действия и переход хода
    this.engine.recordAction({
      ...action,
      payload: {
        targetPosition,
        affectedPositions,
        damage: weapon.damage,
        weaponType: weapon.type
      }
    });
    
    this.engine.nextTurn();
    
    // Возврат в состояние выбора действия
    this.engine.changeState(new PlayerActionSelectionState(this.engine));
    
    return {
      success: true,
      affectedPositions,
      damage: weapon.damage,
      message: targetPlayers.length > 0 ? 'Атака успешна' : 'Промах',
      visualEffects
    };
  }
  
  getAvailableActions(): ActionType[] {
    // В этом состоянии доступно только действие атаки
    return ['attack'];
  }
  
  getAvailableMoves(): Position[] {
    // В этом состоянии нет доступных перемещений
    return [];
  }
  
  getAvailableTargets(): Position[] {
    const player = this.engine.currentPlayer.value;
    const weapon = player.weapons.find(w => w.type === player.activeWeapon);
    
    if (!weapon || player.resources.ammo < weapon.ammoPerShot) {
      return [];
    }
    
    // Рассчет всех возможных клеток в пределах дальности
    const targets: Position[] = [];
    
    // Для простоты берем манхэттенское расстояние
    for (let dx = -weapon.range; dx <= weapon.range; dx++) {
      for (let dy = -weapon.range; dy <= weapon.range; dy++) {
        if (Math.abs(dx) + Math.abs(dy) <= weapon.range) {
          const targetX = player.position.x + dx;
          const targetY = player.position.y + dy;
          
          // Проверка границ поля
          if (targetX >= 0 && targetX < 6 && targetY >= 0 && targetY < 3) {
            targets.push({ x: targetX, y: targetY });
          }
        }
      }
    }
    
    return targets;
  }
  
  isTurnComplete(): boolean {
    // Ход не завершен, пока игрок не выполнит атаку
    return false;
  }
}