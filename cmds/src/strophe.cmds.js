(function() {
  var CMD, CommandNode, RemoteCommand, create, createExecIQ;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  CMD = "http://jabber.org/protocol/commands";
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
  createExecIQ = function(opt) {
    var cfg, i, iq, item, _ref;
    iq = $iq({
      to: opt.jid,
      type: "set"
    });
    cfg = {
      xmlns: CMD,
      node: opt.node
    };
    cfg.action = opt.action || "execute";
    if (opt.sid) {
      cfg.sessionid = opt.sid;
    }
    iq.c("command", cfg);
    if ($.isArray(opt.data)) {
      _ref = opt.data;
      for (i in _ref) {
        item = _ref[i];
        iq.c(opt.item[0].item).t(item).up();
      }
    }
    return iq;
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
  RemoteCommand = (function() {
    function RemoteCommand(conn, jid, node) {
      this.conn = conn;
      this.jid = jid;
      this.node = node;
      this.executeAction = "execute";
      this.actions = [];
      this.sessionid = null;
      this.data = null;
      this.form = null;
      this.status = null;
    }
    RemoteCommand.prototype.parseCmdResult = function(res) {
      var a, actions, cmd;
      cmd = ($(res)).find("command");
      this.sessionid = cmd.attr("sessionid");
      this.stauts = cmd.attr("status");
      actions = cmd.find("actions");
      this.execueAction = actions.attr("execute");
      this.actions = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = actions.length; _i < _len; _i++) {
          a = actions[_i];
          _results.push(a.nodeName);
        }
        return _results;
      })();
      return this.form = cmd.find("x");
    };
    RemoteCommand.prototype.onSuccess = function(res) {};
    RemoteCommand.prototype.onError = function(res) {};
    RemoteCommand.prototype.execute = function() {
      return this.conn.cmds.execute(this.jid, this.node, {
        success: this.parseCmdResult,
        error: this.onError
      });
    };
    RemoteCommand.prototype.next = function(responseForm) {
      return this.conn.cmds.execute(this.jid, this.node, {
        action: "next",
        success: this.parseCmdResult,
        error: this.onError
      });
    };
    RemoteCommand.prototype.prev = function() {
      return this.conn.cmds.execute(this.jid, this.node, {
        action: "prev",
        success: this.parseCmdResult,
        error: this.onError
      });
    };
    RemoteCommand.prototype.complete = function(responseForm) {
      return this.conn.cmds.execute(this.jid, this.node, {
        action: "complete",
        success: this.onSuccess,
        error: this.onError
      });
    };
    RemoteCommand.prototype.cancel = function() {
      return this.conn.cmds.execute(this.jid, this.node, {
        action: "cancel",
        success: this.onSuccess,
        error: this.onError
      });
    };
    RemoteCommand.prototype.isValidAction = function(action) {
      return __indexOf.call(this.actions, action) >= 0;
    };
    RemoteCommand.prototype.toIQ = function() {
      return createExecIQ({
        jid: this.jid,
        node: this.node,
        action: this.action,
        sessionid: this.sessionid,
        data: this.data
      });
    };
    return RemoteCommand;
  })();
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
      console.warn(this.fn);
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
    RemoteCommand: RemoteCommand,
    create: create
  };
  Strophe.addConnectionPlugin("cmds", (function() {
    var add, cmds, conn, execute, init, reply, statusChanged;
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
    statusChanged = function(status, condition) {
      if (status === Strophe.Status.CONNECTED) {
        return conn.addHandler(reply.bind(this), CMD, "iq", "set");
      }
    };
    execute = function(jid, node, opt) {
      var iq, noop;
      if (opt == null) {
        opt = {};
      }
      iq = createExecIQ({
        jid: jid,
        node: node,
        action: opt.action,
        sessionid: opt.sid,
        data: opt.data,
        item: $.grep(cmds.items, function(n) {
          return n.node === node;
        })
      });
      noop = Strophe.Disco.noop;
      return conn.sendIQ(iq, opt.success || noop, opt.error || noop);
    };
    return {
      init: init,
      statusChanged: statusChanged,
      add: add,
      execute: execute,
      exec: execute
    };
  })());
}).call(this);
