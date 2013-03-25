/*global Strophe $iq $ */
/*

  (c) 2013 - Arlo Breault <arlolra@gmail.com>
  Freely distributed under the MPL v2.0 license.

  File: strophe.si-filetransfer.js
  XEP-0096: SI File Transfer
  http://xmpp.org/extensions/xep-0096.html

*/

;(function () {
  "use strict";

  function noop() {}
  
  function inVals(stanza, ns) {
    var ok = false;
    var $mthds = $('si feature x field[var="stream-method"] value', stanza);
    $mthds.each(function (i, m) {
      if ($(m).text() === ns) ok = true;
    });
    return ok;
  }

  Strophe.addConnectionPlugin('si_filetransfer', {
    
    _c: null,
    _cb: null,

    init: function (c) {  

      this._c = c;

      Strophe.addNamespace('SI', 'http://jabber.org/protocol/si');
      Strophe.addNamespace('SI_FILE_TRANSFER',
        Strophe.NS.SI + '/profile/file-transfer');
      Strophe.addNamespace('FEATURE_NEG',
        'http://jabber.org/protocol/feature-neg');

      c.addHandler(this._receive.bind(this), Strophe.NS.SI, 'iq', 'set');

    },

    _receive: function (m) {

      var $m = $(m);
      var from = $m.attr('from');
      var id = $m.attr('id')
      var sid = $('si', $m).attr('id');

      var iq = $iq({
        type: 'result',
        to: from,
        id: id
      }).c('si', {
        xmlns: Strophe.NS.SI,
        id: sid
      }).c('file', {
        xmlns: Strophe.NS.SI_FILE_TRANSFER
      }).up().c('feature', {
        xmlns: Strophe.NS.FEATURE_NEG  
      }).c('x', {
        xmlns: 'jabber:x:data',
        type: 'submit'
      }).c('field', {
        'var': 'stream-method'
      });

      // check for In-Band Bytestream plugin
      // and IBB accepted
      if ( Object.hasOwnProperty.call(this._c, 'ibb') &&
           inVals(m, Strophe.NS.IBB)
      ) iq.c('value').t(Strophe.NS.IBB);

      this._send(iq, noop, noop);

      var $file = $('file', $m);
      var filename = $file.attr('name');
      var size = $file.attr('size'); 
      var mime = $('si', $m).attr('mime-type');

      // callback message
      if (typeof this._cb === 'function') {
        this._cb(from, sid, filename, size, mime);
      }

      return true;

    },

    _success: function (cb, stanza) {
      var err;

      // search for ibb
      if (!inVals(stanza, Strophe.NS.IBB))
        err = new Error('In-Band Bytestream not supported');

      cb(err);
    },

    _fail: function (cb, stanza) {
      var err = 'timed out';
      if (stanza) err = stanza;
      cb(new Error(err));
    },

    _send: function (iq, success, fail) {
      this._c.sendIQ(iq, success, fail, 60 * 1000);
    },

    send: function (to, sid, filename, size, mime, cb) {

      // check for In-Band Bytestream plugin
      if (!Object.hasOwnProperty.call(this._c, 'ibb')) {
        Strophe.warn('The In-Band Bytestream plugin is required.');
        return;
      }

      var iq = $iq({
        type: 'set',
        to: to,
        id: this._c.getUniqueId('si-filetransfer')
      }).c('si', {
        xmlns: Strophe.NS.SI,
        id: sid,
        profile: Strophe.NS.SI_FILE_TRANSFER,
        'mime-type': mime
      }).c('file', {
        xmlns: Strophe.NS.SI_FILE_TRANSFER,
        name: filename,
        size: size
      }).up().c('feature', {
        xmlns: Strophe.NS.FEATURE_NEG
      }).c('x', {
        xmlns: 'jabber:x:data',
        type: 'form'
      }).c('field', {
        'var': 'stream-method',
        type: 'list-single'
      }).c('option')
        .c('value')
        .t(Strophe.NS.IBB);

      this._send(iq,
        this._success.bind(this, cb),
        this._fail.bind(this, cb)
      );

    },

    addFileHandler: function (fn) {
      this._cb = fn;
    }

  });

}());