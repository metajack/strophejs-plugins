//var buster = require('buster');

var id = 0;

function Deffered() {
  this.id = ++id;
  this.callbacks = [];

  this.then = function(callback) {
    this.callbacks.push(callback);
  };

  this.finish = function() {
    var newCallbacks = [];
    for(var i = 0; i < this.callbacks.length; ++i) {
      try {
        if(this.callbacks[i]()) newCallbacks.push(this.callbacks[i]);
      } catch(e) {
        console.log("Error while processing finish");
        console.log(e);
        console.log(e.stack);
        // that's bad...
      }
    }
    this.callbacks = newCallbacks;
  };
};

buster.testCase("Check room handlers", {
  setUp: function() {
    this.timeout = 3000;

    this.connectionSentinel = new Deffered();

    this.connectionSentinel.connectionStatus = function(status) {
      if(status != this.waitForStatus) return;
      this.waitForStatus = -1;
      this.finish();
    }.bind(this.connectionSentinel);

    this.connectionSentinel.waitForStatus = Strophe.Status.CONNECTED;

    this.conn = new Strophe.Connection("http://tigase.im:5280/xmpp-httpbind");
    this.conn.connect("dima@tigase.im", "master", this.connectionSentinel.connectionStatus);

    return this.connectionSentinel;
  },

  tearDown: function() {
    // this.connectionSentinel.waitForStatus = Strophe.Status.DISCONNECTED;
    this.conn.disconnect();
    // return this.connectionSentinel;
  },

  "Rooms should have separate callbacks": function() {
    function RoomClient(name) {
      var messages = [];
      var presences = [];
      var wrongHandler = false;

      this.message = new Deffered();
      this.presence = new Deffered();
      this.fail = new Deffered();

      this.messages = function() { return messages.slice(); }
      this.presences = function() { return presences.slice(); }
      this.wrongHandler = function() { return wrongHandler; }
      this.name = function() { return name; }

      this.onMessage = function(stanza, room) {
        if(room.name != name) {
          wrongHandler = true;
          this.fail.finish();
          return false;
        }

        messages.push(stanza);
        this.message.finish();
      }.bind(this);

      this.onPresence = function(stanza, room) {
        if(room.name != name) {
          wrongHandler = true;
          this.fail.finish();
          return false;
        }

        presences.push(stanza);
        this.presence.finish();
      }.bind(this);
    };

    var sentinel = new Deffered();

    var rooms = [new RoomClient("room-1@muc.tigase.im"),
                 new RoomClient("room-2@muc.tigase.im"),
                 new RoomClient("room-3@muc.tigase.im")];

    var gotPresence = false;
    var gotMessage = false;
    this.conn.muc.join(rooms[0].name(), "dima", rooms[0].onMessage, rooms[0].onPresence);
    rooms[0].presence.then(function() {
      gotPresence = true;
      this.conn.muc.groupchat(rooms[0].name(), "Hello, world!");
      return true;
    }.bind(this));
    rooms[0].message.then(function() {
      gotMessage = true;
      return true;
    });
    this.conn.muc.join(rooms[1].name(), "dima", rooms[1].onMessage, rooms[1].onPresence);

    setTimeout(function() {
      assert(gotPresence);
      assert(gotMessage);
      refute(rooms[0].wrongHandler());
      refute(rooms[1].wrongHandler());

      sentinel.finish();
    }, 2000);

    return sentinel;
  }
});
