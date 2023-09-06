let CONFIG = {
  ids: [0, 1],
  debug: false
};
  
function debug(msg) {
  CONFIG.debug && print(msg);
}

let components = [];

for (let i = 0; i < CONFIG.ids.length; i++) {
  components.push('switch:' + CONFIG.ids[i]);
}

function filterIds(currentId) {
  return CONFIG.ids.filter(function (value) {
    return currentId !== value
  })
}

function statusHandlerCallback(e) {
  debug(JSON.stringify(e));

  if (components.indexOf(e.component) !== -1) {
    let targetIds = filterIds(e.id);

    let nextState = e.delta && e.delta.output;
    let isValid = nextState === false || nextState === true;

    debug(JSON.stringify({ nextState: nextState, isValid: isValid, id: e.id, targetIds: targetIds }));

    if (isValid && e.delta.source === "switch") {
      for (let i = 0; i < targetIds.length; i++) {
        print('Send to id=' + targetIds[i] + ' on=' + nextState);

        Shelly.call("switch.set", {'id': targetIds[i], 'on': nextState });
      }
    }
  }
}
  
Shelly.addStatusHandler(statusHandlerCallback);
