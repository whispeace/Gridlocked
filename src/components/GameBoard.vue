<template>
  <div class="game-container">
    <!-- Верхняя панель с информацией о ходе -->
    <div class="turn-indicator-panel">
      <div class="turn-number">Ход: {{ currentTurn }}</div>
      <div class="action-tooltip" v-if="actionTooltip">{{ actionTooltip }}</div>
    </div>

    <!-- Основная секция игрового поля с панелями игроков по бокам -->
    <div class="main-section">
      <!-- Панель игрока 1 -->
      <PlayerPanel :player-id="'player1'" :is-active="currentPlayerId === 'player1'"
        :resources="gameEngine.gameState.value.players.player1?.resources" :active-weapon="getActiveWeapon('player1')"
        :is-defending="gameEngine.gameState.value.players.player1?.isDefending" />

      <!-- Игровое поле -->
      <div class="game-board">
        <div class="grid">
          <div v-for="y in 3" :key="`row-${y}`" class="grid-row">
            <!-- Поле игрока 1 -->
            <div v-for="x in 3" :key="`cell-p1-${x - 1}-${y - 1}`" class="grid-cell"
              :class="getCellClasses(x - 1, y - 1)" @click="handleCellClick(x - 1, y - 1)"
              @mouseover="handleCellHover(x - 1, y - 1)" @mouseleave="handleCellLeave">
              <AnimatedCell :position="{ x: x - 1, y: y - 1 }" :cell-animator="cellAnimator" />
              <AnimatedPlayer v-if="isPlayerAt('player1', x - 1, y - 1)" ref="player1Ref" playerId="player1"
                :position="gameEngine.gameState.value.players.player1.position" :sprite-manager="spriteManager"
                :is-defending="gameEngine.gameState.value.players.player1?.isDefending" />

              <AnimatedPlayer v-if="isPlayerAt('player2', x - 1, y - 1)" ref="player2Ref" playerId="player2"
                :position="gameEngine.gameState.value.players.player2.position" :sprite-manager="spriteManager"
                :is-defending="gameEngine.gameState.value.players.player2?.isDefending" />

              <div v-if="getCellTerrain(x - 1, y - 1).type !== 'empty'" class="terrain-marker"
                :class="getCellTerrain(x - 1, y - 1).type">
                {{ getTerrainSymbol(getCellTerrain(x - 1, y - 1).type) }}
              </div>
            </div>

            <!-- Центральная разделительная линия -->
            <div class="board-divider"></div>

            <!-- Поле игрока 2 -->
            <div v-for="x in 3" :key="`cell-p2-${x + 2}-${y - 1}`" class="grid-cell"
              :class="getCellClasses(x + 2, y - 1)" @click="handleCellClick(x + 2, y - 1)"
              @mouseover="handleCellHover(x + 2, y - 1)" @mouseleave="handleCellLeave">

              <AnimatedCell :position="{ x: x + 2, y: y - 1 }" :cell-animator="cellAnimator" />
              <AnimatedPlayer v-if="isPlayerAt('player1', x + 2, y - 1)" ref="player1Ref" playerId="player1"
                :position="gameEngine.gameState.value.players.player1.position" :sprite-manager="spriteManager"
                :is-defending="gameEngine.gameState.value.players.player1?.isDefending" />

              <AnimatedPlayer v-if="isPlayerAt('player2', x + 2, y - 1)" ref="player2Ref" playerId="player2"
                :position="gameEngine.gameState.value.players.player2.position" :sprite-manager="spriteManager"
                :is-defending="gameEngine.gameState.value.players.player2?.isDefending" />

              <div v-if="getCellTerrain(x + 2, y - 1).type !== 'empty'" class="terrain-marker"
                :class="getCellTerrain(x + 2, y - 1).type">
                {{ getTerrainSymbol(getCellTerrain(x + 2, y - 1).type) }}
              </div>
            </div>
          </div>
        </div>
        <!-- Контейнер для всех визуальных эффектов -->
        <div class="effects-container">
          <!-- Визуальные эффекты (взрывы, щиты, лечение) -->
          <template v-for="effect in effectsManager.getAllEffects()" :key="effect.id">
            <div class="effect-wrapper" :style="{
              left: `${effect.position.x * CELL_SIZE}px`,
              top: `${effect.position.y * CELL_SIZE}px`
            }">
              <VisualEffectComponent :effect="effect" />
            </div>
          </template>

          <!-- Летящие снаряды -->
          <template v-for="projectile in projectileManager.getActiveProjectiles()" :key="projectile.id">
            <ProjectileComponent :projectile="projectile" :projectile-manager="projectileManager"
              :cell-size="CELL_SIZE" />
          </template>
        </div>


        <!-- Подсказка при наведении на клетку -->
        <div v-if="hoverInfo" class="cell-tooltip" :style="{ top: hoverInfo.y + 'px', left: hoverInfo.x + 'px' }">
          {{ hoverInfo.message }}
        </div>
      </div>

      <!-- Панель игрока 2 -->
      <PlayerPanel :player-id="'player2'" :is-active="currentPlayerId === 'player2'"
        :resources="gameEngine.gameState.value.players.player2?.resources" :active-weapon="getActiveWeapon('player2')"
        :is-defending="gameEngine.gameState.value.players.player2?.isDefending" />
    </div>

    <!-- Панель действий -->
    <div class="action-panel">
      <div class="action-buttons">
        <button v-for="action in availableActions" :key="action" @click="selectAction(action)"
          :class="{ active: selectedAction === action, disabled: !isActionAvailable(action) }"
          :disabled="!isActionAvailable(action)" :title="getActionTooltip(action)">
          <div class="action-icon">{{ getActionIcon(action) }}</div>
          <span>{{ getActionName(action) }}</span>
        </button>
      </div>

      <div class="status-message">
        <p v-if="statusMessage">{{ statusMessage }}</p>
        <p v-else>Выберите действие</p>
      </div>
    </div>

    <!-- Модальное окно с подсказками правил игры -->
    <div class="help-button" @click="showHelp = !showHelp">?</div>

    <Transition name="modal">
      <div v-if="showHelp" class="help-modal">
        <div class="help-content">
          <h2>Правила игры</h2>
          <div @click="showHelp = false" class="close-button">×</div>

          <h3>Основные действия:</h3>
          <ul>
            <li><strong>Переместиться</strong> - двигайтесь на 1 клетку вверх, вниз, влево или вправо.</li>
            <li><strong>Атаковать</strong> - используйте оружие для нанесения урона противнику.</li>
            <li><strong>Защититься</strong> - активируйте щит, чтобы заблокировать следующую атаку.</li>
          </ul>

          <h3>Типы оружия:</h3>
          <ul>
            <li><strong>Пистолет</strong> - точное попадание в одну клетку, средний урон.</li>
            <li><strong>Дробовик</strong> - конус поражения (3 клетки), низкий урон.</li>
            <li><strong>Снайперская винтовка</strong> - точное попадание на большое расстояние, высокий урон.</li>
            <li><strong>Пулемет</strong> - область поражения (3 клетки), низкий урон.</li>
          </ul>

          <h3>Ресурсы:</h3>
          <ul>
            <li><strong>Здоровье</strong> - если падает до 0, игрок проигрывает.</li>
            <li><strong>Щит</strong> - блокирует входящий урон при активации защиты.</li>
            <li><strong>Патроны</strong> - требуются для атаки. Разные виды оружия потребляют разное количество.</li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { GameEngine } from '../models/GameEngine'
