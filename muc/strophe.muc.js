/*
 *Plugin to implement the MUC extension.
   http://xmpp.org/extensions/xep-0045.html
 *jslint configuration:
 *global document, window, setTimeout, clearTimeout, console,
   XMLHttpRequest, ActiveXObject,
   Base64, MD5,
   Strophe, $build, $msg, $iq, $pres
*/
var RoomConfig, XmppRoom,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Strophe.addConnectionPlugin('muc', {
  _connection: null,
  _roomMessageHandlers: [],
  _roomPresenceHandlers: [],
  rooms: [],
  /*Function
  Initialize the MUC plugin. Sets the correct connection object and
  extends the namesace.
  */
  init: function(conn) {
    this._connection = conn;
    Strophe.addNamespace('MUC_OWNER', Strophe.NS.MUC + "#owner");
    Strophe.addNamespace('MUC_ADMIN', Strophe.NS.MUC + "#admin");
    Strophe.addNamespace('MUC_USER', Strophe.NS.MUC + "#user");
    return Strophe.addNamespace('MUC_ROOMCONF', Strophe.NS.MUC + "#roomconfig");
  },
  /*Function
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
  */
  join: function(room, nick, msg_handler_cb, pres_handler_cb, password) {
    var msg, room_nick, _base;
    room_nick = this.test_append_nick(room, nick);
    msg = $pres({
      from: this._connection.jid,
      to: room_nick
    }).c("x", {
      xmlns: Strophe.NS.MUC
    });
    if (password != null) msg.cnode(Strophe.xmlElement("password", [], password));
    if (msg_handler_cb != null) {
      this._roomMessageHandlers[room] = this._connection.addHandler(function(stanza) {
        var from, roomname;
        from = stanza.getAttribute('from');
        roomname = from.split("/")[0];
        if (roomname === room) {
          return msg_handler_cb(stanza);
        } else {
          return true;
        }
      }, null, "message");
    }
    if (pres_handler_cb != null) {
      this._roomPresenceHandlers[room] = this._connection.addHandler(function(stanza) {
        var x, xmlns, xquery, _i, _len;
        xquery = stanza.getElementsByTagName("x");
        if (xquery.length > 0) {
          for (_i = 0, _len = xquery.length; _i < _len; _i++) {
            x = xquery[_i];
            xmlns = x.getAttribute("xmlns");
            if (xmlns && xmlns.match(Strophe.NS.MUC)) {
              return pres_handler_cb(stanza);
            }
          }
        }
        return true;
      }, null, "presence");
    }
    if ((_base = this.rooms)[room] == null) {
      _base[room] = new XmppRoom(this, room, nick, this._roomMessageHandlers[room], this._roomPresenceHandlers[room], password);
    }
    return this._connection.send(msg);
  },
  /*Function
  Leave a multi-user chat room
  Parameters:
  (String) room - The multi-user chat room to leave.
  (String) nick - The nick name used in the room.
  (Function) handler_cb - Optional function to handle the successful leave.
  (String) exit_msg - optional exit message.
  Returns:
  iqid - The unique id for the room leave.
  */
  leave: function(room, nick, handler_cb, exit_msg) {
    var presence, presenceid, room_nick;
    this._connection.deleteHandler(this._roomMessageHandlers[room]);
    this._connection.deleteHandler(this._roomPresenceHandlers[room]);
    room_nick = this.test_append_nick(room, nick);
    presenceid = this._connection.getUniqueId();
    presence = $pres({
      type: "unavailable",
      id: presenceid,
      from: this._connection.jid,
      to: room_nick
    });
    if (exit_msg != null) presence.c("status", exit_msg);
    if (handler_cb != null) {
      this._connection.addHandler(handler_cb, null, "presence", null, presenceid);
    }
    this._connection.send(presence);
    return presenceid;
  },
  /*Function
  Parameters:
  (String) room - The multi-user chat room name.
  (String) nick - The nick name used in the chat room.
  (String) message - The plaintext message to send to the room.
  (String) html_message - The message to send to the room with html markup.
  (String) type - "groupchat" for group chat messages o
                  "chat" for private chat messages
  Returns:
  msgiq - the unique id used to send the message
  */
  message: function(room, nick, message, html_message, type) {
    var msg, msgid, parent, room_nick;
    room_nick = this.test_append_nick(room, nick);
    type = type || (nick != null ? "chat" : "groupchat");
    msgid = this._connection.getUniqueId();
    msg = $msg({
      to: room_nick,
      from: this._connection.jid,
      type: type,
      id: msgid
    }).c("body", {
      xmlns: Strophe.NS.CLIENT
    }).t(message);
    msg.up();
    if (html_message != null) {
      msg.c("html", {
        xmlns: Strophe.NS.XHTML_IM
      }).c("body", {
        xmlns: Strophe.NS.XHTML
      }).h(html_message);
      if (msg.node.childNodes.length === 0) {
        parent = msg.node.parentNode;
        msg.up().up();
        msg.node.removeChild(parent);
      } else {
        msg.up().up();
      }
    }
    msg.c("x", {
      xmlns: "jabber:x:event"
    }).c("composing");
    this._connection.send(msg);
    return msgid;
  },
  /*Function
  Convenience Function to send a Message to all Occupants
  Parameters:
  (String) room - The multi-user chat room name.
  (String) message - The plaintext message to send to the room.
  (String) html_message - The message to send to the room with html markup.
  Returns:
  msgiq - the unique id used to send the message
  */
  groupchat: function(room, message, html_message) {
    return this.message(room, null, message, html_message);
  },
  /*Function
  Send a mediated invitation.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) receiver - The invitation's receiver.
  (String) reason - Optional reason for joining the room.
  Returns:
  msgiq - the unique id used to send the invitation
  */
  invite: function(room, receiver, reason) {
    var invitation, msgid;
    msgid = this._connection.getUniqueId();
    invitation = $msg({
      from: this._connection.jid,
      to: room,
      id: msgid
    }).c('x', {
      xmlns: Strophe.NS.MUC_USER
    }).c('invite', {
      to: receiver
    });
    if (reason != null) invitation.c('reason', reason);
    this._connection.send(invitation);
    return msgid;
  },
  /*Function
  Send a direct invitation.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) receiver - The invitation's receiver.
  (String) reason - Optional reason for joining the room.
  (String) password - Optional password for the room.
  Returns:
  msgiq - the unique id used to send the invitation
  */
  directInvite: function(room, receiver, reason, password) {
    var attrs, invitation, msgid;
    msgid = this._connection.getUniqueId();
    attrs = {
      xmlns: 'jabber:x:conference',
      jid: room
    };
    if (reason != null) attrs.reason = reason;
    if (password != null) attrs.password = password;
    invitation = $msg({
      from: this._connection.jid,
      to: receiver,
      id: msgid
    }).c('x', attrs);
    this._connection.send(invitation);
    return msgid;
  },
  /*Function
  Queries a room for a list of occupants
  (String) room - The multi-user chat room name.
  (Function) success_cb - Optional function to handle the info.
  (Function) error_cb - Optional function to handle an error.
  Returns:
  id - the unique id used to send the info request
  */
  queryOccupants: function(room, success_cb, error_cb) {
    var attrs, info;
    attrs = {
      xmlns: Strophe.NS.DISCO_ITEMS
    };
    info = $iq({
      from: this._connection.jid,
      to: room,
      type: 'get'
    }).c('query', attrs);
    return this._connection.sendIQ(info, success_cb, error_cb);
  },
  /*Function
  Start a room configuration.
  Parameters:
  (String) room - The multi-user chat room name.
  (Function) handler_cb - Optional function to handle the config form.
  Returns:
  id - the unique id used to send the configuration request
  */
  configure: function(room, handler_cb) {
    var config, id, stanza;
    config = $iq({
      to: room,
      type: "get"
    }).c("query", {
      xmlns: Strophe.NS.MUC_OWNER
    });
    stanza = config.tree();
    id = this._connection.sendIQ(stanza);
    if (handler_cb != null) {
      this._connection.addHandler(function(stanza) {
        handler_cb(stanza);
        return false;
      }, Strophe.NS.MUC_OWNER, "iq", null, id);
    }
    return id;
  },
  /*Function
  Cancel the room configuration
  Parameters:
  (String) room - The multi-user chat room name.
  Returns:
  id - the unique id used to cancel the configuration.
  */
  cancelConfigure: function(room) {
    var config, stanza;
    config = $iq({
      to: room,
      type: "set"
    }).c("query", {
      xmlns: Strophe.NS.MUC_OWNER
    }).c("x", {
      xmlns: "jabber:x:data",
      type: "cancel"
    });
    stanza = config.tree();
    return this._connection.sendIQ(stanza);
  },
  /*Function
  Save a room configuration.
  Parameters:
  (String) room - The multi-user chat room name.
  (Array) configarray - an array of form elements used to configure the room.
  Returns:
  id - the unique id used to save the configuration.
  */
  saveConfiguration: function(room, configarray) {
    var conf, config, stanza, _i, _len;
    config = $iq({
      to: room,
      type: "set"
    }).c("query", {
      xmlns: Strophe.NS.MUC_OWNER
    }).c("x", {
      xmlns: "jabber:x:data",
      type: "submit"
    });
    for (_i = 0, _len = configarray.length; _i < _len; _i++) {
      conf = configarray[_i];
      config.cnode(conf).up();
    }
    stanza = config.tree();
    return this._connection.sendIQ(stanza);
  },
  /*Function
  Parameters:
  (String) room - The multi-user chat room name.
  Returns:
  id - the unique id used to create the chat room.
  */
  createInstantRoom: function(room) {
    var roomiq;
    roomiq = $iq({
      to: room,
      type: "set"
    }).c("query", {
      xmlns: Strophe.NS.MUC_OWNER
    }).c("x", {
      xmlns: "jabber:x:data",
      type: "submit"
    });
    return this._connection.sendIQ(roomiq.tree());
  },
  /*Function
  Set the topic of the chat room.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) topic - Topic message.
  */
  setTopic: function(room, topic) {
    var msg;
    msg = $msg({
      to: room,
      from: this._connection.jid,
      type: "groupchat"
    }).c("subject", {
      xmlns: "jabber:client"
    }).t(topic);
    return this._connection.send(msg.tree());
  },
  /*Function
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
  */
  _modifyPrivilege: function(room, item, reason, handler_cb, error_cb) {
    var iq;
    iq = $iq({
      to: room,
      type: "set"
    }).c("query", {
      xmlns: Strophe.NS.MUC_ADMIN
    }).cnode(item);
    if (reason != null) iq.c("reason", reason);
    return this._connection.sendIQ(iq.tree(), handler_cb, error_cb);
  },
  /*Function
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
  */
  modifyRole: function(room, nick, role, reason, handler_cb, error_cb) {
    var item;
    item = $build("item", {
      nick: nick,
      role: role
    });
    return this._modifyPrivilege(room, item, reason, handler_cb, error_cb);
  },
  kick: function(room, nick, reason, handler_cb, error_cb) {
    return this.modifyRole(room, nick, 'none', reason, handler_cb, error_cb);
  },
  voice: function(room, nick, reason, handler_cb, error_cb) {
    return this.modifyRole(room, nick, 'participant', reason, handler_cb, error_cb);
  },
  mute: function(room, nick, reason, handler_cb, error_cb) {
    return this.modifyRole(room, nick, 'visitor', reason, handler_cb, error_cb);
  },
  op: function(room, nick, reason, handler_cb, error_cb) {
    return this.modifyRole(room, nick, 'moderator', reason, handler_cb, error_cb);
  },
  deop: function(room, nick, reason, handler_cb, error_cb) {
    return this.modifyRole(room, nick, 'participant', reason, handler_cb, error_cb);
  },
  /*Function
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
  */
  modifyAffiliation: function(room, jid, affiliation, reason, handler_cb, error_cb) {
    var item;
    item = $build("item", {
      jid: jid,
      affiliation: affiliation
    });
    return this._modifyPrivilege(room, item, reason, handler_cb, error_cb);
  },
  ban: function(room, jid, reason, handler_cb, error_cb) {
    return this.modifyAffiliation(room, jid, 'outcast', reason, handler_cb, error_cb);
  },
  member: function(room, jid, reason, handler_cb, error_cb) {
    return this.modifyAffiliation(room, jid, 'member', reason, handler_cb, error_cb);
  },
  revoke: function(room, jid, reason, handler_cb, error_cb) {
    return this.modifyAffiliation(room, jid, 'none', reason, handler_cb, error_cb);
  },
  owner: function(room, jid, reason, handler_cb, error_cb) {
    return this.modifyAffiliation(room, jid, 'owner', reason, handler_cb, error_cb);
  },
  admin: function(room, jid, reason, handler_cb, error_cb) {
    return this.modifyAffiliation(room, jid, 'admin', reason, handler_cb, error_cb);
  },
  /*Function
  Change the current users nick name.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) user - The new nick name.
  */
  changeNick: function(room, user) {
    var presence, room_nick;
    room_nick = this.test_append_nick(room, user);
    presence = $pres({
      from: this._connection.jid,
      to: room_nick
    }).c("x", {
      xmlns: Strophe.NS.MUC
    });
    return this._connection.send(presence.tree());
  },
  /*Function
  Change the current users status.
  Parameters:
  (String) room - The multi-user chat room name.
  (String) user - The current nick.
  (String) show - The new show-text.
  (String) status - The new status-text.
  */
  setStatus: function(room, user, show, status) {
    var presence, room_nick;
    room_nick = this.test_append_nick(room, user);
    presence = $pres({
      from: this._connection.jid,
      to: room_nick
    });
    if (show != null) presence.c('show', show).up();
    if (status != null) presence.c('status', status);
    return this._connection.send(presence.tree());
  },
  /*Function
  List all chat room available on a server.
  Parameters:
  (String) server - name of chat server.
  (String) handle_cb - Function to call for room list return.
  */
  listRooms: function(server, handle_cb) {
    var iq;
    iq = $iq({
      to: server,
      from: this._connection.jid,
      type: "get"
    }).c("query", {
      xmlns: Strophe.NS.DISCO_ITEMS
    });
    return this._connection.sendIQ(iq, handle_cb);
  },
  test_append_nick: function(room, nick) {
    return room + (nick != null ? "/" + (Strophe.escapeNode(nick)) : "");
  }
});

