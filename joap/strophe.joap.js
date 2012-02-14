(function() {
  var JOAPError, JOAP_NS, Server, add, addXMLAttributes, conn, createIq, del, describe, edit, getAddress, onError, parseAttributeDescription, parseAttributes, parseDesc, parseDescription, parseMethodDescription, parseNewAddress, parseSearch, read, search, sendRequest,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  JOAP_NS = "jabber:iq:joap";

  conn = null;

  onError = function(cb) {
    if (cb == null) cb = function() {};
    return function(iq) {
      var code, err, msg;
      err = iq.getElementsByTagName("error")[0];
      if (err != null) {
        code = err.getAttribute("code") * 1;
        msg = err.textContent;
        if (code === 503) msg = "JOAP server is unavailable";
        return cb(iq, new JOAPError(msg, code));
      } else {
        return cb(iq, new JOAPError("Unknown error"));
      }
    };
  };

  addXMLAttributes = function(iq, attrs) {
    var k, v, _results;
    if (typeof attrs === "object") {
      _results = [];
      for (k in attrs) {
        v = attrs[k];
        _results.push(iq.c("attribute").c("name").t(k).up().cnode(conn.rpc._convertToXML(v)).up().up());
      }
      return _results;
    }
  };

  parseAttributes = function(iq) {
    var a, attrs, data, key, _i, _len;
    attrs = iq.getElementsByTagName("attribute");
    data = {};
    for (_i = 0, _len = attrs.length; _i < _len; _i++) {
      a = attrs[_i];
      key = a.getElementsByTagName("name")[0].textContent;
      data[key] = conn.rpc._convertFromXML(a.getElementsByTagName("value")[0]);
    }
    return data;
  };

  parseNewAddress = function(iq) {
    var address;
    return address = iq.getElementsByTagName("newAddress")[0].textContent;
  };

  parseSearch = function(iq) {
    var i, items, _i, _len, _results;
    items = iq.getElementsByTagName("item");
    _results = [];
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      i = items[_i];
      _results.push(i.textContent);
    }
    return _results;
  };

  parseAttributeDescription = function(d) {
    var _ref, _ref2;
    return {
      name: (_ref = d.getElementsByTagName("name")[0]) != null ? _ref.textContent : void 0,
      type: (_ref2 = d.getElementsByTagName("type")[0]) != null ? _ref2.textContent : void 0,
      desc: parseDesc(d.getElementsByTagName("desc"))
    };
  };

  parseMethodDescription = function(d) {
    var _ref, _ref2;
    return {
      name: (_ref = d.getElementsByTagName("name")[0]) != null ? _ref.textContent : void 0,
      returnType: (_ref2 = d.getElementsByTagName("returnType")[0]) != null ? _ref2.textContent : void 0,
      desc: parseDesc(d.getElementsByTagName("desc"))
    };
  };

  parseDesc = function(desc) {
    var c, res, _i, _len;
    res = {};
    if (desc instanceof NodeList) {
      for (_i = 0, _len = desc.length; _i < _len; _i++) {
        c = desc[_i];
        res[c.getAttribute("xml:lang")] = c.textContent;
      }
    } else {
      res.desc[desc.getAttribute("xml:lang")] = desc.textContent;
    }
    return res;
  };

  parseDescription = function(iq) {
    var ad, c, describe, md, result, _i, _len, _ref;
    result = {
      desc: {},
      attributes: {},
      methods: {},
      classes: []
    };
    describe = iq.getElementsByTagName("describe")[0];
    _ref = describe.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      c = _ref[_i];
      switch (c.tagName.toLowerCase()) {
        case "desc":
          result.desc[c.getAttribute("xml:lang")] = c.textContent;
          break;
        case "attributedescription":
          ad = parseAttributeDescription(c);
          result.attributes[ad.name] = ad;
          break;
        case "methoddescription":
          md = parseMethodDescription(c);
          result.methods[md.name] = md;
          break;
        case "superclass":
          result.superclass = c.textContent;
          break;
        case "timestamp":
          result.timestamp = c.textContent;
          break;
        case "class":
          classes.push = c.textContent;
      }
    }
    return result;
  };

  getAddress = function(clazz, service, instance) {
    var addr, _ref;
    addr = "";
    if (typeof clazz === "string" ? clazz : void 0) addr += "" + clazz + "@";
    addr += service;
    if (((_ref = typeof instance) === "string" || _ref === "number")) {
      addr += "/" + instance;
    }
    return addr;
  };

  createIq = function(type, to) {
    var iqType;
    iqType = "set";
    if ((type === "read" || type === "search" || type === "describe")) {
      iqType = "get";
    }
    return $iq({
      to: to,
      type: iqType
    }).c(type, {
      xmlns: JOAP_NS
    });
  };

  sendRequest = function(type, to, cb, opt) {
    var iq, success;
    if (opt == null) opt = {};
    iq = createIq(type, to);
    if (typeof opt.beforeSend === "function") opt.beforeSend(iq);
    success = function(res) {
      return typeof cb === "function" ? cb(res, null, typeof opt.onResult === "function" ? opt.onResult(res) : void 0) : void 0;
    };
    return conn.sendIQ(iq, success, onError(cb));
  };

  describe = function(id, cb) {
    return sendRequest("describe", id, cb, {
      onResult: parseDescription
    });
  };

  read = function(instance, limits, cb) {
    if (typeof limits === "function") cb = limits;
    return sendRequest("read", instance, cb, {
      beforeSend: function(iq) {
        var l, _i, _len, _results;
        if (limits instanceof Array) {
          _results = [];
          for (_i = 0, _len = limits.length; _i < _len; _i++) {
            l = limits[_i];
            _results.push(iq.c("name").t(l).up());
          }
          return _results;
        }
      },
      onResult: parseAttributes
    });
  };

  add = function(clazz, attrs, cb) {
    if (typeof attrs === "function") cb = attrs;
    return sendRequest("add", clazz, cb, {
      beforeSend: function(iq) {
        return addXMLAttributes(iq, attrs);
      },
      onResult: parseNewAddress
    });
  };

  edit = function(instance, attrs, cb) {
    return sendRequest("edit", instance, cb, {
      beforeSend: function(iq) {
        return addXMLAttributes(iq, attrs);
      },
      onResult: parseAttributes
    });
  };

  search = function(clazz, attrs, cb) {
    if (typeof attrs === "function") cb = attrs;
    return sendRequest("search", clazz, cb, {
      beforeSend: function(iq) {
        return addXMLAttributes(iq, attrs);
      },
      onResult: parseSearch
    });
  };

  del = function(instance, cb) {
    return sendRequest("delete", instance, cb);
  };

  JOAPError = (function(_super) {

    __extends(JOAPError, _super);

    function JOAPError(message, code) {
      this.message = message;
      this.code = code;
      this.name = "JOAPError";
    }

    return JOAPError;

  })(Error);

  Server = (function() {

    function Server(service) {
      this.service = service;
    }

    Server.prototype.describe = function(clazz, instance, cb) {
      if (typeof clazz === "function") {
        cb = clazz;
        clazz = instance = null;
      } else if (typeof instance === "function") {
        cb = instance;
        instance = null;
      }
      return describe(getAddress(clazz, this.service, instance), cb);
    };

    Server.prototype.add = function(clazz, attrs, cb) {
      return add(getAddress(clazz, this.service), attrs, cb);
    };

    Server.prototype.read = function(clazz, instance, limits, cb) {
      return read(getAddress(clazz, this.service, instance), limits, cb);
    };

    Server.prototype.edit = function(clazz, instance, attrs, cb) {
      return edit(getAddress(clazz, this.service, instance), attrs, cb);
    };

    Server.prototype["delete"] = function(clazz, instance, cb) {
      return del(getAddress(clazz, this.service, instance), cb);
    };

    Server.prototype.search = function(clazz, attrs, cb) {
      return search(getAddress(clazz, this.service), attrs, cb);
    };

    return Server;

  })();

  Strophe.addConnectionPlugin('joap', (function() {
    var getObjectServer, init;
    getObjectServer = function(service) {
      return new Server(service);
    };
    init = function(c) {
      conn = c;
      Strophe.addNamespace("JOAP", JOAP_NS);
      if (!conn.hasOwnProperty("disco")) {
        return Strophe.warn("You need the discovery plugin to have JOAP fully implemented.");
      } else {
        conn.disco.addIdentity("automation", "joap");
        return conn.disco.addFeature(Strophe.NS.JOAP);
      }
    };
    return {
      init: init,
      getObjectServer: getObjectServer,
      describe: describe,
      add: add,
      read: read,
      edit: edit,
      "delete": del,
      search: search,
      JOAPError: JOAPError
    };
  })());

}).call(this);
