(function() {
	var INFO = Strophe.NS.DISCO_INFO;
	var ITEMS = Strophe.NS.DISCO_ITEMS;

	function noop(stanza) {
		console.log(stanza);
	}

	function result(iq,ns) {
		var cfg = {
			to: iq.getAttribute('from'),
			type: 'result',
			id: iq.getAttribute('id')
		};
		return $iq(cfg).c('query',{xmlns: ns});
	}

	function itemsHandler(iq) {
		var items = this._items, i =0, item;
		var res = result(iq, ITEMS);
		for(; i < items.length; ++i) {
			item = items[i];
			if (item.callback) {
				var cb = item.callback;
				// register another handler for that node
				// do we have suport in addHandler()?
				delete  item.callback;
			}
			res.c('item',item).up();
		}
		this._conn.send(res);
		return true;
	}

	function infoHandler(iq) {
		var info = this._info;
		var identity = info.identity, features = info.features;
		var res = result(iq, INFO);
		res.c('identity', identity);
		for(var i=0; i < features.length; ++i) {
			res.up().c('feature', {'var': info.features[i]});
		}
		this._conn.send(res);
		return true;
	}


	var disco = {
		_conn: null,
		init: function(conn) {
			this._conn = conn;
			this._info =  {
				identity: { name: 'strophe' },
				features: [ INFO, ITEMS ]
			};
			this._items = [];
		},
		statusChanged: function(status) {
			if (status === Strophe.Status.CONNECTED) {
				this._conn.addHandler(infoHandler.bind(this), INFO, 'iq');
				this._conn.addHandler(itemsHandler.bind(this), ITEMS, 'iq');
			}
		},
		info: function(to, callback) {
			var iq = $iq({to: to, type: 'get'}).c('query',{xmlns: INFO});
			this._conn.sendIQ(iq, callback || noop);
		},
		items: function(to, callback) {
			var iq = $iq({to: to, type: 'get'}).c('query',{xmlns: ITEMS});
			this._conn.sendIQ(iq, callback || noop);
		}
	};
	Strophe.addConnectionPlugin('disco', disco);

})(Strophe);
