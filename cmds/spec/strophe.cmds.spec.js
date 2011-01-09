describe("Commands", function() {
	var conn = new Strophe.Connection(), cmds = conn.cmds, disco = conn.disco, nodes = disco._nodes;
	var CMDS = "http://jabber.org/protocol/commands", INFO = Strophe.NS.DISCO_INFO,
		ITEMS = Strophe.NS.DISCO_ITEMS;

	beforeEach(function() {
		conn.authenticated = true;
		conn._processRequest = function() {};
		conn._changeConnectStatus(Strophe.Status.CONNECTED);
		successHandler = jasmine.createSpy('successHandler');
		errorHandler = jasmine.createSpy('errorHandler');
	});

	it("adds namespace", function() {
		expect(Strophe.NS.CMDS).toEqual(CMDS);
	});
	it("adds feature to disco#info", function() {
		expect(nodes.root.features.pop()).toEqual(CMDS);
	});

	it("can execute command", function() {
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.execute);
		});
		cmds.execute('n@d/r','aCmd');
		expect(conn.send).toHaveBeenCalled();
	});

	it("responds with empty commands", function() {
		var iq = $iq({type: 'get'}).c('query', { node: CMDS, xmlns: ITEMS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_empty);
		});
		conn._dataRecv(createRequest(iq));
		expect(conn.send).toHaveBeenCalled();
	});

	it("responds with notFound if we dont have it", function() {
		var iq = $iq({type: 'set'}).c('command', { action: 'execute', node: 'aNode', xmlns: CMDS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_node_not_found);
		});
		conn._dataRecv(createRequest(iq));
		expect(conn.send).toHaveBeenCalled();
	});

	it("allows to add commands via discos node", function() {
		nodes[CMDS] = new disco.Node({items: [
			{ jid: conn.jid, node: 'aNode', name: 'aName' }
		]});

		var iq = $iq({type: 'get'}).c('query', { node: CMDS, xmlns: ITEMS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_node);
		});
		conn._dataRecv(createRequest(iq));
		expect(conn.send).toHaveBeenCalled();
	});

	it("responds to command execution", function() {
		var spy = jasmine.createSpy('addContent.callback').andCallFake(function(res) {
			res.attrs({status: 'completed'});
			return res;
		});
		nodes[CMDS] = new disco.Node({items: [
			new disco.Node({ jid: conn.jid, node: 'aNode', name: 'aName', addContent: spy})
		]});

		var iq = $iq({type: 'set'}).c('command', { action: 'execute', node: 'aNode', xmlns: CMDS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_node_completed);
		});
		conn._dataRecv(createRequest(iq));
		expect(spy).toHaveBeenCalled();
		expect(conn.send).toHaveBeenCalled();
	});

});

//var c = new Strophe.Connection('http://localhost/xmpp-httpbind');
//c.connect('asdf@psi/strophe','asdf');

