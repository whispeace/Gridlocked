<template>
  <div class="player-panel" :class="{ active: isActive }">
    <div class="player-header">
      <h3>{{ playerName }}</h3>
      <div v-if="isDefending" class="defending-badge">
        Защита
      </div>
    </div>
    
    <div class="player-stats">
      <div class="stat-item health">
        <div class="stat-icon">❤️</div>
        <div class="stat-bar-container">
          <div class="stat-bar">
            <div class="stat-fill health-fill" :style="{ width: `${getHealthPercentage()}%` }"></div>
          </div>
          <div class="stat-label">
            <span class="stat-name">Здоровье</span>
            <span class="stat-value">{{ resources?.health || 0 }}</span>
          </div>
        </div>
      </div>
      
      <div class="stat-item shield">
        <div class="stat-icon">🛡️</div>
        <div class="stat-bar-container">
          <div class="stat-bar">
            <div class="stat-fill shield-fill" :style="{ width: `${getResourcePercentage('shield', 5)}%` }"></div>
          </div>
          <div class="stat-label">
            <span class="stat-name">Щиты</span>
            <span class="stat-value">{{ resources?.shield || 0 }}</span>
          </div>
        </div>
      </div>
      
      <div class="stat-item ammo">
        <div class="stat-icon">🔫</div>
        <div class="stat-bar-container">
          <div class="stat-bar">
            <div class="stat-fill ammo-fill" :style="{ width: `${getResourcePercentage('ammo', 20)}%` }"></div>
          </div>
          <div class="stat-label">
            <span class="stat-name">Патроны</span>
            <span class="stat-value">{{ resources?.ammo || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="weapon-info">
      <div class="weapon-label">Оружие:</div>
      <div class="active-weapon">{{ activeWeapon }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Resources {
  health: number;
  shield: number;
  ammo: number;
}

interface Props {
  playerId: string;
  isActive: boolean;
  resources?: Resources;
  activeWeapon: string;
  isDefending: boolean;
}

const props = defineProps<Props>();

const playerName = computed(() => 
  props.playerId === 'player1' ? 'Игрок 1' : 'Игрок 2'
);

// Расчеты для отображения полосок ресурсов
const getHealthPercentage = () => {
  const health = props.resources?.health || 0;
  return Math.min(100, Math.max(0, health));
};

const getResourcePercentage = (resourceType: 'shield' | 'ammo', maxValue: number) => {
  const value = props.resources?.[resourceType] || 0;
  return Math.min(100, (value / maxValue) * 100);
};
</script>

<style scoped>
.player-panel {
  width: 220px;
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(to bottom, #ecf0f1, #d6dbdf);
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
}

.player-panel.active {
  background: linear-gradient(to bottom, #e8f5e9, #c8e6c9);
  box-shadow: 0 3px 12px rgba(46, 204, 113, 0.3);
  transform: translateY(-3px);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
  font-weight: 600;
}

.defending-badge {
  background-color: #2ecc71;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  animation: pulse 2s infinite;
}

.player-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-icon {
  font-size: 18px;
  width: 22px;
  text-align: center;
}

.stat-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-bar {
  height: 12px;
  background-color: rgba(0,0,0,0.1);
  border-radius: 6px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.health-fill {
  background: linear-gradient(to right, #e74c3c, #c0392b);
}

.shield-fill {
  background: linear-gradient(to right, #3498db, #2980b9);
}

.ammo-fill {
  background: linear-gradient(to right, #f39c12, #d35400);
}

.stat-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #7f8c8d;
}

.stat-value {
  font-weight: 600;
  color: #2c3e50;
}

.weapon-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: rgba(0,0,0,0.05);
  padding: 10px;
  border-radius: 6px;
}

.weapon-label {
  font-size: 14px;
  color: #7f8c8d;
}

.active-weapon {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

/* Анимация */
@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

/* Мобильная адаптация */
@media (max-width: 900px) {
  .player-panel {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .player-header {
    width: 100%;
  }
  
  .player-stats {
    flex: 1;
  }
  
  .weapon-info {
    width: 120px;
  }
}

@media (max-width: 600px) {
  .player-panel {
    flex-direction: column;
  }
  
  .weapon-info {
    width: 100%;
  }
}
</style>