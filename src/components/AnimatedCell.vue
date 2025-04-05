<script setup lang="ts">
import { computed } from 'vue';
import type { CellAnimator } from '../models/CellAnimator';
import type { Position } from '../types';

interface Props {
  position: Position;
  cellAnimator: CellAnimator;
}

const props = defineProps<Props>();

// Получаем все анимации для текущей клетки
const cellAnimations = computed(() => 
  props.cellAnimator.getCellAnimations(props.position)
);

// Динамические стили на основе типов анимаций
const animationStyles = computed(() => {
  // Базовые стили
  const styles: Record<string, string> = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  };
  
  // Если анимаций нет - возвращаем пустые стили
  if (cellAnimations.value.length === 0) {
    return styles;
  }
  
  // Проверяем наличие определенных типов анимаций
  const hasHighlight = cellAnimations.value.some(a => a.type === 'highlight');
  const hasShake = cellAnimations.value.some(a => a.type === 'shake');
  const hasDamage = cellAnimations.value.some(a => a.type === 'damage');
  const hasHeal = cellAnimations.value.some(a => a.type === 'heal');
  const hasSelect = cellAnimations.value.some(a => a.type === 'select');
  
  // Добавляем соответствующие стили
  if (hasHighlight) {
    const highlightAnim = cellAnimations.value.find(a => a.type === 'highlight');
    if (highlightAnim?.color) {
      styles.boxShadow = `inset 0 0 15px ${highlightAnim.color}`;
    }
  }
  
  if (hasShake) {
    styles.animation = 'cell-shake 0.4s ease';
  }
  
  if (hasDamage) {
    styles.animation = 'cell-damage 0.5s ease';
    styles.backgroundColor = 'rgba(255, 0, 0, 0.3)';
  }
  
  if (hasHeal) {
    styles.animation = 'cell-heal 0.8s ease';
    styles.backgroundColor = 'rgba(0, 255, 0, 0.3)';
  }
  
  if (hasSelect) {
    styles.animation = 'cell-select 2s infinite';
    styles.border = '2px solid #fff';
    styles.boxSizing = 'border-box';
  }
  
  return styles;
});

// CSS-классы на основе типов анимаций
const animationClasses = computed(() => {
  const classes: Record<string, boolean> = {
    'animated-cell': true
  };
  
  // Добавляем классы для каждого типа анимации
  cellAnimations.value.forEach(animation => {
    classes[`cell-animation-${animation.type}`] = true;
  });
  
  return classes;
});
</script>

<template>
  <div v-if="cellAnimations.length > 0" :class="animationClasses" :style="animationStyles"></div>
</template>

<style scoped>
.animated-cell {
  z-index: 5;
}

@keyframes cell-shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-3px); }
  100% { transform: translateX(0); }
}

@keyframes cell-damage {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes cell-heal {
  0% { opacity: 0; transform: scale(0.9); }
  50% { opacity: 0.7; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1); }
}

@keyframes cell-select {
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
}
</style>