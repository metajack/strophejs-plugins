var mockConnection = helper.mockConnection,
  spyon = helper.spyon, receive = helper.receive;

describe("Strophe Jabber-RPC plugin", function() {

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

    describe("Forbidden access", function() {

      beforeEach(function() {
        rpc.addJidToWhiteList(["*@jabber.org", "*@localhost"]);
        var handler = function() {};
        rpc.addHandlers(handler, handler);
      });
      
      it("should send forbidden access to the wrong nodes", function() {
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

        iq = $iq({type: "set", id: "123", from: "foo@bar", to: connection.jid})
          .c("query", {xmlns: Strophe.NS.RPC});
        receive(connection, iq);
      });

      it("should NOT send forbidden access to the right nodes", function() {
        spyOn(connection, 'send');
        expect(connection.send).not.toHaveBeenCalled();
        iq = $iq({type: "set", id: "123", from: "foo@bar", to: connection.jid})
          .c("query", {xmlns: Strophe.NS.RPC});
        
        receive(connection, iq);
      });

    });
  });

});