create = (node, callback=Strophe.Disco.noop) ->
  switch node
    when "getUrls" then new CommandNode item: "url", node: "getUrls", name: "Retrieve Urls", callback: callback
    when "setUrls" then new CommandNode item: "url", node: "setUrls", name: "Sets Urls", callback: callback
    else throw "Strophe.Commands has no implementation for: #{node}"

# we have to overrite reply, because we pass in the callback fn form
# node requests handler, we can only send a response
# once our cmd callback has returned 
Strophe.Disco.DiscoNode::reply = (iq, fn) ->
  req = @parseRequest(iq)
  res = @fromTo(req)
  @fn = fn
  @addFirstChild req, res
  @addContent req, res
  res

class CommandNode extends Strophe.Disco.DiscoNode

  constructor: (cfg) -> @[k] = v for k,v of cfg

  send: -> $iq {}

  callback: (onSucces, onError) -> @onSuccess {}

  addContent: (req, res) ->
    @req = req
    @res = res
    @callback.call @, @onSuccess.bind(@), @onError.bind(@)

  onError: ->
    res.attrs status: "error"
    @fn.call @, res

  onSuccess: (obj) ->
    res = @res
    item = @item
    res.attrs status: "completed"
    res.c(item).t(entry).up() for i, entry of obj if $.isArray(obj)
    @fn.call @, res
  
Strophe.Commands = CommandNode: CommandNode, create: create

Strophe.addConnectionPlugin "cmds", do ->

  CMD = "http://jabber.org/protocol/commands"
  conn = cmds = null

  init = (c) ->
    conn = c
    Strophe.addNamespace "COMMANDS", CMD
    cmds = conn.disco.features[CMD] = { items: [] }
    
  add = (item) ->
    throw "command needs a node" unless item.node
    item.jid = conn.jid unless item.jid
    cmds.items.push new CommandNode item

  reply = (iq) ->
    node = ($ "command", iq).attr("node")
    n = $.grep(cmds.items, (n) -> n.node is node)
    if n.length is 0
      nodeImpl = new DiscoNodeNotFound
      conn.send nodeImpl.reply iq
    else
      nodeImpl = n[0]
      nodeImpl.reply(iq, (res) => conn.send res)
    true

  request = (conn, jid, node, args) ->
    iq = $iq { to: jid, type: "set" }
    iq.c "command", xmlns: CMD, node: node, action: "execute"
    data = $.grep($.makeArray(args), (arg) -> $.isArray arg)
    conn.sendIQ iq

  statusChanged = (status, condition) ->
    conn.addHandler reply.bind(@), CMD, "iq", "set"  if status is Strophe.Status.CONNECTED
    
  execute = (jid, node, data, onSuccess, onError) ->
    n = $.grep(cmds.items, (n) -> n.node is node)
    iq = $iq { to: jid, type: "set" }
    iq.c "command", xmlns: CMD, node: node, action: "execute"
    if $.isArray data
      iq.c(n[0].item).t(item).up() for i,item of data
    else
      onSuccess = data
      onError = onSuccess
    noop = Strophe.Disco.noop
    conn.sendIQ iq, onSuccess or noop, onError or noop
  
  # public API
  init: init
  statusChanged: statusChanged
  add: add
  execute:execute
