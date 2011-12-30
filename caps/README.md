Entity Capabilities
===================

This plugin handles entity capabilities according to [XEP-0115](http://xmpp.org/extensions/xep-0115.html).

Requirements
------------
The disco plugin is **required**.

Usage
-----
  1. Download & Include the script in your client :)
  2. Set the node to the client, e.g.:

```
_connection = new Strophe.Connection(service);
// change example.com to your client's url.
_connection.caps.node = 'http://example.com';
```

If you need to send the caps stanza to somewhere, just call `_connection.caps.generateCapsAttrs()` to get the stanza attributes used to generate the "c"-stanza.
