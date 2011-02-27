(function(Strophe,$) {
	var DiscoNode = Strophe.Disco.DiscoNode;
	var noop = Strophe.Disco.noop;

	CommandNode = function() {
		DiscoNode.apply(this,arguments);
	}
	CommandNode.prototype = new DiscoNode();
	Strophe.Commands = {
		CommandNode: CommandNode
	};

})(Strophe,jQuery);


(function(Strophe,$) {
	var CMDS = "http://jabber.org/protocol/commands";
	var CommandNode = Strophe.Commands.CommandNode;

	function reply(iq) {
		var node = $('command',iq).attr('node'), nodeImpl;
		var n = $.grep(this.cmds.items, function(n) { return n.node == node; });
		if(n.length === 0) { nodeImpl = new DiscoNodeNotFound();  }
		else { nodeImpl = new CommandNode(this,n[0]); }
		this._conn.send(nodeImpl.reply(iq));
		return true;
	}

	var cmds = {
		_conn: null,
		init: function(conn) {
			this._conn = conn;
			this.cmds = conn.disco.features[CMDS] = { items: [] };
		}, 
		statusChanged: function(status,condition) {
			if (status === Strophe.Status.CONNECTED) {
				this._conn.addHandler(reply.bind(this), CMDS, 'iq', 'set');
			}
		},
		add: function(item) {
			if(!item.node) { throw 'item needs a node'; }
			if(!item.jid) { item.jid = this._conn.jid; }
			this.cmds.items.push(item);
		},
		execute: function(jid, node, callback) {
			var iq = $iq({to: jid, type: 'set'});
			iq.c('command', { xmlns: CMDS, node: node, action: 'execute'});
			this._conn.sendIQ(iq, callback || noop);
		}
	};

	Strophe.addConnectionPlugin('cmds', cmds);
	Strophe.addNamespace('COMMANDS', CMDS);
})(Strophe,jQuery);
