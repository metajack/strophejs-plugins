(function() {
  var CMD, CommandNode, RemoteCommand, create, createExecIQ;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __indexOf = Array.prototype.indexOf || function(item) {
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
  };
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
    } else if (opt.form) {
      iq.cnode(opt.form.toXML());
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
      this.openDialog = __bind(this.openDialog, this);
      this.executeAction = "execute";
      this.actions = [];
      this.sessionid = null;
      this.data = null;
      this.form = null;
      this.resonseForm = null;
      this.status = null;
      this.error = null;
    }
    RemoteCommand.prototype._parseResult = function(res) {
      var cmd;
      cmd = ($(res)).find("command");
      this.sessionid = cmd.attr("sessionid");
      this.status = cmd.attr("status");
      this._parseActions(cmd);
      this._parseResultForm(cmd);
      return this._parseError(res);
    };
    RemoteCommand.prototype._parseActions = function(cmd) {
      var a, actions;
      actions = cmd.find("actions");
      if (actions.length > 0) {
        this.executeAction = actions.attr("execute");
        return this.actions = (function() {
          var _i, _len, _ref, _results;
          _ref = actions.children();
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            a = _ref[_i];
            _results.push(a.nodeName);
          }
          return _results;
        })();
      }
    };
    RemoteCommand.prototype._parseResultForm = function(cmd) {
      var x;
      x = cmd.find("x");
      if (x.length > 0) {
        return this.form = Strophe.x.Form.fromXML(x);
      } else {
        return this.form = null;
      }
    };
    RemoteCommand.prototype._parseError = function(res) {
      var e, err;
      res = $(res);
      err = res.find("error");
      if (err.length > 0) {
        return this.error = {
          code: err.attr("code"),
          type: err.attr("type"),
          conditions: (function() {
            var _i, _len, _ref, _results;
            _ref = err.children();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              e = _ref[_i];
              _results.push(e.nodeName);
            }
            return _results;
          })()
        };
      } else {
        return this.error = null;
      }
    };
    RemoteCommand.prototype._parseSubmitFormFromHTML = function(html) {
      var f, form, _i, _len, _ref;
      form = Strophe.x.Form.fromHTML(html);
      form.type = "submit";
      _ref = form.fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        f.options = [];
        f.required = false;
      }
      return form;
    };
    RemoteCommand.prototype._createFn = function(action, div, opt) {
      var close;
      close = function() {
        return div.dialog("close");
      };
      switch (action.toLowerCase()) {
        case "next":
          return __bind(function() {
            close();
            opt.responseForm = this._parseSubmitFormFromHTML(div);
            return this.next(opt);
          }, this);
        case "prev":
          return __bind(function() {
            close();
            return this.prev(opt);
          }, this);
        case "complete":
          return __bind(function() {
            close();
            opt.responseForm = this._parseSubmitFormFromHTML(div);
            return this.complete(opt);
          }, this);
        case "cancel":
          return __bind(function() {
            close();
            return this.cancel(opt);
          }, this);
        default:
          return __bind(function() {}, this);
      }
    };
    RemoteCommand.prototype.openDialog = function(opt) {
      var a, actions, div, _i, _len, _ref;
      if (!$.fn.dialog) {
        throw new Error("jQuery dialog is not available");
      }
      if (this.form) {
        actions = {};
        div = $(this.form.toHTML());
        _ref = this.actions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          a = _ref[_i];
          actions[a] = this._createFn(a, div, opt);
        }
        div.find("h1").remove();
        return div.dialog({
          autoOpen: true,
          modal: true,
          title: this.form.title,
          buttons: actions
        });
      }
    };
    RemoteCommand.prototype.onSuccess = function(res, cmd) {};
    RemoteCommand.prototype.onError = function(res, cmd) {
      if (console && cmd.error) {
        return console.error("could not exectute command.\nError:\n  Type: " + cmd.error.type + ",\n  Code: " + cmd.error.code + ",\"\n  Conditions: " + (cmd.error.conditions.join(',')));
      }
    };
    RemoteCommand.prototype._exec = function(opt) {
      if (opt.gui === true) {
        opt.success = function(res, cmd) {
          return cmd.openDialog(opt);
        };
      }
      return this.conn.cmds.execute(this.jid, this.node, {
        success: __bind(function(res) {
          this._parseResult(res);
          if (opt.success) {
            return opt.success(res, this);
          } else {
            return this.onSuccess(res, this);
          }
        }, this),
        error: __bind(function(res) {
          this._parseResult(res);
          if (opt.error) {
            return opt.error(res, this);
          } else {
            return this.onError(res, this);
          }
        }, this),
        sid: this.sessionid,
        action: this.executeAction,
        form: this.responseForm
      });
    };
    RemoteCommand.prototype.execute = function(opt) {
      return this._exec(opt);
    };
    RemoteCommand.prototype.next = function(opt) {
      if (opt.responseForm) {
        this.responseForm = opt.responseForm;
      }
      this.executeAction = "next";
      return this._exec(opt);
    };
    RemoteCommand.prototype.prev = function(opt) {
      this.executeAction = "prev";
      return this._exec(opt);
    };
    RemoteCommand.prototype.complete = function(opt) {
      if (opt.responseForm) {
        this.responseForm = opt.responseForm;
      }
      this.executeAction = "complete";
      return this._exec(opt);
    };
    RemoteCommand.prototype.cancel = function(opt) {
      this.executeAction = "cancel";
      return this._exec(opt);
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
        sid: opt.sid,
        data: opt.data,
        form: opt.form,
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
