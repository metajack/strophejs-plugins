###
Plugin to implement the vCard extension.
http://xmpp.org/extensions/xep-0054.html

Author: Nathan Zorn (nathan.zorn@gmail.com)
CoffeeScript port: Andreas Guth (guth@dbis.rwth-aachen.de)

###
### jslint configuration: ###
### global document, window, setTimeout, clearTimeout, console,
    XMLHttpRequest, ActiveXObject,
    Base64, MD5,
    Strophe, $build, $msg, $iq, $pres
###
buildIq = (type, jid, vCardEl) ->
    iq = $iq if jid then type:type, to:jid else type:type
    iq.c "vCard", xmlns:Strophe.NS.VCARD
    iq.cnode vCardEl if vCardEl
    iq

Strophe.addConnectionPlugin 'vcard',
    _connection: null
    # Called by Strophe.Connection constructor
    init: (conn) ->
        this._connection = conn
        Strophe.addNamespace 'VCARD', 'vcard-temp'

    ###Function
      Retrieve a vCard for a JID/Entity
      Parameters:
      (Function) handler_cb - The callback function used to handle the request.
      (String) jid - optional - The name of the entity to request the vCard
         If no jid is given, this function retrieves the current user's vcard.
    ###
    get: (handler_cb, jid, error_cb) ->
        iq = buildIq "get", jid
        this._connection.sendIQ iq, handler_cb, error_cb

    ### Function
        Set an entity's vCard.
    ###
    set: (handler_cb, vCardEl, jid, error_cb) ->
        iq = buildIq "set", jid, vCardEl
        this._connection.sendIQ iq, handler_cb, error_cb
