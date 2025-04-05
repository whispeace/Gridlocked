import type { GameEngine } from '../GameEngine';
import type { ActionType, Position, GameAction, ActionResult, Player, VisualEffect } from '../../types';
import { SpriteManager } from '../SpriteManager'

const spriteManager = new SpriteManager();

/** Интерфейс */
export interface GameStateInterface {
  enter(): void;
  exit(): void;
  handleAction(action: GameAction): ActionResult;
  getAvailableActions(playerId?: string): ActionType[];
  getAvailableMoves(playerId?: string): Position[];
  getAvailableTargets(playerId?: string): Position[];
  isRoundComplete(): boolean;
}

/** Базовый */
export abstract class GameState implements GameStateInterface {
  constructor(protected engine: GameEngine) {}
  abstract enter(): void;
  abstract exit(): void;
  abstract handleAction(action: GameAction): ActionResult;
  abstract getAvailableActions(playerId?: string): ActionType[];
  abstract getAvailableMoves(playerId?: string): Position[];
  abstract getAvailableTargets(playerId?: string): Position[];
  abstract isRoundComplete(): boolean;
}

/** Состояние выбора действий */
export class PlayersActionSelectionState extends GameState {
  enter() {
    this.engine.resetPendingActions();
  }
  exit() {}
  handleAction(action: GameAction): ActionResult {
    const stored = this.engine.storePendingAction(action);
    if (!stored) return { success: false, affectedPositions: [], message: 'Уже выбрано' };
    if (this.engine.areBothPlayersReady()) this.engine.changeState(new ActionsExecutionState(this.engine));
    return { success: true, affectedPositions: [], message: `Выбрали ${action.type}` };
  }
  getAvailableActions(id?: string): ActionType[] {
    if (!id) return [];
    const p = this.engine.gameState.players[id];
    if (!p) return [];
    const arr: ActionType[] = ['move', 'defend'];
    const w = p.weapons.find(w => w.type === p.activeWeapon);
    if (w && p.resources.ammo >= w.ammoPerShot) arr.push('attack');
    return arr;
  }
  getAvailableMoves(id?: string): Position[] {
    if (!id) return [];
    const p = this.engine.gameState.players[id];
    if (!p) return [];
    const { x, y } = p.position;
    const isP1 = id === 'player1';
    const minX = isP1 ? 0 : 3;
    const maxX = isP1 ? 2 : 5;
    return [
      { x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 }
    ].filter(pos => pos.x >= minX && pos.x <= maxX && pos.y >= 0 && pos.y <= 2);
  }
  getAvailableTargets(playerId?: string): Position[] {
    if (!playerId) return [];
    const p = this.engine.gameState.players[playerId];
    if (!p) return [];
    const w = p.weapons.find(w => w.type === p.activeWeapon);
    if (!w || p.resources.ammo < w.ammoPerShot) return [];
    if (['pistol', 'sniper', 'machinegun'].includes(w.type)) return [];
    const res: Position[] = [];
    for (let dx = -w.range; dx <= w.range; dx++)
      for (let dy = -w.range; dy <= w.range; dy++)
        if (Math.abs(dx) + Math.abs(dy) <= w.range) {
          const tx = p.position.x + dx, ty = p.position.y + dy;
          if (tx >= 0 && tx < 6 && ty >= 0 && ty < 3) res.push({ x: tx, y: ty });
        }
    return res;
  }
  isRoundComplete() { return false; }
}

/** Состояние выполнения ходов */
export class ActionsExecutionState extends GameState {
  async enter() {
    await this.executeAllAsync();
  }
  
