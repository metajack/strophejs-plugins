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

  else if opt.form
    iq.cnode opt.form.toXML()
  iq

class RemoteCommand

  constructor: (@conn, @jid, @node) ->
    @executeAction = "execute"
    @actions = []
    @sessionid = null
    @data = null
    @form = null
    @resonseForm = null
    @status = null
    @error = null

  _parseResult: (res) ->
    cmd = ($ res).find "command"
    @sessionid = cmd.attr "sessionid"
    @status = cmd.attr "status"
    @_parseActions cmd
    @_parseResultForm cmd
    @_parseError res

  _parseActions: (cmd) ->
    actions = cmd.find "actions"
    if actions.length > 0
      @executeAction = actions.attr "execute"
      @actions = (a.nodeName for a in actions.children())

  _parseResultForm:(cmd) ->
    x = cmd.find "x"
    if x.length > 0
      @form = Strophe.x.Form.fromXML x
    else
      @form = null

  _parseError: (res) ->
    res = $ res
    err = res.find "error"
    if err.length > 0
      @error =
        code: err.attr "code"
        type: err.attr "type"
        conditions: ( e.nodeName for e in err.children())
    else
      @error = null

  _parseSubmitFormFromHTML: (html) ->
    form = Strophe.x.Form.fromHTML html
    form.type = "submit"
    for f in form.fields
      f.options = []
      f.required = false
    form

  _createFn: (action, div, opt) ->

    close = -> div.dialog "close"
    switch action.toLowerCase()

      when "next" then =>
        close()
        opt.responseForm = @_parseSubmitFormFromHTML div
        @next opt

      when "prev" then =>
        close()
        @prev opt

      when "complete" then =>
        close()
        opt.responseForm = @_parseSubmitFormFromHTML div
        @complete opt

      when "cancel" then =>
        close()
        @cancel opt

      else =>

  openDialog: (opt) =>

    throw new Error "jQuery dialog is not available" unless $.fn.dialog

    if @form
      actions = {}
      div = $ @form.toHTML()
      actions[a] = @_createFn a, div, opt for a in @actions

      div.find("h1").remove()
      div.dialog
        autoOpen: true
        modal: true
        title: @form.title
        buttons: actions

  onSuccess: (res, cmd) ->

  onError: (res, cmd) ->
    if console and cmd.error
      console.error """could not exectute command.
        Error:
          Type: #{ cmd.error.type },
          Code: #{ cmd.error.code },"
          Conditions: #{ cmd.error.conditions.join ',' }"""

  _exec: (opt) ->
    if opt.gui is true
      opt.success = (res, cmd) ->
        cmd.openDialog opt

    @conn.cmds.execute @jid, @node,
      success: (res) =>
        @_parseResult res
        if opt.success
          opt.success res, @
        else
          @onSuccess res, @
      error: (res) =>
        @_parseResult res
        if opt.error
          opt.error res, @
        else
          @onError res, @
      sid: @sessionid
      action: @executeAction
      form: @responseForm

  execute: (opt) -> @_exec opt

  next: (opt) ->
    @responseForm = opt.responseForm if opt.responseForm
    @executeAction = "next"
    @_exec opt

  prev: (opt)->
    @executeAction = "prev"
    @_exec opt

  complete: (opt) ->
    @responseForm = opt.responseForm if opt.responseForm
    @executeAction = "complete"
    @_exec opt

  cancel: (opt)->
    @executeAction = "cancel"
    @_exec opt

  isValidAction: (action) -> (action in @actions)

  toIQ: -> createExecIQ { @jid, @node, @action, @sessionid, @data }

class CommandNode extends Strophe.Disco.DiscoNode

  constructor: (cfg) -> @[k] = v for k,v of cfg

  onError: ->
    res.attrs status: "error"
    @fn.call @, res

  onSuccess: (obj) ->
    res = @res
    item = @item
    res.attrs status: "completed"
    res.c(item).t(entry).up() for i, entry of obj if $.isArray(obj)
    conn.send res

  reply: (iq, callback) ->
    req = @parseRequest(iq)
    res = @fromTo(req)
    @addFirstChild req, res
    if callback
      callback req, res
    else
      res.attrs status: "completed"
    res

Strophe.Commands =
  CommandNode: CommandNode
  RemoteCommand: RemoteCommand
  create: create

Strophe.addConnectionPlugin "cmds",
  _conn: null

  init: (c) ->
    conn = c
    @_conn = conn
    @_command_handlers = {}
    Strophe.addNamespace "COMMANDS", CMD
    conn.disco.addNode Strophe.NS.COMMANDS, items:[]
    @_cmds = conn.disco.features[CMD]

    @_command_handler = @_conn.addHandler(
      (iq) =>
        node = ($ "command", iq).attr("node")
        n = $.grep(@_cmds.items, (n) -> n.node is node)
        if n.length is 0
          nodeImpl = new DiscoNodeNotFound
          @_conn.send nodeImpl.reply iq
        else
          cb = @_command_handlers[node] or null
          nodeImpl = n[0]
          @_conn.send nodeImpl.reply(iq, cb)
        true
      CMD
      "iq"
      "set")

  add: (item, callback) ->
    throw "command needs a node" unless item.node
    item.jid = @_conn.jid unless item.jid
    @_cmds.items.push new CommandNode item
    @_command_handlers[item.node] = callback

  execute: (jid, node, opt={}) ->

    iq = createExecIQ
      jid: jid
      node: node
      action: opt.action
      sid: opt.sid
      data: opt.data
      form: opt.form
      item: $.grep(@_cmds.items, (n) -> n.node is node)

    noop = Strophe.Disco.noop
    @_conn.sendIQ iq, opt.success or noop, opt.error or noop
