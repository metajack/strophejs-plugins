# This program is distributed under the terms of the MIT license.
# Copyright 2012 (c) Markus Kohlhase <mail@markus-kohlhase.de>

JOAP_NS = "jabber:iq:joap"
conn = null

class JOAPError extends Error

  constructor: (@message, @code)->
    @name = "JOAPError"

class Server

  constructor: (@service) ->

  @onError: (cb=->) -> (iq) ->
    err = iq.getElementsByTagName("error")?[0]
    cb iq, new JOAPError err?.textContent err?.getAttribute "code"

  @addXMLAttributes: (iq, attrs) ->
    if typeof attrs is "object"
      for k,v of attrs
        iq.c("attribute")
          .c("name").t(k).up()
          .cnode(conn.rpc._convertToXML v).up().up()

  @parseAttributes: (iq) ->
    attrs = iq.getElementsByTagName("attribute")
    data = {}
    for a in attrs
      key   = a.getElementsByTagName("name")[0].textContent
      data[key] = conn.rpc._convertFromXML a.getElementsByTagName("value")[0]
    data

  @parseNewAddress: (iq) ->
    console.log "parse address"
    address = iq.getElementsByTagName("newAddress")[0].textContent
    console.log address
    address.split("/")[1]

  @parseSearch: (iq) ->
    items = iq.getElementsByTagName("item")
    (i.textContent.split('/')[1] for i in items)

  @parseAttributeDescription: (d) ->
    name: d.getElementsByTagName("name")[0]?.textContent
    type: d.getElementsByTagName("type")[0]?.textContent
    desc: Server.parseDesc d.getElementsByTagName("desc")

  @parseMethodDescription: (d) ->
    name: d.getElementsByTagName("name")[0]?.textContent
    returnType: d.getElementsByTagName("returnType")[0]?.textContent
    desc: Server.parseDesc d.getElementsByTagName("desc")

  @parseDesc: (desc) ->
    res = {}
    if desc instanceof NodeList
      for c in desc
        res[c.getAttribute "xml:lang"] = c.textContent
    else
      res.desc[desc.getAttribute "xml:lang"] = desc.textContent
    res

  @parseDescription: (iq) ->
    result = desc: {}, attributes: {}, methods: {}, classes: []
    describe = iq.getElementsByTagName("describe")[0]
    for c in describe.childNodes
      switch c.tagName.toLowerCase()
        when "desc"
          result.desc[c.getAttribute "xml:lang"] = c.textContent
        when "attributedescription"
          ad = Server.parseAttributeDescription c
          result.attributes[ad.name] = ad
        when "methoddescription"
          md = Server.parseMethodDescription c
          result.methods[md.name] = md
        when "superclass"
          result.superclass = c.textContent
        when "timestamp"
          result.timestamp = c.textContent
        when "class"
          classes.push = c.textContent
    result

  sendRequest: (type, clazz, cb, opt={}) ->
    iq = @createIq type, clazz, opt.instance
    opt.beforeSend? iq
    success = (res) -> cb? res, null, opt.onResult?(res)
    conn.sendIQ iq, success, Server.onError(cb)

  createIq: (type, clazz, instance) ->
    iqType = "set"
    iqType = "get" if (type in ["read", "search", "describe"])
    $iq(to: @getAddress(clazz, instance), type: iqType)
      .c(type, xmlns: JOAP_NS)

  getAddress: (clazz, instance) ->
    addr = ""
    addr += "#{clazz}@" if clazz if typeof clazz is "string"
    addr += @service
    addr += "/#{instance}" if typeof instance is "string"
    addr

  describe: (clazz, instance, cb) ->
    if typeof clazz is "function"
      cb = clazz
      clazz = instance = null
    else if typeof instance is "function"
      cb = instance
      instance = null
    @sendRequest "describe", clazz, cb,
      instance: instance
      onResult: Server.parseDescription

  add: (clazz, attrs, cb) ->
    cb = attrs if typeof attrs is "function"
    @sendRequest "add", clazz, cb,
      beforeSend: (iq) -> Server.addXMLAttributes iq, attrs
      onResult: Server.parseNewAddress

  read: (clazz, instance, limits, cb) ->
    cb = limits if typeof limits is "function"
    @sendRequest "read", clazz, cb,
      instance: instance
      beforeSend: (iq) -> if limits instanceof Array
        iq.c("name").t(l).up() for l in limits
      onResult: Server.parseAttributes

  edit: (clazz, instance, attrs, cb) -> @sendRequest "edit", clazz, cb,
    instance: instance
    beforeSend: (iq) -> Server.addXMLAttributes iq, attrs
    onResult: Server.parseAttributes

  delete: (clazz, instance, cb) -> @sendRequest "delete", clazz, cb,
    instance: instance

  search: (clazz, attrs, cb) ->
    cb = attrs if typeof attrs is "function"
    @sendRequest "search", clazz, cb,
      beforeSend: (iq) -> Server.addXMLAttributes iq, attrs
      onResult: Server.parseSearch

Strophe.addConnectionPlugin 'joap', do ->

  getObjectServer = (service) -> new Server service
  init = (c) ->
    conn = c
    Strophe.addNamespace "JOAP", JOAP_NS

    if not conn.hasOwnProperty "disco"
      Strophe.warn "You need the discovery plugin to have JOAP fully implemented."
    else
      conn.disco.addIdentity "automation", "joap"
      conn.disco.addFeature Strophe.NS.JOAP

  # public API
  init: init
  getObjectServer: getObjectServer
  JOAPError: JOAPError
