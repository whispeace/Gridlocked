import type { Player, Position, ActionResult } from '../types'
import type { CoreGame } from './CoreGame'

/**
 * Логика расчетов попаданий, урона, проверок
 */
export class RuleEngine {
  constructor(private core: CoreGame) {}

  canMove(player: Player, pos: Position): boolean {
    const { x, y } = pos

    // пределы зоны игрока
    const isP1 = player.id === 'player1'
    const minX = isP1 ? 0 : 3
    const maxX = isP1 ? 2 : 5

    if (!(x >= minX && x <= maxX && y >= 0 && y <= 2)) return false

    const manhattan =
      Math.abs(player.position.x - x) + Math.abs(player.position.y - y)
    if (manhattan !== 1) return false

    // занятость
    return !Object.values(this.core.state.players).some(p => p.position.x === x && p.position.y === y)
  }

  canAttack(player: Player): boolean {
    const weapon = player.weapons.find(w => w.type === player.activeWeapon)
    return weapon !== undefined && player.resources.ammo >= (weapon?.ammoPerShot ?? 0)
  }

  getAttackTargets(player: Player, manualTarget?: Position): Position[] {
    const enemy = Object.values(this.core.state.players).find(p => p.id !== player.id)!
    const weapon = player.weapons.find(w => w.type === player.activeWeapon)
    if (!weapon) return []

    if (['pistol', 'sniper', 'machinegun'].includes(weapon.type)) {
      return [enemy.position]
    }

    // дробовик может бить по manualTarget или по врагу
    const center = manualTarget ?? enemy.position
    return weapon.attackPattern.map(offset => ({
      x: center.x + offset.x,
      y: center.y + offset.y
    }))
  }

  processMove(player: Player, target: Position): ActionResult {
    if (!this.canMove(player, target)) {
      return { success: false, affectedPositions: [], message: 'Недоступная клетка' }
    }
    const oldPos = { ...player.position }
    this.core.movePlayer(player.id, target)
    return { success: true, affectedPositions: [oldPos, target], message: 'Перемещён' }
  }

  processDefend(player: Player): ActionResult {
    player.isDefending = true
    return { success: true, affectedPositions: [player.position], message: 'Защита активна' }
  }

  processAttack(player: Player, manualTarget?: Position): ActionResult {
    if (!this.canAttack(player)) {
      return { success: false, affectedPositions: [], message: 'Нет патронов' }
    }

    const weapon = player.weapons.find(w => w.type === player.activeWeapon)!
    player.resources.ammo -= weapon.ammoPerShot

    const affected = this.getAttackTargets(player, manualTarget)

    let hit = false
    for (const pos of affected) {
      const targets = Object.values(this.core.state.players).filter(
        p => p.id !== player.id &&
        p.position.x === pos.x &&
        p.position.y === pos.y
      )
      if (targets.length) {
        hit = true
        targets.forEach(t => this.core.applyDamage(t.id, weapon.damage))
      }
    }

    return {
      success: true,
      affectedPositions: affected,
      message: hit ? 'Попадание' : 'Промах',
      damage: weapon.damage
    }
  }

  checkWin(): string | null {
    const alive = Object.values(this.core.state.players).filter(p => p.resources.health > 0)
    if (alive.length === 1) return alive[0].id
    if (alive.length === 0) return 'draw'
    return null
  }
}
