(function(Strophe,$) {
	var DiscoNode = Strophe.Disco.DiscoNode;
	var noop = Strophe.Disco.noop;

	CommandNode = function(cfg) {
		$.extend(this,cfg);
	};
	CommandNode.prototype = new DiscoNode();
	CommandNode.prototype.send = function() {
		var iq = $iq({});
	};

	CommandNode.prototype.callback = function(onSucces,onError) {
		this.onSuccess({});
	};


	// we have to overrite reply, because we pass in the callback fn form
	// node requests handler, we can only send a response
	// once our cmd callback has returned
	DiscoNode.prototype.reply = function(iq,fn) {
		var req = this.parseRequest(iq);
		var res = this.fromTo(req);
		this.fn = fn;
		this.addFirstChild(req,res);
		this.addContent(req,res);
		return res;
	};

	// our hook
	CommandNode.prototype.addContent = function(req,res) {
		this.req = req;
		this.res = res;
		this.callback.call(this,this.onSuccess.bind(this), this.onError.bind(this));
	};
	CommandNode.prototype.onError = function() {
		res.attrs({status: 'error'});
		this.fn.call(this,res);
	};

	CommandNode.prototype.onSuccess = function(obj) {
		var res = this.res, item = this.item;
		res.attrs({status: 'completed'});
		if($.isArray(obj)) {
			$.each(obj, function(i,entry) { res.c(item).t(entry).up(); });
		}
		this.fn.call(this,res);
	};

	var GetUrls = new CommandNode({
		root: 'urls',
		item: 'url',
		node: 'getUrls', 
		name: 'Retrieve Urls'
	});

	var SetUrls = new CommandNode({
		root: 'urls',
		item: 'url',
		node: 'setUrls', 
		name: 'Sets Urls'
	});

	function create(node, cb) {
		var cmd, callback = cb || noop;
		if (node === 'getUrls') {
			return new CommandNode({
				item: 'url',
				node: 'getUrls', 
				name: 'Retrieve Urls',
				callback: callback
			});
		} else if (node === 'setUrls') {
			return new CommandNode({
				item: 'url',
				node: 'setUrls', 
				name: 'Sets Urls',
				callback: callback
			});
		}
		throw 'Strophe.Commands has no implementation for: ' + node;
	}


	Strophe.Commands = {
		create: create,
		CommandNode: CommandNode
	};

})(Strophe,jQuery);


(function(Strophe,$) {
	var CMDS = "http://jabber.org/protocol/commands";
	var CommandNode = Strophe.Commands.CommandNode;
	var noop = Strophe.Disco.noop;
	function reply(iq) {
		var node = $('command',iq).attr('node'), nodeImpl;
		var n = $.grep(this.cmds.items, function(n) { return n.node == node; });
		if(n.length === 0) { 
			nodeImpl = new DiscoNodeNotFound();  
			this._conn.send(nodeImpl.reply(iq));
		} else { 
			nodeImpl = n[0]; 
			nodeImpl.reply(iq, function(res) {
				this._conn.send(res);
			}.bind(this));
		}
		return true;
	}

	function request(conn, jid, node, args) {
		var iq = $iq({to: jid, type: 'set'}), data, onSucces, onError;
		iq.c('command', { xmlns: CMDS, node: node, action: 'execute'});
		data = $.grep($.makeArray(args), function(arg) { $.isArray(arg); });
		conn.sendIQ(iq);
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
			if(!item.node) { throw 'command needs a node'; }
			if(!item.jid) { item.jid = this._conn.jid; }
			this.cmds.items.push(new CommandNode(item));
		},
		execute: function(jid, node, data, onSuccess, onError) {
			var n = $.grep(this.cmds.items, function(n) { return n.node == node; });
			var iq = $iq({to: jid, type: 'set'});
			iq.c('command', { xmlns: CMDS, node: node, action: 'execute'});

			if ($.isArray(data)) {
				$.each(data, function(i,item) { iq.c(n[0].item).t(item).up(); });
			} else {
				onSuccess = data;
				onError = onSuccess;
			} 
			this._conn.sendIQ(iq, onSuccess || noop, onError || noop);
		}
	};

	Strophe.addConnectionPlugin('cmds', cmds);
	Strophe.addNamespace('COMMANDS', CMDS);
})(Strophe,jQuery);
