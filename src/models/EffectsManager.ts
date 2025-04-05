import { ref } from 'vue';
import type { Position, VisualEffect } from '../types';

/**
 * Класс для управления визуальными эффектами на игровом поле
 */
export class EffectsManager {
  // Активные визуальные эффекты
  private activeEffects = ref<Array<VisualEffect & { id: number, startTime: number }>>([]);
  private lastEffectId = 0;

  /**
   * Создает новый визуальный эффект
   * @param type Тип эффекта
   * @param position Позиция на поле
   * @param duration Длительность эффекта в мс
   * @returns ID созданного эффекта
   */
  public createEffect(type: VisualEffect['type'], position: Position, duration: number): number {
    const id = ++this.lastEffectId;
    
    this.activeEffects.value.push({
      id,
      type,
      position,
      duration,
      startTime: Date.now()
    });
    
    // Удаляем эффект после истечения его длительности
    setTimeout(() => {
      this.removeEffect(id);
    }, duration);
    
    return id;
  }

  /**
   * Удаляет визуальный эффект по ID
   * @param id ID эффекта
   */
  public removeEffect(id: number): void {
    const index = this.activeEffects.value.findIndex(effect => effect.id === id);
    if (index !== -1) {
      this.activeEffects.value.splice(index, 1);
    }
  }

  /**
   * Проверяет, есть ли активный эффект на указанной позиции
   * @param position Позиция на поле
   * @param type Опциональный тип эффекта для проверки
   * @returns Найденный эффект или null
   */
  public getEffectAt(position: Position, type?: VisualEffect['type']): (VisualEffect & { id: number }) | null {
    const effect = this.activeEffects.value.find(e => 
      e.position.x === position.x && 
      e.position.y === position.y &&
      (type ? e.type === type : true)
    );
    
    return effect ? { ...effect } : null;
  }

  /**
   * Возвращает все активные эффекты
   * @returns Массив активных эффектов
   */
  public getAllEffects(): Array<VisualEffect & { id: number }> {
    return [...this.activeEffects.value];
  }

  /**
   * Создает эффект взрыва на указанной позиции
   * @param position Позиция на поле
   * @returns ID созданного эффекта
   */
  public createExplosion(position: Position): number {
    return this.createEffect('explosion', position, 800);
  }

  /**
   * Создает эффект лечения на указанной позиции
   * @param position Позиция на поле
   * @returns ID созданного эффекта
   */
  public createHeal(position: Position): number {
    return this.createEffect('heal', position, 1000);
  }

  /**
   * Создает эффект щита на указанной позиции
   * @param position Позиция на поле
   * @returns ID созданного эффекта
   */
  public createShield(position: Position): number {
    return this.createEffect('shield', position, 1200);
  }

  /**
   * Создает эффект промаха на указанной позиции
   * @param position Позиция на поле
   * @returns ID созданного эффекта
   */
  public createMiss(position: Position): number {
    return this.createEffect('miss', position, 500);
  }
}