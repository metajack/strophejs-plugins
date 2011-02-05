describe("Disco#info", function() {
	var conn, disco;
	var INFO = Strophe.NS.DISCO_INFO, ITEMS = Strophe.NS.DISCO_ITEMS;
	var defaults = {
		info:  {
			identity: { name: 'strophe' },
			features: [ INFO, ITEMS ]
		},
		items: []
	};

	function clear(stanza) {
		if (stanza.tree) {
			stanza = stanza.tree();
		}
		if (stanza.removeAttribute) {
			stanza.removeAttribute('id');
			return Strophe.serialize(stanza);
		}
		return stanza;
	}
	beforeEach(function() {
		conn = new Strophe.Connection('asdf');
		disco = conn.disco;
		conn._changeConnectStatus(Strophe.Status.CONNECTED);
	});

	it("disco has defaults", function() {
		expect(disco._info).toEqual(defaults.info);
		expect(disco._items).toEqual(defaults.items);
	});

	it("disco._info can set defaults", function() {
		disco._info.features = [];
		disco._items = ['a','b'];
		expect(disco._info.features).toEqual([]);
		expect(disco._items).toEqual(['a','b']);
	});

	it("disco#info sends query", function() {
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual("<iq to='n@d/r' type='get' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#info'/></iq>");
		});
		disco.info('n@d/r');
	});

	it("disco#items sends query", function() {
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual("<iq to='n@d/r' type='get' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#items'/></iq>");
		});
		disco.items('n@d/r');
	});

	it("disco responds to disco#info", function() {
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual("<iq to='null' type='result' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#info'><identity name='strophe'/><feature var='http://jabber.org/protocol/disco#info'/><feature var='http://jabber.org/protocol/disco#items'/></query></iq>");
		});
		var handler = conn.addHandlers[0];
		var iq = $iq({type: 'get'}).c('query', { xmlns: INFO });
		expect(handler.isMatch(iq.tree()));
		handler.run(iq.tree());
	});

	it("disco responds to disco#items", function() {
		spyOn(conn,'send').andCallFake(function(iq) {
			expect(clear(iq)).toEqual("<iq to='null' type='result' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#items'/></iq>");
		});
		var handler = conn.addHandlers[1];
		var iq = $iq({type: 'get'}).c('query', { xmlns: ITEMS });
		expect(handler.isMatch(iq.tree()));
		handler.run(iq.tree());
	});
});


