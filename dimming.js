let CONFIG = {
  inputs: [
    { target: { id: 0, ip: '192.168.0.1' } },
  ],
  debug: false,
}
  
function debug(msg) {
  CONFIG.debug && print(msg);
}

let Dimmer = {
  _endpoint: function (method) {
    return "http://" + this.ip + "/light/" + this.id + '?' + method;
  },
  'single_push': function() {
    debug(this._endpoint('dim=down&step=100'));
    Shelly.call('http.get', { url: this._endpoint('turn=toggle') });
  },
  'double_push': function() {
    Shelly.call('http.get', { url: this._endpoint('turn=on&brightness=90') });
  },
  'long_push': function() {
    if (this.isUp) {
      debug('Dimmer - dimming down');
      this.isUp = false;
      this.state = true;

      Shelly.call('http.get', { url: this._endpoint('dim=down&step=100') });
    } else {
      debug('Dimmer - dimming up');
      this.isUp = true;
      this.state = true;

      Shelly.call('http.get', { url: this._endpoint('dim=up&step=100') });
    }
  },
  'btn_up': function() {
    if (this.state) {
      debug('Dimmer - release');
      this.state = false;

      Shelly.call('http.get', { url: this._endpoint('dim=stop') });
    }
  },
  createInstance: function (config) {
    let _self = Object.create(this);
    _self.getInstance = null;
    _self.ip = config.target.ip;
    _self.id = config.target.id;
    _self.state = false;
    _self.isUp = false;
    return _self;
  },
};
  
let dimmers = [
  Dimmer.createInstance(CONFIG.inputs[0])
]

print('Start Running')

Shelly.addEventHandler(function(e) {
  let dimmer = dimmers[e.info.id];

  if (dimmer && dimmer[e.info.event]) {
    dimmer[e.info.event]();
  }
});
  