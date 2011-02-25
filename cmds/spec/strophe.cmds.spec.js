describe("Commands", function() {
	var CMDS = "http://jabber.org/protocol/commands", INFO = Strophe.NS.DISCO_INFO;
		ITEMS = Strophe.NS.DISCO_ITEMS;
	var conn, cmds, disco, nodes;

	beforeEach(function() {
		conn = new Strophe.Connection();
		conn.authenticated = true;
		conn._processRequest = function() {};
		conn._changeConnectStatus(Strophe.Status.CONNECTED);
		successHandler = jasmine.createSpy('successHandler');
		errorHandler = jasmine.createSpy('errorHandler');
		cmds = conn.cmds;
		disco = conn.disco;
		nodes = disco._nodes;
	});

	describe("basic", function() {
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
		conn.cmds.addCommand({ jid: conn.jid, node: 'aNode', name: 'aName' });
		var iq = $iq({type: 'get'}).c('query', { node: CMDS, xmlns: ITEMS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_node);
		});
		conn._dataRecv(createRequest(iq));
		expect(conn.send).toHaveBeenCalled();
	});

	it("responds to command execution", function() {
		var cmd = { jid: conn.jid, node: 'aNode', name: 'aName' };
		cmd.addContent = jasmine.createSpy('addContent').andCallFake(function(res) {
			res.attrs({status: 'completed'});
			return res;
		});
		conn.cmds.addCommand(cmd);
		var iq = $iq({type: 'set'}).c('command', { action: 'execute', node: 'aNode', xmlns: CMDS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_node_completed);
		});
		conn._dataRecv(createRequest(iq));
		expect(cmd.addContent).toHaveBeenCalled();
		expect(conn.send).toHaveBeenCalled();
	});

});



//var c1 = new Strophe.Connection('http://localhost/xmpp-httpbind');
//c1.connect('asdf@psi/c1','asdf');
//
//var c2 = new Strophe.Connection('http://localhost/xmpp-httpbind');
//c2.connect('asdf@psi/c2','asdf');
//
//var cmd = { jid: c2.jid, node: 'aNode', name: 'aName' };
//cmd.addContent = function(res) {
//	console.log('cmd executing yo');
//	res.attrs({status: 'completed'});
//	console.log(res);
//	return res;
//};
//c2.cmds.addCommand(cmd);



