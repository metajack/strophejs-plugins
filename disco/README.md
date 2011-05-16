Service Discovery Module
======================== 
The module facilitates client and server side handling of discovery messages (http://xmpp.org/extensions/xep-0030.html). To run the specs you should install jasmine-tool for nodejs via npm and update the external libraries (Strophe, jQuery) in jasmine.json

Client Side
========================
 For sending disco#info and disco#item messages the plugin provides two methods on the disco object added to the strophe connection. You use them as follows

    var c = new Strophe.Connection('http://localhost/xmpp-httpbind');
    c.connect('andi@psi/strophe','andi');
    c.disco.info('andi@psi/psi');

You can also pass a node, success and error handlers to the info method. The items method behaves in the same way, e.g. 

    c.disco.items('andi@psi/psi', 'http://jabber.org/protocol/commands')

Server Side
========================
 The module adds response handlers to info and item queries returning payload similar to what you see below

     <iq xmlns='jabber:client' from='andi@psi/strophe' to='andi@psi/strophe2' type='result' id='4774:sendIQ'><query xmlns='http://jabber.org/protocol/disco#info'><identity name='strophe'/><feature var='http://jabber.org/protocol/disco#info'/><feature var='http://jabber.org/protocol/disco#items'/></query></iq>

You can additional features using the addNode, e.g. 
    c.disco.addNode('aNode', { items: [{node: 'aNode', name: 'aName'}]  });

and then query for them using the items method

    c1.disco.items('andi@psi/strophe', 'aNode', function(s) { console.log(Strophe.serialize(s)) ; } )

See the specs for details.
    
    
