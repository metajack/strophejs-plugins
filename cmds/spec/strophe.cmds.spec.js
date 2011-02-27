describe("CommandNode", function() {
	var CommandNode = Strophe.Commands.CommandNode;

	it("lasdf", function() {
		var n = new CommandNode();
	});

});

xdescribe("Commands", function() {
	var c, iq;
	beforeEach(function() {
		c = mockConnection();
		iq = {to: 'n@d/r2', from: 'n@d/r1', type: 'get', id: 'abc'};
	});

	it("disco#info includes command feature", function() {
		var req = $iq(iq).c('query', { xmlns: Strophe.NS.DISCO_INFO});
		spyon(c,'send',function(res) {
			expect(res.find('feature:eq(2)').attr('var')).toEqual(Strophe.NS.COMMANDS);
		});
		receive(c,req);
	});

	it("disco#items includes added commands", function() {
		c.cmds.add({node: 'a'});
		var req = $iq(iq).c('query', { xmlns: Strophe.NS.DISCO_ITEMS, node: Strophe.NS.COMMANDS});
		spyon(c,'send',function(res) {
			expect(res.find('item:eq(0)').attr('jid')).toEqual('n@d/r2');
			expect(res.find('item:eq(0)').attr('node')).toEqual('a');
		});
		receive(c,req);
	});

	it("responds to command execution", function() {
		var cmd = { node: 'aNode', name: 'aName' };
		cmd.callback = jasmine.createSpy('callback');
		cmd.addContent = jasmine.createSpy('addContent').andCallFake(function(req,res) {
			res.attrs({status: 'completed'});
		});
		c.cmds.add(cmd);
		var iq = $iq({type: 'set'}).c('command', {action: 'execute', node: 'aNode', xmlns: Strophe.NS.COMMANDS});
		spyon(c,'send',function(res) {
			expect(res.find('command').attr('status')).toEqual('completed');
		});
		receive(c,iq);
		expect(cmd.addContent).toHaveBeenCalled();
	});



	xit("can execute command", function() {
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.execute);
		});
		cmds.execute('n@d/r','aCmd');
		expect(conn.send).toHaveBeenCalled();
	});

	xit("responds with empty commands", function() {
		var iq = $iq({type: 'get'}).c('query', { node: CMDS, xmlns: ITEMS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_empty);
		});
		conn._dataRecv(createRequest(iq));
		expect(conn.send).toHaveBeenCalled();
	});

	xit("responds with notFound if we dont have it", function() {
		var iq = $iq({type: 'set'}).c('command', { action: 'execute', node: 'aNode', xmlns: CMDS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_node_not_found);
		});
		conn._dataRecv(createRequest(iq));
		expect(conn.send).toHaveBeenCalled();
	});

	xit("allows to add commands via discos node", function() {
		conn.cmds.addCommand({ jid: conn.jid, node: 'aNode', name: 'aName' });
		var iq = $iq({type: 'get'}).c('query', { node: CMDS, xmlns: ITEMS }).tree();
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual(stanzas.commands.response_node);
		});
		conn._dataRecv(createRequest(iq));
		expect(conn.send).toHaveBeenCalled();
	});

	xit("responds to command execution", function() {
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


