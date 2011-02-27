describe("Strophe.disco", function() {
	var c, iq;
	beforeEach(function() {
		c = mockConnection();
		iq = {to: 'n@d/r2', from: 'n@d/r1', type: 'get', id: 'abc'};
	});
	it("responds to disco#info", function() {
		var req = $iq(iq).c('query', { xmlns: Strophe.NS.DISCO_INFO});
		spyon(c,'send',function(res) {
			logStanza(res);
			expect(res.find('identity').attr('name')).toEqual('strophe');
			expect(res.find('feature:eq(0)').attr('var')).toEqual(Strophe.NS.DISCO_INFO);
			expect(res.find('feature:eq(1)').attr('var')).toEqual(Strophe.NS.DISCO_ITEMS);
		});
		receive(c,req);
	});

	it("responds to disco#items", function() {
		var req = $iq(iq).c('query', { xmlns: Strophe.NS.DISCO_ITEMS});
		spyon(c,'send',function(res) {
			expect(res.find('items').size()).toEqual(0);
		});
		receive(c,req);
	});

	it("responds with not found", function() {
		var req = $iq(iq).c('query', { xmlns: Strophe.NS.DISCO_INFO, node: 'aNode' });
		spyon(c,'send',function(res) {
			expect(res.find('error').attr('type')).toEqual('cancel');
			expect(res.find('item-not-found').attr('xmlns')).toEqual('urn:ietf:params:xml:ns:xmpp-stanzas');
		});
		receive(c,req);
	});

	it("responds with node", function() {
		var req = $iq(iq).c('query', { xmlns: Strophe.NS.DISCO_INFO, node: 'aNode' });
		c.disco.addNode('aNode', { identity: { name: 'aNode'}, features: { 'aFeature': '' } });
		spyon(c,'send',function(res) {
			expect(res.find('identity').attr('name')).toEqual('aNode');
			expect(res.find('feature:eq(0)').attr('var')).toEqual('aFeature');
		});
		receive(c,req);
	});
});
xdescribe("Strophe.disco", function() {
	var conn = new Strophe.Connection(), disco = conn.disco,
		successHandler, errorHandler;
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
			conn.authenticated = true;
			conn._processRequest = function() {};
			conn._changeConnectStatus(Strophe.Status.CONNECTED);
			successHandler = jasmine.createSpy('successHandler');
			errorHandler = jasmine.createSpy('errorHandler');
		});

		it("sends request", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.info.request);
			});
			disco.info('n@d/r');
			expect(conn.send).toHaveBeenCalled();
		});

		it("sends request and calls success callback", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				var id = iq.getAttribute('id');
				var res = $iq({type: 'result', id: id});
				conn._dataRecv(createRequest(res));
			});
			disco.info('n@d/r', successHandler, errorHandler);
			expect(conn.send).toHaveBeenCalled();
			expect(successHandler).toHaveBeenCalled();
		});

		it("sends request and calls error callback", function() {
			var callback = jasmine.createSpy();
			spyOn(conn,'send').andCallFake(function(iq) {
				var id = iq.getAttribute('id');
				var res = $iq({type: 'error', id: id});
				conn._dataRecv(createRequest(res));
			});
			disco.info('n@d/r', successHandler, errorHandler);
			expect(conn.send).toHaveBeenCalled();
			expect(errorHandler).toHaveBeenCalled();
		});
		
		it("sends request for node", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.info.request_with_node);
			});
			disco.info('n@d/r','aNode');
			expect(conn.send).toHaveBeenCalled();
		});

		it("responds", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.info.response);
			});
			var iq = $iq({type: 'get'}).c('query', { xmlns: NS_INFO });
			conn._dataRecv(createRequest(iq.tree()));
			expect(conn.send).toHaveBeenCalled();
		});

		it("responds for node", function() {
			disco._nodes.aNode = new disco.Node({
				identity: 'aNode',
				features: ['a','b']
			});
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.info.response_with_node);
			});
			var iq = $iq({type: 'get'}).c('query', { xmlns: NS_INFO, node: 'aNode' });
			conn._dataRecv(createRequest(iq.tree()));
			expect(conn.send).toHaveBeenCalled();
		});

		it("responds with error for missing node", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.info.response_not_found);
			});
			var iq = $iq({type: 'get'}).c('query', { xmlns: NS_INFO, node: 'aNode' });
			conn._dataRecv(createRequest(iq.tree()));
			expect(conn.send).toHaveBeenCalled();
		});
	});

	describe("disco#items", function() {
		beforeEach(function() {
			conn = new Strophe.Connection();
			disco = conn.disco;
			conn.authenticated = true;
			conn._processRequest = function() {};
			conn._changeConnectStatus(Strophe.Status.CONNECTED);
			successHandler = jasmine.createSpy('successHandler');
			errorHandler = jasmine.createSpy('errorHandler');
		});
		it("sends request", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.items.request);
			});
			disco.items('n@d/r');
			expect(conn.send).toHaveBeenCalled();
		});
		it("sends request for node", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.items.request_with_node);
			});
			disco.items('n@d/r','aNode');
			expect(conn.send).toHaveBeenCalled();
		});

		it("responds", function() {
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.items.response);
			});
			var iq = $iq({type: 'get'}).c('query', { xmlns: NS_ITEMS });
			conn._dataRecv(createRequest(iq.tree()));
			expect(conn.send).toHaveBeenCalled();
		});
		it("responds for node", function() {
			disco._nodes.aNode = new disco.Node({
				items: [{name: 'aNother', node: 'aNotherNode'}]
			});
			spyOn(conn,'send').andCallFake(function(iq) {
				expect(clear(iq)).toEqual(stanzas.items.response_with_node);
			});
			var iq = $iq({type: 'get'}).c('query', { xmlns: NS_ITEMS, node: 'aNode' });
			conn._dataRecv(createRequest(iq.tree()));
			expect(conn.send).toHaveBeenCalled();
		});
	});
});
//var c1 = new Strophe.Connection('http://localhost/xmpp-httpbind');
//c1.connect('asdf@psi/c1', 'asdf');
//
//var c2 = new Strophe.Connection('http://localhost/xmpp-httpbind');
//c2.connect('asdf@psi/c2', 'asdf');

