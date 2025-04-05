<template>
  <div class="game-container">
    <!-- Верхняя панель с информацией о раунде -->
    <div class="turn-indicator-panel">
      <div class="turn-number">Раунд: {{ gameEngine.gameState.turnNumber }}</div>
      <div class="action-tooltip" v-if="actionTooltip">{{ actionTooltip }}</div>
    </div>

    <!-- Основная секция игрового поля с панелями игроков по бокам -->
    <div class="main-section">
      <!-- Панель игрока 1 -->
      <PlayerPanel :player-id="'player1'" :is-active="!gameEngine.hasPlayerSelected('player1')"
        :resources="gameEngine.gameState.players.player1?.resources" :active-weapon="getActiveWeapon('player1')"
        :is-defending="gameEngine.gameState.players.player1?.isDefending" />

      <!-- Игровое поле -->
      <div class="game-board">
        <div class="grid">
          <div v-for="y in 3" :key="`row-${y}`" class="grid-row">
            <!-- Поле игрока 1 -->
            <div v-for="x in 3" :key="`cell-p1-${x - 1}-${y - 1}`" class="grid-cell"
              :class="getCellClasses(x - 1, y - 1, 'player1')" @click="handleCellClick(x - 1, y - 1, 'player1')"
              @mouseover="handleCellHover(x - 1, y - 1, 'player1')" @mouseleave="handleCellLeave">
              <AnimatedCell :position="{ x: x - 1, y: y - 1 }" :cell-animator="cellAnimator" />

              <AnimatedPlayer v-if="isPlayerAt('player1', x - 1, y - 1)" playerId="player1"
                :position="gameEngine.gameState.players.player1.position" :sprite-manager="spriteManager"
                :is-defending="gameEngine.gameState.players.player1?.isDefending" />

              <AnimatedPlayer v-if="isPlayerAt('player2', x - 1, y - 1)" playerId="player2"
                :position="gameEngine.gameState.players.player2.position" :sprite-manager="spriteManager"
                :is-defending="gameEngine.gameState.players.player2?.isDefending" />
              <div v-if="getCellTerrain(x - 1, y - 1).type !== 'empty'" class="terrain-marker"
                :class="getCellTerrain(x - 1, y - 1).type">
                {{ getTerrainSymbol(getCellTerrain(x - 1, y - 1).type) }}
              </div>
            </div>

            <!-- Центральная разделительная линия -->
            <div class="board-divider"></div>

            <!-- Поле игрока 2 -->
            <div v-for="x in 3" :key="`cell-p2-${x + 2}-${y - 1}`" class="grid-cell"
              :class="getCellClasses(x + 2, y - 1, 'player2')" @click="handleCellClick(x + 2, y - 1, 'player2')"
              @mouseover="handleCellHover(x + 2, y - 1, 'player2')" @mouseleave="handleCellLeave">
              <AnimatedCell :position="{ x: x + 2, y: y - 1 }" :cell-animator="cellAnimator" />

              <AnimatedPlayer v-if="isPlayerAt('player1', x + 2, y - 1)" playerId="player1"
                :position="gameEngine.gameState.players.player1.position" :sprite-manager="spriteManager"
                :is-defending="gameEngine.gameState.players.player1?.isDefending" />

              <AnimatedPlayer v-if="isPlayerAt('player2', x + 2, y - 1)" playerId="player2"
                :position="gameEngine.gameState.players.player2.position" :sprite-manager="spriteManager"
                :is-defending="gameEngine.gameState.players.player2?.isDefending" />

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
      <PlayerPanel :player-id="'player2'" :is-active="!gameEngine.hasPlayerSelected('player2')"
        :resources="gameEngine.gameState.players.player2?.resources" :active-weapon="getActiveWeapon('player2')"
        :is-defending="gameEngine.gameState.players.player2?.isDefending" />
    </div>

    <!-- Панель действий (показываем для игроков, которые еще не выбрали действие) -->
    <div class="action-panels">
      <div class="player-action-panel player1" v-if="!gameEngine.hasPlayerSelected('player1')">
        <div class="player-label">Игрок 1</div>
        <div class="action-buttons">
          <button v-for="action in getAvailableActions('player1')" :key="action"
            @click="selectAction(action, 'player1')"
            :class="{ active: selectedActions.player1 === action, disabled: !isActionAvailable(action, 'player1') }"
            :disabled="!isActionAvailable(action, 'player1')" :title="getActionTooltip(action, 'player1')">
            <div class="action-icon">{{ getActionIcon(action) }}</div>
            <span>{{ getActionName(action) }}</span>
          </button>
        </div>
        <div class="status-message">
          <p v-if="statusMessages.player1">{{ statusMessages.player1 }}</p>
          <p v-else>Выберите действие</p>
        </div>
      </div>

      <div class="player-action-panel player2" v-if="false">
        <div class="player-label">Игрок 2</div>
        <div class="action-buttons">
          <button v-for="action in getAvailableActions('player2')" :key="action"
            @click="selectAction(action, 'player2')"
            :class="{ active: selectedActions.player2 === action, disabled: !isActionAvailable(action, 'player2') }"
            :disabled="!isActionAvailable(action, 'player2')" :title="getActionTooltip(action, 'player2')">
            <div class="action-icon">{{ getActionIcon(action) }}</div>
            <span>{{ getActionName(action) }}</span>
          </button>
        </div>
        <div class="status-message">
          <p v-if="statusMessages.player2">{{ statusMessages.player2 }}</p>
          <p v-else>Выберите действие</p>
        </div>
      </div>

      <!-- Индикатор ожидания для игроков, которые уже выбрали действие -->
      <div class="waiting-panel"
        v-if="gameEngine.hasPlayerSelected('player1') || gameEngine.hasPlayerSelected('player2')">
        <template v-if="gameEngine.hasPlayerSelected('player1') && gameEngine.hasPlayerSelected('player2')">
          <div class="executing-message">Выполнение действий...</div>
        </template>
        <template v-else>
          <div class="waiting-message">
            {{ gameEngine.hasPlayerSelected('player1') ? 'Игрок 1 ждет выбора Игрока 2' : 'Игрок 2 ждет выбора Игрока 1'
            }}
          </div>
        </template>
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

          <h3>Особенности игры:</h3>
          <ul>
            <li>Оба игрока выбирают действия одновременно.</li>
            <li>Действия выполняются в порядке: защита → атака → перемещение.</li>
            <li>При выборе "Переместиться" кликните на подсвеченную клетку.</li>
            <li>Простое оружие стреляет автоматически в направлении противника.</li>
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
import { ref, onMounted, reactive } from 'vue'
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
const selectedActions = reactive<Record<string, ActionType | null>>({
  player1: null,
  player2: null
})
const availableMoves = reactive<Record<string, Position[]>>({
  player1: [],
  player2: []
})
const availableTargets = reactive<Record<string, Position[]>>({
  player1: [],
  player2: []
})
const statusMessages = reactive<Record<string, string>>({
  player1: '',
  player2: ''
})
const actionTooltip = ref<string>('')
const showHelp = ref<boolean>(false)
const hoverInfo = ref<{ x: number, y: number, message: string } | null>(null)

