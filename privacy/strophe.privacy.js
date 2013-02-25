/*
 *Plugin to implement the MUC extension.
   http://xmpp.org/extensions/xep-0045.html
 *Author:
    Helios Technologiez <adm@heliostech.hk>
*/

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
  },

  /** Function: newItem
   *  Create new item.
   *
   *  Params:
   *    (String) type - Type of item.
   *    (String) value - Value of item.
   *    (String) action - Action for the matching.
   *    (String) order - Order of rule..
   *    (String) block - Block list.
   *
   *  Returns:
   *    New list, or existing list if it exists.
   */
  newItem: function(type, value, action, order, block) {
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
  },

  /** Function: loadList
   *  Loads list from server
   *
   *  Params:
   *    (String) name - List name.
   *    (Function) successCallback - Called upon successful load.
   *    (Function) failCallback - Called upon fail load.
   */
  loadList: function(name, successcb, failcb) {
  };

  /** Function: setActive
   *  Sets given list as active.
   *
   *  Params:
   *    (String) name - List name.
   *    (Function) successCallback - Called upon successful setting.
   *    (Function) failCallback - Called upon fail setting.
   */
  setActive: function(nameOrList, successCallback, failCallback) {
  },

  /** Function: getActive
   *  Returns currently active list of null.
   */
  getActive: function() {
  },

  /** Function: setDefault
   *  Sets given list as default.
   *
   *  Params:
   *    (String) name - List name.
   *    (Function) successCallback - Called upon successful setting.
   *    (Function) failCallback - Called upon fail setting.
   */
  setDefault: function(nameOrList, successCallback, failCallback) {
  },

  /** Function: getDefault
   *  Returns currently default list of null.
   */
  getDefault: function() {
  }
});

/**
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
 * Contains list of rules. There is no layering.
 */
function List(isPulled) {
  /** PrivateVariable: _name
   *  List name.
   *
   *  Not changeable. Create new, copy this one, and delete, if you wish to rename.
   */
  this._name = null;
  /** PrivateVariable: _isPulled
   *  If list is pulled from server and up to date.
   *
   *  Is false upon first getting of list of lists, or after getting stanza about update
   */
  this._isPulled = isLoaded;
  /** Variable: items
   *  Items of this list.
   */
  this.items = [];
};

/** Function: getName
 *  Returns list name
 */
List.prototype.getName = function() {
};

/** Function: validate
 *  Checks if list is of valid structure
 */
List.prototype.validate = function() {
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
