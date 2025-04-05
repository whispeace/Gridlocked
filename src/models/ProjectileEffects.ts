import { ref } from 'vue';
import type { Position } from '../types';

/**
 * Типы снарядов
 */
export type ProjectileType = 'bullet' | 'laser' | 'rocket' | 'grenade';

/**
 * Информация о летящем снаряде
 */
export interface Projectile {
  id: number;
  type: ProjectileType;
  startPosition: Position;
  targetPosition: Position;
  startTime: number;
  duration: number;
  completed: boolean;
}

/**
 * Менеджер анимации снарядов
 */
export class ProjectileManager {
  // Активные снаряды
  private projectiles = ref<Projectile[]>([]);
  private lastId = 0;

  /**
   * Добавляет снаряд для анимации
   * @returns ID созданного снаряда
   */
  public createProjectile(
    type: ProjectileType,
    start: Position,
    target: Position,
    duration: number
  ): number {
    const id = ++this.lastId;
    
    this.projectiles.value.push({
      id,
      type,
      startPosition: { ...start },
      targetPosition: { ...target },
      startTime: Date.now(),
      duration,
      completed: false
    });
    
    // Автоматически отмечаем снаряд как завершенный после истечения времени
    setTimeout(() => {
      const projectile = this.projectiles.value.find(p => p.id === id);
      if (projectile) {
        projectile.completed = true;
        
        // Удаляем снаряд после небольшой задержки (чтобы анимация успела завершиться)
        setTimeout(() => this.removeProjectile(id), 100);
      }
    }, duration);
    
    return id;
  }

  /**
   * Удаляет снаряд по ID
   */
  public removeProjectile(id: number): void {
    const index = this.projectiles.value.findIndex(p => p.id === id);
    if (index !== -1) {
      this.projectiles.value.splice(index, 1);
    }
  }

  /**
   * Возвращает все активные снаряды
   */
  public getActiveProjectiles(): Projectile[] {
    return [...this.projectiles.value];
  }

  /**
   * Рассчитывает текущую позицию снаряда на основе времени
   */
  public getProjectilePosition(projectileId: number): Position | null {
    const projectile = this.projectiles.value.find(p => p.id === projectileId);
    if (!projectile) return null;
    
    const elapsed = Date.now() - projectile.startTime;
    
    // Если снаряд уже завершил свое движение, возвращаем его целевую позицию
    if (elapsed >= projectile.duration || projectile.completed) {
      return projectile.targetPosition;
    }
    
    // Процент завершения анимации (от 0 до 1)
    const progress = Math.min(1, elapsed / projectile.duration);
    
    // Линейная интерполяция между начальной и конечной позицией
    return {
      x: projectile.startPosition.x + (projectile.targetPosition.x - projectile.startPosition.x) * progress,
      y: projectile.startPosition.y + (projectile.targetPosition.y - projectile.startPosition.y) * progress
    };
  }

  /**
   * Создает снаряд типа "пуля" от одной позиции к другой
   */
  public createBullet(start: Position, target: Position): number {
    return this.createProjectile('bullet', start, target, 300);
  }

  /**
   * Создает снаряд типа "лазер" от одной позиции к другой
   */
  public createLaser(start: Position, target: Position): number {
    return this.createProjectile('laser', start, target, 200);
  }

  /**
   * Создает снаряд типа "ракета" от одной позиции к другой
   */
  public createRocket(start: Position, target: Position): number {
    return this.createProjectile('rocket', start, target, 600);
  }

  /**
   * Создает снаряд типа "граната" от одной позиции к другой
   */
  public createGrenade(start: Position, target: Position): number {
    return this.createProjectile('grenade', start, target, 800);
  }
}