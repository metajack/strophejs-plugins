var helper = (function() {
  function receive(c,req) {
    c._dataRecv(createRequest(req));
  }

  function spyon (obj, method, cb)  {
    sinon.stub(obj,method, function(res) {
      cb.call(this,res);
    });
  }

  function mockConnection() {
    var c = new Strophe.Connection();
    c.authenticated = true;
    c.jid = 'n@d/r2';
    c._processRequest = function() {};
    c._changeConnectStatus(Strophe.Status.CONNECTED);
    return c;
  }

  function createRequest(iq) {
    iq = typeof iq.tree == "function" ? iq.tree() : iq;
    var req = new Strophe.Request(iq, function() {});
    req.getResponse = function() {
      var env = new Strophe.Builder('env', {type: 'mock'}).tree();
      env.appendChild(iq);
      return env;
    };
    return req;
  }

  return {
    createRequest: createRequest,
    mockConnection: mockConnection,
    receive: receive,
    spyon: spyon
  };
})();