import type { ActionType, Position, Terrain } from '../types'
import PlayerPanel from './PlayerPanel.vue'
import { SpriteManager } from '../models/SpriteManager'
import { player1SpriteConfig, player2SpriteConfig } from '../config/spriteConfig'
import AnimatedPlayer from './AnimatedPlayer.vue'
import { EffectsManager } from '../models/EffectsManager'
import { ProjectileManager } from '../models/ProjectileEffects'
import VisualEffectComponent from './VisualEffectComponent.vue'
import ProjectileComponent from './ProjectileComponent.vue'
import { CellAnimator } from '../models/CellAnimator'
import AnimatedCell from './AnimatedCell.vue'

// Инициализация игрового движка
const gameEngine = new GameEngine()

// Состояние компонента
const selectedAction = ref<ActionType | null>(null)
const availableMoves = ref<Position[]>([])
const availableTargets = ref<Position[]>([])
const statusMessage = ref<string>('')
const actionTooltip = ref<string>('')
const showHelp = ref<boolean>(false)
const hoverInfo = ref<{ x: number, y: number, message: string } | null>(null)

// Вычисляемые свойства
const currentPlayerId = computed(() => gameEngine.gameState.value.currentTurn)
const currentTurn = computed(() =>
  `${gameEngine.gameState.value.turnNumber} - ${currentPlayerId.value === 'player1' ? 'Игрок 1' : 'Игрок 2'}`
)
const availableActions = computed(() => gameEngine.getAvailableActions())

