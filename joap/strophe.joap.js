(function() {
  var JOAPError, JOAP_NS, Server, conn,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  JOAP_NS = "jabber:iq:joap";

  conn = null;

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

    Server.onError = function(cb) {
      if (cb == null) cb = function() {};
      return function(iq) {
        var err, _ref;
        err = (_ref = iq.getElementsByTagName("error")) != null ? _ref[0] : void 0;
        return cb(iq, new JOAPError(err != null ? err.textContent(err != null ? err.getAttribute("code") : void 0) : void 0));
      };
    };

    Server.addXMLAttributes = function(iq, attrs) {
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

    Server.parseAttributes = function(iq) {
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

    Server.parseNewAddress = function(iq) {
      var address, _ref;
      address = (_ref = iq.getElementsByTagName("newAddress")) != null ? _ref[0] : void 0;
      return address.split("/")[1];
    };

    Server.parseSearch = function(iq) {
      var i, items, _i, _len, _results;
      items = iq.getElementsByTagName("item");
      _results = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        i = items[_i];
        _results.push(i.textContent.split('/')[1]);
      }
      return _results;
    };

    Server.parseAttributeDescription = function(d) {
      var _ref, _ref2;
      return {
        name: (_ref = d.getElementsByTagName("name")[0]) != null ? _ref.textContent : void 0,
        type: (_ref2 = d.getElementsByTagName("type")[0]) != null ? _ref2.textContent : void 0,
        desc: Server.parseDesc(d.getElementsByTagName("desc"))
      };
    };

    Server.parseMethodDescription = function(d) {
      var _ref, _ref2;
      return {
        name: (_ref = d.getElementsByTagName("name")[0]) != null ? _ref.textContent : void 0,
        returnType: (_ref2 = d.getElementsByTagName("returnType")[0]) != null ? _ref2.textContent : void 0,
        desc: Server.parseDesc(d.getElementsByTagName("desc"))
      };
    };

    Server.parseDesc = function(desc) {
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

    Server.parseDescription = function(iq) {
      var ad, c, describe, md, result, _i, _len, _ref;
      result = {
        desc: {},
        attributes: {},
        methods: {}
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
            ad = Server.parseAttributeDescription(c);
            result.attributes[ad.name] = ad;
            break;
          case "methoddescription":
            md = Server.parseMethodDescription(c);
            result.methods[md.name] = md;
            break;
          case "superclass":
            result.superclass = c.textContent;
            break;
          case "timestamp":
            result.timestamp = c.textContent;
        }
      }
      return result;
    };

    Server.prototype.sendRequest = function(type, clazz, cb, opt) {
      var iq, success;
      if (opt == null) opt = {};
      iq = this.createIq(type, clazz, opt.instance);
      if (typeof opt.beforeSend === "function") opt.beforeSend(iq);
      success = function(res) {
        return typeof cb === "function" ? cb(res, null, typeof opt.onResult === "function" ? opt.onResult(res) : void 0) : void 0;
      };
      return conn.sendIQ(iq, success, Server.onError(cb));
    };

    Server.prototype.createIq = function(type, clazz, instance) {
      var iqType;
      iqType = "set";
      if ((type === "read" || type === "search" || type === "describe")) {
        iqType = "get";
      }
      return $iq({
        to: this.getAddress(clazz, instance),
        type: iqType
      }).c(type, {
        xmlns: JOAP_NS
      });
    };

    Server.prototype.getAddress = function(clazz, instance) {
      var addr;
      addr = "";
      if (typeof clazz === "string" ? clazz : void 0) addr += "" + clazz + "@";
      addr += this.service;
      if (typeof instance === "string") addr += "/" + instance;
      return addr;
    };

    Server.prototype.describe = function(clazz, instance, cb) {
      if (typeof clazz === "function") {
        cb = clazz;
        clazz = instance = null;
      } else if (typeof instance === "function") {
        cb = instance;
        instance = null;
      }
      return this.sendRequest("describe", clazz, cb, {
        instance: instance,
        onResult: Server.parseDescription
      });
    };

    Server.prototype.add = function(clazz, attrs, cb) {
      return this.sendRequest("add", clazz, cb, {
        beforeSend: function(iq) {
          return Server.addXMLAttributes(iq, attrs);
        },
        onResult: Server.parseNewAddress
      });
    };

    Server.prototype.read = function(clazz, instance, limits, cb) {
      if (typeof limits === "function") cb = limits;
      return this.sendRequest("read", clazz, cb, {
        instance: instance,
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
        onResult: Server.parseAttributes
      });
    };

    Server.prototype.edit = function(clazz, instance, attrs, cb) {
      return this.sendRequest("edit", clazz, cb, {
        instance: instance,
        beforeSend: function(iq) {
          return Server.addXMLAttributes(iq, attrs);
        },
        onResult: Server.parseAttributes
      });
    };

    Server.prototype["delete"] = function(clazz, instance, cb) {
      return this.sendRequest("delete", clazz, cb, {
        instance: instance
      });
    };

    Server.prototype.search = function(clazz, attrs, cb) {
      if (typeof attrs === "function") cb = attrs;
      return this.sendRequest("search", clazz, cb, {
        beforeSend: function(iq) {
          return Server.addXMLAttributes(iq, attrs);
        },
        onResult: Server.parseSearch
      });
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
      JOAPError: JOAPError
    };
  })());

}).call(this);
