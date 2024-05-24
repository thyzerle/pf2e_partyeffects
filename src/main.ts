import { MODULE_ID } from './globals.ts';
import { isGMOnline, log } from './utils.ts';
import { addCondition, addEffect, isValidTarget } from './partyeffects.ts';

/*
 * Socket handling
 */
let socket;

Hooks.once('socketlib.ready', () => {
  log('Initializing');
  socket = socketlib.registerModule(MODULE_ID);
  socket.register('addCondition', addCondition);
  socket.register('addEffect', addEffect);
});

/*
 * onDropActorSheetData (also triggers when dropping an item on an token)
 */
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
        return false;
      } else if (item.type === 'effect') {
        socket.executeAsGM('addEffect', actor.id, data.uuid);
        return false;
      }
    }
  }
  return;
});
