
function clear(stanza) {
	if (stanza.tree) {
		stanza = stanza.tree();
	}
	if (stanza.removeAttribute) {
		stanza.removeAttribute('id');
		return Strophe.serialize(stanza);
	}
	return stanza;
}
var stanzas = {
	info: {
		request: "<iq to='n@d/r' type='get' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#info'/></iq>",
		request_with_node: "<iq to='n@d/r' type='get' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#info' node='aNode'/></iq>",
		response: "<iq to='null' type='result' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#info'><identity name='strophe'/><feature var='http://jabber.org/protocol/disco#info'/><feature var='http://jabber.org/protocol/disco#items'/></query></iq>",
		response_with_node: "<iq to='null' type='result' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#info' node='aNode'><identity>aNode</identity><feature var='a'/><feature var='b'/></query></iq>"
	},
	items: {
		request: "<iq to='n@d/r' type='get' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#items'/></iq>",
		request_with_node: "<iq to='n@d/r' type='get' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#items' node='aNode'/></iq>",
		response: "<iq to='null' type='result' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#items'/></iq>",
		response_with_node: "<iq to='null' type='result' xmlns='jabber:client'><query xmlns='http://jabber.org/protocol/disco#items' node='aNode'><item name='aNother' node='aNotherNode'/></query></iq>"
	}
};
