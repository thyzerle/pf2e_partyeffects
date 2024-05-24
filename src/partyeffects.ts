import { ConditionPF2e, EffectPF2e } from '@item';

/*
 * Add a condition to an actor
 */
async function addCondition(targetId, conditionId, value) {
  const actor = game.actors.get(targetId);
  const condition = (await fromUuid(conditionId)) as ConditionPF2e;
  if (!actor || !condition) return;

  actor.increaseCondition(condition.slug, { value: value });
}

/*
 * Add an effect to an actor
 */
async function addEffect(targetId, effectId) {
  const actor = game.actors.get(targetId);
  const effect = (await fromUuid(effectId)) as EffectPF2e;
  if (!actor || !effect) return;

  const source = effect.toObject();

  actor.createEmbeddedDocuments('Item', [source]);
}

/*
 * Check if the target is a valid actor
 * - Not undefined
 * - Is a character
 * - Is not owned by the current user (Also excludes the GM)
 * - Is owned by (another) player
 */
function isValidTarget(target: Actor): boolean {
  if (!target) return false;
  if (target.type !== 'character') return false;
  if (target.isOwner) return false;
  if (!target.hasPlayerOwner) return false;

  return true;
}

export { addCondition, addEffect, isValidTarget };
