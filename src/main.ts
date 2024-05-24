import { ConditionPF2e } from '@item';

// GLOBALS
const MODULE_NAME = 'PF2e Party Effects';
const MODULE_ID = 'pf2e-partyeffects';

let socket;

Hooks.once('socketlib.ready', () => {
  log('Initializing');
  socket = socketlib.registerModule(MODULE_ID);
  socket.register('addCondition', addCondition);
  socket.register('addEffect', addEffect);
});

Hooks.on('dropActorSheetData', (actor: Actor, _sheet, data: any) => {
  if (isValidTarget(actor)) {
    const item = fromUuidSync(data.uuid);
    if (!item) return;

    if (item.type === 'condition' || item.type === 'effect') {
      if (!isGMOnline()) {
        ui.notifications.error(
          game.i18n.localize(`${MODULE_ID}.error.gmNotOnline`)
        );
        return;
      }

      if (item.type === 'condition') {
        socket.executeAsGM('addCondition', actor.id, data.uuid, data.value);
      } else if (item.type === 'effect') {
        socket.executeAsGM('addEffect', actor.id, data.uuid);
      }
    }
  }
});

function log(message: string, ...args: any[]) {
  console.info(`${MODULE_NAME} | ${message}`, ...args);
}

async function addCondition(targetId, conditionId, value) {
  const actor = game.actors.get(targetId);
  const condition = (await fromUuid(conditionId)) as ConditionPF2e;
  if (!actor || !condition) return;

  actor.increaseCondition(condition.slug, { value: value });
}

async function addEffect(targetId, effectId) {
  const actor = game.actors.get(targetId);
  const effect = await fromUuid(effectId);
  if (!actor || !effect) return;

  const source = effect.toObject();

  actor.createEmbeddedDocuments('Item', [source]);
}

function isGMOnline(): boolean {
  return game.users.find((u) => u.isGM && u.active) !== undefined;
}

function isValidTarget(target: Actor): boolean {
  if (!target) return false;
  if (target.type !== 'character') return false;
  if (target.isOwner) return false;
  if (!target.hasPlayerOwner) return false;

  return true;
}