// Создаем менеджер спрайтов
const spriteManager = new SpriteManager()

// Размер клетки
const CELL_SIZE = 80

// Создаем менеджеры эффектов и снарядов
const effectsManager = new EffectsManager()
const projectileManager = new ProjectileManager()
const cellAnimator = new CellAnimator()

/**
 * Инициализирует начальные направления и анимации для персонажей
 */
function setupInitialPlayerDirections() {
  // Игрок 1 смотрит вправо, игрок 2 смотрит влево
  const player1 = gameEngine.gameState.players['player1']
  const player2 = gameEngine.gameState.players['player2']

  if (player1) {
    spriteManager.playAnimation('player1', 'idle', player1.position, 'right')
  }

  if (player2) {
    spriteManager.playAnimation('player2', 'idle', player2.position, 'left')
  }
}

// Инициализация при монтировании компонента
onMounted(() => {
  // Важно: инициализируем спрайты игроков перед любыми операциями с ними
  console.log('Регистрация спрайтов игроков')
  spriteManager.registerPlayerSprite('player1', player1SpriteConfig)
  spriteManager.registerPlayerSprite('player2', player2SpriteConfig)

  // Устанавливаем начальные анимации
  setupInitialPlayerDirections()

  // Показ приветственной подсказки
  actionTooltip.value = 'Оба игрока выбирают свои действия одновременно'
  setTimeout(() => { actionTooltip.value = '' }, 4000)

  // Подсвечиваем доступные клетки для перемещения обоих игроков
  highlightAvailableMoves('player1')
  highlightAvailableMoves('player2')
})

