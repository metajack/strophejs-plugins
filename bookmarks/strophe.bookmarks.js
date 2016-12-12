Strophe.addConnectionPlugin('bookmarks', {
	init : function(connection) {
		this.connection = connection;
		Strophe.addNamespace('PRIVATE', 'jabber:iq:private');
		Strophe.addNamespace('BOOKMARKS', 'storage:bookmarks');
		Strophe.addNamespace('PRIVACY', 'jabber:iq:privacy');
		Strophe.addNamespace('DELAY', 'jabber:x:delay');
		Strophe.addNamespace('PUBSUB', 'http://jabber.org/protocol/pubsub');
		
	},
	/**
	 * Create private bookmark node.
	 *
	 * @param {function} [success] - Callback after success
	 * @param {function} [error] - Callback after error
	 */
	createBookmarksNode : function(success, error) {
		// We do this instead of using publish-options because this is not
		// mandatory to implement according to XEP-0060
		this.connection.sendIQ($iq({
			type : 'set'
		}).c('pubsub', {
			xmlns : Strophe.NS.PUBSUB
		}).c('create', {
			node : 'storage:bookmarks'
		}).up().c('configure').c('x', {
			xmlns : 'jabber:x:data',
			type : 'submit'
		}).c('field', {
			'var' : 'FORM_TYPE',
			type : 'hidden'
		}).c('value').t('http://jabber.org/protocol/pubsub#node_config').up()
				.up().c('field', {
					'var' : 'pubsub#persist_items'
				}).c('value').t('1').up().up().c('field', {
					'var' : 'pubsub#access_model'
				}).c('value').t('whitelist'), success, error);

		return true;
	},
	/**
	 * Add bookmark to storage.
	 *
	 * @param {string} roomJid - The JabberID of the chat roomJid
	 * @param {string} [alias] - A friendly name for the bookmark
	 * @param {string} [nick] - The users's preferred roomnick for the chatroom
	 * @param {boolean} [autojoin=false] - Whether the client should automatically join 
	 * the conference room on login.
	 * @param {function} [success] - Callback after success
	 * @param {function} [error] - Callback after error
	 */
	add : function(roomJid, alias, nick, autojoin, success, error) {
		var self = this;
		var stanza = $iq({
			type : 'set'
		}).c('pubsub', {
			xmlns : Strophe.NS.PUBSUB
		}).c('publish', {
			node : Strophe.NS.BOOKMARKS
		}).c('item', {
			id : 'current'
		}).c('storage', {
			xmlns : Strophe.NS.BOOKMARKS
		});

		function bookmarkGroupChat() {
			var conferenceAttr = {
				jid : roomJid, autojoin : autojoin || false
			};

			if (alias) {
				conferenceAttr.name = alias;
			}

			stanza.c('conference', conferenceAttr);
			if (nick) {
				stanza.c('nick').t(nick);
			}

			self.connection.sendIQ(stanza, success, error);
		}

		self.get(function(s) {
			var confs = s.getElementsByTagName('conference');
			for (var i = 0; i < confs.length; i++) {
				var conferenceAttr = {
					jid : confs[i].getAttribute('jid'), autojoin : confs[i].getAttribute('autojoin') || false
				};
				var roomName = confs[i].getAttribute('name');
				if (roomName) {
					conferenceAttr.name = roomName;
				}
				stanza.c('conference', conferenceAttr);
				var nickname = confs[i].getElementsByTagName('nick');
				if (nickname.length === 1) {
					stanza.c('nick').t(nickname[0].innerHTML);
				}
				stanza.up().up();
			}

			bookmarkGroupChat();
		}, function(s) {
			if (s.getElementsByTagName('item-not-found').length > 0) {
				bookmarkGroupChat();
			} else {
				error(s);
			}
		});
	},
	/**
	 * Retrieve all stored bookmarks.
	 *
	 * @param {function} [success] - Callback after success
	 * @param {function} [error] - Callback after error
	 */
	get: function(success, error) {
		this.connection.sendIQ($iq({
			type : 'get'
		}).c('pubsub', {
			xmlns : Strophe.NS.PUBSUB
		}).c('items', {
			node : Strophe.NS.BOOKMARKS
		}), success, error);
	},
	/**
	 * Delete the given entry for roomJid.
	 *
	 * @param {string} roomJid - The JabberID of the chat roomJid you want to remove
	 * @param {function} [success] - Callback after success
	 * @param {function} [error] - Callback after error
	 * @param {boolean} [notify=false] - True: notify all subscribers
	 */
	delete: function(roomJid, success, error, notify) {
		this.connection.sendIQ($iq({
			type : 'set'
		}).c('pubsub', {
			xmlns : Strophe.NS.PUBSUB
		}).c('retract', {
			node : Strophe.NS.BOOKMARKS,
			notify: notify || false
		}).c('item', {
			id: roomJid
		}), success, error);
	}

});
