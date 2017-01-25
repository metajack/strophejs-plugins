# Strophe.js Plugins

**Please Note:**
*This repository used to contain all the plugins. They have since been split
out into their own repositories so that they can be managed and released
independently. For more info, see ticket [#123](https://github.com/strophe/strophejs-plugins/issues/123)*

[Strophe.js](http://code.stanziq.com/strophe) is a JavaScript library for
speaking XMPP in web applications. It supports extension via a plugin system.

Below is listed a collection Strophe.js plugins created and maintained by the
community. The homepage for this collection is
https://github.com/strophe/strophejs-plugins

## How to use

Strophe plugins extend the Strophe.Connection object by calling
``Strophe.addConnectionPlugin``.

This enables us to then access the plugin as an attribute on the connection
object.

For example, here the "roster" plugin is used:

```
var connection = new Strophe.Connection(bosh_service_url);
connection.roster.get(function () {});
```

## Available Plugins

### XMPP Extensions

- [Data Forms](https://github.com/strophe/strophejs-plugin-dataforms)
  ([XEP 0004](http://xmpp.org/extensions/xep-0004.html))

- [Jabber-RPC](https://github.com/strophe/strophejs-plugin-rpc)
  ([XEP 0009](http://xmpp.org/extensions/xep-0009.html))

- [Service Discovery](https://github.com/strophe/strophejs-plugin-disco)
  ([XEP 0030](http://xmpp.org/extensions/xep-0030.html))

- [Multi-User Chat](https://github.com/strophe/strophejs-plugin-muc)
  ([XEP 0045](http://xmpp.org/extensions/xep-0045.html))

- [Bookmarks](https://github.com/strophe/strophejs-plugin-bookmarks)
  ([XEP 0048](http://xmpp.org/extensions/xep-0048.html))

- [Private XML Storage](https://github.com/strophe/strophejs-plugin-private)
  ([XEP 0049](http://xmpp.org/extensions/xep-0049.html))

- [Ad-Hoc Commands](https://github.com/strophe/strophejs-plugin-cmds)
  ([XEP 0050](http://xmpp.org/extensions/xep-0050.html))

- [vcard-temp](https://github.com/strophe/strophejs-plugin-vcard)
  ([XEP 0054](http://xmpp.org/extensions/xep-0054.html))

- [Result Set Management](https://github.com/strophe/strophejs-plugin-rsm)
  ([XEP 0059](http://xmpp.org/extensions/xep-0059.html))

- [Publish-Subscribe](https://github.com/strophe/strophejs-plugin-pubsub)
  ([XEP 0060](http://xmpp.org/extensions/xep-0060.html))

- [Out of Band Data](https://github.com/strophe/strophejs-plugin-outofband)
  ([XEP 0066](http://xmpp.org/extensions/xep-0066.html))

- [Jabber Object Access Protocol](https://github.com/strophe/strophejs-plugin-joap)
  ([XEP 0075](http://xmpp.org/extensions/xep-0075.html))

- [In-Band Registration](https://github.com/strophe/strophejs-plugin-register)
  ([XEP 0077](http://xmpp.org/extensions/xep-0077.html))

- [Chat State Notifications](https://github.com/strophe/strophejs-plugin-chatstates)
  ([XEP 0085](http://xmpp.org/extensions/xep-0085.html))

- [Entity Capabilities](https://github.com/strophe/strophejs-plugin-caps)
  ([XEP 0115](http://xmpp.org/extensions/xep-0115.html))

- [Message Archiving](https://github.com/strophe/strophejs-plugin-archive)
  ([XEP 0136](http://xmpp.org/extensions/xep-0136.html))

- [Personal Eventing Protocol](https://github.com/strophe/strophejs-plugin-pep)
  ([XEP 0163](http://xmpp.org/extensions/xep-0163.html))

- [Message Delivery Receipts](https://github.com/strophe/strophejs-plugin-receipts)
  ([XEP 0184](http://xmpp.org/extensions/xep-0184.html))

- [XMPP Ping](https://github.com/strophe/strophejs-plugin-ping)
  ([XEP 0199](http://xmpp.org/extensions/xep-0199.html))

- [Roster Versioning](https://github.com/strophe/strophejs-plugin-roster)
  ([XEP 0237](http://xmpp.org/extensions/xep-0237.html))

- [Message Carbons](https://github.com/strophe/strophejs-plugin-message-carbons)
  ([XEP 0280](http://xmpp.org/extensions/xep-0280.html))

- [Message Archive Management](https://github.com/strophe/strophejs-plugin-mam)
  ([XEP 0313](http://xmpp.org/extensions/xep-0313.html))

- [In-Band Bytestreams](https://github.com/strophe/strophejs-plugin-ibb)
  ([XEP 0047](http://xmpp.org/extensions/xep-0047.html))

- [SI File Transfer](https://github.com/strophe/strophejs-plugin-si-filetransfer)
  ([XEP 0096](http://xmpp.org/extensions/xep-0096.html))

- [Stream Management](https://github.com/strophe/strophejs-plugin-stream-management)
  ([XEP 0198](http://xmpp.org/extensions/xep-0198.html))

### XMPP-IoT

extensions used in Internet of Things (IoT)

- [Internet of Things - Sensor Data](https://github.com/strophe/strophejs-plugin-sensordata) - Reading values from devices
  ([XEP 0323](http://xmpp.org/extensions/xep-0325.html))

- [Internet of Things - Control](https://github.com/strophe/strophejs-plugin-control) - Writing values to devices
  ([XEP 0325](http://xmpp.org/extensions/xep-0325.html))

### Other Plugins

- [Serverdate](https://github.com/strophe/strophejs-plugin-serverdate) - Syncs a local clock
  to the servers

- [epic](https://github.com/strophe/strophejs-plugin-epic)

- [iexdomain](https://github.com/strophe/strophejs-plugin-iexdomain) - Support for IE
  XDomainRequest

## Contribute

If you would like to make your own plugin available here, please create a
ticket in the issue tracker and someone will create a new repository for you.

## Literature

The book Professional XMPP Programming with JavaScript and
[jQuery](http://jquery.com/) is also available, which covers Strophe in detail
in the context of web applications.
You can find more information and two free chapters ( including one specifically
on writing Strophe.js plugins ) at the [homepage](http://professionalxmpp.com)
of the book.
