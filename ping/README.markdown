# Strophe.ping.js

Strophe.ping.js is a plugin to provide XMPP Ping
( [ XEP-0199 ]( http://xmpp.org/extensions/xep-0199.html ) ).

## Usage

After you connected sucessfully to the XMPP server you can send a ping to a XMPP
client or server:

    connection.ping.ping( "serviceJID@server.org", success, error, timeout );

You can also add a ping handler to receive pings:

    connection.ping.addPingHandler( handler );

Within your ping handler function you surely want to reply with a pong iq:

    handler = function( ping ){
      ...
      connection.ping.pong( ping );
      ...
	  return true;
    }

## ToDo

- write specs