// Создаем менеджер спрайтов
const spriteManager = new SpriteManager()

// Ссылки на компоненты анимированных игроков для управления их анимациями
const player1Ref = ref<InstanceType<typeof AnimatedPlayer> | null>(null)
const player2Ref = ref<InstanceType<typeof AnimatedPlayer> | null>(null)

// Инициализация при монтировании компонента
onMounted(() => {
  // Регистрируем спрайты игроков
  spriteManager.registerPlayerSprite('player1', player1SpriteConfig)
  spriteManager.registerPlayerSprite('player2', player2SpriteConfig)

  statusMessage.value = `Ход игрока ${currentPlayerId.value === 'player1' ? '1' : '2'}`

  // Показ приветственной подсказки
  actionTooltip.value = 'Выберите действие для начала игры'
  setTimeout(() => { actionTooltip.value = '' }, 4000)
})

const CELL_SIZE = 80 // Размер клетки в пикселях

// Создаем менеджеры эффектов и снарядов
const effectsManager = new EffectsManager()
const projectileManager = new ProjectileManager()
const cellAnimator = new CellAnimator()

// Методы работы с ресурсами
const getActiveWeapon = (playerId: string) => {
  const weaponType = gameEngine.gameState.value.players[playerId]?.activeWeapon
  const weaponNames: Record<string, string> = {
    'pistol': 'Пистолет',
    'shotgun': 'Дробовик',
    'sniper': 'Снайперская винтовка',
    'machinegun': 'Пулемет'
  }
  return weaponNames[weaponType || ''] || 'Нет оружия'
}

// Методы работы с клетками
const isPlayerAt = (playerId: string, x: number, y: number) => {
  const player = gameEngine.gameState.value.players[playerId]
  return player?.position.x === x && player?.position.y === y
}

const isCurrentPlayerAt = (x: number, y: number) => {
  return isPlayerAt(currentPlayerId.value, x, y)
}


const getTerrainSymbol = (terrainType: string): string => {
  const symbols: Record<string, string> = {
    'empty': '',
    'cover': '🧱',
    'damage': '🔥',
    'bonus': '🎁'
  }
  return symbols[terrainType] || ''
}

const isMoveTarget = (x: number, y: number) => {
  if (!availableMoves.value || availableMoves.value.length === 0) {
    return false;
  }
  return selectedAction.value === 'move' &&
    availableMoves.value.some(pos => pos.x === x && pos.y === y);
};

const isAttackTarget = (x: number, y: number) => {
  if (!availableTargets.value || availableTargets.value.length === 0) {
    return false;
  }
  return selectedAction.value === 'attack' &&
    availableTargets.value.some(pos => pos.x === x && pos.y === y);
};

/**
 * Возвращает информацию о типе местности на указанной клетке
 * Безопасно обрабатывает случаи выхода за границы поля
 */
const getCellTerrain = (x: number, y: number): Terrain => {
  // Проверяем, что массив terrain существует
  if (!gameEngine?.gameState?.value?.terrain) {
    return { type: 'empty' }
  }

  // Используем опциональную цепочку для безопасного доступа
  return gameEngine.gameState.value.terrain[x]?.[y] || { type: 'empty' }
}


const getCellClasses = (x: number, y: number) => {
  return {
    'player-cell': isPlayerAt(currentPlayerId.value, x, y),
    'enemy-cell': isPlayerAt(currentPlayerId.value === 'player1' ? 'player2' : 'player1', x, y),
    'active-cell': isCurrentPlayerAt(x, y),
    'move-target': isMoveTarget(x, y),
    'attack-target': isAttackTarget(x, y),
    'player1-zone': x <= 2,
    'player2-zone': x >= 3,
    'cover-cell': getCellTerrain(x, y).type === 'cover',
    'damage-cell': getCellTerrain(x, y).type === 'damage',
    'bonus-cell': getCellTerrain(x, y).type === 'bonus'
  }
}

