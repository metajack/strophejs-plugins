describe("strophe.PLUGIN_NAME", function() {

  var mockConnection, realConnection;

  mockConnection = function() {
    var c = new Strophe.Connection();
    c.authenticated = true;
    c.jid = 'n@d/r2';
    c._processRequest = function() {};
    c._changeConnectStatus(Strophe.Status.CONNECTED);
    return c;
  };

  realConnection = function(jid, pw, host) {
    if (host == null) {
      host = 'http://localhost/xmpp-httpbind';
    }
    var c = new Strophe.Connection(host);
    c.connect(jid, pw);
    return c;
  };

  beforeEach(function() {
    this.con = mockConnection();
    // or
    // this.con = realConnection("myJID@tld","myPass");
    this.successHandler = jasmine.createSpy("successHandler");
    this.errorHandler = jasmine.createSpy("errorHandler");
  });

  it("does exist", function() {
    (expect(this.con.PLUGIN_NAME)).toBeDefined();
  });
});
