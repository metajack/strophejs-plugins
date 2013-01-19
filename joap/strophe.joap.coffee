###
This program is distributed under the terms of the MIT license.
Copyright 2012 - 2013 (c) Markus Kohlhase <mail@markus-kohlhase.de>
###

JOAP_NS = "jabber:iq:joap"
RPC_NS  = "jabber:iq:rpc"

# Private static members

conn = null

onError = (cb=->) -> (iq) ->
  err = iq.getElementsByTagName("error")[0]
  if err?
    code = err.getAttribute("code") * 1
    msg  = err.textContent
    msg = "JOAP server is unavailable" if code is 503
    cb iq, new JOAPError msg, code
  else
    cb iq, new JOAPError "Unknown error"

addXMLAttributes = (iq, attrs) ->
  return if not attrs?
  if attrs instanceof Array
    return console?.warn? "No attributes added: attribute parameter is not an object"
  else if typeof attrs is "object"
    for k,v of attrs
      iq.c("attribute")
        .c("name").t(k).up()
        .cnode(conn.rpc._convertToXML v).up().up()

addRPCElements = (iq, method, params=[]) ->
  throw new TypeError unless typeof method is "string"
  iq.c("methodCall").c("methodName").t(method).up()
  if not (params instanceof Array)
    console?.warn? "No parameters added: parameter is not an array"
    return
  if params.length > 0
    iq.c("params")
    for p in params
      iq.c("param")
        .cnode(conn.rpc._convertToXML p).up().up()

parseAttributes = (iq) ->
  attrs = iq.getElementsByTagName("attribute")
  data = {}
  for a in attrs
    key   = a.getElementsByTagName("name")[0].textContent
    data[key] = conn.rpc._convertFromXML a.getElementsByTagName("value")[0]
  data

parseRPCParams = (iq) ->
  conn.rpc._convertFromXML iq
    .getElementsByTagName("param")[0]
    .getElementsByTagName("value")[0]

parseNewAddress = (iq) ->
  a = iq.getElementsByTagName("newAddress")[0]
  if a? then new JID(a.textContent).toString()
  else undefined

parseSearch = (iq) ->
  items = iq.getElementsByTagName("item")
  (new JID(i.textContent).toString() for i in items)

parseAttributeDescription = (d) ->
  name: d.getElementsByTagName("name")[0]?.textContent
  type: d.getElementsByTagName("type")[0]?.textContent
  desc: parseDesc d.getElementsByTagName("desc")

parseMethodDescription = (d) ->
  name: d.getElementsByTagName("name")[0]?.textContent
  returnType: d.getElementsByTagName("returnType")[0]?.textContent
  desc: parseDesc d.getElementsByTagName("desc")

parseDesc = (desc) ->
  res = {}
  if desc instanceof NodeList
    for c in desc
      res[c.getAttribute "xml:lang"] = c.textContent
  else
    res.desc[desc.getAttribute "xml:lang"] = desc.textContent
  res

parseDescription = (iq) ->
  result = desc: {}, attributes: {}, methods: {}, classes: []
  describe = iq.getElementsByTagName("describe")[0]
  if describe?
   for c in describe.childNodes
     switch c.tagName.toLowerCase()
       when "desc"
         result.desc[c.getAttribute "xml:lang"] = c.textContent
       when "attributedescription"
         ad = parseAttributeDescription c
         result.attributes[ad.name] = ad
       when "methoddescription"
         md = parseMethodDescription c
         result.methods[md.name] = md
       when "superclass"
         result.superclass = new JID(c.textContent).toString()
       when "timestamp"
         result.timestamp = c.textContent
       when "class"
         classes.push = c.textContent
  result

getAddress = (clazz, service, instance) ->
  (new JID clazz, service, instance).toString()

createIq = (type, to) ->
  iqType = if (type in ["read", "search", "describe"]) then "get" else "set"
  xmlns  = if type is "query" then RPC_NS else JOAP_NS
  $iq(to: to, type: iqType)
    .c(type, xmlns: xmlns)

sendRequest = (type, to, cb, opt={}) ->
  iq = createIq type, to
  opt.beforeSend? iq
  success = (res) -> cb? res, null, opt.onResult?(res)
  conn.sendIQ iq, success, onError(cb)

describe = (id, cb) ->
  sendRequest "describe", id, cb,
    onResult: parseDescription

read = (instance, limits, cb) ->
  if typeof limits is "function"
    cb = limits; limits = null
  sendRequest "read", instance, cb,
    beforeSend: (iq) -> if limits instanceof Array
      iq.c("name").t(l).up() for l in limits
    onResult: parseAttributes

add = (clazz, attrs, cb) ->
  cb = attrs if typeof attrs is "function"
  sendRequest "add", clazz, cb,
    beforeSend: (iq) -> addXMLAttributes iq, attrs
    onResult: parseNewAddress

