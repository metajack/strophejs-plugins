var id = 1;

(function() {
  const gate = "http://tigase.im:5280/xmpp-httpbind"
  const user = "dima@tigase.im";
  const password = "master";

  function generateUniqueName(list) {
    var uniqueListName = "z";
    for(var key in list)
      if(list.hasOwnProperty(key))
        uniqueListName += key;
    return uniqueListName;
  };

  buster.testCase("Testing callbacks throwing errors when not passed", {
    setUp: function() {
      this.timeout = 10000;
      this.connection = new ConnectionSentinel();
      var pr = this.connection.connect(gate, user, password);
      this.plugin = this.connection._connection.privacy;
      sinon.spy(Strophe, "error");
      return pr;
    },

    tearDown: function() {
      Strophe.error.restore();
      if(!this.connection._connected) return;
      return this.connection.disconnect();
    },

    "Should not try to call undefined callback on loading list": function() {
      this.plugin.getListNames();
      var d = when.defer();
      setTimeout(function() {
        assert(this.plugin.isInitialized, "Plugin was not well initialized");
        refute(Strophe.error.called, "Error should not arise while retrieving lists' names.");
        var testListName = generateUniqueName(this.plugin.lists);
        console.log("Generated name: " + testListName);
        var list = this.plugin.newList(testListName);
        list.items.push(this.plugin.newItem("jid", "hello", "allow", 10));
        this.plugin.saveList(testListName);
        setTimeout(function() {
          // actually, i don't have a way to check if it was a successful call. hope for best :)
          refute(Strophe.error.called, "Error should not arise while saving list.");
          this.plugin.loadList(testListName);
          setTimeout(function() {
            refute(Strophe.error.called, "Error should not arise while loading list.");
            this.plugin.deleteList(testListName);
            setTimeout(function() {
              refute(Strophe.error.called, "Error should not arise while deleting list.");
              d.resolver.resolve();
            }.bind(this), 2000);
          }.bind(this), 2000);
        }.bind(this), 2000);
      }.bind(this), 2000);
      return d.promise;
    }
  });
})();
