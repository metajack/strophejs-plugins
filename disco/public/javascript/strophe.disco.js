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

	function request(conn, type, args) {
		var to = args[0], node = args[1], cb = args[2], q = { xmlns: type };
		if(typeof node === 'function') { cb = node; node = undefined; }
		if(node) { q.node = node; }
		var	iq = $iq({to: to, 'type': 'get'}).c('query',q);
		conn.sendIQ(iq, cb || noop);
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
		info: function(to, node, callback) {
			request(this._conn, INFO, arguments);
		},
		items: function(to, node, callback) {
			request(this._conn, ITEMS, arguments);
		}
	};
	Strophe.addConnectionPlugin('disco', disco);

	disco.Node = Node;

})(Strophe);
