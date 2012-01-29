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
    rsg = $pres(
      from: @_connection.jid
      to: room_nick)
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

    presence.c "status", exit_msg if exit_msg

    if handler_cb?
      @_connection.addHandler(
        handler_cb,
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
      .h html_message
      if msg.node.childNodes.length is 0
        # html creation or import failed somewhere; fallback to plaintext
        parent = msg.node.parentNode
        msg.up().up()
        # get rid of the empty html element if we got invalid html
        #so we don't send an empty message
        msg.node.removeChild(parent)
      else
        msg.up().up()
    msg.c("x", xmlns: "jabber:x:event").c "composing"
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
    .c 'invite', to: receiver
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
    .c 'x', attrs
    @_connection.send invitation
    return msgid

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
    .c "query", xmlns: Strophe.NS.MUC_OWNER
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
    .c "x", xmlns: "jabber:x:data", type: "cancel"
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
    .c "x", xmlns: "jabber:x:data", type: "submit"
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
    .c "x", xmlns: "jabber:x:data", type: "submit"
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
    .t topic
    @_connection.send msg.tree()

  ###Function
  Changes the role and affiliation of a member of a MUC room.
  The modification can only be done by a room moderator. An error will be
  returned if the user doesn't have permission.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) nick - The nick name of the user to modify.
  (String) role - The new role of the user.
  (String) affiliation - The new affiliation of the user.
  (String) reason - The reason for the change.
  Returns:
  iq - the id of the mode change request.
  ###
  modifyUser: (room, nick, role, affiliation, reason) ->
    item_attrs = nick: Strophe.escapeNode nick
    item_attrs.role = role if role?
    item_attrs.affiliation = affiliation if affiliation?

    item = $build "item", item_attrs
    item.cnode Strophe.xmlElement("reason", reason) if reason?

    roomiq = $iq(
      to: room,
      type: "set" )
    .c("query", xmlns: Strophe.NS.MUC_OWNER)
    .cnode item.tree()
    @_connection.sendIQ roomiq.tree()

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
    .c "x", xmlns: Strophe.NS.MUC
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
    .c "query", xmlns: Strophe.NS.DISCO_ITEMS
    @_connection.sendIQ iq, handle_cb

  test_append_nick: (room, nick) ->
    room + if nick? then "/#{Strophe.escapeNode nick}" else ""
