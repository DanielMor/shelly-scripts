let CONFIG = {
  id: '0',
  debug: false,
  remote: {
    ip: '192.168.0.1',
    id: '0'
  }
};

function debug(msg) {
  CONFIG.debug && print(msg);
}

// REMOTE Shelly
let RemoteShelly = {
  _cb: function (result, error_code, error_message, callback) {
    let rpcResult = JSON.parse(result.body);
    let rpcCode = result.code;
    let rpcMessage = result.message;
    callback(rpcResult, rpcCode, rpcMessage);
  },
  composeEndpoint: function (method) {
    return "http://" + this.address + "/rpc/" + method;
  },
  call: function (rpc, data, callback) {
    let postData = {
      url: this.composeEndpoint(rpc),
      body: data,
    };
    Shelly.call("HTTP.POST", postData, RemoteShelly._cb, callback);
  },
  getInstance: function (address) {
    let rs = Object.create(this);
    rs.getInstance = null;
    rs.address = address;
    return rs;
  },
};

let remoteShelly = RemoteShelly.getInstance(CONFIG.remote.ip);
let component = "switch:" + CONFIG.id;

function statusHandlerCallback(e) {
  debug(JSON.stringify(e));

  if (e.component === component) {
    let nextState = e.delta && e.delta.output;
    let isValid = nextState === false || nextState === true;

    debug(JSON.stringify({ nextState, isValid }));

    if (isValid && e.delta.source === "switch") {
      print('Send to remote on=' + nextState);

      remoteShelly.call(
        "switch.set",
        { id: CONFIG.remote.id, on: nextState },
        function (result, error_code, message) {
          debug(JSON.stringify(result));
          print('Result: ', error_code, message);
        }
      );
    }
  }
}

Shelly.addStatusHandler(statusHandlerCallback);