// Методы работы с ресурсами
const getActiveWeapon = (playerId: string) => {
  const weaponType = gameEngine.gameState.players[playerId]?.activeWeapon
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
  const player = gameEngine.gameState.players[playerId]
  return player?.position.x === x && player?.position.y === y
}

// Получение доступных действий для игрока
const getAvailableActions = (playerId: string): ActionType[] => {
  return gameEngine.getAvailableActions(playerId)
}

// Получение символа для типа местности
const getTerrainSymbol = (terrainType: string): string => {
  const symbols: Record<string, string> = {
    'empty': '',
    'cover': '🧱',
    'damage': '🔥',
    'bonus': '🎁'
  }
  return symbols[terrainType] || ''
}

// Проверка, является ли клетка целью для перемещения
const isMoveTarget = (x: number, y: number, playerId: string) => {
  if (!availableMoves[playerId] || availableMoves[playerId].length === 0) {
    return false
  }
  return selectedActions[playerId] === 'move' &&
    availableMoves[playerId].some(pos => pos.x === x && pos.y === y)
}

// Проверка, является ли клетка целью для атаки
const isAttackTarget = (x: number, y: number, playerId: string) => {
  if (!availableTargets[playerId] || availableTargets[playerId].length === 0) {
    return false
  }
  return selectedActions[playerId] === 'attack' &&
    availableTargets[playerId].some(pos => pos.x === x && pos.y === y)
}

/**
 * Получает тип местности на указанной клетке поля
 * Защищен от null/undefined значений
 * 
 * @param x Координата X клетки
 * @param y Координата Y клетки
 * @returns Объект с информацией о типе местности
 */
const getCellTerrain = (x: number, y: number): Terrain => {
  if (!gameEngine?.gameState?.terrain) {
    return { type: 'empty' }
  }
  return gameEngine.gameState.terrain[x]?.[y] || { type: 'empty' }
}

// Определение CSS-классов для клетки
const getCellClasses = (x: number, y: number, playerId: string) => {
  return {
    'player-cell': isPlayerAt(playerId, x, y),
    'enemy-cell': isPlayerAt(playerId === 'player1' ? 'player2' : 'player1', x, y),
    'active-cell': isPlayerAt(playerId, x, y) && !gameEngine.hasPlayerSelected(playerId),
    'move-target': isMoveTarget(x, y, playerId),
    'attack-target': isAttackTarget(x, y, playerId),
    'player1-zone': x <= 2,
    'player2-zone': x >= 3,
    'cover-cell': getCellTerrain(x, y).type === 'cover',
    'damage-cell': getCellTerrain(x, y).type === 'damage',
    'bonus-cell': getCellTerrain(x, y).type === 'bonus',
    'available-move': selectedActions[playerId] !== 'move' && !gameEngine.hasPlayerSelected(playerId) &&
      gameEngine.getAvailableMoves(playerId).some(pos => pos.x === x && pos.y === y)
  }
}

