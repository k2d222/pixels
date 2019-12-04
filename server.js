

export class Server {
  constructor(address, port) {
    this.websocket = new WebSocket(`ws://${address}:${port}/`);
    this.websocket.onmessage = this._onMessage.bind(this);
    this.events = {};
  }
}

Server.prototype.on = function(type, fn) {
  if( !(type in this.events) ) this.events[type] = [fn];
  else this.events[type].push(fn);
}

Server.prototype._onMessage = function(e) {
  let data = JSON.parse(e.data);
  let type = data.type;
  let content = data.content;

  if( !(type in this.events) ) console.warn("no callback for event", data);
  else {
    console.log('received event', data);
    for (let fn of this.events[type]) {
      fn(content);
    }
  }
}

Server.prototype.send = function(type, content) {
  let message = JSON.stringify({
    'type':type,
    'content':content
  });
  this.websocket.send(message);
}
