(function(Strophe,$) {
	var DiscoNode = Strophe.Disco.DiscoNode;
	var noop = Strophe.Disco.noop;

	CommandNode = function(cfg) {
		$.extend(this,cfg);
	};
	CommandNode.prototype = new DiscoNode();
	CommandNode.prototype.addContent = function(req,res) {
		this.req = req;
		this.res = res;
		if (this.callback) {
			this.callback.call(this,this.addResult);
		} else { 
			this.addResult({});
		}
	};

	CommandNode.prototype.addResult = function(obj) {
		var res = this.res;
		res.c(this.root, { xmlns: 'epic:x' } );
		if($.isPlainObject(obj)) { throw 'cannot handle object yet'; }
		if($.isArray(obj)) {
			$.each(obj, function(i,item) {
				res.c(this.item).t(item).up();
			}.bind(this));
		}
	};


	var getUrls = { 
		node: 'getUrls', 
		name: 'Retrieve Urls',
		addContent: function(req,res) {
			if(!this.callback) {  throw 'No callback provided'; }
			var urls = Strophe.xmlElement('urls',[['xmlns','epic:x:urls']]);
			res.c('urls', {xmlns: 'epic:x:urls'});
			this.callback(function(urls) {
				_.each(urls, function(url) {
					res.c('url').t(url).up();
				});
			});
			return res;
		}
	};
	var GetUrls = new CommandNode({
		root: 'urls',
		item: 'url',
		node: 'getUrls', 
		name: 'Retrieve Urls'
	});


	Strophe.Commands = {
		CommandNode: CommandNode,
		GetUrls: GetUrls,
		getUrls: getUrls
	};

})(Strophe,jQuery);


(function(Strophe,$) {
	var CMDS = "http://jabber.org/protocol/commands";
	var CommandNode = Strophe.Commands.CommandNode;

	function reply(iq) {
		var node = $('command',iq).attr('node'), nodeImpl;
		var n = $.grep(this.cmds.items, function(n) { return n.node == node; });
		if(n.length === 0) { nodeImpl = new DiscoNodeNotFound();  }
		else {
			nodeImpl = $.isPlainObject(n[0]) ? new CommandNode(this,n[0]) : n[0]; 
		}
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
