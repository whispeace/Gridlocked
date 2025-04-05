<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import type { Projectile, ProjectileManager } from '../models/ProjectileEffects';
import type { Position } from '../types';

interface Props {
  projectile: Projectile;
  projectileManager: ProjectileManager;
  cellSize: number; // размер клетки в пикселях
}

const props = defineProps<Props>();

// Текущее положение снаряда в клетках (относительные координаты)
const position = ref<Position>({ 
  x: props.projectile.startPosition.x, 
  y: props.projectile.startPosition.y 
});

// Функция для перевода координат игрового поля в пиксели на экране
const positionStyle = computed(() => {
  return {
    left: `${position.value.x * props.cellSize + props.cellSize / 2}px`,
    top: `${position.value.y * props.cellSize + props.cellSize / 2}px`
  };
});

// CSS-классы в зависимости от типа снаряда
const projectileClass = computed(() => {
  return {
    'projectile': true,
    [`projectile-${props.projectile.type}`]: true,
    'projectile-completed': props.projectile.completed
  };
});

// Угол поворота для снаряда (чтобы он был направлен в сторону цели)
const rotationStyle = computed(() => {
  const dx = props.projectile.targetPosition.x - props.projectile.startPosition.x;
  const dy = props.projectile.targetPosition.y - props.projectile.startPosition.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  return {
    transform: `translate(-50%, -50%) rotate(${angle}deg)`
  };
});

// ID анимации
let animationFrameId: number | null = null;

// Функция обновления положения снаряда
function updatePosition() {
  const newPosition = props.projectileManager.getProjectilePosition(props.projectile.id);
  
  if (newPosition) {
    position.value = newPosition;
  }
  
  // Продолжаем анимацию, если снаряд ещё не достиг цели
  if (!props.projectile.completed) {
    animationFrameId = requestAnimationFrame(updatePosition);
  }
}

// Запускаем анимацию при создании компонента
onMounted(() => {
  animationFrameId = requestAnimationFrame(updatePosition);
});

// Очищаем ресурсы при удалении компонента
onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<template>
  <div 
    class="projectile-container" 
    :style="positionStyle"
  >
    <div 
      :class="projectileClass"
      :style="rotationStyle"
    >
      <!-- Иконка в зависимости от типа снаряда -->
      <template v-if="projectile.type === 'bullet'">•</template>
      <template v-else-if="projectile.type === 'laser'">━━━</template>
      <template v-else-if="projectile.type === 'rocket'">⮞</template>
      <template v-else-if="projectile.type === 'grenade'">●</template>
    </div>
  </div>
</template>

<style scoped>
.projectile-container {
  position: absolute;
  pointer-events: none;
  z-index: 20;
}

.projectile {
  position: relative;
  transition: transform 0.1s ease;
}

.projectile-bullet {
  font-size: 12px;
  color: #333;
  filter: drop-shadow(0 0 3px rgba(255, 255, 0, 0.7));
}

.projectile-laser {
  font-size: 8px;
  color: #f00;
  filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.9));
}

.projectile-rocket {
  font-size: 16px;
  color: #f50;
  filter: drop-shadow(0 0 3px rgba(255, 80, 0, 0.7));
}

.projectile-grenade {
  font-size: 14px;
  color: #060;
  filter: drop-shadow(0 0 3px rgba(0, 100, 0, 0.7));
}

.projectile-completed {
  opacity: 0;
  transition: opacity 0.1s ease-out;
}
</style>