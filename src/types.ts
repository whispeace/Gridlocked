// Позиция на игровом поле
export interface Position {
  x: number;
  y: number;
}

// Типы действий игрока
export type ActionType = 'move' | 'attack' | 'defend';

// Тип местности на клетке
export interface Terrain {
  type: 'empty' | 'cover' | 'damage' | 'bonus';
  effect?: number; // числовое значение эффекта (урон, бонус, защита)
}

// Оружие
export interface Weapon {
  type: 'pistol' | 'shotgun' | 'sniper' | 'machinegun';
  damage: number; // урон при попадании
  range: number; // дальность в клетках
  ammoPerShot: number; // расход патронов за выстрел
  attackPattern: Position[]; // шаблон поражения относительно центра
}

// Ресурсы игрока
export interface Resources {
  health: number;
  shield: number;
  ammo: number;
}

// Игрок
export interface Player {
  id: string;
  position: Position;
  resources: Resources;
  weapons: Weapon[];
  activeWeapon: string;
  isDefending: boolean;
}

// Действие в игре
export interface GameAction {
  playerId: string;
  type: ActionType;
  payload: any; // зависит от типа действия
  timestamp: number;
}

// Состояние игры
export interface GameState {
  players: Record<string, Player>;
  terrain: Terrain[][];
  currentTurn: string;
  turnNumber: number;
  actionHistory: GameAction[];
}

// Результат действия игрока (для анимации и визуальных эффектов)
export interface ActionResult {
  success: boolean;          // Выполнено ли действие успешно
  affectedPositions: Position[]; // Позиции, затронутые действием
  damage?: number;           // Нанесенный урон
  message?: string;          // Сообщение о результате
  visualEffects?: VisualEffect[]; // Визуальные эффекты
}

// Визуальный эффект для отображения
export interface VisualEffect {
  type: 'explosion' | 'heal' | 'shield' | 'miss';
  position: Position;
  duration: number; // Длительность в мс
}

// Предмет (для системы подбора предметов)
export interface Item {
  id: string;
  type: 'weapon' | 'ammo' | 'health' | 'shield';
  name: string;
  effect: number;
  weapon?: Weapon; // Если тип "weapon"
}

// Расширение типа Terrain для включения предметов
export interface EnhancedTerrain extends Terrain {
  item?: Item; // Предмет на клетке
}

// Настройки игры
export interface GameSettings {
  mapSize: {
    width: number;
    height: number;
  };
  startingResources: Resources;
  maxHealth: number;
  maxShield: number;
  maxAmmo: number;
  winConditions: WinCondition[];
}

// Условия победы
export type WinCondition = 
  | { type: 'elimination' } // Устранение противника
  | { type: 'capture', positions: Position[] } // Захват определенных позиций
  | { type: 'survival', turns: number }; // Выживание N ходов