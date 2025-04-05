import type { PlayerSpriteConfig } from '../models/SpriteManager';

/**
 * Базовый размер кадра для спрайтов
 */
const SPRITE_FRAME = {
  width: 48,
  height: 48
};

/**
 * Стандартная продолжительность кадра (в миллисекундах)
 */
const DEFAULT_FRAME_DURATION = 150;

/**
 * Создает шаблон для кадров анимации движения
 * @param row Ряд в спрайтовом листе
 * @returns Массив кадров для анимации
 */
function createWalkFrames(row: number) {
  // Используем все кадры ходьбы для полноценной анимации
  return [
    { x: 0, y: row * SPRITE_FRAME.height, ...SPRITE_FRAME },
    { x: SPRITE_FRAME.width, y: row * SPRITE_FRAME.height, ...SPRITE_FRAME },
    { x: 2 * SPRITE_FRAME.width, y: row * SPRITE_FRAME.height, ...SPRITE_FRAME },
    { x: 3 * SPRITE_FRAME.width, y: row * SPRITE_FRAME.height, ...SPRITE_FRAME },
  ];
}

/**
 * Создает шаблон для кадров анимации атаки
 * @param row Ряд в спрайтовом листе
 * @returns Массив кадров для анимации (не используется согласно требованиям)
 */
function createAttackFrames(row: number) {
  // По требованиям атаку не анимируем, 
  // но для совместимости определяем кадры, используя первый кадр соответствующего направления
  return [{ x: 0, y: row * SPRITE_FRAME.height, ...SPRITE_FRAME }];
}

/**
 * Создает шаблон для кадров анимации защиты
 * @param row Ряд в спрайтовом листе
 * @returns Массив кадров для анимации
 */
function createDefendFrames(row: number) {
  // Упрощенная версия - используем первый кадр ходьбы
  return [{ x: 0, y: row * SPRITE_FRAME.height, ...SPRITE_FRAME }];
}

/**
 * Создает шаблон для кадров анимации покоя
 * @param row Ряд в спрайтовом листе
 * @returns Массив кадров для анимации
 */
function createIdleFrames(row: number) {
  // Используем второй кадр (индекс 1) для всех направлений согласно требованиям
  return [{ x: SPRITE_FRAME.width, y: row * SPRITE_FRAME.height, ...SPRITE_FRAME }];
}

/**
 * Конфигурация спрайта для первого игрока
 */
export const player1SpriteConfig: PlayerSpriteConfig = {
  spriteSheet: '/sprites/female.png', // Путь к спрайту первого игрока
  frameWidth: SPRITE_FRAME.width,
  frameHeight: SPRITE_FRAME.height,
  animations: {
    idle: {
      down: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION }
    },
    walk: {
      up: { frames: createWalkFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createWalkFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      down: { frames: createWalkFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createWalkFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    attack: {
      down: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION }
    },
    defend: {
      down: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION }
    }
  }
};

/**
 * Конфигурация спрайта для второго игрока
 */
export const player2SpriteConfig: PlayerSpriteConfig = {
  spriteSheet: '/sprites/male.png', // Путь к спрайту второго игрока
  frameWidth: SPRITE_FRAME.width,
  frameHeight: SPRITE_FRAME.height,
  animations: {
    idle: {
      down: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    walk: {
      up: { frames: createWalkFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createWalkFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      down: { frames: createWalkFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createWalkFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    attack: {
      down: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    defend: {
      down: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    }
  }
};