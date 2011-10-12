/*
  This plugin is distributed under the terms of the MIT licence.
  Please see the LICENCE file for details.

  Copyright (c) Markus Kohlhase <mail@markus-kohlhase.de>, 2009-2011

  Some parts are inspired by the pep plugin of François de Metz <francois@2metz.fr>.
  See https://github.com/owengriffin/strophejs/blob/master/plugins/strophe.pep.js
*/

/**
* File: strophe.pep.js
* A Strophe plugin for XMPP Personal Eventing Protocol.
* No pubsub plugin is needed.
*/

// Extend the Strophe.Connection object.

Strophe.addConnectionPlugin('pep',
{
  _connection: null,

  /**
  * Obejct for global options.
  */

  defaults: {

    matchBare: true,
    success: null,
    error: null

  },

  // called by the Strophe.Connection constructor

  init: function( conn ){

    this._connection = conn;
    Strophe.addNamespace( 'PUBSUB', "http://jabber.org/protocol/pubsub" );
    Strophe.addNamespace( 'PUBSUB_EVENT', "http://jabber.org/protocol/pubsub#event" );

  },


  /**
  * Function: subscribe
  *
  * Parameters:
  *
  * (String) jid        - JID to subscribe to.
  * (String) node       - Node to subscribe to.
  * (Function) success  - Callback function on successfull subscription.
  * (Function) error    - Callback function on error.
  * (Function) handler  - Message handler for the subscribed node.
  * (Boolean) matchBare -
  */

  subscribe: function( jid, node, success, error, handler, matchBare ){

    var that = this;

    this._connection.sendIQ(
      this._createSubscriptionIQ( jid, node, matchBare ),
      function( iq ){
        if( handler ){
          that._addPepHandler( handler, jid, node, matchBare );
        }
        that._getAppropriateHandler( success, "success" )( iq );
      },
      that._getAppropriateHandler( error, "error" )
    );
  },

   /**
   * Function: unsubscribe
   *
   * Parameters:
   * (String) jid         - Jabber ID
   * (String) node        - The node
   * (Function) success   - The success callback function
   * (Function) error     - The error callback function
   * (Boolean) matchBare  -
   */

  unsubscribe: function( jid, node, success, error, matchBare ){

    this._connection.sendIQ(
      this._createUnsubscriptionIQ( jid, node, matchBare ),
      this._getAppropriateHandler( success, "success" ),
      this._getAppropriateHandler( error, "error" )
    );
  },

  /**
   * Function: publish
   *
   * Parameters:
   * (String) node      - The node.
   * (Object) content   - The content object that should be published.
   *                      It can be either a single content object or an array
   *                      of content objects.
   *                      The content object can be a text string,
   *                      an valid XML string or an DOM object.
   * (Function) success - The callback function on success.
   * (Function) error   - The callback function on error.
   */

  publish: function( node, content, success, error ){

    this._connection.sendIQ(
      this._createPublishIQ( node, content ),
      this._getAppropriateHandler( success, "success" ),
      this._getAppropriateHandler( error, "error" )
    );
  },


  /**
   * PrivateFunction: _getAppropriateHandler
   *
   * Parameters:
   * (Function) handler -
   * (String) type      -
   *
   * Returns:
   * (Function) handler -
   */

  _getAppropriateHandler: function( handler, type ){

    if( typeof( handler ) === "function" ){
      return handler;
    }

    if( typeof( type ) === "string" ){

      switch( type.toLowerCase() ){
        case "success": return this._getAppropriateHandler( this.defaults.success, null );
        case "error": return this._getAppropriateHandler( this.defaults.error, null );
        default:  return function(){};
      }
    }
    return function(){};
  },

  /**
  * PrivateFunction: _addPepHandler
  *
  * Parameters:
  * (Function) handler  - Callback function
  * (String) jid        - JID
  * (String) node       - The node
  * (Boolean) matchBare -
  *
  * Returns:
  * A reference to the handler.
  */

  _addPepHandler: function( handler, jid, node, matchBare ){

    var that = this;

    jid = this._getAppropriateJid( jid, matchBare );

    return this._connection.addHandler(
      function( msg ){
        if( that._isCorrectNode( msg, node ) ){
          return handler( msg );
        }
        return true;
      },
      null,
      'message',
      null,
      null,
      jid,
      { matchBare: matchBare }
    );

  },

  /**
   * PrivateFunction: _getAppropriateJid
   *
   * Checks whether the full qualified JID is desired or not and returns
   * the appropriate JID.
   * If nothing is defined the global option will be used if it is defined,
   * otherwise the JID get passed through.
   *
   * Parameters:
   *
   * (String) jid         - full qualified jid
   * (Boolean) matchBare  -
   *
   * Returns:
   *
   * (String) jid - the desired JID
   */

  _getAppropriateJid: function( jid, matchBare ){

    if( jid !== null &&
        jid !== undefined &&
        jid !== "" &&
        jid !== " "){

      if( matchBare === true ){
        return Strophe.getBareJidFromJid( jid );
      }
      else if( matchBare !== false && matchBare !== true ){
        if( this.defaults.matchBare ){
          return this._getAppropriateJid( jid, this.defaults.matchBare );
        } else {
          return jid;
        }
      }
      return jid;
    }
    return jid;
  },

  /**
   * PrivateFunction: _deletePepHandler
   *
   */

  _deletePepHandler: function( handler ){
    this._connection.deleteHandler( handler );
  },

  /**
   * PrivateFunction: _isCorrectNode
   *
   * Parameters:
   * (Object) msg   - The message
   * (String) node  - The name of the node that should match
   *
   * Returns:
   * True if the node mathes.
   */

  _isCorrectNode: function( msg, node ){

    if( msg.childNodes.length > 0 ){

      var event = msg.childNodes[0];
      var items = event.childNodes[0];

      if( event.tagName === "event" &&
        event.getAttribute('xmlns') === Strophe.NS.PUBSUB_EVENT &&
        items.getAttribute('node') === node ){
        return true;
      }
    }
    return false;
  },

  /**
  * PrivateFunction: _createSubscriptionIQ
  *
  * Parameters:
  * (String) jid        - JabberID
  * (String) node       - The node
  * (Boolean) matchBare -
  *
  * Returns:
  * (Object) iq - IQ stanza to subscibe
  */

  _createSubscriptionIQ: function( jid, node, matchBare ){

    var iqid = this._connection.getUniqueId("pepsubscriptioniq");

    return $iq({ type: 'set', to: jid, id: iqid })
      .c("pubsub", { xmlns: Strophe.NS.PUBSUB })
      .c("subscribe", { node: node, jid: this._getJid( matchBare ) } );
  },

  /**
  * PrivateFunction: _createUnsubscriptionIQ
  *
  * Parameters:
  * (String) jid        - JabberID
  * (String) node       - The node
  * (Boolean) matchBare -
  *
  * Returns:
  * (Obejct) iq - IQ stanza to unsubscribe
  */

  _createUnsubscriptionIQ: function( jid, node, matchBare ){

    var iqid = this._connection.getUniqueId("pepunsubscriptioniq");

    return $iq({ type: 'set', to: jid, id: iqid })
      .c("pubsub", { xmlns: Strophe.NS.PUBSUB })
      .c("unsubscribe", { node: node, jid: this._getJid( matchBare ) } );

  },

  /**
  * PrivateFunction: _createPublishIQ
  *
  * Parameters:
  * (String) node     - The node
  * (Object) content  - The content object
  */

  _createPublishIQ: function( node, content ){

    var pubid = this._connection.getUniqueId("peppublishiq");

    // convert to array if needed
    if( !this._isArray(content) ){
      content = [content];
    }

    var iq = $iq({ type: 'set' })
      .c("pubsub", { xmlns: Strophe.NS.PUBSUB })
      .c("publish", { node: node } );

    for( var i in content ){

      if( content[i] ){
        iq.cnode( this._createPublishItem( content[i] ) ).up();
      }
    }
    return iq;
  },

  /**
   * PrivateFunction: _createPublishItem
   *
   * Parameters:
   * (Object) c   - The content to publish
   *
   * Returns:
   * (Obejct) dom - The appropriate XML item object
   */

  _createPublishItem: function( c ){

    var item = Strophe.xmlElement("item",[]);

    switch( typeof( c ) ){

      case "number":
      case "boolean":
        item.appendChild( Strophe.xmlTextNode( c + '' ) );
        break;

      case "string":

        var dom = this._textToXml( c );

        if( dom !== null ){
          item.appendChild( dom );
        } else {
          item.appendChild( Strophe.xmlTextNode( c + '' ) );
        }
        break;

      case "object":

      if( this._isNode(c) || this._isElement(c) ){
        item.appendChild( c );
      }
      break;
    }
    return item;
  },

  /**
   * PrivateFunction: _textToXml
   *
   * Parameters:
   * (String) text  - XML String
   *
   * Returns:
   * (Object) dom - DOM Object
   */

  _textToXml: function( text ){

    var doc = null;

    if( window.DOMParser ){
      var parser = new DOMParser();
      doc = parser.parseFromString( text, 'text/xml');
    } else if( window.ActiveXObject ){
      doc = new ActiveXObject("MSXML2.DOMDocument");
      doc.async = false;
      doc.loadXML(text);
    } else{
      throw{
        type: 'Parse error',
        message: "No DOM parser object found."
      };
    }

    var error = doc.getElementsByTagName("parsererror");

    if( error.length > 0 ){
      return null;
    }

    var node = document.importNode( doc.documentElement, true );
    return node;
  },

  /**
   * PrivateFunction: _getJid
   *
   * Parameters:
   * (Boolean) matchBare
   *
   * Returns:
   * (Boolean) jid  - The Jabber ID of the current connection.
   * If global option matchBare is set to TRUE the bare JID will be returned.
   */

  _getJid: function( matchBare ){
    return this._getAppropriateJid( this._connection.jid, matchBare );
  },

  /**
   * PrivateFunction: _isNode
   *
   * Parameters:
   * ( Object ) obj - The object to test
   *
   * Returns:
   * True if it is a DOM node
   */

  _isNode: function( obj ){

      if( typeof( Node ) === "object" ){
        return ( obj instanceof Node );
      }else{
        return ( typeof( obj ) === "object" && typeof( obj.nodeType ) === "number" && typeof( obj.nodeName ) === "string");
      }
  },

  /**
   * PrivateFunction: _isElement
   *
   * Parameters:
   * ( Object ) obj - The object to test
   *
   * Returns:
   * True if it is a DOM element.
   */

  _isElement: function( obj ){

    if( typeof( HTMLElement ) === "object"){
      return ( obj instanceof HTMLElement ); //DOM2
    } else{
      return ( typeof( obj ) === "object" && obj.nodeType === 1 && typeof( obj.nodeName ) === "string" );
    }
  },

  /**
   * PrivateFunction: _isArray
   * Checks if an given object is an array.
   *
   * Parameters:
   * (Object) obj - The object to test
   *
   * Returns:
   * True if it is an array.
   */

  _isArray: function( obj ){
    try{
      return obj && obj.constructor.toString().match(/array/i) !== null ;
    } catch( e ){
      return false;
    }
  }


});
