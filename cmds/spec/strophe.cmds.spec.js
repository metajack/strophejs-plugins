describe("Commands", function() {

	var conn = new Strophe.Connection(), cmds = conn.cmds, disco = conn.disco;
	conn._changeConnectStatus(Strophe.Status.CONNECTED);
	conn.authenticated = true;
	var CMDS = "http://jabber.org/protocol/commands";
	it("adds namespace", function() {
		expect(Strophe.NS.CMDS).toEqual(CMDS);
	});
	it("adds feature to disco#info", function() {
		expect(disco._nodes.root.features.pop()).toEqual(CMDS);
	});

	it("can execute command", function() {
		conn.jid = 'a@b/c';
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.execute);
		});
		cmds.execute('n@d/r','aCmd');
	});

	it("responds with not found for non existing command", function() {
		var iq = $iq({type: 'get'}).c('query', { node: CMDS, xmlns: Strophe.NS.DISCO_INFO }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_not_found);
		});
		conn._dataRecv(createRequest(iq));
	});


});

var c = new Strophe.Connection('http://localhost/xmpp-httpbind');
c.connect('asdf@psi/strophe','asdf');