XmppRoom = (function() {

  function XmppRoom(client, name, nick, msg_handler_id, pres_handler_id, password) {
    this.client = client;
    this.name = name;
    this.nick = nick;
    this.msg_handler_id = msg_handler_id;
    this.pres_handler_id = pres_handler_id;
    this.password = password;
    this.name = Strophe.getBareJidFromJid(name);
    this.client.rooms[this.name] = this;
    this.roster = new Array();
  }

  XmppRoom.prototype.join = function(msg_handler_cb, pres_handler_cb) {
    if (this.client.rooms[this.name] != null) {
      return this.client.join(this.name, this.nick, null, null, password);
    }
  };

  XmppRoom.prototype.leave = function(handler_cb, message) {
    this.client.leave(this.name, this.nick, handler_cb, message);
    return this.client.rooms[this.name] = null;
  };

  XmppRoom.prototype.message = function(nick, message, html_message, type) {
    return this.client.message(this.name, nick, message, html_message, type);
  };

  XmppRoom.prototype.groupchat = function(message, html_message) {
    return this.client.groupchat(this.name, message, html_message);
  };

  XmppRoom.prototype.invite = function(receiver, reason) {
    return this.client.invite(this.name, receiver, reason);
  };

  XmppRoom.prototype.directInvite = function(receiver, reason) {
    return this.client.directInvite(this.name, receiver, reason, this.password);
  };

  XmppRoom.prototype.configure = function(handler_cb) {
    return this.client.configure(this.name, handler_cb);
  };

  XmppRoom.prototype.cancelConfigure = function() {
    return this.client.cancelConfigure(this.name);
  };

  XmppRoom.prototype.saveConfiguration = function(configarray) {
    return this.client.saveConfiguration(this.name, configarray);
  };

  XmppRoom.prototype.queryOccupants = function(success_cb, error_cb) {
    return this.client.queryOccupants(this.name, success_cb, error_cb);
  };

  XmppRoom.prototype.setTopic = function(topic) {
    return this.client.setTopic(this.name, topic);
  };

  XmppRoom.prototype.modifyRole = function(nick, role, reason, success_cb, error_cb) {
    return this.client.modifyRole(this.name, nick, role, reason, success_cb, error_cb);
  };

  XmppRoom.prototype.kick = function(nick, reason, handler_cb, error_cb) {
    return this.client.kick(this.name, nick, 'none', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.voice = function(nick, reason, handler_cb, error_cb) {
    return this.client.voice(this.name, nick, 'participant', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.mute = function(nick, reason, handler_cb, error_cb) {
    return this.client.mute(this.name, nick, 'visitor', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.op = function(nick, reason, handler_cb, error_cb) {
    return this.client.op(this.name, nick, 'moderator', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.deop = function(nick, reason, handler_cb, error_cb) {
    return this.client.deop(this.name, nick, 'participant', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.modifyAffiliation = function(jid, affiliation, reason, success_cb, error_cb) {
    return this.client.modifyAffiliation(this.name, jid, affiliation, reason, success_cb, error_cb);
  };

  XmppRoom.prototype.ban = function(jid, reason, handler_cb, error_cb) {
    return this.client.ban(this.name, jid, 'outcast', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.member = function(jid, reason, handler_cb, error_cb) {
    return this.client.member(this.name, jid, 'member', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.revoke = function(jid, reason, handler_cb, error_cb) {
    return this.client.revoke(this.name, jid, 'none', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.owner = function(jid, reason, handler_cb, error_cb) {
    return this.client.owner(this.name, jid, 'owner', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.admin = function(jid, reason, handler_cb, error_cb) {
    return this.client.admin(this.name, jid, 'admin', reason, handler_cb, error_cb);
  };

  XmppRoom.prototype.changeNick = function(nick) {
    this.nick = nick;
    return this.client.changeNick(this.name, nick);
  };

  XmppRoom.prototype.setStatus = function(show, status) {
    return this.client.setStatus(this.name, this.nick, show, status);
  };

  return XmppRoom;

})();

RoomConfig = (function() {

  function RoomConfig(info) {
    this.parse = __bind(this.parse, this);    if (info != null) this.parse(info);
  }

  RoomConfig.prototype.parse = function(result) {
    var attr, attrs, child, field, identity, query, _i, _j, _k, _len, _len2, _len3, _ref;
    query = result.getElementsByTagName("query")[0].children;
    this.identities = [];
    this.features = [];
    this.x = [];
    for (_i = 0, _len = query.length; _i < _len; _i++) {
      child = query[_i];
      attrs = child.attributes;
      switch (child.nodeName) {
        case "identity":
          identity = {};
          for (_j = 0, _len2 = attrs.length; _j < _len2; _j++) {
            attr = attrs[_j];
            identity[attr.name] = attr.textContent;
          }
          this.identities.push(identity);
          break;
        case "feature":
          this.features.push(attrs["var"].textContent);
          break;
        case "x":
          attrs = child.children[0].attributes;
          if ((!attrs["var"].textContent === 'FORM_TYPE') || (!attrs.type.textContent === 'hidden')) {
            break;
          }
          _ref = child.children;
          for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
            field = _ref[_k];
            if (!(!field.attributes.type)) continue;
            attrs = field.attributes;
            this.x.push({
              "var": attrs["var"].textContent,
              label: attrs.label.textContent || "",
              value: field.firstChild.textContent || ""
            });
          }
      }
    }
    return {
      "identities": this.identities,
      "features": this.features,
      "x": this.x
    };
  };

  return RoomConfig;

})();
