describe("Commands", function() {
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
		c.cmds.add({ node: 'a'});
		var req = $iq(iq).c('query', { xmlns: Strophe.NS.DISCO_ITEMS, node: Strophe.NS.COMMANDS});
		spyon(c,'send',function(res) {
			expect(res.find('item:eq(0)').attr('jid')).toEqual('n@d/r2');
			expect(res.find('item:eq(0)').attr('node')).toEqual('a');
		});
		receive(c,req);
	});

	it("responds to command execution", function() {
		c.cmds.add({ node: 'a', name: 'aName' });
		var iq = $iq({type: 'set'}).c('command', {action: 'execute', node: 'a', xmlns: Strophe.NS.COMMANDS});
		spyon(c,'send',function(res) {
			expect(res.find('command').attr('status')).toEqual('completed');
		});
		receive(c,iq);
	});

	it("responds with notFound for unknown command", function() {
		var iq = $iq({type: 'set'}).c('command', { action: 'execute', node: 'a', xmlns: Strophe.NS.COMMANDS });
		spyon(c,'send',function(res) {
			expect(res.find('item-not-found').length).toEqual(1);
		});
		receive(c,iq);
	});

	it("can execute command", function() {
		spyon(c,'send',function(req) {
			expect(req.find('command').attr('node')).toEqual('aCmd');
			expect(req.find('command').attr('action')).toEqual('execute');
		});
		c.cmds.execute('n@d/r','aCmd');
		expect(c.send).toHaveBeenCalled();
	});

	it("can execute command with data", function() {
		c.cmds.add({name: 'foo', node: 'foo', item: 'foo'});
		spyon(c,'send',function(req) {
			expect(req.find('command').attr('node')).toEqual('foo');
			expect(req.find('command').attr('action')).toEqual('execute');
			expect(req.find('foo').size()).toEqual(2);
			// somethings wrong with SpecHelper#createRequest
			expect(req.find('command foo').size()).toEqual(0);
		});
		c.cmds.execute('n@d/r','foo', ['foo','bar']);
		expect(c.send).toHaveBeenCalled();
	});
}); 

