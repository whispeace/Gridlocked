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
 * @returns Массив кадров для анимации
 */
function createAttackFrames(row: number) {
  // Упрощенная версия - используем те же кадры что и для ходьбы
  // В реальной игре здесь были бы кадры атаки
  return createWalkFrames(row);
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
  // Используем только первый кадр ходьбы
  return [{ x: 0, y: row * SPRITE_FRAME.height, ...SPRITE_FRAME }];
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
      down: { frames: createIdleFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createIdleFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    walk: {
      down: { frames: createWalkFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createWalkFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createWalkFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createWalkFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    attack: {
      down: { frames: createAttackFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createAttackFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createAttackFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createAttackFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    defend: {
      down: { frames: createDefendFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createDefendFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createDefendFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createDefendFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
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
      down: { frames: createIdleFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createIdleFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createIdleFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createIdleFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    walk: {
      down: { frames: createWalkFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createWalkFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createWalkFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createWalkFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    attack: {
      down: { frames: createAttackFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createAttackFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createAttackFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createAttackFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    },
    defend: {
      down: { frames: createDefendFrames(0), frameDuration: DEFAULT_FRAME_DURATION },
      left: { frames: createDefendFrames(1), frameDuration: DEFAULT_FRAME_DURATION },
      right: { frames: createDefendFrames(2), frameDuration: DEFAULT_FRAME_DURATION },
      up: { frames: createDefendFrames(3), frameDuration: DEFAULT_FRAME_DURATION }
    }
  }
};