(function() {

  Strophe.addConnectionPlugin('pep', (function() {
    var conn, init, publish, subscribe, unsubscribe;
    conn = null;
    init = function(c) {
      conn = c;
      if (conn.caps === void 0) throw new Error("caps plugin required!");
      if (conn.pubsub === void 0) throw new Error("pubsub plugin required!");
    };
    subscribe = function(node, handler) {
      conn.caps.addFeature(node);
      conn.caps.addFeature("" + node + "+notify");
      conn.addHandler(handler, Strophe.NS.PUBSUB_EVENT, "message", null, null, null);
      return conn.caps.sendPres();
    };
    unsubscribe = function(node) {
      conn.caps.removeFeature(node);
      conn.caps.removeFeature("" + node + "+notify");
      return conn.caps.sendPres();
    };
    publish = function(node, items, callback) {
      return conn.pubsub.publish(node, items, callback);
    };
    return {
      init: init,
      publish: publish,
      subscribe: subscribe,
      unsubscribe: unsubscribe
    };
  })());

}).call(this);
