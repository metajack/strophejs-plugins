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
    /***Function

        Publish and item to the given pubsub node.

        Parameters:
        (String) node -  The name of the pubsub node.
        (Array) items -  The list of items to be published.
        (Function) call_back - Used to determine if node
        creation was sucessful.
        */
        publish: function(node, items, call_back) {
            var that = this.conn;
            var iqid = that.getUniqueId("pubsubpublishnode");

            var iq = $iq({from:that.jid,type:'set', id:iqid})
              .c('pubsub', { xmlns:Strophe.NS.PUBSUB })
              .c('publish', { node:node, jid:that.jid })
              .list('item', items);

            that.addHandler(call_back, null, 'iq', null, iqid, null);
            that.send(iq.tree());

            return iqid;
        },
        

    return {
      init: init,
      publish: publish,
      subscribe: subscribe,
      unsubscribe: unsubscribe
    };
  })());

}).call(this);
