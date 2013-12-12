/*
 *Plugin to implement the MUC extension.
   http://xmpp.org/extensions/xep-0045.html
 *Author:
    Helios Technologiez <adm@heliostech.hk>
*/
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Strophe.addConnectionPlugin('privacy', {
  _connection: null,

  /** Variable: lists
   *  Available privacy lists
   */
  lists: {},
  /** PrivateVariable: _default
   *  Default privacy list
   */
  _default: null,
  /** PrivateVariable: _active
   *  Active privacy list
   */
  _active: null,
  /** PrivateVariable: _isInitialized
   *  If lists were pulled from the server, and plugin is ready to work with those.
   */
  _isInitialized: false,

  init: function(conn) {
    this._connection = conn;
    this._listChangeCallback = null;
    Strophe.addNamespace('PRIVACY', "jabber:iq:privacy");
  },

  isInitialized: function() {
    return this._isInitialized;
  },

  /** Function: getListNames
   *  Initial call to get all list names.
   *
   *  This has to be called before any actions with lists. This is separated from init method, to be able to put
   *  callbacks on the success and fail events.
   *
   *  Params:
   *    (Function) successCallback - Called upon successful deletion.
   *    (Function) failCallback - Called upon fail deletion.
   *    (Function) listChangeCallback - Called upon list change.
   */
  getListNames: function(successCallback, failCallback, listChangeCallback) {
    this._listChangeCallback = listChangeCallback;
    this._connection.sendIQ($iq({type: "get", id: this._connection.getUniqueId("privacy")})
                            .c("query", {xmlns: Strophe.NS.PRIVACY}),
                            __bind(function(stanza) {
                              var _lists = this.lists;
                              this.lists = {};
                              var listNames = stanza.getElementsByTagName("list");
                              for(var i = 0; i < listNames.length; ++i) {
                                var listName = listNames[i].getAttribute("name");
                                if(_lists.hasOwnProperty(listNames))
                                  this.lists[listName] = _lists[listName];
                                else this.lists[listName] = new List(listName, false);
                                this.lists[listName]._isPulled = false
                              }
                              var activeNode = stanza.getElementsByTagName("active");
                              if(activeNode.length == 1) this._active = activeNode[0].getAttribute("name");
                              var defaultNode = stanza.getElementsByTagName("default");
                              if(defaultNode.length == 1) this._default = defaultNode[0].getAttribute("name");
                              this._isInitialized = true;
                              if(successCallback)
                                try {
                                  successCallback();
                                } catch(e) {
                                  Strophe.error("Error while processing callback privacy list names pull.");
                                }
                            }, this), failCallback);
  },

  /** Function: newList
   *  Create new named list.
   *
   *  Params:
   *    (String) name - New List name.
   *
   *  Returns:
   *    New list, or existing list if it exists.
   */
  newList: function(name) {
    if(!this.lists.hasOwnProperty(name)) this.lists[name] = new List(name, true);
    return this.lists[name];
  },

  /** Function: newItem
   *  Create new item.
   *
   *  Params:
   *    (String) type - Type of item.
   *    (String) value - Value of item.
   *    (String) action - Action for the matching.
   *    (String) order - Order of rule.
   *    (String) blocked - Block list.
   *
   *  Returns:
   *    New list, or existing list if it exists.
   */
  newItem: function(type, value, action, order, blocked) {
    var item = new Item();
    item.type = type;
    item.value = value;
    item.action = action;
    item.order = order;
    item.blocked = blocked;
    return item;
  },

  /** Function: deleteList
   *  Delete list.
   *
   *  Params:
   *    (String) name - List name.
   *    (Function) successCallback - Called upon successful deletion.
   *    (Function) failCallback - Called upon fail deletion.
   */
  deleteList: function(name, successCallback, failCallback) {
    this._connection.sendIQ($iq({type: "set", id: this._connection.getUniqueId("privacy")})
                            .c("query", {xmlns: Strophe.NS.PRIVACY})
                            .c("list", {name: name}),
                            __bind(function() {
                              delete this.lists[name];
                              if(successCallback)
                                try {
                                  successCallback();
                                } catch(e) {
                                  Strophe.error("Exception while running callback after removing list");
                                }
                            }, this),
                            failCallback);
  },

  /** Function: saveList
   *  Saves list.
   *
   *  Params:
   *    (String) name - List name.
   *    (Function) successCallback - Called upon successful setting.
   *    (Function) failCallback - Called upon fail setting.
   *
   *  Returns:
   *    True if list is ok, and is sent to server, false otherwise.
   */
  saveList: function(name, successCallback, failCallback) {
    if(!this.lists.hasOwnProperty(name)) {
      Strophe.error("Trying to save uninitialized list");
      throw new Error("List not found");
    }
    var listModel = this.lists[name];
    if(!listModel.validate()) return false;
    var listIQ = $iq({type: "set", id: this._connection.getUniqueId("privacy")});
    var list = listIQ.c("query", {xmlns: Strophe.NS.PRIVACY})
      .c("list", {name: name});
    var count = listModel.items.length;
    for(var i = 0; i < count; ++i) {
      var item = listModel.items[i];
      var itemNode = list.c("item", { action: item.action, order: item.order});
      if(item.type != "") itemNode.attrs({type: item.type, value: item.value});
      if(item.blocked && item.blocked.length > 0) {
        var blockCount = item.blocked.length;
        for(var j = 0; j < blockCount; ++j)
          itemNode.c(item.blocked[j]).up();
      }
      itemNode.up();
    }
    this._connection.sendIQ(listIQ, __bind(function() {
      listModel._isPulled = true;
      if(successCallback)
        try {
          successCallback();
        } catch(e) {
          Strophe.error("Exception in callback when saving list " + name);
        }
    }, this), failCallback);
    return true;
  },

  /** Function: loadList
   *  Loads list from server
   *
   *  Params:
   *    (String) name - List name.
   *    (Function) successCallback - Called upon successful load.
   *    (Function) failCallback - Called upon fail load.
   */
  loadList: function(name, successCallback, failCallback) {
    this._connection.sendIQ($iq({type: "get", id: this._connection.getUniqueId("privacy")})
                            .c("query", {xmlns: Strophe.NS.PRIVACY})
                            .c("list", {name: name}),
                            __bind(function(stanza) {
                              var lists = stanza.getElementsByTagName("list");
                              var listsSize = lists.length;
                              for(var i = 0; i < listsSize; ++i) {
                                var list = lists[i];
                                var listModel = this.newList(list.getAttribute("name"));
                                listModel.items = [];
                                var items = list.getElementsByTagName("item");
                                var itemsSize = items.length;
                                for(var j = 0; j < itemsSize; ++j) {
                                  var item = items[j];
                                  var blocks = [];
                                  var blockNodes = item.childNodes;
                                  var nodesSize = blockNodes.length;
                                  for(var k = 0; k < nodesSize; ++k)
                                    blocks.push(blockNodes[k].nodeName);
                                  listModel.items.push(this.newItem(item.getAttribute('type'),
                                                                    item.getAttribute('value'),
                                                                    item.getAttribute('action'),
                                                                    item.getAttribute('order'),
                                                                    blocks));
                                }
                              }
                              this.lists[name];
                              if(successCallback)
                                try {
                                  successCallback();
                                } catch(e) {
                                  Strophe.error("Exception while running callback after loading list");
                                }
                            }, this),
                            failCallback);
  },

  /** Function: setActive
   *  Sets given list as active.
   *
   *  Params:
   *    (String) name - List name.
   *    (Function) successCallback - Called upon successful setting.
   *    (Function) failCallback - Called upon fail setting.
   */
  setActive: function(name, successCallback, failCallback) {
    var iq = $iq({type: "set", id: this._connection.getUniqueId("privacy")})
      .c("query", {xmlns: Strophe.NS.PRIVACY})
      .c("active");
    if(name) iq.attrs({name: name});
    this._connection.sendIQ(iq,
                            __bind(function() {
                              this._active = name;
                              if(successCallback)
                                try {
                                  successCallback();
                                } catch(e) {
                                  Strophe.error("Exception while running callback after setting active list");
                                }
                            }, this),
                            failCallback);
  },

  /** Function: getActive
   *  Returns currently active list of null.
   */
  getActive: function() {
    return this._active;
  },

  /** Function: setDefault
   *  Sets given list as default.
   *
   *  Params:
   *    (String) name - List name.
   *    (Function) successCallback - Called upon successful setting.
   *    (Function) failCallback - Called upon fail setting.
   */
  setDefault: function(name, successCallback, failCallback) {
    var iq = $iq({type: "set", id: this._connection.getUniqueId("privacy")})
      .c("query", {xmlns: Strophe.NS.PRIVACY})
      .c("default");
    if(name) iq.attrs({name: name});
    this._connection.sendIQ(iq,
                            __bind(function() {
                              this._default = name;
                              if(successCallback)
                                try {
                                  successCallback();
                                } catch(e) {
                                  Strophe.error("Exception while running callback after setting default list");
                                }
                            }, this),
                            failCallback);
  },

  /** Function: getDefault
   *  Returns currently default list of null.
   */
  getDefault: function() {
    return this._default;
  }
});

