###
 *Plugin to implement the MUC extension.
   http://xmpp.org/extensions/xep-0045.html
 *jslint configuration:
 *global document, window, setTimeout, clearTimeout, console,
   XMLHttpRequest, ActiveXObject,
   Base64, MD5,
   Strophe, $build, $msg, $iq, $pres
###

Strophe.addConnectionPlugin 'muc'
  _connection: null
  _roomMessageHandlers: []
  _roomPresenceHandlers: []
  rooms: []
  # The plugin must have the init function
  ###Function
  Initialize the MUC plugin. Sets the correct connection object and
  extends the namesace.
  ###
  init: (conn) ->
    @_connection = conn
    # extend name space
    #   NS.MUC - XMPP Multi-user chat namespace from XEP 45.
    Strophe.addNamespace 'MUC_OWNER',     Strophe.NS.MUC+"#owner"
    Strophe.addNamespace 'MUC_ADMIN',     Strophe.NS.MUC+"#admin"
    Strophe.addNamespace 'MUC_USER',      Strophe.NS.MUC+"#user"
    Strophe.addNamespace 'MUC_ROOMCONF',  Strophe.NS.MUC+"#roomconfig"

  ###Function
  Join a multi-user chat room
  Parameters:
  (String) room - The multi-user chat room to join.
  (String) nick - The nickname to use in the chat room. Optional
  (Function) msg_handler_cb - The function call to handle messages from the
  specified chat room.
  (Function) pres_handler_cb - The function call back to handle presence
  in the chat room.
  (String) password - The optional password to use. (password protected
  rooms only)
  ###
  join: (room, nick, msg_handler_cb, pres_handler_cb, password) ->
    room_nick = @test_append_nick(room, nick)
    msg = $pres(
      from: @_connection.jid
      to: room_nick )
    .c("x", xmlns: Strophe.NS.MUC)

    if password?
      msg.cnode Strophe.xmlElement("password", [], password)

    if msg_handler_cb?
      @_roomMessageHandlers[room] = @_connection.addHandler(
        (stanza) ->
          from = stanza.getAttribute 'from'
          roomname = from.split("/")[0]
          # filter on room name
          if roomname is room
            return msg_handler_cb stanza
          else
            return true
        null
        "message" )

    if pres_handler_cb?
      @_roomPresenceHandlers[room] = @_connection.addHandler(
        (stanza) ->
          xquery = stanza.getElementsByTagName "x"
          if xquery.length > 0
            # Handle only MUC user protocol
            for x in xquery
              xmlns = x.getAttribute "xmlns"
              if xmlns and xmlns.match Strophe.NS.MUC
                return pres_handler_cb stanza
          return true
        null
        "presence" )

    @rooms[room] ?= new XmppRoom(
      @
      room
      nick
      @_roomMessageHandlers[room]
      @_roomPresenceHandlers[room]
      password )

    @_connection.send msg

  ###Function
  Leave a multi-user chat room
  Parameters:
  (String) room - The multi-user chat room to leave.
  (String) nick - The nick name used in the room.
  (Function) handler_cb - Optional function to handle the successful leave.
  (String) exit_msg - optional exit message.
  Returns:
  iqid - The unique id for the room leave.
  ###
  leave: (room, nick, handler_cb, exit_msg) ->
    @_connection.deleteHandler @_roomMessageHandlers[room]
    @_connection.deleteHandler @_roomPresenceHandlers[room]
    room_nick = @test_append_nick room, nick
    presenceid = @_connection.getUniqueId()
    presence = $pres (
      type: "unavailable"
      id: presenceid
      from: @_connection.jid
      to: room_nick )

    presence.c "status", exit_msg if exit_msg?

    if handler_cb?
      @_connection.addHandler(
        handler_cb
        null
        "presence"
        null
        presenceid )

    @_connection.send presence
    return presenceid

  ###Function
  Parameters:
  (String) room - The multi-user chat room name.
  (String) nick - The nick name used in the chat room.
  (String) message - The plaintext message to send to the room.
  (String) html_message - The message to send to the room with html markup.
  (String) type - "groupchat" for group chat messages o
                  "chat" for private chat messages
  Returns:
  msgiq - the unique id used to send the message
  ###
  message: (room, nick, message, html_message, type) ->
    room_nick = @test_append_nick(room, nick)
    type = type or if nick? then "chat" else "groupchat"
    msgid = @_connection.getUniqueId()
    msg = $msg(
      to: room_nick
      from: @_connection.jid
      type: type
      id: msgid )
    .c("body", xmlns: Strophe.NS.CLIENT)
    .t(message)
    msg.up()
    if html_message?
      msg.c("html", xmlns: Strophe.NS.XHTML_IM)
      .c("body", xmlns: Strophe.NS.XHTML)
      .h(html_message)
      if msg.node.childNodes.length is 0
        # html creation or import failed somewhere; fallback to plaintext
        parent = msg.node.parentNode
        msg.up().up()
        # get rid of the empty html element if we got invalid html
        #so we don't send an empty message
        msg.node.removeChild parent
      else
        msg.up().up()
    msg.c("x", xmlns: "jabber:x:event").c("composing")
    @_connection.send msg
    return msgid

  ###Function
  Convenience Function to send a Message to all Occupants
  Parameters:
  (String) room - The multi-user chat room name.
  (String) message - The plaintext message to send to the room.
  (String) html_message - The message to send to the room with html markup.
  Returns:
  msgiq - the unique id used to send the message
  ###
  groupchat: (room, message, html_message) ->
    @message room, null, message, html_message

  ###Function
  Send a mediated invitation.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) receiver - The invitation's receiver.
  (String) reason - Optional reason for joining the room.
  Returns:
  msgiq - the unique id used to send the invitation
  ###
  invite: (room, receiver, reason) ->
    msgid = @_connection.getUniqueId()
    invitation = $msg(
      from: @_connection.jid
      to: room
      id: msgid )
    .c('x', xmlns: Strophe.NS.MUC_USER)
    .c('invite', to: receiver)
    invitation.c 'reason', reason if reason?
    @_connection.send invitation
    return msgid

  ###Function
  Send a direct invitation.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) receiver - The invitation's receiver.
  (String) reason - Optional reason for joining the room.
  (String) password - Optional password for the room.
  Returns:
  msgiq - the unique id used to send the invitation
  ###
  directInvite: (room, receiver, reason, password) ->
    msgid = @_connection.getUniqueId()
    attrs =
      xmlns: 'jabber:x:conference'
      jid: room
    attrs.reason = reason if reason?
    attrs.password = password if password?
    invitation = $msg(
      from: @_connection.jid
      to: receiver
      id: msgid )
    .c('x', attrs)
    @_connection.send invitation
    return msgid

  ###Function
  Queries a room for a list of occupants
  (String) room - The multi-user chat room name.
  (Function) success_cb - Optional function to handle the info.
  (Function) error_cb - Optional function to handle an error.
  Returns:
  id - the unique id used to send the info request
  ###
  queryOccupants: (room, success_cb, error_cb) ->
    attrs = {xmlns: Strophe.NS.DISCO_ITEMS};
    info = $iq(
      from:this._connection.jid
      to:room
      type:'get' )
    .c('query', attrs)
    @_connection.sendIQ info, success_cb, error_cb

  ###Function
  Start a room configuration.
  Parameters:
  (String) room - The multi-user chat room name.
  (Function) handler_cb - Optional function to handle the config form.
  Returns:
  id - the unique id used to send the configuration request
  ###
  configure: (room, handler_cb) ->
    # send iq to start room configuration
    config = $iq(
      to:room
      type: "get" )
    .c("query", xmlns: Strophe.NS.MUC_OWNER)
    stanza = config.tree()
    id = @_connection.sendIQ stanza

    if handler_cb?
      @_connection.addHandler(
        (stanza) ->
          handler_cb stanza
          return false
        Strophe.NS.MUC_OWNER
        "iq"
        null
        id )

    return id

  ###Function
  Cancel the room configuration
  Parameters:
  (String) room - The multi-user chat room name.
  Returns:
  id - the unique id used to cancel the configuration.
  ###
  cancelConfigure: (room) ->
    #send iq to start room configuration
    config = $iq(
      to: room
      type: "set" )
    .c("query", xmlns: Strophe.NS.MUC_OWNER)
    .c("x", xmlns: "jabber:x:data", type: "cancel")
    stanza = config.tree()
    @_connection.sendIQ stanza

  ###Function
  Save a room configuration.
  Parameters:
  (String) room - The multi-user chat room name.
  (Array) configarray - an array of form elements used to configure the room.
  Returns:
  id - the unique id used to save the configuration.
  ###
  saveConfiguration: (room, configarray) ->
    config = $iq(
      to: room
      type: "set" )
    .c("query", xmlns: Strophe.NS.MUC_OWNER)
    .c("x", xmlns: "jabber:x:data", type: "submit")
    config.cnode(conf).up() for conf in configarray
    stanza = config.tree()
    @_connection.sendIQ stanza

  ###Function
  Parameters:
  (String) room - The multi-user chat room name.
  Returns:
  id - the unique id used to create the chat room.
  ###
  createInstantRoom: (room) ->
    roomiq = $iq(
      to: room
      type: "set" )
    .c("query", xmlns: Strophe.NS.MUC_OWNER)
    .c("x", xmlns: "jabber:x:data", type: "submit")
    @_connection.sendIQ roomiq.tree()

  ###Function
  Set the topic of the chat room.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) topic - Topic message.
  ###
  setTopic: (room, topic) ->
    msg = $msg(
      to: room
      from: @_connection.jid
      type: "groupchat" )
    .c("subject", xmlns: "jabber:client")
    .t(topic)
    @_connection.send msg.tree()

  ###Function
  Internal Function that Changes the role or affiliation of a member
  of a MUC room. This function is used by modifyRole and modifyAffiliation.
  The modification can only be done by a room moderator. An error will be
  returned if the user doesn't have permission.
  Parameters:
  (String) room - The multi-user chat room name.
  (Object) item - Object with nick and role or jid and affiliation attribute
  (String) reason - Optional reason for the change.
  (Function) handler_cb - Optional callback for success
  (Function) errer_cb - Optional callback for error
  Returns:
  iq - the id of the mode change request.
  ###
  _modifyPrivilege: (room, item, reason, handler_cb, error_cb) ->
    iq = $iq(
      to: room
      type: "set" )
    .c("query", xmlns: Strophe.NS.MUC_ADMIN)
    .cnode(item)

    iq.c("reason", reason) if reason?

    @_connection.sendIQ iq.tree(), handler_cb, error_cb

  ###Function
  Changes the role of a member of a MUC room.
  The modification can only be done by a room moderator. An error will be
  returned if the user doesn't have permission.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) nick - The nick name of the user to modify.
  (String) role - The new role of the user.
  (String) affiliation - The new affiliation of the user.
  (String) reason - Optional reason for the change.
  (Function) handler_cb - Optional callback for success
  (Function) errer_cb - Optional callback for error
  Returns:
  iq - the id of the mode change request.
  ###
  modifyRole: (room, nick, role, reason, handler_cb, error_cb) ->
    item = $build("item"
      nick: nick
      role: role )

    @_modifyPrivilege room, item, reason, handler_cb, error_cb

  kick: (room, nick, reason, handler_cb, error_cb) ->
    @modifyRole room, nick, 'none', reason, handler_cb, error_cb

  voice: (room, nick, reason, handler_cb, error_cb) ->
    @modifyRole room, nick, 'participant', reason, handler_cb, error_cb

  mute: (room, nick, reason, handler_cb, error_cb) ->
    @modifyRole room, nick, 'visitor', reason, handler_cb, error_cb

  op: (room, nick, reason, handler_cb, error_cb) ->
    @modifyRole room, nick, 'moderator', reason, handler_cb, error_cb

  deop: (room, nick, reason, handler_cb, error_cb) ->
    @modifyRole room, nick, 'participant', reason, handler_cb, error_cb

  ###Function
  Changes the affiliation of a member of a MUC room.
  The modification can only be done by a room moderator. An error will be
  returned if the user doesn't have permission.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) jid  - The jid of the user to modify.
  (String) affiliation - The new affiliation of the user.
  (String) reason - Optional reason for the change.
  (Function) handler_cb - Optional callback for success
  (Function) errer_cb - Optional callback for error
  Returns:
  iq - the id of the mode change request.
  ###
  modifyAffiliation: (room, jid, affiliation, reason, handler_cb, error_cb) ->
    item = $build("item"
      jid: jid
      affiliation: affiliation )

    @_modifyPrivilege room, item, reason, handler_cb, error_cb

  ban: (room, jid, reason, handler_cb, error_cb) ->
    @modifyAffiliation room, jid, 'outcast', reason, handler_cb, error_cb

  member: (room, jid, reason, handler_cb, error_cb) ->
    @modifyAffiliation room, jid, 'member', reason, handler_cb, error_cb

  revoke: (room, jid, reason, handler_cb, error_cb) ->
    @modifyAffiliation room, jid, 'none', reason, handler_cb, error_cb

  owner: (room, jid, reason, handler_cb, error_cb) ->
    @modifyAffiliation room, jid, 'owner', reason, handler_cb, error_cb

  admin: (room, jid, reason, handler_cb, error_cb) ->
    @modifyAffiliation room, jid, 'admin', reason, handler_cb, error_cb

  ###Function
  Change the current users nick name.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) user - The new nick name.
  ###
  changeNick: (room, user) ->
    room_nick = @test_append_nick room, user
    presence = $pres(
      from: @_connection.jid
      to: room_nick )
    .c("x", xmlns: Strophe.NS.MUC)
    @_connection.send presence.tree()

  ###Function
  Change the current users status.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) user - The current nick.
  (String) show - The new show-text.
  (String) status - The new status-text.
  ###
  setStatus: (room, user, show, status) ->
    room_nick = @test_append_nick room, user
    presence = $pres(
      from: @_connection.jid
      to: room_nick )
    presence.c('show', show).up() if show?
    presence.c('status', status) if status?
    @_connection.send presence.tree()

  ###Function
  List all chat room available on a server.
  Parameters:
  (String) server - name of chat server.
  (String) handle_cb - Function to call for room list return.
  ###
  listRooms: (server, handle_cb) ->
    iq = $iq(
      to: server
      from: @_connection.jid
      type: "get" )
    .c("query", xmlns: Strophe.NS.DISCO_ITEMS)
    @_connection.sendIQ iq, handle_cb

  test_append_nick: (room, nick) ->
    room + if nick? then "/#{Strophe.escapeNode nick}" else ""

