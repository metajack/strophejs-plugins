(function(Strophe) {
	var INFO = Strophe.NS.DISCO_INFO;
	var ITEMS = Strophe.NS.DISCO_ITEMS;

	function Node(cfg) {
		this.name = cfg.name;
		this.identity = cfg.identity;
		this.features = cfg.features;
		this.items = cfg.items;
	}

	Node.prototype.reply = function(iq) {
		var _iq = {
			to: iq.getAttribute('from'),
			type: 'result',
			id: iq.getAttribute('id')
		};
		var _query = { xmlns: iq.childNodes[0].getAttribute('xmlns') };
		if (iq.childNodes[0].getAttribute('node')) {
			_query.node = iq.childNodes[0].getAttribute('node');
		}
		var res =  $iq(_iq).c('query',_query);
		return this.addContent(res,_query.xmlns);
	};


	Node.prototype.notFound = function(iq) {
		var _iq = {
			to: iq.getAttribute('from'),
			type: 'result',
			id: iq.getAttribute('id')
		};
		var _query = { xmlns: iq.childNodes[0].getAttribute('xmlns') };
		if (iq.childNodes[0].getAttribute('node')) {
			_query.node = iq.childNodes[0].getAttribute('node');
		}
		var res =  $iq(_iq).c('query',_query);
		res.c('error', { type: 'cancel'});
		res.c('item-not-found', { xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas' });
		return res;
	};

	Node.prototype.addContent = function(iq,xmlns) {
		if(xmlns === INFO) {
			return this.addInfo(iq);
		} 
		if (xmlns === ITEMS) {
			return this.addItems(iq);
		}
		return iq;
	};


	Node.prototype.addItems = function(res) {
		var items = this.items;
		for(var i=0; i < items.length; ++i) {
			item = items[i];
//			if(item.callback) {
//				var cb = item.callback.bind(this);
//				delete item.callback;
//			}
			res.c('item',item).up();
		}
		return res;
	};

	Node.prototype.addInfo = function(res) {
		res.c('identity', this.identity);
		for(var i=0; i < this.features.length; ++i) {
			res.up().c('feature', {'var': this.features[i]});
		}
		return res;
	};

	function noop(stanza) {
		if (console) {
			console.log(stanza);
		}
	}

	var defaults = function() {
		return { 
			identity: { name: 'strophe' },
			features: [ INFO, ITEMS ],
			items: []
		};
	};

	var disco = {
		_conn: null,
		init: function(conn) {
			this._conn = conn;
			this._nodes = { 
				'root': new Node(defaults())
			};
		},
		statusChanged: function(status) {
			if (status === Strophe.Status.CONNECTED) {
				this._conn.addHandler(function(iq) {
					var node = iq.childNodes[0].getAttribute('node');
					node = node === null ? "root" : node;
					var n = this._nodes[node], res;
					if(n) {
						res = n.reply(iq);
					} else {
						res = this._nodes.root.notFound(iq);
					}
					this._conn.send(res);
					return true;
				}.bind(this), INFO, 'iq');

				//this._conn.addHandler(infoHandler.bind(this), INFO, 'iq');
				this._conn.addHandler(itemsHandler.bind(this), ITEMS, 'iq');
			}
		},
		info: function(to, callback) {
			var args = arguments, last = args[args.length-1], cb = noop, query = {
				xmlns: INFO
			}, iq;
			if (typeof last === "function") { cb = last; }
			if (args[1] && typeof args[1] === "string") { query.node = arguments[1]; }
			iq = $iq({to: to, 'type': 'get'}).c('query',query);
			this._conn.sendIQ(iq, cb);
		},
		items: function(to, callback) {
			var args = arguments, last = args[args.length-1], cb = noop, query = {
				xmlns: ITEMS
			}, iq;
			if (typeof last === "function") { cb = last; }
			if (args[1] && typeof args[1] === "string") { query.node = arguments[1]; }
			iq = $iq({to: to, 'type': 'get'}).c('query',query);
			this._conn.sendIQ(iq, cb);
		}
	};
	Strophe.addConnectionPlugin('disco', disco);

	disco.Node = Node;

})(Strophe);
