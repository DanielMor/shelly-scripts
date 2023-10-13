let CONFIG = {
  inputs: [
    { type: 'dimmer', target: { id: 0, ip: '192.168.0.1' } },
    { type: 'rgbw2', target: { id: 0, ip: '192.168.0.1', mode: 'color' } },
    null,
    { type: 'rgbw2', target: { id: 0, ip: '192.168.0.1', mode: 'white' } },
  ],
  interval: 200,
  step: 5,
  min: 0,
  max: 100,
  debug: true,
};

function debug(msg) {
  CONFIG.debug && print(msg);
}

function increase(value, step, isUp) {
  if (isUp) {
    return Math.min(CONFIG.max, value + step)
  } else {
    return Math.max(CONFIG.min, value - step)
  }
}

let Dimmer = {
  _endpoint: function (method) {
    return this.baseUrl + '?' + method;
  },
  _execute: function(response) {
    let data = JSON.parse(response.body);
    this.isUp = !this.isUp;
    this.state = true;

    if (data.brightness === CONFIG.max) {
      this.isUp = false;
    } else if(data.brightness === CONFIG.min) {
      this.isUp = true;
    }

    if (this.isUp) {
      debug('Dimmer - dimming up');

      Shelly.call('http.get', { url: this._endpoint('dim=up&step=100') });
    } else {
      debug('Dimmer - dimming down');

      Shelly.call('http.get', { url: this._endpoint('dim=down&step=100') });
    }
  },
  'single_push': function() {
    Shelly.call('http.get', { url: this._endpoint('turn=toggle') });
  },
  'double_push': function() {
    Shelly.call('http.get', { url: this._endpoint('turn=on&brightness=90') });
  },
  'long_push': function() {
    Shelly.call('http.get', { url: this.baseUrl }, this._execute.bind(this));
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
    _self.baseUrl = 'http://' + _self.ip + '/light/' + _self.id;

    return _self;
  },
};

let RGBW2 = {
  _endpoint: function (method) {
    return this.baseUrl + '?' + method;
  },
  _execute: function(response) {
    let data = JSON.parse(response.body);
    this.brightness = this.mode === 'white' ? data.brightness : data.gain;
    this.isUp = !this.isUp; 

    debug('RGBW2 - brightness=' + this.brightness);

    if (this.brightness === CONFIG.max) {
      this.isUp = false;
    } else if(this.brightness === CONFIG.min) {
      this.isUp = true;
    }

    debug('RGBW2 - start timer isUp=' + this.isUp);
    this.timer = Timer.set(CONFIG.interval, true, this._timerCallback.bind(this));
  },
  _timerCallback: function() {
    if (this.isUp && this.brightness === CONFIG.max || !this.isUp && this.brightness === CONFIG.min) {
      return this._clearTimer();
    }

    this.brightness = increase(this.brightness, CONFIG.step, this.isUp);

    debug('RGBW2 - Set brightness to ' + this.brightness);
   
    if (this.mode === 'color') {
      Shelly.call('http.get', { url: this._endpoint('gain=' + this.brightness) });
    } else if (this.mode === 'white') {
      Shelly.call('http.get', { url: this._endpoint('brightness=' + this.brightness) });
    }
  },
  'single_push': function() {
    Shelly.call('http.get', { url: this._endpoint('turn=toggle') });
  },
  _clearTimer: function() {
    if (this.timer) {
      Timer.clear(this.timer)
      this.timer = null;
    }
  },
  'double_push': function() {
    if (this.mode === 'color') {
      Shelly.call('http.get', { url: this._endpoint('turn=on&gain=90') });
    } else if (this.mode === 'white') {
      Shelly.call('http.get', { url: this._endpoint('turn=on&brightness=90') });
    }
  },
  'long_push': function() {
    Shelly.call('http.get', { url: this.baseUrl }, this._execute.bind(this));
  },
  'btn_up': function() {
    this._clearTimer();
  },
  createInstance: function (config) {
    let _self = Object.create(this);
    _self.getInstance = null;
    _self.ip = config.target.ip;
    _self.id = config.target.id;
    _self.mode = config.target.mode;
    _self.isUp = false;
    _self.brightness = 0;
    _self.baseUrl = 'http://' + _self.ip + '/' + _self.mode + '/' + _self.id;

    return _self;
  },
};
  

let dimmers = CONFIG.inputs.map(function (config) {
  if (!config) {
    return null;
  }

  debug('Create ' + config.type);

  switch(config.type) {
    case 'rgbw2':
      return RGBW2.createInstance(config);

    case 'dimmer':
    default:
      return Dimmer.createInstance(config);
  }
});

print('Start Running')

Shelly.addEventHandler(function(e) {
  let dimmer = dimmers[e.info.id];

  if (dimmer && dimmer[e.info.event]) {
    print('Action call ' + e.info.event + '|' + e.info.id)
    dimmer[e.info.event]();
  }
});
