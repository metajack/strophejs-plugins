/* XEP-0313: Message Archive Management
 * Copyright (C) 2012 Kim Alvefur
 *
 * This file is MIT/X11 licensed. Please see the
 * LICENSE.txt file in the source package for more information.
 *
 * TODO:
 * Get RSM from the reply
 * Clean remove onMessage handler afterwards
 * queryid?
 *
 */

Strophe.addConnectionPlugin('mam', {
  _c: null,
  _p: [ "with", "start", "end" ],
init:
  function(conn) {
    this._c = conn;
    Strophe.addNamespace('MAM', 'urn:xmpp:mam:tmp');
  },
query:
  function(jid, options) {
    var _p = this._p;
    var attr = {type:"get",to:jid};
    var mamAttr = {xmlns: Strophe.NS.MAM};
    var iq = $iq(attr).c("query", mamAttr);
    for (i=0; i < this._p.length; i++) {
      var pn = _p[i];
      var p = options[pn]; delete options[pn];
      if(!!p) {
				iq.c(pn).t(p).up();
      }
    }
    var onMessage = options["onMessage"]; delete options['onMessage'];
    var onComplete = options["onComplete"]; delete options['onComplete'];
    iq.cnode(new Strophe.RSM(options).toXML());
    this._c.addHandler(onMessage, Strophe.NS.MAM, "message", null);
    return this._c.sendIQ(iq, onComplete);
  },
    /* Proposed format for preferences, once implemented:
     *
     * prefs ::= Object
     * prefs.default ::= [ "always" | "never" | "roster" ]
     * prefs.always ::= Array( JID* )
     * prefs.never ::= Array( JID* )
     *
     * Example
     * setPrefs(me, {
     *  default: "roster",
     *  always: [ "alice@wonderland.lit" ],
     *  never: [ "madhatter@wonderland.lit" ]
     * });
     *
getPrefs:
  function(jid) {
  },
setPrefs:
  function(jid, prefs) {
  },
  */
});
