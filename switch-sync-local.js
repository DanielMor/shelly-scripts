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

  if (component.indexOf(e.component) === 0) {
    let currentId = parseInt(e.component.slice(7));
    let targetIds = filterIds(currentId);

    let nextState = e.delta && e.delta.output;
    let isValid = nextState === false || nextState === true;

    debug(JSON.stringify({ nextState: nextState, isValid: isValid, currentId: currentId, targetIds: targetIds }));

    if (isValid && e.delta.source === "switch") {
      for (let i = 0; i < targetIds.length; i++) {
        print('Send to id=' + targetIds[i] + ' on=' + nextState);

        Shelly.call("switch.set", {'id': targetIds[i], 'on': nextState });
      }
    }
  }
}
  
  Shelly.addStatusHandler(statusHandlerCallback);
  