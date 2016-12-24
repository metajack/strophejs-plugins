# Strophe.stream-management.js

Strophe.stream-management.js is a plugin that implements stream management on XMPP. ([ XEP-0198 ]( http://xmpp.org/extensions/xep-0198.html ))

## Usage

After you connected sucessfully to the XMPP server you can enable stream management:

```
    connection.streamManagement.enable();
```


You can also enable the option to send a request response on every received stanza:

```
	connection.streamManagement.sendCountOnEveryIncomingStanza = true;
```

By default the client will request a response every 5 stanzas sent. You can change that behavior
setting the value of requestResponseInterval. To disable this feature set to zero.

```
    connection.streamManagement.requestResponseInterval = 5;
```

You may also manually request an acknowledgement at any point:

```
    connection.streamManagement.requestAcknowledgement();
```

By adding a listener, you will receive the ID of each sent stanza that has been acknowledged by the server.

```
    connection.streamManagement.addAcknowledgedStanzaListener(myFunc(id))
```

To get sent stanzas stream count use:

```
	connection.streamManagement.getOutgoingCounter();
```

To get received stream count use:

```
	connection.streamManagement.getIncomingCounter();
```

You may enable logging to have the console notify you when the server has acknowledged some but not all stanzas.
Such instances can occur due to transmission delay and is therefore not necessarily a critical error.
Logging is disabled by default.

```
	connection.streamManagement.logging = true;
```

# Notes

Please note that between requesting the enablement of stream management and the server confirming support.
The sending stream is paused. This means that if the server does not support XEP-198, your application
will stop sending stanzas until to you manually resume the stream 'connection.resume()'.

You may also run into issues if you use 'connection.pause()' or 'connection.resume' elsewhere in your codebase.

## Contributors

- Tom Evans
- Javier Vega
- Emmet McPoland


##TODO

Add additional examples of usage.
