/**
 * ConnectionSentinel is a subject to become part of the buster testing tools for connection management.
 */
function ConnectionSentinel() {
  this._connected = false;
  this._connecting = false;
  this._disconnecting = false;
};

ConnectionSentinel.prototype.connect = function(gate, user, password) {
  if(this._connected) return;
  if(this._connecting) return;
  this._connecting = true;
  this._connection = new Strophe.Connection(gate);
  this._connectionDeferred = when.defer();
  this._connection.connect(user, password, this._onConnectionStatus.bind(this));
  return this._connectionDeferred.promise;
};

ConnectionSentinel.prototype.disconnect = function(successcb) {
  if(!this._connected) return;
  if(this._disconnecting) return;
  this._disconnecting = true;
  this._disconnectionDeferred = when.defer();
  this._connection.disconnect();
  return this._disconnectionDeferred.promise;
}

ConnectionSentinel.prototype._onConnectionStatus = function(status, reason) {
  if(this._connecting) {
    if([Strophe.Status.CONNECTED, Strophe.Status.CONNFAIL, Strophe.Status.ERROR, Strophe.Status.AUTHFAIL].indexOf(status) >= 0) {
      this._connecting = false;
      if(status == Strophe.Status.CONNECTED) {
        this._connected = true;
        try {
          this._connectionDeferred.resolver.resolve(true);
        } catch(e) {
          console.log("Error on connection success callback");
        }
      } else { //if(status == Strophe.Status.CONNFAIL) {
        this._connected = false;
        try {
          this._connectionDeferred.resolver.resolve(false);
        } catch(e) {
          console.log("Error on connection fail callback");
        }
      }
      this._connectionDeferred = null;
    }
  } else if(this._disconnecting) {
    if([Strophe.Status.DISCONNECTED].indexOf(status) >= 0) {
      this._connected = false;
      try {
        this._disconnectionDeferred.resolver.resolve();
      } catch(e) {
        console.log("Error on disconnection callback");
      }
      this._disconnecting = false;
      this._disconnectionDeferred = null;
      this._connection = null;
    }
  }
  return true;
}