  private async executeAllAsync() {
    const ordered = this.engine.getPendingActions().sort((a, b) => {
      const prio = (t: ActionType) => t==='defend'?3:t==='attack'?2:1;
      return prio(b.type) - prio(a.type);
    });
    for(const a of ordered){
      console.log(`[EXEC] ${a.playerId}: ${a.type}`);
      const res = this.executeSingle(a);
      console.log('[Result]', res.message, res);
      // Даем красивой анимации проиграться
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    await new Promise(resolve => setTimeout(resolve, 600)); // Доп. пауза после всех
    this.engine.incrementRound();
    this.engine.changeState(new PlayersActionSelectionState(this.engine));
  }
  
  exit() {}
  handleAction(): ActionResult {
    return { success: false, affectedPositions: [], message: 'Подождите выполнения' }
  }

  private executeAll() {
    const ordered = this.engine.getPendingActions().sort((a,b) => {
      const prio = (t: ActionType) => t==='defend'?3:t==='attack'?2:1;
      return prio(b.type) - prio(a.type);
    });

    ordered.forEach(a => {
      console.log(`[EXECUTE] ${a.playerId}: ${a.type}`);
      const r = this.executeSingle(a);
      console.log('[Result]', r.message, r);
    });

    this.engine.incrementRound();
    this.engine.changeState(new PlayersActionSelectionState(this.engine));
  }

  private executeSingle(action: GameAction): ActionResult {
    const p = this.engine.gameState.players[action.playerId];
    if (!p) return {success:false, affectedPositions:[], message:'No Player'};
    switch(action.type){
      case 'move': return this.doMove(p, action);
      case 'attack': return this.doAttack(p, action);
      case 'defend': return this.doDefend(p);
      default: return {success:false, affectedPositions:[], message:'Unknown'};
    }
  }

  private doMove(p: Player, act: GameAction): ActionResult {
    const target = act.payload as Position;
    const occ = Object.values(this.engine.gameState.players).some(pl =>
      pl.id !== p.id && pl.position.x === target.x && pl.position.y === target.y
    );
    if (occ) return {success:false, affectedPositions:[p.position], message:'Клетка занята'};
    const from = {...p.position};
    p.position = {...target};
  
    // Запускаем анимацию ходьбы
    spriteManager.playAnimation(p.id, 'walk', p.position);
    setTimeout(() => spriteManager.playAnimation(p.id, 'idle', p.position), 500);  // Через 0.5 сек вернется Idle

    return {success:true, affectedPositions:[from, target], message:'Перемещение'};
  }
  

  private doDefend(p: Player): ActionResult {
    p.isDefending = true;
    return {
      success: true,
      affectedPositions: [p.position],
      message: 'Защита',
      visualEffects: [{
        type: 'shield',
        position: p.position,
        duration: 1000,
      }]
    }
  }

  private doAttack(p: Player, act: GameAction): ActionResult {
    const weapon = p.weapons.find(w=>w.type===p.activeWeapon);
    if (!weapon) return {success:false, affectedPositions:[], message:'Без оружия'};
    if (p.resources.ammo < weapon.ammoPerShot) return {success:false, affectedPositions:[], message:'Нет патронов'};
    p.resources.ammo -= weapon.ammoPerShot;

    const enemy = this.engine.gameState.players[p.id === 'player1' ? 'player2' : 'player1'];

    let target: Position;
    if ( act.payload && (weapon.type==='shotgun'|| act.payload.targetPosition || (typeof act.payload.x==='number' && typeof act.payload.y==='number')) ) {
      target = act.payload.targetPosition || act.payload;
    } else {
      target = {...enemy.position};
    }

    const dist = Math.abs(target.x - p.position.x) + Math.abs(target.y - p.position.y);
    if(dist > weapon.range){
      return {
        success:true,
        affectedPositions:[target],
        message:'Цель вне зоны',
        visualEffects:[{type:'miss', position:target, duration:600}]
      }
    }

    let area : Position[];
    if( weapon.type==='shotgun'){
      area = weapon.attackPattern.map(offset=>({x:target.x+offset.x, y:target.y+offset.y}));
    } else{
      area = [{...target}];
    }
    const validPos = area.filter(pos=> pos.x>=0 && pos.x<6 && pos.y>=0 && pos.y<3);

    const hitPlayers = Object.values(this.engine.gameState.players).filter(pp =>
      pp.id !== p.id && validPos.some(pos=> pos.x===pp.position.x && pos.y===pp.position.y)
    );

    hitPlayers.forEach(tp => {
      let dmg = weapon.damage;
      if(tp.isDefending && tp.resources.shield>0){
        tp.resources.shield = Math.max(0, tp.resources.shield-1);
        dmg = 0; // щит блокирует весь урон
      }
      tp.resources.health = Math.max(0, tp.resources.health-dmg);
      console.log(`${tp.id} получил урон: ${dmg}, здоровье: ${tp.resources.health}, щиты: ${tp.resources.shield}`);
    });

    const effects: VisualEffect[] = [];
    validPos.forEach(pos => {
      if(hitPlayers.some(tp=>tp.position.x === pos.x && tp.position.y===pos.y))
        effects.push({type:'explosion', position:pos, duration:800});
      else
        effects.push({type:'miss', position:pos, duration:600});
    });
    return {
      success:true,
      affectedPositions: validPos,
      message: hitPlayers.length?'Попадание':'Промах',
      visualEffects: effects
    }
  }

  getAvailableActions(): ActionType[] { return []; }
  getAvailableMoves(): Position[] { return []; }
  getAvailableTargets(): Position[] { return []; }
  isRoundComplete() { return true; }
}
