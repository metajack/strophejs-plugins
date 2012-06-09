# This plugin is distributed under the terms of the MIT licence.
# Please see the LICENCE file for details.
#
# Copyright (c) Markus Kohlhase, 2011 - 2012

# A Strophe plugin for ( http://xmpp.org/extensions/xep-0115.html )

# NOTE: This plugin has following dependencies:
#
# - strophe.caps.js
# - strophe.pubsub.js

Strophe.addConnectionPlugin 'pep', (->

  conn = null

  init = (c) ->
    conn = c
    if conn.caps is undefined
      throw new Error "caps plugin required!"
    if conn.pubsub is undefined
      throw new Error "pubsub plugin required!"

  subscribe = (node, handler) ->

    # add implicit subscription
    conn.caps.addFeature node
    conn.caps.addFeature "#{node}+notify"
    conn.addHandler handler, Strophe.NS.PUBSUB_EVENT, "message", null, null, null
    conn.caps.sendPres()

  unsubscribe = (node) ->

    # remove implicit subscription
    conn.caps.removeFeature node
    conn.caps.removeFeature "#{node}+notify"
    conn.caps.sendPres()

  # Publish and item to the given pubsub node.
  # Parameters:
  # (String) node         - The name of the pubsub node.
  # (Array) items         - The list of items to be published.
  # (Function) callback   - Used to determine if node creation was sucessful.
  publish = (node, items, callback) ->

    # there are some problems with the pubsub plugin (see #71),
    # so just build the iq stanza manually
    iqid = conn.getUniqueId "pubsubpublishnode"
    conn.addHandler callback, null, 'iq', null, iqid, null
    conn.send $iq({from:conn.jid,type:'set', id:iqid})
      .c('pubsub', { xmlns:Strophe.NS.PUBSUB })
      .c('publish', { node:node, jid:conn.jid })
      .list('item', items)
      .tree()
    iqid

  # Public API
  init: init
  publish: publish
  subscribe: subscribe
  unsubscribe: unsubscribe

)()
