(function(Strophe) {
	var noop = function(iq) {
		console.log(iq);
	};

//	disco._nodes[CMDS] = new disco.Node({
//		items: [{name: 'play', node: 'play', jid: 'n@d/r'}]
//	});
	var CMDS = "http://jabber.org/protocol/commands";
	var cmds = {
		_conn: null,
		init: function(conn) {
			this._conn = conn;
		}, 
		statusChanged: function(status,condition) {
			var disco;
			if (status === Strophe.Status.CONNECTED) {
				disco = this._conn.disco;
				disco._nodes.root.features.push(CMDS);
				disco._nodes[CMDS] = new disco.Node({items: []});
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
})(Strophe);
