(function(Strophe,$) {
	var INFO = Strophe.NS.DISCO_INFO;
	var ITEMS = Strophe.NS.DISCO_ITEMS;

	/**
	 * Node, used for info,  items response
	 */ 
	function Node(cfg) {
		$.extend(this, cfg);
//		this.name = cfg.name;
//		this.identity = cfg.identity;
//		this.features = cfg.features;
//		this.items = cfg.items;
	}

	Node.prototype._reply = function(iq) {
		var to = iq.attr('from') || null, id = iq.attr('id'), res;
		var child = iq.find('> *:eq(0)'), childAttr = {};
		if (child.attr('xmlns')) { childAttr.xmlns = child.attr('xmlns'); }
		if (child.attr('node')) { childAttr.node = child.attr('node'); } 
		res = $iq({ to: to, type: 'result', id: id});
		if ($.isEmptyObject(childAttr)) { res.c(child[0].tagName); }
		else { res.c(child[0].tagName, childAttr); }
		return {
			res: res,
			xmlns: childAttr.xmlns
		};
	};

	Node.prototype.reply = function(iq) {
		var obj = this._reply($(iq));
		return this.addContent(obj.res, obj.xmlns);
	};

	Node.prototype.notFound = function(iq) {
		var res = this._reply($(iq)).res;
		res.c('error', { type: 'cancel'});
		res.c('item-not-found', { xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas' });
		return res;
	};

	Node.prototype.addContent = function(iq,xmlns) {
		if(xmlns === INFO) { return this.addInfo(iq); }
		if(xmlns === ITEMS) { return this.addItems(iq); }
		return iq;
	};

	Node.prototype.addItems = function(res) {
		var items = this.items;
		for(var i=0; i < items.length; ++i) {
			item = items[i];
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
		var to = args[0], node = args[1], cb = args[2], err = args[3], 
			q = { xmlns: type };
		if(typeof node === 'function') { err = cb; cb = node; node = undefined; }
		if(node) { q.node = node; }
		var	iq = $iq({to: to, 'type': 'get'}).c('query',q);
		conn.sendIQ(iq, cb || noop, err || noop);
	}

	function reply(iq) { 
		var node = $('query',iq).attr('node') || "root";
		var n = this._nodes[node], res;
		if(n) { res = n.reply(iq); } 
		else { res = this._nodes.root.notFound(iq); }
		this._conn.send(res);
		return true;
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
				this._conn.addHandler(reply.bind(this), INFO, 'iq', 'get');
				this._conn.addHandler(reply.bind(this), ITEMS, 'iq', 'get');
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

})(Strophe,jQuery);