/**
 * Class: Item
 * Describes single rule.
 */
function Item() {
  /** Variable: type
   *  One of [jid, group, subscription].
   */
  this.type = null;
  this.value = null;
  /** Variable: action
   *  One of [allow, deny].
   *
   *  Not null. Action to be execute.
   */
  this.action =  null;
  /** Variable: order
   *  The order in which privacy list items are processed.
   *
   *  Unique, not-null, non-negative integer.
   */
  this.order = null;
  /** Variable: blocked
   *  List of blocked stanzas.
   *
   *  One or more of [message, iq, presence-in, presence-out]. Empty set is equivalent to all.
   */
  this.blocked = [];
};

/** Function: validate
 *  Checks if item is of valid structure
 */
Item.prototype.validate = function() {
  if(["jid", "group", "subscription", ""].indexOf(this.type) < 0) return false;
  if(this.type == "subscription") {
    if(["both", "to", "from", "none"].indexOf(this.value) < 0) return false;
  }
  if(["allow", "deny"].indexOf(this.action) < 0) return false;
  if(!this.order || !/^\d+$/.exec(this.order)) return false;
  if(this.blocked) {
    if(typeof(this.blocked) != "object") return false;
    var possibleBlocks = ["message", "iq", "presence-in", "presence-out"];
    var blockCount = this.blocked.length;
    for(var i = 0; i < blockCount; ++i) {
      if(possibleBlocks.indexOf(this.blocked[i]) < 0) return false;
      possibleBlocks.splice(this.blocked[i], 1);
    }
  }
  return true;
};

