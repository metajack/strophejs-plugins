(function($) {

	function log(msg) {
		if (window.console) {
			console.log('epic.' + msg);
		}
	}

	var templates = {
		roster: '<ul class="epic-roster"></ul>',
		roster_item: '<li data-jid="${jid}" class="epic-roster-item">${jid}</li>',
		cmds: '<ul class="epic-cmds"></ul>',
		cmds_item: '<li class="epic-cmd-item" data-jid="${jid}" data-node="${node}">${name}</li>'
	};

	var epic = {
		_create: function() {
			log('create');
			this.element.append(templates.roster);
			this.element.append(templates.cmds);
			this._conn = this.options.conn;
			this._conn.roster.onPresenceChanged = $.proxy(this.updateRoster, this);
			this.element.delegate('.epic-roster', 'click', $.proxy(this.getCmdList,this));
			this.element.delegate('.epic-cmds', 'click', $.proxy(this.executeCmd,this));
		},
		updateRoster: function(jid, status) {
			log('updateRoster');
			var roster = this.element.find('.epic-roster');
			$(".epic-roster-item[data-jid='" + jid + "']", roster).remove();
			if (status !== 'unavailable') {
				$.tmpl(templates.roster_item, {jid: jid}).appendTo(roster);
			}
		},
		getCmdList: function(e) {
			var node = $(e.target).text();
			log('getCmdList for ' + node);
			this._conn.disco.items(node, Strophe.NS.CMDS, $.proxy(this.updateCmdList, this));
		},
		updateCmdList: function(iq) {
			var cmds = this.element.find('.epic-cmds');
			$("item",iq).each(function(i,item) {
				item = $(item);
				var data = {
					node: item.attr('node'),
					name: item.attr('name'),
					jid: item.attr('jid')
				};
				$.tmpl(templates.cmds_item, data).appendTo(cmds);
			});
		},
		executeCmd: function(e) {
			var target = $(e.target);
			var node = target.attr('data-node');
			var jid = target.attr('data-jid');
			log('executeCmd for ' + node + ' on ' + jid);
			this._conn.cmds.execute(jid, node);
		}
	};

	$.widget('nmk.epic', epic);
})(jQuery);
