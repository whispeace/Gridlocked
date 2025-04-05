import type { GameEngine } from '../GameEngine';
import type { ActionType, Position, GameAction, ActionResult, Player, VisualEffect } from '../../types';

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
   * @param playerId ID игрока
   * @returns Массив доступных действий
   */
  getAvailableActions(playerId?: string): ActionType[];
  
  /**
   * Получение доступных целей для перемещения
   * @param playerId ID игрока
   * @returns Массив доступных позиций
   */
  getAvailableMoves(playerId?: string): Position[];
  
  /**
   * Получение доступных целей для атаки
   * @param playerId ID игрока
   * @returns Массив доступных позиций
   */
  getAvailableTargets(playerId?: string): Position[];
  
  /**
   * Проверка завершения раунда
   * @returns true, если раунд завершен
   */
  isRoundComplete(): boolean;
}

/**
 * Абстрактный класс состояния игры
 */
export abstract class GameState implements GameStateInterface {
  constructor(protected engine: GameEngine) {}
  
  abstract enter(): void;
  
  abstract exit(): void;
  
  abstract handleAction(action: GameAction): ActionResult;
  
  abstract getAvailableActions(playerId?: string): ActionType[];
  
  abstract getAvailableMoves(playerId?: string): Position[];
  
  abstract getAvailableTargets(playerId?: string): Position[];
  
  abstract isRoundComplete(): boolean;
}

/**
 * Состояние выбора действий игроками
 */
export class PlayersActionSelectionState extends GameState {
  enter(): void {
    // Сброс выбранных действий обоих игроков
    this.engine.resetPendingActions();
  }
  
  exit(): void {
    // Логика при выходе из состояния
  }
  
  handleAction(action: GameAction): ActionResult {
    // Сохраняем выбранное действие игрока
    const isActionStoredSuccessfully = this.engine.storePendingAction(action);
    
    if (!isActionStoredSuccessfully) {
      return {
        success: false,
        affectedPositions: [],
        message: 'Невозможно выполнить действие'
      };
    }
    
    // Проверяем, выбрали ли оба игрока свои действия
    if (this.engine.areBothPlayersReady()) {
      // Если оба игрока выбрали действия, переходим к их выполнению
      this.engine.changeState(new ActionsExecutionState(this.engine));
    }
    
    return {
      success: true,
      affectedPositions: [],
      message: `Действие ${action.type} выбрано`
    };
  }
  
  getAvailableActions(playerId: string): ActionType[] {
    if (!playerId) return [];
    
    // Получение доступных действий для конкретного игрока
    const player = this.engine.gameState.value.players[playerId];
    if (!player) return [];
    
    const actions: ActionType[] = ['move', 'defend'];
    
    // Проверка возможности атаки (наличие патронов)
    const weapon = player.weapons.find(w => w.type === player.activeWeapon);
    if (weapon && player.resources.ammo >= weapon.ammoPerShot) {
      actions.push('attack');
    }
    
    return actions;
  }
  
  getAvailableMoves(playerId: string): Position[] {
    if (!playerId) return [];
    
    const player = this.engine.gameState.value.players[playerId];
    if (!player) return [];
    
    const { x, y } = player.position;
    
    // Определение зоны игрока
    const isPlayerOne = playerId === 'player1';
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
  
  getAvailableTargets(playerId: string): Position[] {
    if (!playerId) return [];
    
    const player = this.engine.gameState.value.players[playerId];
    if (!player) return [];
    
    const weapon = player.weapons.find(w => w.type === player.activeWeapon);
    if (!weapon || player.resources.ammo < weapon.ammoPerShot) {
      return [];
    }
    
    // Определяем, нужно ли выбирать цель для этого оружия
    if (weapon.type === 'pistol' || weapon.type === 'sniper' || weapon.type === 'machinegun') {
      // Для простого оружия автоматически стреляем в направлении противника
      return [];
    }
    
    // Для дробовика и других сложных оружий возвращаем все доступные цели
    const targets: Position[] = [];
    const isPlayerOne = playerId === 'player1';
    const { x, y } = player.position;
    
    for (let dx = -weapon.range; dx <= weapon.range; dx++) {
      for (let dy = -weapon.range; dy <= weapon.range; dy++) {
        if (Math.abs(dx) + Math.abs(dy) <= weapon.range) {
          const targetX = x + dx;
          const targetY = y + dy;
          
          // Проверка границ поля
          if (targetX >= 0 && targetX < 6 && targetY >= 0 && targetY < 3) {
            targets.push({ x: targetX, y: targetY });
          }
        }
      }
    }
    
    return targets;
  }
  
  isRoundComplete(): boolean {
    // Раунд не завершен, пока оба игрока не выбрали свои действия
    return false;
  }
}

/**
 * Состояние выполнения выбранных действий
 */
export class ActionsExecutionState extends GameState {
  private actionResults: ActionResult[] = [];
  
