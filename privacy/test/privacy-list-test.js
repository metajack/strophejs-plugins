/**
 * Unfortunately, this testing suit will not work under chrome, because it brakes security, according to chrome - you
 * are not allowed to make any requests outside you domain name (which usually will be localhost), you cannot even make
 * calls to different port - which makes creating local tigase servers pretty useless. But if you decided to overcome
 * all difficulties, and finally test this plugin under chrome - you are welcome to share config files and simple howto.
 *
 * Different domains (tigase.im and sure.im) were selected for strophe was not up to connect to same domain, or better
 * to say, it did not want to disconnect. Anyway i fell into strange issues which maybe should be reported and solved in
 * Strophe itself.
 */

var id = 0;

(function() {
const gate = "http://tigase.im:5280/xmpp-httpbind";
const user = "dima@tigase.im";
const password = "master";
const othergate = "http://sure.im:5280/xmpp-httpbind";
const otheruser = "dima1@tigase.im";
const otherpassword = "master";

buster.testCase("Check privacy lists", {
  setUp: function() {
    this.timeout = 3000;
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
    this.timeout = 15000;
    var sconn = this.connection._connection;
    var d = when.defer();
    function alertAndStop(say) {
      return function() {
        assert(false, say);
        d.resolver.resolve();
      }
    };
    this.plugin.getListNames(function() {
      var list = this.plugin.newList("buster-tester");
      list.items = [this.plugin.newItem("jid", otheruser, "deny", 10)];
      function saveListSuccess() {
        this.plugin.setActive(list.getName(), function() {
          this.otherConnection = new ConnectionSentinel();
          this.otherConnection.connect(othergate, otheruser, otherpassword).then(function() {
            var messageTimerId = setTimeout(function() {
              assert(true, "Messages was filtered! or lost....");
              this.otherConnection.disconnect().then(function() {
                d.resolver.resolve();
              }.bind(this));
            }.bind(this), 2000);
            sconn.addHandler(function() {
              clearTimeout(messageTimerId);
              this.otherConnection.disconnect().then(function() {
                alertAndStop("Message was accepted")();
              }.bind(this));
            }.bind(this), null, "message");
            this.otherConnection._connection.send($msg({type: "chat", to: user}).c("body", {}, "hello, dima!"));
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
    item = this.plugin.newItem("", "", "deny", 5, ["message", "iq"]);
    assert(item.validate(), "Valid item with fall-through case.");

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
    list.items = [this.plugin.newItem("jid", "user1@example.com", "deny", 2),
                  this.plugin.newItem("jid", "user8@example.com", "deny", 5, ["presence-out", "iq"]),
                  this.plugin.newItem("jid", "example.com/work", "allow", 8),
                  this.plugin.newItem("jid", "example.com", "deny", 10, ["message"])];
    assert(list.validate(), "Valid list");

    list.items[2].order = list.items[0].order;
    refute(list.validate(), "Two items have same order.");
    list.items[2] = this.plugin.newItem("jid", "ololo.com", "bla!", 12);
    refute(list.validate(), "One of the items is invalid.");
  }
});
})();
