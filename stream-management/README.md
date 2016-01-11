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


To get sent stanzas stream count use:

```
	connection.streamManagement.getOutgoingCounter();
```

To get received stream count use:

```
	connection.streamManagement.getIncomingCounter();
```

## Contributors

- Tom Evans
- Javier Vega


##TODO

Add additional examples of usage.