  enter(): void {
    // Выполняем все действия в правильном порядке
    this.executeAllActions();
  }
  
  exit(): void {
    // Очистка результатов
    this.actionResults = [];
  }
  
  handleAction(action: GameAction): ActionResult {
    // В этом состоянии новые действия не принимаются
    return {
      success: false,
      affectedPositions: [],
      message: 'Подождите, выполняются текущие действия'
    };
  }
  
  /**
   * Выполняет все ожидающие действия в порядке приоритета
   */
  private executeAllActions(): void {
    // Получаем все ожидающие действия
    const pendingActions = this.engine.getPendingActions();
    console.log('Выполнение действий:', pendingActions.map(a => `${a.playerId}: ${a.type}`));
    
    // Сортировка действий по приоритету:
    // 1. Защита
    // 2. Атака
    // 3. Перемещение
    const sortedActions = [...pendingActions].sort((a, b) => {
      const getPriority = (type: ActionType): number => {
        switch(type) {
          case 'defend': return 3;
          case 'attack': return 2;
          case 'move': return 1;
          default: return 0;
        }
      };
      
      return getPriority(b.type) - getPriority(a.type);
    });
    
    console.log('Порядок выполнения:', sortedActions.map(a => `${a.playerId}: ${a.type}`));
    
    // Выполняем каждое действие
    sortedActions.forEach(action => {
      console.log(`Выполнение действия: ${action.playerId} - ${action.type}`);
      const result = this.executeAction(action);
      this.actionResults.push(result);
      console.log('Результат:', result);
    });
    
    // Переход к следующему раунду
    setTimeout(() => {
      console.log('Переход к следующему раунду');
      this.engine.incrementRound();
      this.engine.changeState(new PlayersActionSelectionState(this.engine));
    }, 1500); // Задержка для анимаций
  }
  
  /**
   * Выполняет отдельное действие и возвращает результат
   */
  private executeAction(action: GameAction): ActionResult {
    const player = this.engine.gameState.value.players[action.playerId];
    
    switch(action.type) {
      case 'move':
        return this.executeMove(player, action);
      case 'attack':
        return this.executeAttack(player, action);
      case 'defend':
        return this.executeDefend(player, action);
      default:
        return {
          success: false,
          affectedPositions: [],
          message: 'Неизвестное действие'
        };
    }
  }
  
  /**
   * Выполняет действие перемещения
   */
  private executeMove(player: Player, action: GameAction): ActionResult {
    const targetPosition = action.payload as Position;
    
    // Проверяем, не выполнилось ли уже перемещение другого игрока на эту же клетку
    const isOccupied = Object.values(this.engine.gameState.value.players).some(p => 
      p.id !== player.id && 
      p.position.x === targetPosition.x && 
      p.position.y === targetPosition.y
    );
    
    if (isOccupied) {
      return {
        success: false,
        affectedPositions: [player.position],
        message: 'Клетка уже занята другим игроком'
      };
    }
    
    // Выполнение перемещения
    const oldPosition = { ...player.position };
    player.position = { ...targetPosition };
    
    return {
      success: true,
      affectedPositions: [oldPosition, targetPosition],
      message: 'Перемещение выполнено'
    };
  }
  
