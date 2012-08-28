buster.spec.expose()

var mockConnection = helper.mockConnection,
  spyon = helper.spyon, receive = helper.receive;

describe("Strophe Jabber-RPC plugin", function() {

  var connection, rpc;

  beforeEach(function() {
    connection = mockConnection();
    rpc = connection.rpc;
  });

  describe("Whitelist filter", function() {
    
    it("should be deactivated be default", function() {
      expect(rpc._whitelistEnabled).toBeFalsy();
      expect(rpc._jidInWhitelist("foo@bar/baz")).toBeTruthy();
      expect(rpc._jidInWhitelist("random@guy")).toBeTruthy();
    });

    it("should filter out jids", function() {
      rpc.addJidToWhiteList(["foo@bar/baz", "baz@foo/bar"]);
      
      expect(rpc._whitelistEnabled).toBeTruthy();

      expect(rpc._jidInWhitelist("foo@bar/baz")).toBeTruthy();
      expect(rpc._jidInWhitelist("baz@foo/bar")).toBeTruthy();
      expect(rpc._jidInWhitelist("random@guy")).toBeFalsy();

      expect(rpc._jidInWhitelist(connection.jid)).toBeTruthy();
    });

    it("should allow to use a wildcard for the node", function() {
      rpc.addJidToWhiteList("*@d");

      expect(rpc._whitelistEnabled).toBeTruthy();

      expect(rpc._jidInWhitelist("foo@d")).toBeTruthy();
      expect(rpc._jidInWhitelist("bar@d/r")).toBeTruthy();
      expect(rpc._jidInWhitelist("random@guy")).toBeFalsy();
    });

    it("should allow the use a wildcard for the domain", function() {
      rpc.addJidToWhiteList("n@*");

      expect(rpc._whitelistEnabled).toBeTruthy();

      expect(rpc._jidInWhitelist("n@foo")).toBeTruthy();
      expect(rpc._jidInWhitelist("n@bar/r")).toBeTruthy();
      expect(rpc._jidInWhitelist("random@guy")).toBeFalsy();
    });

    it("should allow the filter *@*", function() {
      rpc.addJidToWhiteList("*@*");

      expect(rpc._whitelistEnabled).toBeFalsy();
    });

  });

  describe("Send RPC", function() {
    
    it("should send a request message", function() {
      spyon(connection, "send", function(iq) {
        expect(iq.getAttribute("type")).toEqual("set");
        expect(iq.getAttribute("id")).toEqual("id123");
        expect(iq.getAttribute("from")).toEqual(connection.jid);
        expect(iq.getAttribute("to")).toEqual("foo@bar/baz");

        var query = iq.firstChild;
        expect(query.getAttribute("xmlns")).toEqual(Strophe.NS.RPC);

        var methodcall = query.firstChild;
        expect(methodcall.tagName).toEqual("methodCall");

        var methodname = methodcall.firstChild;
        expect(methodname.textContent).toEqual("ping");

        var params = methodcall.getElementsByTagName("params")[0].getElementsByTagName("param");
        expect(params.length).toEqual(2);

        var string = params[0].firstChild.firstChild;
        var object = params[1].firstChild.firstChild;

        expect(string.tagName).toEqual("string");
        expect(string.textContent).toEqual("foo");

        expect(object.tagName).toEqual("struct");
        var s = new XMLSerializer();
        expect(s.serializeToString(object)).toEqual(
          "<struct>"  +
          "<member>"  +
          "<name>a</name><value><string>bar</string></value>" +
          "</member>" +
          "<member>"  +
          "<name>b</name><value><string>baz</string></value>" +
          "</member>" +
          "</struct>"
        );
      });
      rpc.sendRequest("id123", "foo@bar/baz", "ping", ["foo", {a:"bar", b:"baz"}]);
    });

    it("should send a response message", function() {
      spyon(connection, "send", function(iq) {
        expect(iq.getAttribute("type")).toEqual("result");
        expect(iq.getAttribute("id")).toEqual("id321");
        expect(iq.getAttribute("from")).toEqual(connection.jid);
        expect(iq.getAttribute("to")).toEqual("foo@bar/baz");

        var query = iq.firstChild;
        expect(query.getAttribute("xmlns")).toEqual(Strophe.NS.RPC);

        var methodresponse = query.firstChild;
        expect(methodresponse.tagName).toEqual("methodResponse");

        var string = methodresponse.getElementsByTagName("params")[0]
                                   .getElementsByTagName("param")[0]
                                   .getElementsByTagName("value")[0]
                                   .firstChild;
        expect(string.tagName).toEqual("string");
        expect(string.textContent).toEqual("pong");
      });
      rpc.sendResponse("id321", "foo@bar/baz", "pong");
    });

    it("should send an error message", function() {
      spyon(connection, "send", function(iq) {
        expect(iq.getAttribute("type")).toEqual("result");
        expect(iq.getAttribute("id")).toEqual("id231");
        expect(iq.getAttribute("from")).toEqual(connection.jid);
        expect(iq.getAttribute("to")).toEqual("foo@bar/baz");

        var query = iq.firstChild;
        expect(query.getAttribute("xmlns")).toEqual(Strophe.NS.RPC);

        var methodresponse = query.firstChild;
        expect(methodresponse.tagName).toEqual("methodResponse");

        var object = methodresponse.getElementsByTagName("fault")[0]
                                   .getElementsByTagName("value")[0]
                                   .firstChild;
        expect(object.tagName).toEqual("struct");
        var s = new XMLSerializer();
        expect(s.serializeToString(object)).toEqual(
          "<struct>"  +
          "<member>"  +
          "<name>faultCode</name><value><i4>-30021</i4></value>" +
          "</member>" +
          "<member>"  +
          "<name>faultString</name><value><string>error message</string></value>" +
          "</member>" +
          "</struct>"
        );
      });
      rpc.sendError("id231", "foo@bar/baz", -30021 ,"error message");
    });

    describe("Handlers", function() {

      var handler;

      beforeEach(function() {
        handler = sinon.spy();
      });

      it("should be possible to add a request handler", function() {
        rpc.addRequestHandler(handler);
        var iq = $iq({type: "set", id: "123", from: "foo@bar", to: connection.jid})
          .c("query", {xmlns: Strophe.NS.RPC})
          .c("methodCall")
          .c("methodName").t("pong")
          .up()
          .c("params")
          .c("param")
          .c("value")
          .c("string").t("foo")
          .up().up().up()
          .c("param")
          .c("value")
          .c("i4").t("-32");
        receive(connection, iq);
        expect(handler).toHaveBeenCalledWith("123", "foo@bar", "pong", ["foo", -32]);
      });

      it("should be possible to add a response handler", function() {
        rpc.addResponseHandler(handler);
        iq = $iq({ type: "result", id: "id123", from: "foo@bar/baz", to: connection.jid })
          .c("query", {xmlns: Strophe.NS.RPC})
          .c("methodResponse")
          .c("params")
          .c("param")
          .c("value")
          .c("string").t("foo");
        receive(connection, iq);
        expect(handler).toHaveBeenCalledWith("id123", "foo@bar/baz", "foo", false);
      });

      it("should be possible to parse a fault response", function() {
        rpc.addResponseHandler(handler);
        var iq =$iq({type: "result", id: "123", from: "foo@bar", to: connection.jid})
          .c("query", {xmlns: Strophe.NS.RPC})
          .c("methodResponse")
          .c("fault")
          .c("value")
          .c("struct")
          .c("member")
          .c("name").t("faultString")
          .up()
          .c("value")
          .c("string").t("parsererror");
        receive(connection, iq);
        expect(handler).toHaveBeenCalledWith("123", "foo@bar", {faultString:"parsererror"}, true)
      });

    });

    describe("Forbidden access", function() {

      beforeEach(function() {
        rpc.addJidToWhiteList(["*@jabber.org", "*@localhost"]);
      });
      
      it("should send forbidden access to the wrong nodes", function() {
        var handler = function() {};
        rpc.addHandlers(handler, handler);
        spyon(connection, "send", function(iq) {
          expect(iq.getAttribute("type")).toEqual("error");
          expect(iq.getAttribute("id")).toEqual("123");
          expect(iq.getAttribute("from")).toEqual(connection.jid);
          expect(iq.getAttribute("to")).toEqual("foo@bar");

          var error = iq.firstChild;
          expect(error.tagName).toEqual("error");
          expect(error.getAttribute("code")).toEqual("403");
          expect(error.getAttribute("type")).toEqual("auth");

          var forbidden = error.firstChild;
          expect(forbidden.tagName).toEqual("forbidden");
          expect(forbidden.getAttribute("xmlns")).toEqual(Strophe.NS.STANZAS);
        });

        var iq = $iq({type: "set", id: "123", from: "foo@bar", to: connection.jid})
          .c("query", {xmlns: Strophe.NS.RPC});
        receive(connection, iq);
      });

      it("should NOT send forbidden access to the right nodes", function() {
        spyon(connection, "send");
        var iq = $iq({type: "set", id: "123", from: "foo@jabber.org", to: connection.jid})
          .c("query", {xmlns: Strophe.NS.RPC});
        receive(connection, iq);
        expect(connection.send).not.toHaveBeenCalled();
      });

    });

  });

});
