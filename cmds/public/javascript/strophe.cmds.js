(function(Strophe,$) {
	var noop = function(iq) {
		console.log(iq);
	};


	function respond(iq) {
		var node = $('command',iq).attr('node') || "root", res;
		var cmds = this._conn.disco._nodes[CMDS];
		var n = $.grep(cmds.items, function(i) { return i.node === node; });
		if (n.length === 1 ) { res = n[0].reply(iq); }
		else { res = this._conn.disco._nodes.root.notFound(iq); }
		this._conn.send(res);
	}

//	disco._nodes[CMDS] = new disco.Node({
//		items: [{name: 'play', node: 'play', jid: 'n@d/r'}]
//	});
	var CMDS = "http://jabber.org/protocol/commands";
	var cmds = {
		_conn: null,
		init: function(conn) {
			this._conn = conn;
			this._nodes = [];
		}, 
		statusChanged: function(status,condition) {
			var disco, root, i;
			if (status === Strophe.Status.CONNECTED) {
				disco = this._conn.disco;
				disco._nodes.root.features.push(CMDS);
				root = new disco.Node({items: []});
				for (i=0; i < this._nodes.length; ++i) {
					root.items.push(new disco.Node(this._nodes[i]));
				}
				disco._nodes[CMDS] = root;
				this._conn.addHandler(respond.bind(this), CMDS, 'iq', 'set');
			}
		},
		addCommand: function(nodeCfg) {
			if(this._conn.disco._nodes[CMDS]) {
				var node = new this._conn.disco.Node(nodeCfg);
				this._conn.disco._nodes[CMDS].items.push(node);
			} else {
				this._nodes.push(nodeCfg); 
			}
		},
		execute: function(jid, node, callback) {
			var iq = $iq({to: jid, type: 'set'});
			iq.c('command', { xmlns: CMDS, node: node, action: 'execute'});
			this._conn.sendIQ(iq, callback || noop);
		}
	};
	Strophe.addConnectionPlugin('cmds', cmds);
	Strophe.addNamespace('CMDS', CMDS);
})(Strophe,jQuery);
