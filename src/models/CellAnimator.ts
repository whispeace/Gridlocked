import { ref } from 'vue';
import type { Position } from '../types';

/**
 * Типы анимации клеток игрового поля
 */
export type CellAnimationType = 
  | 'highlight'   // Подсветка клетки
  | 'select'      // Выбор клетки
  | 'damage'      // Получение урона
  | 'heal'        // Лечение
  | 'move'        // Перемещение
  | 'shake';      // Тряска клетки

/**
 * Информация об анимации клетки
 */
export interface CellAnimation {
  id: number;
  type: CellAnimationType;
  position: Position;
  startTime: number;
  duration: number;
  intensity?: number; // Интенсивность эффекта (от 0 до 1)
  color?: string;     // Цвет для подсветки
}

/**
 * Управляет анимациями клеток игрового поля
 */
export class CellAnimator {
  // Активные анимации клеток
  private cellAnimations = ref<CellAnimation[]>([]);
  private lastAnimationId = 0;

  /**
   * Создает новую анимацию клетки
   * @returns ID созданной анимации
   */
  public animateCell(
    type: CellAnimationType,
    position: Position,
    duration: number,
    options?: { intensity?: number; color?: string }
  ): number {
    const id = ++this.lastAnimationId;
    
    this.cellAnimations.value.push({
      id,
      type,
      position: { ...position },
      startTime: Date.now(),
      duration,
      ...options
    });
    
    // Автоматическое удаление анимации после истечения срока
    setTimeout(() => this.removeAnimation(id), duration);
    
    return id;
  }

  /**
   * Удаляет анимацию по ID
   */
  public removeAnimation(id: number): void {
    const index = this.cellAnimations.value.findIndex(a => a.id === id);
    if (index !== -1) {
      this.cellAnimations.value.splice(index, 1);
    }
  }

  /**
   * Удаляет все анимации для указанной клетки
   */
  public clearCellAnimations(position: Position): void {
    this.cellAnimations.value = this.cellAnimations.value.filter(
      a => a.position.x !== position.x || a.position.y !== position.y
    );
  }

  /**
   * Проверяет, есть ли анимация указанного типа на клетке
   */
  public hasCellAnimation(position: Position, type?: CellAnimationType): boolean {
    return this.cellAnimations.value.some(
      a => a.position.x === position.x && a.position.y === position.y && 
           (type ? a.type === type : true)
    );
  }

  /**
   * Возвращает все анимации для указанной клетки
   */
  public getCellAnimations(position: Position): CellAnimation[] {
    return this.cellAnimations.value.filter(
      a => a.position.x === position.x && a.position.y === position.y
    );
  }

  /**
   * Возвращает все активные анимации
   */
  public getAllAnimations(): CellAnimation[] {
    return [...this.cellAnimations.value];
  }

  /**
   * Подсвечивает клетку указанным цветом
   */
  public highlightCell(position: Position, color: string = '#fff', duration: number = 1000): number {
    return this.animateCell('highlight', position, duration, { color });
  }

  /**
   * Создает анимацию выбора клетки
   */
  public selectCell(position: Position, duration: number = 2000): number {
    return this.animateCell('select', position, duration);
  }

  /**
   * Создает анимацию получения урона для клетки
   */
  public damageCell(position: Position, intensity: number = 1, duration: number = 500): number {
    return this.animateCell('damage', position, duration, { intensity });
  }

  /**
   * Создает анимацию лечения для клетки
   */
  public healCell(position: Position, duration: number = 800): number {
    return this.animateCell('heal', position, duration);
  }

  /**
   * Создает анимацию перемещения для клетки
   */
  public moveCell(position: Position, duration: number = 300): number {
    return this.animateCell('move', position, duration);
  }

  /**
   * Создает анимацию тряски для клетки
   */
  public shakeCell(position: Position, intensity: number = 1, duration: number = 400): number {
    return this.animateCell('shake', position, duration, { intensity });
  }
}