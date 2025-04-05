<script setup lang="ts">
import { computed } from 'vue';
import type { VisualEffect } from '../types';

interface Props {
  effect: VisualEffect & { id: number };
}

const props = defineProps<Props>();

// Определяем CSS классы на основе типа эффекта
const effectClass = computed(() => {
  return {
    'effect': true,
    'effect-explosion': props.effect.type === 'explosion',
    'effect-heal': props.effect.type === 'heal',
    'effect-shield': props.effect.type === 'shield',
    'effect-miss': props.effect.type === 'miss'
  };
});

// Определяем контент эффекта в зависимости от его типа
const effectContent = computed(() => {
  switch (props.effect.type) {
    case 'explosion':
      return '💥';
    case 'heal':
      return '❤️';
    case 'shield':
      return '🛡️';
    case 'miss':
      return '❌';
    default:
      return '';
  }
});
</script>

<template>
  <div :class="effectClass" :key="effect.id">
    <div class="effect-content">{{ effectContent }}</div>
  </div>
</template>

<style scoped>
.effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none; /* Чтобы эффект не блокировал клики */
  z-index: 10;
}

.effect-content {
  font-size: 28px;
  transform-origin: center;
  animation: effect-animation 0.6s ease-out;
}

.effect-explosion .effect-content {
  animation: explosion-animation 0.6s ease-out;
}

.effect-heal .effect-content {
  animation: heal-animation 0.8s ease-out;
}

.effect-shield .effect-content {
  animation: shield-animation 1s ease-out;
}

.effect-miss .effect-content {
  animation: miss-animation 0.5s ease-out;
  opacity: 0.7;
}

@keyframes effect-animation {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}

@keyframes explosion-animation {
  0% { transform: scale(0); opacity: 0; }
  20% { transform: scale(1.5); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes heal-animation {
  0% { transform: scale(0) translateY(0); opacity: 0; }
  50% { transform: scale(1) translateY(-10px); opacity: 1; }
  100% { transform: scale(1) translateY(-20px); opacity: 0; }
}

@keyframes shield-animation {
  0% { transform: scale(0); opacity: 0; }
  30% { transform: scale(1.2); opacity: 1; }
  70% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.1); opacity: 0; }
}

@keyframes miss-animation {
  0% { transform: translateY(0) rotate(0); opacity: 0; }
  30% { transform: translateY(-5px) rotate(10deg); opacity: 1; }
  100% { transform: translateY(-15px) rotate(-10deg); opacity: 0; }
}
</style>