// Обработчики интерфейса
const handleCellHover = (x: number, y: number) => {
  const cellElement = event?.target as HTMLElement
  if (!cellElement) return

  const position = { x, y }

  // Подсвечиваем клетку при наведении, если это цель действия
  if (isMoveTarget(x, y)) {
    cellAnimator.highlightCell(position, '#3498db', 300)
  } else if (isAttackTarget(x, y)) {
    cellAnimator.highlightCell(position, '#e74c3c', 300)
  }

  // Оригинальный код подсказки...
  const rect = cellElement.getBoundingClientRect()
  let message = ''

  if (isMoveTarget(x, y)) {
    message = 'Переместиться сюда'
  } else if (isAttackTarget(x, y)) {
    message = 'Атаковать эту клетку'
  } else if (isPlayerAt('player1', x, y)) {
    message = 'Игрок 1'
    if (gameEngine.gameState.value.players.player1?.isDefending) {
      message += ' (защищается)'
    }
  } else if (isPlayerAt('player2', x, y)) {
    message = 'Игрок 2'
    if (gameEngine.gameState.value.players.player2?.isDefending) {
      message += ' (защищается)'
    }
  } else if (getCellTerrain(x, y).type !== 'empty') {
    const terrainTypes = {
      'cover': 'Укрытие (защита)',
      'damage': 'Огонь (урон)',
      'bonus': 'Бонус'
    }
    message = terrainTypes[getCellTerrain(x, y).type as keyof typeof terrainTypes] || ''
  }

  if (message) {
    hoverInfo.value = {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 30,
      message
    }
  }
}

const handleCellLeave = () => {
  hoverInfo.value = null
}

// Методы для действий
const selectAction = (action: ActionType) => {
  selectedAction.value = action

  // Сброс целей
  availableMoves.value = []
  availableTargets.value = []

  // ИСПРАВЛЕНИЕ: сначала выполняем действие выбора для переключения состояния
  gameEngine.executeAction({
    playerId: currentPlayerId.value,
    type: action,
    payload: { selectOnly: true }, // Дополнительный флаг, чтобы указать, что это только выбор действия
    timestamp: Date.now()
  })

  // Обновление подсказок и получение возможных ходов/целей
  if (action === 'move') {
    statusMessage.value = 'Выберите клетку для перемещения'
    // ИСПРАВЛЕНИЕ: получаем доступные ходы после смены состояния
    availableMoves.value = gameEngine.getAvailableMoves()

    // Анимируем доступные клетки
    availableMoves.value.forEach(pos => {
      cellAnimator.highlightCell(pos, '#3498db', 2000)
    })
  } else if (action === 'attack') {
    statusMessage.value = 'Выберите цель для атаки'
    // ИСПРАВЛЕНИЕ: получаем доступные цели после смены состояния
    availableTargets.value = gameEngine.getAvailableTargets()

    // Анимируем доступные цели
    availableTargets.value.forEach(pos => {
      cellAnimator.highlightCell(pos, '#e74c3c', 2000)
    })
  } else if (action === 'defend') {
    statusMessage.value = 'Активация защиты...'

    // Анимируем защиту на клетке игрока
    const playerPos = gameEngine.gameState.value.players[currentPlayerId.value].position
    cellAnimator.highlightCell(playerPos, '#2ecc71', 800)

    executeAction('defend', null)
  }
}

// Исправленный метод handleCellClick
const handleCellClick = (x: number, y: number) => {
  const position = { x, y }

  // Анимация клетки при клике
  cellAnimator.highlightCell(position, '#fff', 300)

  // Важно: сохраняем оригинальную логику выбора действий
  if (selectedAction.value === 'move' && isMoveTarget(x, y)) {
    executeAction('move', position)
  } else if (selectedAction.value === 'attack' && isAttackTarget(x, y)) {
    executeAction('attack', position)
  } else if (!selectedAction.value && isCurrentPlayerAt(x, y)) {
    // Если игрок кликнул на своей фигуре без выбранного действия
    selectAction('move')
    actionTooltip.value = 'Выберите, куда переместиться'
    setTimeout(() => { actionTooltip.value = '' }, 3000)
  } else if (!selectedAction.value) {
    // Если игрок кликнул на случайной клетке без выбранного действия
    actionTooltip.value = 'Сначала выберите действие внизу'
    setTimeout(() => { actionTooltip.value = '' }, 3000)
  }
}