class XmppRoom
  constructor: (@client, @name, @nick, @msg_handler_id, @pres_handler_id, @password) ->
    @name = Strophe.getBareJidFromJid name
    @client.rooms[@name] = @
    @roster = new Array()

  join: (msg_handler_cb, pres_handler_cb) ->
    @client.join(@name, @nick, null, null, password) if @client.rooms[@name]?

  leave: (handler_cb, message) ->
    @client.leave @name, @nick, handler_cb, message
    @client.rooms[@name] = null

  message: (nick, message, html_message, type) ->
    @client.message @name, nick, message, html_message, type

  groupchat: (message, html_message) ->
    @client.groupchat @name, message, html_message

  invite: (receiver, reason) ->
    @client.invite @name, receiver, reason

  directInvite: (receiver, reason) ->
    @client.directInvite @name, receiver, reason, @password

  configure: (handler_cb) ->
    @client.configure @name, handler_cb

  cancelConfigure: ->
    @client.cancelConfigure @name

  saveConfiguration: (configarray) ->
    @client.saveConfiguration @name, configarray

  setTopic: (topic) ->
    @client.setTopic @name, topic

  modifyUser: (nick, role, affiliation, reason) ->
    @client.modifyUser @name, nick, affiliation, reason

  changeNick: (@nick) ->
    @client.changeNick @name, nick

  setStatus: (show, status) ->
    @client.setStatus @name, @nick, show, status

class RoomConfig

  constructor: (info) ->
    @parse info if info?

  parse: (result) =>
    query = result.getElementsByTagName("query")[0].children
    @identities =  []
    @features =  []
    @x = []
    for child in query
      attrs = child.attributes
      switch child.nodeName
        when "identity"
          identity = {}
          identity[attr.name] = attr.textContent for attr in attrs
          @identities.push identity
        when "feature"
          @features.push attrs.var.textContent
        when "x"
          attrs = child.children[0].attributes
          break if ((not attrs.var.textContent is 'FORM_TYPE') or (not attrs.type.textContent is 'hidden'))
          for field in child.children when not field.attributes.type
            attrs = field.attributes
            # @x[attrs.var.textContent.split("#")[1]] =
            @x.push (
              var: attrs.var.textContent
              label: attrs.label.textContent or ""
              value: field.firstChild.textContent or "" )

    "identities": @identities, "features": @features, "x": @x

