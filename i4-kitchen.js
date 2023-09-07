let CONFIG = {
  target: {
    ip: '192.168.0.1',
    id: '0',
  }
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomColor() {
  let red = randomIntFromInterval(0, 255);
  let green = randomIntFromInterval(0, 255);
  let blue = randomIntFromInterval(0, 255);
  let baseUrl = 'http://' + CONFIG.target.ip + '/color/' + CONFIG.target.id;
  let params = '?turn=on&red=' + red +'&green=' + green + '&blue=' + blue;
  Shelly.call('http.get', { url: baseUrl + params });
}

let ACTIONS = {
  'input:1': {
    'double_push': randomColor,
  }
}

print('Start Running')

Shelly.addEventHandler(function(e) {
  let inputActions = ACTIONS[e.component];
  
  if (inputActions) {
    if (inputActions[e.info.event]) {
      print('Executing ' + e.component + '|' + e.info.event);
      inputActions[e.info.event]();
    }
  }
});
