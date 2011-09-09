# strophe.disco.js

strophe.disco.js is a plugin for the XMPP library [ Strophe.js ]( http://code.stanziq.com/strophe )
to provide Service discovery ( [XEP-0030>](http://xmpp.org/extensions/xep-0030.html) ).
It allows to send disco queries and registers handlers that respond to incoming queries.

## Usage

    var c = new Strophe.Connection('bosh-service');
    c.connect(jid,pw);
    c.disco.info(jid,callback);

### Run Specs

use node with jasmine-node plugin to run the specs

## ToDo

- cleanup stanza specs using Strophe.Builder instead of strings

## Licence

Strophe.caps.js is licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).

## Authors

- François de Metz (francois@2metz.fr)
- Markus Kohlhase (mail@markus-kohlhase.de)
