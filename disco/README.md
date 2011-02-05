** Support for xep-030: Service discovery **

Allows to send disco queries and registers handlers that respond incoming queries.

** Example

var c = new Strophe.Connection('bosh-service');
c.connect(jid,pw);
c.disco.info(jid,callback);

** Runspec

use node with jasmine-node plugin to run the specs

