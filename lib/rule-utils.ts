import { Rule, ActionType, TriggerType } from '@/src/types/rules';

export function getRuleDescription(rule: Rule): string {
  // 1. Describe Trigger
  let triggerDesc = '';
  if (rule.trigger.type === TriggerType.ON_LAND) {
    if (rule.trigger.value !== undefined && rule.trigger.value !== null) {
      triggerDesc = `Sur la case ${rule.trigger.value}`;
    } else {
      triggerDesc = `Sur n'importe quelle case`;
    }
  } else if (rule.trigger.type === TriggerType.ON_DICE_ROLL) {
      if (rule.trigger.value !== undefined && rule.trigger.value !== null) {
          triggerDesc = `Si le dé fait ${rule.trigger.value}`;
      } else {
          triggerDesc = `Au lancer de dé`;
      }
  } else if (rule.trigger.type === TriggerType.ON_PASS_OVER) {
      if (rule.trigger.value !== undefined && rule.trigger.value !== null) {
          triggerDesc = `En passant par la case ${rule.trigger.value}`;
      } else {
          triggerDesc = `En passant par une case`;
      }
  } else if (rule.trigger.type === TriggerType.ON_TURN_START) {
      triggerDesc = `Au début du tour`;
  } else if (rule.trigger.type === TriggerType.ON_MOVE_START) {
      triggerDesc = `Au début du mouvement`;
  } else {
    triggerDesc = rule.trigger.type; // Fallback
  }

  // 2. Describe Effects
  if (!rule.effects || rule.effects.length === 0) {
      return `${triggerDesc} : (Aucun effet)`;
  }

  const effect = rule.effects[0]; // Start with first effect
  let actionDesc = '';
  
  switch (effect.type) {
    case ActionType.MOVE_RELATIVE:
      actionDesc = effect.value > 0 ? `avancer de ${effect.value}` : `reculer de ${Math.abs(effect.value)}`;
      break;
    case ActionType.MODIFY_SCORE:
      actionDesc = effect.value > 0 ? `gagner ${effect.value} pts` : `perdre ${Math.abs(effect.value)} pts`;
      break;
    case ActionType.TELEPORT:
      actionDesc = `aller à la case ${effect.value}`;
      break;
    case ActionType.SKIP_TURN:
      actionDesc = `passer le tour`;
      break;
    default:
      actionDesc = `${effect.type} (${effect.value})`;
  }

  // Add target info if not self
  if (effect.target === 'all') {
      actionDesc += ` (Tous)`;
  } else if (effect.target === 'others') {
      actionDesc += ` (Les autres)`;
  }

  return `${triggerDesc} : ${actionDesc}`;
}
