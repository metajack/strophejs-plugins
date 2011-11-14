Service Discovery Module
======================== 
The module facilitates client and server side handling of discovery messages (http://xmpp.org/extensions/xep-0030.html). To run the specs you should install jasmine-tool for nodejs via npm and update the references to the external libraries (Strophe, jQuery) in jasmine.json. After that you run
    
    $> jasmine mon

and navigate your browser to http://localhost:8124 to view the specs executing.

Client Side
========================
The plugin provides to methods (info and items) on top of the disco object that is added to the connection. You use them as follows

    var c = new Strophe.Connection('http://localhost/xmpp-httpbind');
    c.connect('andi@psi/strophe','andi');
    c.disco.info('andi@psi/psi');

You can also pass a node, success and error handlers to the method. The items method behaves in the same way. Just make sure that your success and error handlers are passed after the node (if any).


Server Side
========================
 The module adds response handlers to info and item queries. The disco object added to the connection has members for features and identity that will be used to populate the disco#info response.

     <iq xmlns='jabber:client' from='andi@psi/strophe' to='andi@psi/strophe2' type='result' id='4774:sendIQ'><query xmlns='http://jabber.org/protocol/disco#info'><identity name='strophe'/><feature var='http://jabber.org/protocol/disco#info'/><feature var='http://jabber.org/protocol/disco#items'/></query></iq>

You can additional nodes using addNode, e.g. 
    c.disco.addNode('aNode', { items: [{node: 'aNode', name: 'aName'}]  });

and then query for them using the items method

    c1.disco.items('andi@psi/strophe', 'aNode', function(s) { console.log(Strophe.serialize(s)) ; } )

See the specs for details.
    
    
