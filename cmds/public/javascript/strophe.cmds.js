(function(Strophe) {

	var noop = function(iq) {
		console.log(iq);
	};
	var CMDS = "http://jabber.org/protocol/commands";
	var cmds = {
		_conn: null,
		init: function(conn) {
			this._conn = conn;
		}, 
		statusChanged: function(status,condition) {
			if (status === Strophe.Status.CONNECTED) {
				this._conn.disco._nodes.root.features.push(CMDS);
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
