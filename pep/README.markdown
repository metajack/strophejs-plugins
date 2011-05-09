# Strophe.pep.js

Strophe.pep.js is a plugin for the XMPP library [ Strophe.js ]( http://code.stanziq.com/strophe ) 
to provide the Personal Eventing Protocol ( XEP-0163 ). This plugin is intend to be small and simple. 
It has no dependecies to other plugins.
You can find a more powerful PEP plugin in [ owengriffin's repository ]( https://github.com/owengriffin/strophejs/blob/master/plugins/strophe.pep.js ).

Strophe.pep.js is licensed under the MIT license.

## Usage

After you connected sucessfully to the XMPP server you can (un-)subscribe to PEP nodes or publish to your own nodes:

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
