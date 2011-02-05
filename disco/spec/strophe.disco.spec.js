
describe("Strophe.disco", function() {
	var conn = new Strophe.Connection(), disco = conn.disco;
	var NS_INFO = Strophe.NS.DISCO_INFO,
		NS_ITEMS = Strophe.NS.DISCO_ITEMS;

	describe("general aspects", function() {

		it("exposes info and items methods", function() {
			expect(disco.info).toBeDefined();
			expect(disco.items).toBeDefined();
		});

		it("exposes Node Constructor function", function() {
			expect(disco.Node).toBeDefined();
		});

		it("has a root node with default configuration", function() {
			expect(disco._nodes.root.features).toEqual([NS_INFO, NS_ITEMS]);
			expect(disco._nodes.root.identity).toEqual({name: 'strophe'});
			expect(disco._nodes.root.items).toEqual([]);
		});
		it("resets to defaults for new connection", function() {
			disco._nodes.root.features.pop();
			disco._nodes.root.identity.name = 'newName';
			disco._nodes.root.items.push(NS_INFO);

			conn = new Strophe.Connection();
			disco = conn.disco;
			expect(disco._nodes.root.features).toEqual([NS_INFO, NS_ITEMS]);
			expect(disco._nodes.root.identity).toEqual({name: 'strophe'});
			expect(disco._nodes.root.items).toEqual([]);
			
		});
	});

	describe("disco#info", function() {
		beforeEach(function() {
			conn = new Strophe.Connection();
			disco = conn.disco;
			conn._changeConnectStatus(Strophe.Status.CONNECTED);
		});

		it("sends request", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.info.request);
			});
			disco.info('n@d/r');
		});
		
		it("sends request for node", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.info.request_with_node);
			});
			disco.info('n@d/r','aNode');
		});

		it("responds", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.info.response);
			});
			var handler = conn.addHandlers[0];
			var iq = $iq({type: 'get'}).c('query', { xmlns: NS_INFO });
			expect(handler.isMatch(iq.tree()));
			handler.run(iq.tree());
		});

		it("responds for node", function() {
			disco._nodes.aNode = new disco.Node({
				identity: 'aNode',
				features: ['a','b']
			});
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.info.response_with_node);
			});
			var handler = conn.addHandlers[0];
			var iq = $iq({type: 'get'}).c('query', { xmlns: NS_INFO, node: 'aNode' });
			expect(handler.isMatch(iq.tree()));
			handler.run(iq.tree());
		});
	});

	describe("disco#items", function() {
		beforeEach(function() {
			conn = new Strophe.Connection();
			disco = conn.disco;
			conn._changeConnectStatus(Strophe.Status.CONNECTED);
		});
		it("sends request", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.items.request);
			});
			disco.items('n@d/r');
		});
		it("sends request for node", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.items.request_with_node);
			});
			disco.items('n@d/r','aNode');
		});

		it("responds", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.items.response);
			});
			var handler = conn.addHandlers[0];
			var iq = $iq({type: 'get'}).c('query', { xmlns: NS_ITEMS });
			expect(handler.isMatch(iq.tree()));
			handler.run(iq.tree());
		});
		it("responds for node", function() {
			disco._nodes.aNode = new disco.Node({
				items: [{name: 'aNother', node: 'aNotherNode'}]
			});
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.items.response_with_node);
			});
			var handler = conn.addHandlers[0];
			var iq = $iq({type: 'get'}).c('query', { xmlns: NS_ITEMS, node: 'aNode' });
			expect(handler.isMatch(iq.tree()));
			handler.run(iq.tree());
		});
	});
});
