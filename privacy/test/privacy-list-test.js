var id = 0;

const server = "tigase.im";
const gate = "http://" + server + ":5280/xmpp-httpbind"
const user = "dima@tigase.im";
const password = "master";
const otheruser = "dima1@tigase.im";
const otherpassword = "master";

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

buster.testCase("Check privacy lists", {
  setUp: function() {
    this.timeout = 12000;
    this.connection = new ConnectionSentinel();
    var pr = this.connection.connect(gate, user, password);
    this.plugin = this.connection._connection.privacy;
    return pr;
  },

  tearDown: function() {
    if(!this.connection._connected) return;
    return this.connection.disconnect();
  },

  "Basic usage. Add list, set active": function() {
    assert(this.connection._connected, "Connection is not available");
    var sconn = this.connection._connection;
    var d = when.defer();
    function alertAndStop(say) {
      return function() {
        alert(false, say);
        d.resolver.resolve();
      }
    };
    this.plugin.getListNames(function() {
      var list = this.plugin.newList("buster-tester");
      list.items = [this.plugin.newItem("kid", otheruser, "block", 10)];
      function saveListSuccess() {
        this.plugin.setActive(list.getName(), function() {
          this.otherConnection = new ConnectionSentinel();
          this.otherConnection.connect(gate, otheruser, otherpassword).then(function() {
            var messageTimerId = setTimeout(function() {
              alert(true, "Messages was filtered! or lost....");
              d.promise.resolver.resolve();
            }.bind(this), 2000);
            sconn.addHandler(function() {
              clearTimeout(messageTimerId);
              alertAndStop()();
            }.bind(this), null, "message", null, null, otheruser);
            this.otherConnection.send($msg({type: "chat"}).c("body", {}, "hello, dima!"));
          }.bind(this), alertAndStop("Unable to connect with other user"));
        }.bind(this), alertAndStop("Unable to set active list."));
      };
      if(!this.plugin.saveList(list.getName(), saveListSuccess.bind(this), alertAndStop("Failed to save list")))
        alertAndStop("List was wrongly formatted!")();
    }.bind(this), alertAndStop("List was wrongly formatted!"));
    return d.promise;
  },

  "Item validation": function() {
    var item = this.plugin.newItem("jid", "user@example.com", "allow", 12);
    assert(item.validate(), "Valid item");
    item = this.plugin.newItem("subscription", "from", "deny", 5, ["message", "iq"]);
    assert(item.validate(), "Valid item");

    item = this.plugin.newItem("WRONG", "blabla.com", "deny", 10);
    refute(item.validate(), "Bad type name");
    item = this.plugin.newItem("subscription", "eigther", "deny", 2, ["message", "presence-in"]);
    refute(item.validate(), "Bad subscription type");
    item = this.plugin.newItem("subscription", "both", "alala", 23, ["message"]);
    refute(item.validate(), "Bad action");
    item = this.plugin.newItem("jid", "domain", "allow", -2, ["message"]);
    refute(item.validate(), "Bad order");
    item = this.plugin.newItem("jid", "pivo@domain", "allow", 66, ["presence-in", "messages"]);
    refute(item.validate(), "Bad blocked stanza type");
  },

  "List validation": function() {
    var list = this.plugin.newList("booster-list-name");
    list.items = [this.plugin.newItem("jid", "user1@example.com", "block", 2),
                  this.plugin.newItem("jid", "user8@example.com", "block", 5, ["presence-out", "iq"]),
                  this.plugin.newItem("jid", "example.com/work", "allow", 8),
                  this.plugin.newItem("jid", "example.com", "block", 10, ["message"])];
    assert(list.validate(), "Valid list");

    list.items[2].order = list.items[0].order;
    refute(list.validate(), "Two items have same order.");
    list.items[2] = this.plugin.newItem("jid", "ololo.com", "bla!", 12);
    refute(list.validate(), "One of the items is invalid.");
  }
});
