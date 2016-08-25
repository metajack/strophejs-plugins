/**
 * Message Carbons (XEP 0280) plugin
 * @see http://xmpp.org/extensions/xep-0280.html
 */

(function () {

	function CarbonMessage() {
		this.direction = '';
		this.type = '';
		this.to = '';
		this.from = '';
		this.innerMessage = null
	}

	Strophe.addConnectionPlugin('messageCarbons', {
		_connection: null,
		_onCarbon: null,

		init: function (conn) {
			this._connection = conn;
			Strophe.addNamespace('CARBONS', 'urn:xmpp:carbons:2');
			Strophe.addNamespace('FORWARD', 'urn:xmpp:forward:0');
			this._connection.addHandler(this._messageHandler.bind(this), null, "message");
		},

		enable: function (onCarbon) {
			_onCarbon = onCarbon;
			var id = this._connection.getUniqueId('carbons');
			var iq = $iq({ type: "set", id: id })
				.c("enable", { xmlns: Strophe.NS.CARBONS });
			this._connection.sendIQ(iq);
		},

		disable: function () {
			var id = this._connection.getUniqueId('carbons');
			var iq = $iq({ type: "set", id: id })
				.c("disable", { xmlns: Strophe.NS.CARBONS });
			this._connection.sendIQ(iq);
		},

		_messageHandler: function (msg) {
			if (typeof _onCarbon !== "function")
				return true;

			var subMessage = $(msg).find("sent > forwarded > message");
			if (subMessage) {
				var item = new CarbonMessage();
				item.direction = "sent";
				item.type = $(subMessage).attr('type')
				item.to = $(subMessage).attr('to');
				item.from = $(subMessage).attr('from');
				item.innerMessage = subMessage;
				_onCarbon(item);
			}

			var subMessage = $(msg).find("received > forwarded > message");
			if (subMessage) {
				var item = new CarbonMessage();
				item.direction = "received";
				item.type = $(subMessage).attr('type')
				item.to = $(subMessage).attr('to');
				item.from = $(subMessage).attr('from');
				item.innerMessage = subMessage;
				_onCarbon(item);
			}

			return true;
		}

	});

})();