(function() {
  var CommandNode, create;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  create = function(node, callback) {
    if (callback == null) {
      callback = Strophe.Disco.noop;
    }
    switch (node) {
      case "getUrls":
        return new CommandNode({
          item: "url",
          node: "getUrls",
          name: "Retrieve Urls",
          callback: callback
        });
      case "setUrls":
        return new CommandNode({
          item: "url",
          node: "setUrls",
          name: "Sets Urls",
          callback: callback
        });
      default:
        throw "Strophe.Commands has no implementation for: " + node;
    }
  };
  Strophe.Disco.DiscoNode.prototype.reply = function(iq, fn) {
    var req, res;
    req = this.parseRequest(iq);
    res = this.fromTo(req);
    this.fn = fn;
    this.addFirstChild(req, res);
    this.addContent(req, res);
    return res;
  };
  CommandNode = (function() {
    __extends(CommandNode, Strophe.Disco.DiscoNode);
    function CommandNode(cfg) {
      var k, v;
      for (k in cfg) {
        v = cfg[k];
        this[k] = v;
      }
    }
    CommandNode.prototype.send = function() {
      return $iq({});
    };
    CommandNode.prototype.callback = function(onSucces, onError) {
      return this.onSuccess({});
    };
    CommandNode.prototype.addContent = function(req, res) {
      this.req = req;
      this.res = res;
      return this.callback.call(this, this.onSuccess.bind(this), this.onError.bind(this));
    };
    CommandNode.prototype.onError = function() {
      res.attrs({
        status: "error"
      });
      return this.fn.call(this, res);
    };
    CommandNode.prototype.onSuccess = function(obj) {
      var entry, i, item, res;
      res = this.res;
      item = this.item;
      res.attrs({
        status: "completed"
      });
      if ($.isArray(obj)) {
        for (i in obj) {
          entry = obj[i];
          res.c(item).t(entry).up();
        }
      }
      return this.fn.call(this, res);
    };
    return CommandNode;
  })();
  Strophe.Commands = {
    CommandNode: CommandNode,
    create: create
  };
  Strophe.addConnectionPlugin("cmds", (function() {
    var CMD, add, cmds, conn, execute, init, reply, request, statusChanged;
    CMD = "http://jabber.org/protocol/commands";
    conn = cmds = null;
    init = function(c) {
      conn = c;
      Strophe.addNamespace("COMMANDS", CMD);
      return cmds = conn.disco.features[CMD] = {
        items: []
      };
    };
    add = function(item) {
      if (!item.node) {
        throw "command needs a node";
      }
      if (!item.jid) {
        item.jid = conn.jid;
      }
      return cmds.items.push(new CommandNode(item));
    };
    reply = function(iq) {
      var n, node, nodeImpl;
      node = ($("command", iq)).attr("node");
      n = $.grep(cmds.items, function(n) {
        return n.node === node;
      });
      if (n.length === 0) {
        nodeImpl = new DiscoNodeNotFound;
        conn.send(nodeImpl.reply(iq));
      } else {
        nodeImpl = n[0];
        nodeImpl.reply(iq, __bind(function(res) {
          return conn.send(res);
        }, this));
      }
      return true;
    };
    request = function(conn, jid, node, args) {
      var data, iq;
      iq = $iq({
        to: jid,
        type: "set"
      });
      iq.c("command", {
        xmlns: CMD,
        node: node,
        action: "execute"
      });
      data = $.grep($.makeArray(args), function(arg) {
        return $.isArray(arg);
      });
      return conn.sendIQ(iq);
    };
    statusChanged = function(status, condition) {
      if (status === Strophe.Status.CONNECTED) {
        return conn.addHandler(reply.bind(this), CMD, "iq", "set");
      }
    };
    execute = function(jid, node, data, onSuccess, onError) {
      var i, iq, item, n, noop;
      n = $.grep(cmds.items, function(n) {
        return n.node === node;
      });
      iq = $iq({
        to: jid,
        type: "set"
      });
      iq.c("command", {
        xmlns: CMD,
        node: node,
        action: "execute"
      });
      if ($.isArray(data)) {
        for (i in data) {
          item = data[i];
          iq.c(n[0].item).t(item).up();
        }
      } else {
        onSuccess = data;
        onError = onSuccess;
      }
      noop = Strophe.Disco.noop;
      return conn.sendIQ(iq, onSuccess || noop, onError || noop);
    };
    return {
      init: init,
      statusChanged: statusChanged,
      add: add,
      execute: execute
    };
  })());
}).call(this);