// Обновленная версия executeAction, сохраняющая базовую функциональность
const executeAction = (actionType: ActionType, payload: any) => {
  // Получаем текущего игрока и его позицию
  const currentPlayer = gameEngine.gameState.value.players[currentPlayerId.value]
  const playerPosition = currentPlayer.position


  // Создаем визуальные эффекты в зависимости от типа действия
  if (actionType === 'attack') {
    const targetPosition = payload as Position

    // Создаем эффект снаряда
    const weapon = currentPlayer.weapons.find(w => w.type === currentPlayer.activeWeapon)
    if (weapon) {
      // Выбираем тип снаряда в зависимости от оружия
      switch (weapon.type) {
        case 'pistol':
          projectileManager.createBullet(playerPosition, targetPosition)
          break
        case 'shotgun':
          // Для дробовика создаем несколько снарядов
          projectileManager.createBullet(playerPosition, targetPosition)
          break
        case 'sniper':
          projectileManager.createLaser(playerPosition, targetPosition)
          break
        case 'machinegun':
          projectileManager.createBullet(playerPosition, targetPosition)
          break
      }
    }
  } else if (actionType === 'defend') {
    // Эффект щита
    effectsManager.createShield(playerPosition)
  }

  const result = gameEngine.executeAction({
    playerId: currentPlayerId.value,
    type: actionType,
    payload,
    timestamp: Date.now()
  })

  if (result.success) {
    // Установка временного сообщения об успехе
    const actionMessages = {
      'move': 'Вы переместились',
      'attack': 'Атака выполнена',
      'defend': 'Защита активирована'
    }

    statusMessage.value = actionMessages[actionType]

    // Сброс выбранного действия и доступных целей
    selectedAction.value = null
    availableMoves.value = []
    availableTargets.value = []

    // Очистка статусного сообщения через 2 секунды
    setTimeout(() => {
      statusMessage.value = `Ход игрока ${currentPlayerId.value === 'player1' ? '1' : '2'}`
    }, 2000)
  } else {
    statusMessage.value = result.message || 'Невозможно выполнить действие'
    setTimeout(() => {
      statusMessage.value = `Ход игрока ${currentPlayerId.value === 'player1' ? '1' : '2'}`
    }, 2000)
  }

  return result.success
}

const getActionName = (action: ActionType): string => {
  const actionNames: Record<ActionType, string> = {
    'move': 'Переместиться',
    'attack': 'Атаковать',
    'defend': 'Защититься'
  }
  return actionNames[action]
}

const getActionIcon = (action: ActionType): string => {
  const actionIcons: Record<ActionType, string> = {
    'move': '⟷',
    'attack': '⚔️',
    'defend': '🛡️'
  }
  return actionIcons[action]
}

const getActionTooltip = (action: ActionType): string => {
  const tooltips: Record<ActionType, string> = {
    'move': 'Переместиться на соседнюю клетку',
    'attack': `Атаковать противника (${getActiveWeapon(currentPlayerId.value)})`,
    'defend': 'Активировать защиту от следующей атаки'
  }
  return tooltips[action]
}

const isActionAvailable = (action: ActionType): boolean => {
  if (action === 'attack') {
    const player = gameEngine.gameState.value.players[currentPlayerId.value]
    const weaponType = player?.activeWeapon
    const weapon = player?.weapons.find(w => w.type === weaponType)

    return player?.resources.ammo >= (weapon?.ammoPerShot || 0)
  }
  return true
}

// Инициализация при монтировании
onMounted(() => {
  statusMessage.value = `Ход игрока ${currentPlayerId.value === 'player1' ? '1' : '2'}`

  // Показ приветственной подсказки
  actionTooltip.value = 'Выберите действие для начала игры'
  setTimeout(() => { actionTooltip.value = '' }, 4000)
})
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
  font-family: 'Roboto', sans-serif;
  position: relative;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Верхняя панель */
.turn-indicator-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #4a66bb, #2c3e50);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.turn-number {
  font-size: 18px;
  font-weight: 600;
}

