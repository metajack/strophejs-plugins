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
    init: function (conn) {
        this._c = conn;
        Strophe.addNamespace('MAM', 'urn:xmpp:mam:0');
    },
    query: function (jid, options) {
        var _p = this._p;
        var attr = {
            type:"set",
            id:jid
        };
        var mamAttr = {xmlns: Strophe.NS.MAM};
        var iq = $iq(attr).c("query", mamAttr).c('x',{xmlns:'jabber:x:data'});

        iq.c('field',{var:"FORM_TYPE"}).c('value').t("urn:xmpp:mam:0").up().up();
        for (i = 0; i < this._p.length; i++) {
            var pn = _p[i];
            var p = options[pn];
            delete options[pn];
            if (!!p) {
                var f
                iq.c('field',{var:pn}).c('value').t(p).up().up();
            }
        }
        iq.up();

        var onMessage = options["onMessage"];
        delete options['onMessage'];
        var onComplete = options["onComplete"];
        delete options['onComplete'];
        iq.cnode(new Strophe.RSM(options).toXML());

        this._c.addHandler(onMessage, Strophe.NS.MAM, "message", null);
        return this._c.sendIQ(iq, onComplete);
    }
});
