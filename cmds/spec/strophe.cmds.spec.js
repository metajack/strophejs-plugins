describe("Commands", function() {
	var conn = new Strophe.Connection(), cmds = conn.cmds, disco = conn.disco;
	var CMDS = "http://jabber.org/protocol/commands", INFO = Strophe.NS.DISCO_INFO,
		ITEMS = Strophe.NS.DISCO_ITEMS;

	beforeEach(function() {
		conn.authenticated = true;
		conn._processRequest = function() {};
		conn._changeConnectStatus(Strophe.Status.CONNECTED);
		successHandler = jasmine.createSpy('successHandler');
		errorHandler = jasmine.createSpy('errorHandler');
	});



	xit("adds namespace", function() {
		expect(Strophe.NS.CMDS).toEqual(CMDS);
	});
	xit("adds feature to disco#info", function() {
		expect(disco._nodes.root.features.pop()).toEqual(CMDS);
	});

	xit("can execute command", function() {
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.execute);
		});
		cmds.execute('n@d/r','aCmd');
	});

	it("responds with empty commands", function() {
		var iq = $iq({type: 'get'}).c('query', { node: CMDS, xmlns: ITEMS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_empty);
		});
		conn._dataRecv(createRequest(iq));
	});

	it("responds and executes command", function() {
		var iq = $iq({type: 'get'}).c('query', { node: CMDS, xmlns: ITEMS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_empty);
		});
		conn._dataRecv(createRequest(iq));
	});
});

var c = new Strophe.Connection('http://localhost/xmpp-httpbind');
c.connect('asdf@psi/strophe','asdf');

