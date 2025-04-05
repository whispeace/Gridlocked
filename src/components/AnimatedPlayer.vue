<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import type { SpriteManager, AnimationType } from '../models/SpriteManager';
import type { Position } from '../types';

interface Props {
  playerId: string;
  position: Position;
  spriteManager: SpriteManager;
  isDefending: boolean;
}

const props = defineProps<Props>();

// Состояние анимации
const animationFrameId = ref<number | null>(null);
const spriteStyle = ref<Record<string, string>>({});

// Запуск цикла анимации
function startAnimationLoop() {
  function updateFrame() {
    props.spriteManager.updateAnimation(props.playerId);
    const css = props.spriteManager.getSpriteCss(props.playerId);
    if (css) {
      spriteStyle.value = css;
    }
    
    // Продолжаем цикл анимации
    animationFrameId.value = requestAnimationFrame(updateFrame);
  }
  
  animationFrameId.value = requestAnimationFrame(updateFrame);
}

// Остановка цикла анимации
function stopAnimationLoop() {
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }
}

// Запуск цикла анимации при монтировании компонента
onMounted(() => {
  console.log(`Монтирование компонента AnimatedPlayer для ${props.playerId}`);
  
  // Запускаем цикл анимации
  startAnimationLoop();
  
  // Уже не нужно запускать анимацию здесь, она инициализируется в GameBoard
});

// Очистка при размонтировании
onBeforeUnmount(() => {
  stopAnimationLoop();
});

// Отслеживаем изменение состояния защиты
watch(() => props.isDefending, (newValue) => {
  if (newValue) {
    props.spriteManager.playAnimation(props.playerId, 'defend', props.position);
  } else {
    props.spriteManager.playAnimation(props.playerId, 'idle', props.position);
  }
});

// Отслеживание позиции не нужно, так как анимации управляются напрямую через GameBoard
// Все анимации запускаются централизованно через spriteManager

// Больше не используем этот метод, так как вызываем анимации напрямую через SpriteManager
// Экспортируем пустой интерфейс
defineExpose({});
</script>

<template>
  <div class="animated-player">
    <div class="sprite" :style="spriteStyle"></div>
    <!-- Индикатор защиты, если игрок защищается -->
    <div v-if="isDefending" class="shield-indicator"></div>
  </div>
</template>

<style scoped>
.animated-player {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sprite {
  /* Базовые стили для спрайта, конкретные размеры и положение будут установлены динамически */
  transform: scale(1.5); /* Масштабирование спрайта для соответствия размеру клетки */
  transition: transform 0.2s ease; /* Плавное изменение масштаба */
}

.shield-indicator {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #2ecc71;
  box-sizing: border-box;
  animation: pulse 1.5s infinite;
  pointer-events: none; /* Чтобы не блокировать клики */
}

@keyframes pulse {
  0% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.7; transform: scale(1); }
}
</style>