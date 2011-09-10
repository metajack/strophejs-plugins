# Strophe.pep.js

Strophe.pep.js is a plugin to provide the Personal Eventing Protocol
( [XEP-0163](http://xmpp.org/extensions/xep-0163.html) ).

## Usage

After you connected sucessfully to the XMPP server you can (un-)subscribe to PEP
nodes or publish to your own nodes:

    connection.pep.subscribe( "serviceJID@server.org", "nodename" );
    ...
    connection.pep.unsubscribe( "serviceJID@server.org", "nodename" );
    ...
    var elem = document.createElement("mytag");
    elem.appendChild( document.createTextNode("myText") );

    var content = ["<a><b id="c">sample text</b></a>", elem ];
    connection.pep.publish( "mynode", content );


You can also pass callback and handler functions:

    conncection.pep.subscribe( jid, node, success, error, handler );
    ...
    conncection.pep.unsubscribe( jid, node, success, error );
    ...
    connection.pep.publish( node, content, success, error );

If you have standard handlers you want to use, you can define them globally:

    conncection.pep.defaults.success = myDefaultSuccessHandler
    ...
    conncection.pep.defaults.error = myDefaultErrorHandler

## ToDo

- write specs

## Authors

- flosse
