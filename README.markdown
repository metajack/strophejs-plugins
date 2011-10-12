# Strophe.js Plugins

**WARNING:**
This repository contains almost all community plugins. Some of them
are in an experimental state. For more stable plugins checkout the original
repository or all branches of this repository that are based on the `upstream`
branch.

[Strophe.js](http://code.stanziq.com/strophe) is a JavaScript library for
speaking XMPP in web applications. It supports extension via a plugin system.

This is a collection of Strophe.js plugins created and maintained by the
community. The homepage for this collection is
https://github.com/metajack/strophejs-plugins .

## Available Plugins

- [Data Forms](strophejs-plugins/tree/master/dataforms/)
  ([XEP 0004](http://xmpp.org/extensions/xep-0004.html))

- [Service Discovery](strophejs-plugins/tree/master/disco/)
  ([XEP 0030](http://xmpp.org/extensions/xep-0030.html))

- [Multi-User Chat](strophejs-plugins/tree/master/muc/)
  ([XEP 0045](http://xmpp.org/extensions/xep-0045.html))

- [Private XML Storage](strophejs-plugins/tree/master/private/)
  ([XEP 0049](http://xmpp.org/extensions/xep-0049.html))

- [Ad-Hoc Commands](strophejs-plugins/tree/master/cmds/)
  ([XEP 0050](http://xmpp.org/extensions/xep-0050.html))

- [vcard-temp](strophejs-plugins/tree/master/vcard/)
  ([XEP 0054](http://xmpp.org/extensions/xep-0054.html))

- [Result Set Management](strophejs-plugins/tree/master/rsm/)
  ([XEP 0059](http://xmpp.org/extensions/xep-0059.html))

- [Publish-Subscribe](strophejs-plugins/tree/master/pubsub/)
  ([XEP 0060](http://xmpp.org/extensions/xep-0060.html))

- [In-Band Registration](strophejs-plugins/tree/master/register/)
  ([XEP 0077](http://xmpp.org/extensions/xep-0077.html))

- [Chat State Notifications](strophejs-plugins/tree/master/chatstates/)
  ([XEP 0085](http://xmpp.org/extensions/xep-0085.html))

- [Entity Capabilities](strophejs-plugins/tree/master/caps/)
  ([XEP 0115](http://xmpp.org/extensions/xep-0115.html))

- [Message Archiving](strophejs-plugins/tree/master/archive/)
  ([XEP 0136](http://xmpp.org/extensions/xep-0136.html))

- [Personal Eventing Protocol](strophejs-plugins/tree/master/pep/)
  ([XEP 0163](http://xmpp.org/extensions/xep-0163.html))

- [XMPP Ping](strophejs-plugins/tree/master/ping/)
  ([XEP 0199](http://xmpp.org/extensions/xep-0199.html))

- [Roster Versioning](strophejs-plugins/tree/master/roster/)
  ([XEP 0237](http://xmpp.org/extensions/xep-0237.html))

## Contribute

If you would like to make your plugin available here, simply fork this
repository, commit your plugin (see [boilerplate](master/boilerplate)),
and issue a pull request.
The same instructions also work for any changes you wish to make to existing
plugins.


## Literature

The book Professional XMPP Programming with JavaScript and
[jQuery](http://jquery.com/) is also available, which covers Strophe in detail
in the context of web applications.
You can find more information and two free chapters ( including one specifically
 on writing Strophe.js plugins ) at the [homepage](http://professionalxmpp.com)
of the book.
