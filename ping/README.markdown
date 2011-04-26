# Strophe.ping.js

Strophe.ping.js is a plugin for the XMPP library [Strophe.js]( http://code.stanziq.com/strophe ) 
to provide XMPP Ping ( [ XEP-0199 ]( http://xmpp.org/extensions/xep-0199.html ) ).

Strophe.ping.js is licensed under the MIT license.

## Usage

After you connected sucessfully to the XMPP server you can send a ping to a XMPP client or server:

    connection.ping.ping( "serviceJID@server.org", success, error );

You can also add a ping handler to receive pings:

    conncection.ping.addPingHandler( handler );

Within your ping handler function you surely want to reply with a pong iq:

    myHandler = function( ping ){
      ...
      conncection.ping.pong( ping )
      ...
    }