  /**
   * Выполняет действие атаки
   * @param player Игрок, выполняющий атаку
   * @param action Информация о действии атаки
   * @returns Результат выполнения атаки
   */
  private executeAttack(player: Player, action: GameAction): ActionResult {
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
    
    // Расход патронов
    player.resources.ammo -= weapon.ammoPerShot;
    
    // Находим противника
    const isPlayerOne = player.id === 'player1';
    const enemyId = isPlayerOne ? 'player2' : 'player1';
    const enemy = this.engine.gameState.value.players[enemyId];
    
    // Определяем цель атаки
    let targetPosition: Position;
    
    // Проверяем: передана ли конкретная позиция для атаки (для сложного оружия)
    if (action.payload && (
        weapon.type === 'shotgun' || 
        (typeof action.payload === 'object' && 'x' in action.payload && 'y' in action.payload) ||
        (typeof action.payload === 'object' && action.payload.targetPosition)
    )) {
      // Используем указанную позицию для атаки
      targetPosition = 
        (action.payload.targetPosition) || 
        (typeof action.payload === 'object' && 'x' in action.payload ? action.payload : null) as Position;
    } else {
      // Для простого оружия (пистолет, снайпер, пулемет) стреляем по линии к противнику
      
      // Важное изменение: теперь стреляем прямо в позицию противника, 
      // а не просто по прямой с фиксированной дальностью
      targetPosition = { ...enemy.position };
    }
    
    // Проверка дальности оружия
    const distX = Math.abs(targetPosition.x - player.position.x);
    const distY = Math.abs(targetPosition.y - player.position.y);
    
    // Если цель вне зоны досягаемости, атака промахивается
    if (distX + distY > weapon.range) {
      return {
        success: true,
        affectedPositions: [targetPosition],
        message: 'Цель вне зоны досягаемости',
        visualEffects: [{
          type: 'miss',
          position: targetPosition,
          duration: 600
        }]
      };
    }
    
    // Расчёт клеток поражения на основе шаблона оружия и позиции цели
    let affectedPositions: Position[];
    
    if (weapon.type === 'shotgun') {
      // Для дробовика используем шаблон атаки
      affectedPositions = weapon.attackPattern.map(offset => ({
        x: targetPosition.x + offset.x,
        y: targetPosition.y + offset.y
      }));
    } else {
      // Для пистолета, снайпера и пулемета атакуем точно по позиции противника
      affectedPositions = [{ ...targetPosition }];
    }
    
    // Проверяем, находятся ли позиции в пределах игрового поля
    const validAffectedPositions = affectedPositions.filter(pos => 
      pos.x >= 0 && pos.x < 6 && pos.y >= 0 && pos.y < 3
    );
    
    // Определение целей атаки (другие игроки в зоне поражения)
    // Ключевое исправление: проверяем попадание по противнику
    const targetPlayers = Object.values(this.engine.gameState.value.players).filter(p =>
      p.id !== player.id &&
      validAffectedPositions.some(pos => pos.x === p.position.x && pos.y === p.position.y)
    );
    
    // Вывод отладочной информации
    console.log('Атака:', {
      игрок: player.id,
      оружие: weapon.type,
      позицияИгрока: player.position,
      позицияЦели: targetPosition,
      пораженныеПозиции: validAffectedPositions,
      пораженныеИгроки: targetPlayers.map(p => p.id),
      позицииПротивников: Object.values(this.engine.gameState.value.players)
        .filter(p => p.id !== player.id).map(p => `${p.id}: ${p.position.x},${p.position.y}`)
    });
    
    // Применение урона к целям
    targetPlayers.forEach(target => {
      // Сохраняем исходное значение здоровья для отображения нанесенного урона
      const oldHealth = target.resources.health;
      
      // Если цель защищается и у неё есть щиты, урон идёт по щитам
      if (target.isDefending && target.resources.shield > 0) {
        target.resources.shield = Math.max(0, target.resources.shield - 1);
      } else {
        // Иначе урон идёт по здоровью
        target.resources.health = Math.max(0, target.resources.health - weapon.damage);
      }
      
      // Вычисляем фактически нанесенный урон
      const actualDamage = oldHealth - target.resources.health;
      
      console.log(`Урон нанесен ${target.id}: ${actualDamage} (здоровье: ${target.resources.health})`);
    });
    
    // Создаем визуальные эффекты для всех задействованных клеток
    const visualEffects: VisualEffect[] = [];
    
    // Добавляем визуальные эффекты в зависимости от результата атаки
    validAffectedPositions.forEach(pos => {
      // Проверяем, есть ли попадание по игроку на этой позиции
      const hitPlayer = targetPlayers.find(p => p.position.x === pos.x && p.position.y === pos.y);
      
      if (hitPlayer) {
        // Эффект попадания (взрыв)
        visualEffects.push({
          type: 'explosion',
          position: pos,
          duration: 800
        });
      } else {
        // Эффект промаха
        visualEffects.push({
          type: 'miss',
          position: pos,
          duration: 600
        });
      }
    });
    
    // Формируем сообщение о результате атаки
    let message = 'Промах';
    if (targetPlayers.length > 0) {
      message = `Попадание! Нанесено ${weapon.damage} урона`;
    }
    
    return {
      success: true,
      affectedPositions: validAffectedPositions,
      damage: weapon.damage,
      message: message,
      visualEffects: visualEffects
    };
  }
  
  /**
   * Выполняет действие защиты
   */
  private executeDefend(player: Player, action: GameAction): ActionResult {
    player.isDefending = true;
    
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
    // В этом состоянии нет доступных действий
    return [];
  }
  
  getAvailableMoves(): Position[] {
    // В этом состоянии нет доступных перемещений
    return [];
  }
  
  getAvailableTargets(): Position[] {
    // В этом состоянии нет доступных целей для атаки
    return [];
  }
  
  isRoundComplete(): boolean {
    // Раунд завершен после выполнения всех действий
    return true;
  }
}
