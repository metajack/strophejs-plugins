Strophe.addConnectionPlugin('bookmarks', {
	init : function(connection) {
		this.connection = connection;
		Strophe.addNamespace('PRIVATE', 'jabber:iq:private');
		Strophe.addNamespace('BOOKMARKS', 'storage:bookmarks');
		Strophe.addNamespace('PRIVACY', 'jabber:iq:privacy');
		Strophe.addNamespace('DELAY', 'jabber:x:delay');
		Strophe.addNamespace('PUBSUB', 'http://jabber.org/protocol/pubsub');
		
	},
	createBookmarksNode : function() {
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
				}).c('value').t('whitelist'));

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
	 */
	add : function(roomJid, alias, nick, autojoin) {
		var conferenceAttr = {
			jid: roomJid,
			autojoin: autojoin || false
		};

		if (alias) {
			conferenceAttr.name = alias;
		}

		var stanza = $iq({
			type : 'set'
		}).c('pubsub', {
			xmlns : Strophe.NS.PUBSUB
		}).c('publish', {
			node : Strophe.NS.BOOKMARKS
		}).c('item', {
			id : roomJid
		}).c('storage', {
			xmlns : Strophe.NS.BOOKMARKS
		}).c('conference', conferenceAttr);

		if (nick) {
			stanza.c('nick').t(nick);
		}

		this.connection.sendIQ(stanza);
	},
	/**
	 * Retrieve all stored bookmarks.
	 *
	 * @param {function} success - Callback after success
	 * @param {function} error - Callback after error
	 */
	get: function(success, error) {
		this.connection.sendIQ($iq({
			type : 'get'
		}).c('pubsub', {
			xmlns : Strophe.NS.PUBSUB
		}).c('items', {
			node : Strophe.NS.BOOKMARKS
		}), success, error);
	}

});
