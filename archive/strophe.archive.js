// http://xmpp.org/extensions/xep-0136.html
Strophe.addConnectionPlugin('archive', {
  _connection: null,

  init: function(connection) {
    this._connection = connection;
    Strophe.addNamespace('DELAY', 'jabber:x:delay');
    Strophe.addNamespace('ARCHIVE', 'http://www.xmpp.org/extensions/xep-0136.html#ns');
  },

  listCollections: function(jid, rsm, callback) {
    var xml = $iq({type: 'get', id: this._connection.getUniqueId('list')}).c('list', {xmlns: Strophe.NS.ARCHIVE, 'with': jid});
    if (rsm) { xml = xml.cnode(rsm.toXML()); }
    this._connection.sendIQ(xml, this._handleListConnectionResponse.bind(this, callback));
  },
  
  _handleListConnectionResponse: function(callback, stanza) {
    var collections = [];
    var chats = stanza.getElementsByTagName('chat');
    for (var ii = 0; ii < chats.length; ii++) {
      var jid = chats[ii].getAttribute('with');
      var start = chats[ii].getAttribute('start');
      collections.push(new Strophe.ArchivedCollection(this._connection, jid, start));
    }
    var responseRsm = new Strophe.RSM({xml: stanza.getElementsByTagName('set')[0]});
    callback(collections, responseRsm);
  }
});

Strophe.ArchivedCollection = function(connection, jid, start) {
  this.connection = connection;
  this.jid = jid;
  this.start = start;
  this.startDate = iso8601toDate(start);
};

Strophe.ArchivedCollection.prototype = {
  retrieveMessages: function(rsm, callback) {
    var builder = $iq({type: 'get', id: this.connection.getUniqueId('retrieve')}).c('retrieve', {xmlns: Strophe.NS.ARCHIVE, 'with': this.jid, start: this.start});
    if (rsm) { builder = builder.cnode(rsm.toXML()); }
    this.connection.sendIQ(builder, function(stanza) {
      var messages = [];
      var myJid = Strophe.getBareJidFromJid(this.connection.jid);
      var responseRsm;
      var timestamp = this.startDate;
      var msgTimestamp;
      var chat = stanza.getElementsByTagName('chat')[0];
      var element = chat.firstChild;
      while (element) {
        switch (element.tagName) {
        case 'to':
          msgTimestamp = this._incrementTimestampForMessage(timestamp, element);
          messages.push(new Strophe.ArchivedMessage(msgTimestamp, myJid, this.jid, Strophe.getText(element.getElementsByTagName('body')[0])));
          break;
        case 'from':
          msgTimestamp = this._incrementTimestampForMessage(timestamp, element);
          messages.push(new Strophe.ArchivedMessage(msgTimestamp, this.jid, myJid, Strophe.getText(element.getElementsByTagName('body')[0])));
          break;
        case 'set':
          responseRsm = new Strophe.RSM({xml: element});
          break;
        default:
          break;
        }
        element = element.nextSibling;
      }
      callback(messages, responseRsm);
    }.bind(this));
  },

  _incrementTimestampForMessage: function(timestamp, element) {
    var secs = element.getAttribute('secs');
    var newTimestamp = new Date();
    newTimestamp.setTime(timestamp.getTime() + Number(secs) * 1000);
    return newTimestamp;
  }
};

Strophe.ArchivedMessage = function(timestamp, from, to, body) {
  this.timestamp = timestamp;
  this.from = from;
  this.to = to;
  this.body = body;
};

Strophe.ArchivedMessage.prototype = {
};

/** Function: iso8610toDate
   * Parses a ISO-8610 Date to a Date-Object.
	 *
	 * Uses a fallback if the client's browser doesn't support it.
	 *
	 * Quote:
	 *   ECMAScript revision 5 adds native support for ISO-8601 dates in the Date.parse method,
	 *   but many browsers currently on the market (Safari 4, Chrome 4, IE 6-8) do not support it.
	 *
	 * Credits:
	 *  <Colin Snover at http://zetafleet.com/blog/javascript-dateparse-for-iso-8601>
	 *
	 * Parameters:
	 *   (String) date - ISO-8610 Date
	 *
	 * Returns:
	 *   Date-Object
	 */
function iso8601toDate(date) {
  var timestamp = Date.parse(date), minutesOffset = 0;
	if(isNaN(timestamp)) {
		var struct = /^(\d{4}|[+\-]\d{6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?))?/.exec(date);
		if(struct) {
			if(struct[8] !== 'Z') {
				minutesOffset = +struct[10] * 60 + (+struct[11]);
				if(struct[9] === '+') {
					minutesOffset = -minutesOffset;
				}
			}
			return new Date(+struct[1], +struct[2] - 1, +struct[3], +struct[4], +struct[5] + minutesOffset, +struct[6], struct[7] ? +struct[7].substr(0, 3) : 0);
		} else {
			// XEP-0091 date
			timestamp = Date.parse(date.replace(/^(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') + 'Z');
		}
	}
	return new Date(timestamp);
};