// Обработчик наведения на клетку
const handleCellHover = (x: number, y: number, playerId: string) => {
  const cellElement = event?.target as HTMLElement
  if (!cellElement) return

  const position = { x, y }

  // Подсвечиваем клетку при наведении, если это цель действия
  if (isMoveTarget(x, y, playerId)) {
    cellAnimator.highlightCell(position, '#3498db', 300)
  } else if (isAttackTarget(x, y, playerId)) {
    cellAnimator.highlightCell(position, '#e74c3c', 300)
  }

  // Подсказка при наведении
  const rect = cellElement.getBoundingClientRect()
  let message = ''

  // Формирование текста подсказки
  if (isMoveTarget(x, y, playerId)) {
    message = 'Переместиться сюда'
  } else if (isAttackTarget(x, y, playerId)) {
    message = 'Атаковать эту клетку'
  } else if (isPlayerAt('player1', x, y)) {
    message = 'Игрок 1'
    if (gameEngine.gameState.players.player1?.isDefending) {
      message += ' (защищается)'
    }
  } else if (isPlayerAt('player2', x, y)) {
    message = 'Игрок 2'
    if (gameEngine.gameState.players.player2?.isDefending) {
      message += ' (защищается)'
    }
  } else if (getCellTerrain(x, y).type !== 'empty') {
    const terrainTypes = {
      'cover': 'Укрытие (защита)',
      'damage': 'Огонь (урон)',
      'bonus': 'Бонус'
    }
    message = terrainTypes[getCellTerrain(x, y).type as keyof typeof terrainTypes] || ''
  } else if (
    selectedActions[playerId] !== 'move' &&
    !gameEngine.hasPlayerSelected(playerId) &&
    gameEngine.getAvailableMoves(playerId).some(pos => pos.x === x && pos.y === y)
  ) {
    message = 'Доступная клетка для перемещения'
  }

  if (message) {
    hoverInfo.value = {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 30,
      message
    }
  }
}

// Сброс подсказки при уходе курсора с клетки
const handleCellLeave = () => {
  hoverInfo.value = null
}

// Подсвечивание доступных клеток для перемещения
const highlightAvailableMoves = (playerId: string) => {
  const moves = gameEngine.getAvailableMoves(playerId)
  moves.forEach(pos => {
    cellAnimator.highlightCell(pos, '#3498db4d', 4000)
  })
}

