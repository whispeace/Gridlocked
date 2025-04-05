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