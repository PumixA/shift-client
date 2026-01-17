// Based on "Triggers de Mouvement" & "Triggers de Tour"
export enum TriggerType {
  ON_LAND = 'ON_LAND', // Le classique
  ON_PASS_OVER = 'ON_PASS_OVER',
  ON_MOVE_START = 'ON_MOVE_START',
  ON_TURN_START = 'ON_TURN_START',
  ON_DICE_ROLL = 'ON_DICE_ROLL'
}

// Based on "Actions de Déplacement" & "Actions de Stats"
export enum ActionType {
  MOVE_RELATIVE = 'MOVE_RELATIVE', // Avancer/Reculer
  TELEPORT = 'MOVE_TO_TILE',       // Aller à une case
  MODIFY_SCORE = 'MODIFY_STAT',    // Gagner/Perdre points
  SKIP_TURN = 'SKIP_NEXT_TURN'
}

export interface RuleEffect {
  type: ActionType;
  value: number; // Can be negative for backward/penalty
  target: 'self' | 'all' | 'others';
}

export interface Rule {
  id: string; // UUID
  title: string;
  description?: string;
  trigger: {
    type: TriggerType;
    value?: number; // Example: Tile Index for ON_LAND, or Dice Value for ON_DICE_VALUE
  };
  // Simplified for MVP (No complex conditions yet)
  conditions: never[]; 
  effects: RuleEffect[];
}