// Выбор действия игроком
const selectAction = (action: ActionType, playerId: string) => {
  selectedActions[playerId] = action

  // Сброс доступных целей
  availableMoves[playerId] = []
  availableTargets[playerId] = []

  if (action === 'move') {
    statusMessages[playerId] = 'Выберите клетку для перемещения'
    availableMoves[playerId] = gameEngine.getAvailableMoves(playerId)

    // Анимируем доступные клетки
    availableMoves[playerId].forEach(pos => {
      cellAnimator.highlightCell(pos, '#3498db', 2000)
    })
  } else if (action === 'attack') {
    // Получаем доступные цели и активное оружие
    availableTargets[playerId] = gameEngine.getAvailableTargets(playerId)
    const player = gameEngine.gameState.players[playerId]
    const weapon = player.weapons.find(w => w.type === player.activeWeapon)

    // Получаем позицию противника для визуализации эффектов
    const enemyId = playerId === 'player1' ? 'player2' : 'player1'
    const enemy = gameEngine.gameState.players[enemyId]

    // Проверяем, нужно ли выбирать цель (дробовик требует выбора)
    if (availableTargets[playerId].length > 0 && weapon?.type === 'shotgun') {
      // Только для дробовика игрок должен выбрать цель
      statusMessages[playerId] = 'Выберите цель для атаки'

      // Анимируем доступные цели
      availableTargets[playerId].forEach(pos => {
        cellAnimator.highlightCell(pos, '#e74c3c', 2000)
      })
    } else {
      // Для простого оружия (пистолет, снайпер, пулемет) выполняем атаку автоматически
      statusMessages[playerId] = 'Атака противника...'

      // Определяем направление атаки
      const playerPos = player.position
      const enemyPos = enemy.position

      // Создаём эффект "пути" выстрела от позиции игрока к противнику
      const diffX = enemyPos.x - playerPos.x
      const diffY = enemyPos.y - playerPos.y
      const isHorizontal = Math.abs(diffX) >= Math.abs(diffY)

      if (isHorizontal) {
        // Горизонтальный выстрел
        const step = diffX > 0 ? 1 : -1
        for (let i = 1;i <= Math.abs(diffX);i++) {
          const effectPos = { x: playerPos.x + (i * step), y: playerPos.y }
          cellAnimator.highlightCell(effectPos, '#e74c3c', 300 + i * 100)
        }
      } else {
        // Вертикальный выстрел
        const step = diffY > 0 ? 1 : -1
        for (let i = 1;i <= Math.abs(diffY);i++) {
          const effectPos = { x: playerPos.x, y: playerPos.y + (i * step) }
          cellAnimator.highlightCell(effectPos, '#e74c3c', 300 + i * 100)
        }
      }

      // Непосредственно передаем позицию противника для гарантированного попадания
      const targetPayload = { targetPosition: { ...enemyPos } }

      // Создаем действие атаки с указанием конкретной цели
      executeAction('attack', targetPayload, playerId)
    }
  } else if (action === 'defend') {
    statusMessages[playerId] = 'Активация защиты...'

    // Анимируем защиту на клетке игрока
    const playerPos = gameEngine.gameState.players[playerId].position
    cellAnimator.highlightCell(playerPos, '#2ecc71', 800)

    executeAction('defend', null, playerId)
  }
}

// Обработчик клика по клетке
const handleCellClick = (x: number, y: number, playerId: string) => {
  // Если игрок уже выбрал действие, игнорируем клик
  if (gameEngine.hasPlayerSelected(playerId)) {
    return
  }

  const position = { x, y }

  // Анимация клетки при клике
  cellAnimator.highlightCell(position, '#fff', 300)

  // Обработка клика в зависимости от выбранного действия
  if (selectedActions[playerId] === 'move' && isMoveTarget(x, y, playerId)) {
    executeAction('move', position, playerId)
  } else if (selectedActions[playerId] === 'attack' && isAttackTarget(x, y, playerId)) {
    executeAction('attack', position, playerId)
  } else if (!selectedActions[playerId] && isPlayerAt(playerId, x, y)) {
    // Подсказка о выборе действия при клике на своего игрока
    actionTooltip.value = `Игрок ${playerId === 'player1' ? '1' : '2'}: выберите действие внизу`
    setTimeout(() => { actionTooltip.value = '' }, 3000)
  } else if (
    !selectedActions[playerId] &&
    gameEngine.getAvailableMoves(playerId).some(pos => pos.x === x && pos.y === y)
  ) {
    // Если кликнули на доступную для перемещения клетку, выбираем действие "переместиться"
    // и сразу выполняем перемещение
    selectedActions[playerId] = 'move'
    executeAction('move', position, playerId)
  } else if (!selectedActions[playerId]) {
    // Подсказка о выборе действия
    actionTooltip.value = `Игрок ${playerId === 'player1' ? '1' : '2'}: выберите действие внизу`
    setTimeout(() => { actionTooltip.value = '' }, 3000)
  }
}