.action-tooltip {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  animation: fadeIn 0.3s ease-out;
}

/* Основная секция */
.main-section {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

/* Игровое поле */
.game-board {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  background-color: #fff;
}

.grid {
  border: 3px solid #2c3e50;
  border-radius: 8px;
  overflow: hidden;
}

.grid-row {
  display: flex;
  position: relative;
}

.board-divider {
  width: 6px;
  background: linear-gradient(180deg, #2c3e50, #3498db);
  position: relative;
}

.grid-cell {
  width: 80px;
  height: 80px;
  border: 1px solid rgba(44, 62, 80, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.grid-cell:hover {
  background-color: rgba(52, 152, 219, 0.1);
}

.player1-zone {
  background-color: rgba(52, 152, 219, 0.05);
}

.player2-zone {
  background-color: rgba(231, 76, 60, 0.05);
}

.player-marker {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: white;
  position: relative;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.player-marker.p1 {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.player-marker.p2 {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.shield-indicator {
  position: absolute;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: 2px solid #2ecc71;
  animation: pulse 1.5s infinite;
  top: -6px;
  left: -6px;
}

.player-cell {
  background-color: rgba(46, 204, 113, 0.1);
}

.enemy-cell {
  background-color: rgba(231, 76, 60, 0.1);
}

.active-cell .player-marker {
  transform: scale(1.1);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
}

.move-target {
  background-color: rgba(52, 152, 219, 0.25);
  animation: pulse-background 1.5s infinite;
}

.attack-target {
  background-color: rgba(231, 76, 60, 0.25);
  animation: pulse-background 1.5s infinite;
}

.cover-cell {
  background-color: rgba(189, 195, 199, 0.3);
}

.damage-cell {
  background-color: rgba(241, 196, 15, 0.3);
}

.bonus-cell {
  background-color: rgba(155, 89, 182, 0.3);
}

.terrain-marker {
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 22px;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
}

.terrain-marker.cover {
  animation: slight-bounce 3s ease-in-out infinite;
}

.terrain-marker.damage {
  animation: slight-rotate 2s ease-in-out infinite;
}

.terrain-marker.bonus {
  animation: slight-scale 2s ease-in-out infinite;
}

/* Панель действий */
.action-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(135deg, #f5f7fa, #eef2f7);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
  border: none;
  border-radius: 6px;
  background-color: #ecf0f1;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  min-width: 120px;
}

button:hover:not(.disabled) {
  background-color: #d5dbdb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

button.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-icon {
  font-size: 22px;
  margin-bottom: 4px;
}

.status-message {
  padding: 12px;
  border-radius: 6px;
  background-color: #ecf0f1;
  text-align: center;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Подсказка при наведении */
.cell-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 10;
  pointer-events: none;
  white-space: nowrap;
  transform: translateY(-100%);
}

/* Кнопка помощи */
.help-button {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.help-button:hover {
  background-color: #2980b9;
  transform: scale(1.1);
}

/* Модальное окно правил */
.help-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.help-content {
  background-color: white;
  padding: 24px;
  border-radius: 10px;
  width: 90%;
  max-width: 550px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f1f1f1;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #e0e0e0;
}

/* Анимации */
@keyframes pulse {
  0% {
    opacity: 0.7;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.05);
  }

  100% {
    opacity: 0.7;
    transform: scale(1);
  }
}

@keyframes pulse-background {
  0% {
    opacity: 0.8;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.8;
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(-5px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slight-bounce {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-2px);
  }

  100% {
    transform: translateY(0);
  }
}

@keyframes slight-rotate {
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(5deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

@keyframes slight-scale {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
}

/* Анимация модального окна */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Адаптивность */
@media (max-width: 900px) {
  .main-section {
    flex-direction: column;
  }

  .grid-cell {
    width: 60px;
    height: 60px;
  }

  .player-marker {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }

  .shield-indicator {
    width: 48px;
    height: 48px;
  }

  .action-buttons {
    flex-wrap: wrap;
  }
}

.effects-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* Чтобы эффекты не блокировали клики */
  z-index: 10;
}

.effect-wrapper {
  position: absolute;
  width: 80px;
  /* Размер клетки */
  height: 80px;
  /* Размер клетки */
}
</style>