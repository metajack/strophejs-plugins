//var buster = require('buster');

var id = 0;

(function() {
const gate = "http://tigase.im:5280/xmpp-httpbind";
const user = "dima@tigase.im";
const password = "master";

function RoomClient(name) {
  var messages = [];
  var presences = [];
  var wrongHandler = false;

  this.message = when.defer();
  this.presence = when.defer();
  this.fail = when.defer();

  this.messages = function() { return messages.slice(); }
  this.presences = function() { return presences.slice(); }
  this.wrongHandler = function() { return wrongHandler; }
  this.name = function() { return name; }

  this.onMessage = function(stanza, room) {
    if(room.name != name) {
      wrongHandler = true;
      this.fail.resolver.resolve();
      return false;
    }

    messages.push(stanza);
    this.message.resolver.resolve();
  }.bind(this);

  this.onPresence = function(stanza, room) {
    if(room.name != name) {
      wrongHandler = true;
      this.fail.resolver.resolve();
      return false;
    }

    presences.push(stanza);
    this.presence.resolver.resolve();
  }.bind(this);
};

buster.testCase("Check room handlers", {
  setUp: function() {
    this.timeout = 5000;

    this.connection = new ConnectionSentinel();
    var pr = this.connection.connect(gate, user, password);
    this.plugin = this.connection._connection.muc;

    return pr;
  },

  tearDown: function() {
    if(!this.connection._connected) return;
    return this.connection.disconnect();
  },

  "Rooms should have separate callbacks": function() {
    var sentinel = when.defer();

    var rooms = [new RoomClient("room-1@muc.tigase.im"),
                 new RoomClient("room-2@muc.tigase.im"),
                 new RoomClient("room-3@muc.tigase.im")];

    var gotPresence = false;
    var gotMessage = false;
    this.plugin.join(rooms[0].name(), "dima", rooms[0].onMessage, rooms[0].onPresence);
    rooms[0].presence.promise.then(function() {
      gotPresence = true;
      this.plugin.groupchat(rooms[0].name(), "Hello, world!");
      return true;
    }.bind(this));
    rooms[0].message.promise.then(function() {
      gotMessage = true;
      return true;
    });
    this.plugin.join(rooms[1].name(), "dima", rooms[1].onMessage, rooms[1].onPresence);

    setTimeout(function() {
      assert(gotPresence);
      assert(gotMessage);
      refute(rooms[0].wrongHandler());
      refute(rooms[1].wrongHandler());

      sentinel.resolver.resolve();
    }, 2000);

    return sentinel.promise;
  }
});
})();