// Обновленный метод executeAction
const executeAction = (actionType: ActionType, payload: any, playerId: string) => {
  // Получаем текущего игрока и его позицию
  const player = gameEngine.gameState.players[playerId]
  const playerPosition = player.position

  // Создаем визуальные эффекты в зависимости от типа действия
  if (actionType === 'attack') {
    // Добавляем начальный эффект выстрела от позиции игрока
    const weapon = player.weapons.find(w => w.type === player.activeWeapon)

    // Не анимируем атаку согласно требованиям

    // Определяем цель атаки
    let targetPos: Position

    if (payload && typeof payload === 'object') {
      if ('x' in payload && 'y' in payload) {
        // Если передана конкретная позиция
        targetPos = payload as Position
      } else if (payload.targetPosition) {
        // Если передана цель в объекте payload
        targetPos = payload.targetPosition
      } else {
        // Позиция противника по умолчанию
        const enemyId = playerId === 'player1' ? 'player2' : 'player1'
        targetPos = { ...gameEngine.gameState.players[enemyId].position }
      }
    } else {
      // Позиция противника по умолчанию
      const enemyId = playerId === 'player1' ? 'player2' : 'player1'
      targetPos = { ...gameEngine.gameState.players[enemyId].position }
    }

    // Создаем соответствующий проектиль в зависимости от оружия
    if (weapon) {
      switch (weapon.type) {
        case 'pistol':
          projectileManager.createBullet(playerPosition, targetPos)
          break
        case 'shotgun':
          // Для дробовика создаем несколько снарядов
          projectileManager.createBullet(playerPosition, targetPos)
          if (playerId === 'player1') {
            projectileManager.createBullet(
              playerPosition,
              { x: targetPos.x, y: targetPos.y - 1 }
            )
            projectileManager.createBullet(
              playerPosition,
              { x: targetPos.x, y: targetPos.y + 1 }
            )
          } else {
            projectileManager.createBullet(
              playerPosition,
              { x: targetPos.x, y: targetPos.y - 1 }
            )
            projectileManager.createBullet(
              playerPosition,
              { x: targetPos.x, y: targetPos.y + 1 }
            )
          }
          break
        case 'sniper':
          projectileManager.createLaser(playerPosition, targetPos)
          break
        case 'machinegun':
          // Для пулемета создаем несколько снарядов с небольшой задержкой
          projectileManager.createBullet(playerPosition, targetPos)
          setTimeout(() => {
            projectileManager.createBullet(playerPosition, targetPos)
          }, 100)
          setTimeout(() => {
            projectileManager.createBullet(playerPosition, targetPos)
          }, 200)
          break
      }
    }
  } else if (actionType === 'defend') {
    // Эффект щита
    effectsManager.createShield(playerPosition)

    // Запускаем анимацию защиты
    spriteManager.playAnimation(playerId, 'defend', playerPosition)
  } else if (actionType === 'move') {
    // Для движения анимация запускается через executeAction в обработчике игрового движка
  }

  gameEngine.handleAction({
    playerId,
    type: actionType,
    payload,
    timestamp: Date.now()
  })

  if(playerId === 'player1' && !gameEngine.hasPlayerSelected('player2')){
    autoChooseActionForAI();
  }
}
// Получение имени действия
const getActionName = (action: ActionType): string => {
  const actionNames: Record<ActionType, string> = {
    'move': 'Переместиться',
    'attack': 'Атаковать',
    'defend': 'Защититься'
  }
  return actionNames[action]
}

// Получение иконки для действия
const getActionIcon = (action: ActionType): string => {
  const actionIcons: Record<ActionType, string> = {
    'move': '⟷',
    'attack': '⚔️',
    'defend': '🛡️'
  }
  return actionIcons[action]
}

// Получение подсказки для действия
const getActionTooltip = (action: ActionType, playerId: string): string => {
  const tooltips: Record<ActionType, string> = {
    'move': 'Переместиться на соседнюю клетку',
    'attack': `Атаковать противника (${getActiveWeapon(playerId)})`,
    'defend': 'Активировать защиту от следующей атаки'
  }
  return tooltips[action]
}