/** Function: copy
 *  Copy one item into another.
 */
Item.prototype.copy = function(item) {
  this.type = item.type;
  this.value = item.value;
  this.action = item.action;
  this.order = item.order;
  this.blocked = item.blocked.slice();
};

/**
 * Class: List
 * Contains list of rules. There is no layering.
 */
function List(name, isPulled) {
  /** PrivateVariable: _name
   *  List name.
   *
   *  Not changeable. Create new, copy this one, and delete, if you wish to rename.
   */
  this._name = name;
  /** PrivateVariable: _isPulled
   *  If list is pulled from server and up to date.
   *
   *  Is false upon first getting of list of lists, or after getting stanza about update
   */
  this._isPulled = isPulled;
  /** Variable: items
   *  Items of this list.
   */
  this.items = [];
};

/** Function: getName
 *  Returns list name
 */
List.prototype.getName = function() {
  return this._name;
};

/** Function: isPulled
 *  If list is pulled from server.
 *
 * This is false for list names just taken from server. you need to make loadList to see all the contents of the list.
 * Also this is possible when list was changed somewhere else, and you've got announcement about update. Same loadList
 * is your savior.
 */
List.prototype.isPulled = function() {
  return this._isPulled;
};

/** Function: validate
 *  Checks if list is of valid structure
 */
List.prototype.validate = function() {
  var orders = [];
  var itemCount = this.items.length;
  for(var i = 0; i < itemCount; ++i) {
    if(!this.items[i].validate()) return false;
    if(orders.indexOf(this.items[i].order) >= 0) return false;
    orders.push(this.items[i].order);
  }
  return true;
};

/** Function: copy
 *  Copy all items of one list into another.
 *
 *  Params:
 *    (List) list - list to copy items from.
 */
List.prototype.copy = function(list) {
  this.items = [];
  var l = list.items.length;
  for(var i = 0; i < l; ++i) {
    this.items[i] = new Item();
    this.items[i].copy(list.items[i]);
  }
};
