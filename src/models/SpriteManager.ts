import { ref, computed } from 'vue';
import type { Position } from '../types';

/**
 * Типы направления персонажа
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Типы анимации персонажа
 */
export type AnimationType = 'idle' | 'walk' | 'attack' | 'defend';

/**
 * Информация о кадре спрайта
 */
export interface SpriteFrame {
  x: number;       // X-координата на спрайтовом листе
  y: number;       // Y-координата на спрайтовом листе
  width: number;   // Ширина кадра
  height: number;  // Высота кадра
}

/**
 * Конфигурация спрайта персонажа
 */
export interface PlayerSpriteConfig {
  spriteSheet: string;  // Путь к изображению спрайтового листа
  frameWidth: number;   // Ширина одного кадра
  frameHeight: number;  // Высота одного кадра
  animations: {
    [key in AnimationType]: {
      [key in Direction]: {
        frames: SpriteFrame[];   // Кадры для конкретной анимации и направления
        frameDuration: number;   // Длительность каждого кадра в мс
      }
    }
  }
}

/**
 * Класс для управления спрайтами персонажей
 */
export class SpriteManager {
  // Спрайты игроков
  private playerSprites = ref<Record<string, PlayerSpriteConfig>>({});
  
  // Текущие анимации игроков
  private currentAnimations = ref<Record<string, {
    type: AnimationType;
    direction: Direction;
    currentFrame: number;
    lastFrameTime: number;
  }>>({});

  // Позиции игроков для определения направления движения
  private lastPositions = ref<Record<string, Position>>({});

  /**
   * Регистрирует конфигурацию спрайта для игрока
   * @param playerId ID игрока
   * @param config Конфигурация спрайта
   */
  public registerPlayerSprite(playerId: string, config: PlayerSpriteConfig): void {
    this.playerSprites.value[playerId] = config;
    this.currentAnimations.value[playerId] = {
      type: 'idle',
      direction: 'down',
      currentFrame: 0,
      lastFrameTime: Date.now()
    };
  }

  /**
   * Определяет направление на основе предыдущей и текущей позиции
   * @param prevPos Предыдущая позиция
   * @param currentPos Текущая позиция
   * @returns Направление
   */
  private determineDirection(prevPos: Position, currentPos: Position): Direction {
    // Базовая логика определения направления
    if (prevPos.x < currentPos.x) return 'right';
    if (prevPos.x > currentPos.x) return 'left';
    if (prevPos.y < currentPos.y) return 'down';
    if (prevPos.y > currentPos.y) return 'up';
    
    // Если аниманий нет или позиция не изменилась, используем значение по умолчанию
    const animKeys = Object.keys(this.currentAnimations.value);
    if (animKeys.length > 0) {
      return this.currentAnimations.value[animKeys[0]]?.direction || 'down';
    }
    return 'down'; // Значение по умолчанию
  }

  /**
   * Запускает анимацию определенного типа для игрока
   * @param playerId ID игрока
   * @param animType Тип анимации
   * @param position Текущая позиция (для определения направления)
   */
  public playAnimation(playerId: string, animType: AnimationType, position: Position): void {
    if (!this.playerSprites.value[playerId]) {
      console.error(`Спрайт для игрока ${playerId} не зарегистрирован`);
      return;
    }

    // Определяем направление на основе предыдущей позиции
    let direction: Direction = 'down';
    if (this.lastPositions.value[playerId]) {
      direction = this.determineDirection(this.lastPositions.value[playerId], position);
    }
    
    // Обновляем последнюю позицию
    this.lastPositions.value[playerId] = { ...position };

    // Устанавливаем текущую анимацию
    this.currentAnimations.value[playerId] = {
      type: animType,
      direction,
      currentFrame: 0,
      lastFrameTime: Date.now()
    };
  }

  /**
   * Обновляет текущий кадр анимации на основе прошедшего времени
   * @param playerId ID игрока
   */
  public updateAnimation(playerId: string): void {
    const animation = this.currentAnimations.value[playerId];
    const config = this.playerSprites.value[playerId];

    if (!animation || !config) return;

    const now = Date.now();
    const animConfig = config.animations[animation.type][animation.direction];
    
    // Проверяем, прошло ли достаточно времени для обновления кадра
    if (now - animation.lastFrameTime >= animConfig.frameDuration) {
      // Обновляем кадр
      animation.currentFrame = (animation.currentFrame + 1) % animConfig.frames.length;
      animation.lastFrameTime = now;
    }
  }

  /**
   * Возвращает текущий кадр для отрисовки
   * @param playerId ID игрока
   * @returns Информация о текущем кадре или null, если спрайт не найден
   */
  public getCurrentFrame(playerId: string): SpriteFrame | null {
    const animation = this.currentAnimations.value[playerId];
    const config = this.playerSprites.value[playerId];

    if (!animation || !config) return null;

    const animConfig = config.animations[animation.type][animation.direction];
    return animConfig.frames[animation.currentFrame];
  }

  /**
   * Возвращает путь к спрайтовому листу для игрока
   * @param playerId ID игрока
   * @returns Путь к спрайтовому листу или null, если спрайт не найден
   */
  public getSpriteSheet(playerId: string): string | null {
    return this.playerSprites.value[playerId]?.spriteSheet || null;
  }

  /**
   * Получает CSS для отображения текущего кадра
   * @param playerId ID игрока
   * @returns CSS стили для отображения или null, если спрайт не найден
   */
  public getSpriteCss(playerId: string): Record<string, string> | null {
    const frame = this.getCurrentFrame(playerId);
    const spriteSheet = this.getSpriteSheet(playerId);

    if (!frame || !spriteSheet) return null;

    return {
      width: `${frame.width}px`,
      height: `${frame.height}px`,
      backgroundImage: `url(${spriteSheet})`,
      backgroundPosition: `-${frame.x}px -${frame.y}px`,
      backgroundRepeat: 'no-repeat'
    };
  }
}