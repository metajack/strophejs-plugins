** Support for xep-030: Service discovery **

Allows to send disco queries and registers handlers that respond to incoming queries.


** Example **

    var c = new Strophe.Connection('bosh-service');
    c.connect(jid,pw);
    c.disco.info(jid,callback);

** Run Specs **

use node with jasmine-node plugin to run the specs

** Todo ** 

 * cleanup stanza specs using Strophe.Builder instead of strings


** See **

 * http://xmpp.org/extensions/xep-0030.html