edit = (instance, attrs, cb) ->
  sendRequest "edit", instance, cb,
    beforeSend: (iq) -> addXMLAttributes iq, attrs
    onResult: parseNewAddress

search = (clazz, attrs, cb) ->
  if typeof attrs is "function"
    cb = attrs; attrs=null
  sendRequest "search", clazz, cb,
    beforeSend: (iq) -> addXMLAttributes iq, attrs
    onResult: parseSearch

searchAndRead = (clazz, attrs, limits, cb) ->
  if typeof limits is "function"
    cb = limits; limits = null
  if typeof attrs is "function" and not limits?
    cb = attrs; attrs = null
  else if attrs instanceof Array and not limits?
    limits = attrs; attrs = null
  search clazz, attrs, (iq, err, res) ->
    if err?
      cb err
    else
      objects = []
      count   = res.length
      if count > 0
        readCB  = (iq, err, o) ->
          if err?
            cb err
          else
            count--
            objects.push o
            cb null, objects if count is 0
        for id in res then do (id) -> read id, limits, readCB
      else
        cb null, objects

del = (instance, cb) ->
  sendRequest "delete", instance, cb

methodCall = (method, address, params, cb) ->
  sendRequest "query", address, cb,
    beforeSend: (iq) -> addRPCElements iq, method, params
    onResult: parseRPCParams

class JOAPError extends Error

  constructor: (@message, @code)->
    @name = "JOAPError"

class JOAPServer

  constructor: (service) ->
    @jid = new JID service

  describe: (clazz, instance, cb) ->
    if typeof clazz is "function"
      cb = clazz; clazz = instance = null
    else if typeof instance is "function"
      cb = instance; instance = null
    describe getAddress(clazz, @jid.domain, instance), cb

  add: (clazz, attrs, cb) ->
    add getAddress(clazz, @jid.domain), attrs, cb

  read: (clazz, instance, limits, cb) ->
    read getAddress(clazz, @jid.domain, instance), limits, cb

  edit: (clazz, instance, attrs, cb) ->
    edit getAddress(clazz, @jid.domain, instance), attrs, cb

  delete: (clazz, instance, cb) ->
    del getAddress(clazz, @jid.domain, instance), cb

  search: (clazz, attrs, cb) ->
    search getAddress(clazz, @jid.domain), attrs, cb

  searchAndRead: (clazz, attrs, limits, cb) ->
    searchAndRead getAddress(clazz, @jid.domain), attrs, limits, cb

  methodCall: (method, clazz, instance, params, cb) ->
    if typeof clazz is "function"
      cb = clazz; clazz = instance = params = null
    else if typeof instance is "function"
      cb = instance; instance = params = null
    else if typeof params is "function"
      cb = params; params = null
    methodCall method, getAddress(clazz, @jid.domain, instance), params, cb

class JOAPObject

  constructor: (id) ->
    @jid = new JID id

  read: (limits, cb) -> read @jid.toString(), limits, cb

  edit: (attrs, cb) -> edit @jid.toString(), attrs, cb

  describe: (cb) -> describe @jid.toString(), cb

  methodCall: (method, params, cb) ->
    if typeof params is "function"
      cb = params; params = null
    methodCall method, @jid.toString(), params, cb

class JOAPClass

  constructor: (id) ->
    @jid = new JID id

  describe: (instance, cb) ->
    if typeof instance is "function"
      cb = instance
      instance = null
    describe getAddress(@jid.user, @jid.domain, instance), cb

  add: (attrs, cb) ->
    add getAddress(@jid.user, @jid.domain), attrs, cb

  read: (instance, limits, cb) ->
    read getAddress(@jid.user, @jid.domain, instance), limits, cb

  edit: (instance, attrs, cb) ->
    edit getAddress(@jid.user, @jid.domain, instance), attrs, cb

  delete: (instance, cb) ->
    del getAddress(@jid.user, @jid.domain, instance), cb

  search: (attrs, cb) ->
    search getAddress(@jid.user, @jid.domain), attrs, cb

  searchAndRead: (attrs, limits, cb) ->
    searchAndRead getAddress(@jid.user, @jid.domain), attrs, limits, cb

  methodCall: (method, instance, params, cb) ->
    if typeof instance is "function"
      cb = instance; instance = params = null
    else if typeof params is "function"
      cb = params; params = null
    methodCall method, getAddress(@jid.user, @jid.domain, instance), params, cb

Strophe.addConnectionPlugin 'joap', do ->

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
  describe: describe
  add: add
  read: read
  edit: edit
  delete: del
  search: search
  searchAndRead: searchAndRead
  methodCall: methodCall
  JOAPError: JOAPError
  JOAPServer: JOAPServer
  JOAPObject: JOAPObject
  JOAPClass: JOAPClass