// Проверка доступности действия
const isActionAvailable = (action: ActionType, playerId: string): boolean => {
  if (action === 'attack') {
    const player = gameEngine.gameState.players[playerId]
    const weaponType = player?.activeWeapon
    const weapon = player?.weapons.find(w => w.type === weaponType)

    return player?.resources.ammo >= (weapon?.ammoPerShot || 0)
  }
  return true
}

function autoChooseActionForAI() {
  const enemyId = 'player1';
  const aiId = 'player2';
  const aiPlayer = gameEngine.gameState.players[aiId];
  const enemy = gameEngine.gameState.players[enemyId];

  // Приоритет: если мало хп — защита
  if(aiPlayer.resources.health < 30 || aiPlayer.resources.shield > 0 && Math.random() < 0.5){
    executeAction('defend', null, aiId);
    console.log('[AI] Игрок 2 выбрал защиту');
    return;
  }

  // Еще патроны есть? Тогда атакуем:
  const weapon = aiPlayer.weapons.find(w=>w.type === aiPlayer.activeWeapon);
  if(weapon && aiPlayer.resources.ammo >= weapon.ammoPerShot){
    // атакуем прямо в игрока
    executeAction('attack', { targetPosition: enemy.position }, aiId);
    console.log('[AI] Игрок 2 выбрал атаку');
    return;
  }

  // Иначе, если можем двинуться - идём в случайную доступную точку
  const moves = gameEngine.getAvailableMoves(aiId);
  if(moves.length){
    const move = moves[Math.floor(Math.random()*moves.length)];
    executeAction('move', move, aiId);
    console.log('[AI] Игрок 2 сделал случайный ход');
    return;
  }

  // Ну а вдруг вообще ничего — тогда защита
  executeAction('defend', null, aiId);
  console.log('[AI] Игрок 2 пассивно встал в защиту');
}

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

.player-cell {
  background-color: rgba(46, 204, 113, 0.1);
}

.enemy-cell {
  background-color: rgba(231, 76, 60, 0.1);
}

.active-cell {
  background-color: rgba(46, 204, 113, 0.2);
  box-shadow: inset 0 0 8px rgba(46, 204, 113, 0.4);
}

.move-target {
  background-color: rgba(52, 152, 219, 0.25);
  animation: pulse-background 1.5s infinite;
  cursor: pointer;
}

.attack-target {
  background-color: rgba(231, 76, 60, 0.25);
  animation: pulse-background 1.5s infinite;
  cursor: pointer;
}

/* Новый класс для подсвечивания доступных клеток */
.available-move {
  border: 2px dashed #3498db;
  box-sizing: border-box;
  animation: border-pulse 2s infinite;
  cursor: pointer;
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
.action-panels {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.player-action-panel {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(135deg, #f5f7fa, #eef2f7);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player-action-panel.player1 {
  border-left: 4px solid #3498db;
}

.player-action-panel.player2 {
  border-left: 4px solid #e74c3c;
}

.player-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
  margin-bottom: 5px;
}

.waiting-panel {
  flex: 1;
  min-width: 300px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.waiting-message {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 500;
}

.executing-message {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 500;
  animation: highlight 1.5s infinite;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
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

@keyframes border-pulse {
  0% {
    border-color: rgba(52, 152, 219, 0.4);
  }

  50% {
    border-color: rgba(52, 152, 219, 0.8);
  }

  100% {
    border-color: rgba(52, 152, 219, 0.4);
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

@keyframes highlight {
  0% {
    color: #2c3e50;
  }

  50% {
    color: #3498db;
  }

  100% {
    color: #2c3e50;
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

/* Контейнер для эффектов */
.effects-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.effect-wrapper {
  position: absolute;
  width: 80px;
  height: 80px;
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

  .action-buttons {
    flex-wrap: wrap;
  }

  .action-panels {
    flex-direction: column;
  }
}
</style>