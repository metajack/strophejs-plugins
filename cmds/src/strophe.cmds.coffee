CMD = "http://jabber.org/protocol/commands"

create = (node, callback=Strophe.Disco.noop) ->
  switch node
    when "getUrls" then new CommandNode item: "url", node: "getUrls", name: "Retrieve Urls", callback: callback
    when "setUrls" then new CommandNode item: "url", node: "setUrls", name: "Sets Urls", callback: callback
    else throw "Strophe.Commands has no implementation for: #{node}"

createExecIQ = (opt) ->

  iq = $iq { to: opt.jid, type: "set" }

  cfg =
    xmlns: CMD,
    node: opt.node,

  cfg.action = opt.action or "execute"
  cfg.sessionid = opt.sid if opt.sid

  iq.c "command", cfg

  if $.isArray opt.data
    iq.c(opt.item[0].item).t(item).up() for i,item of opt.data
  iq

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

class RemoteCommand

  constructor: (@conn, @jid, @node) ->
    @executeAction = "execute"
    @actions = []
    @sessionid = null
    @data = null
    @form = null
    @status = null

  parseCmdResult: (res) ->
    cmd = ($ res).find "command"
    @sessionid = cmd.attr "sessionid"
    @stauts = cmd.attr "status"
    actions = cmd.find "actions"
    @execueAction = actions.attr "execute"
    @actions = (a.nodeName for a in actions)
    @form = cmd.find "x"

  onSuccess: (res) ->

  onError: (res) ->

  execute: ->
    @conn.cmds.execute @jid, @node,
      success: @parseCmdResult
      error: @onError

  next: (responseForm) ->
    @conn.cmds.execute @jid, @node,
      action: "next"
      success: @parseCmdResult
      error: @onError

  prev: ->
    @conn.cmds.execute @jid, @node,
      action: "prev"
      success: @parseCmdResult
      error: @onError

  complete: (responseForm) ->
    @conn.cmds.execute @jid, @node,
      action: "complete"
      success: @onSuccess
      error: @onError

  cancel: ->
    @conn.cmds.execute @jid, @node,
      action: "cancel"
      success: @onSuccess
      error: @onError

  isValidAction: (action) -> (action in @actions)

  toIQ: -> createExecIQ { @jid, @node, @action, @sessionid, @data }

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
    console.warn @fn
    res = @res
    item = @item
    res.attrs status: "completed"
    res.c(item).t(entry).up() for i, entry of obj if $.isArray(obj)
    @fn.call @, res

Strophe.Commands =
  CommandNode: CommandNode
  RemoteCommand: RemoteCommand
  create: create

Strophe.addConnectionPlugin "cmds", do ->

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

  statusChanged = (status, condition) ->
    conn.addHandler reply.bind(@), CMD, "iq", "set"  if status is Strophe.Status.CONNECTED

  execute = (jid, node, opt={}) ->

    iq = createExecIQ
      jid: jid
      node: node
      action: opt.action
      sessionid: opt.sid
      data: opt.data
      item: $.grep(cmds.items, (n) -> n.node is node)

    noop = Strophe.Disco.noop
    conn.sendIQ iq, opt.success or noop, opt.error or noop

  # public API
  init: init
  statusChanged: statusChanged
  add: add
  execute:execute
  exec:execute
