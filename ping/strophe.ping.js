/*
  This plugin is distributed under the terms of the MIT licence.
  Please see the LICENCE file for details.

  Copyright (c) Markus Kohlhase, 2010
*/

/**
* File: strophe.ping.js
* A Strophe plugin for XMPP Ping ( http://xmpp.org/extensions/xep-0199.html )
*/

Strophe.addConnectionPlugin('ping',
{
  _connection: null,
  
  // called by the Strophe.Connection constructor

  init: function( conn ){
    
    this._connection = conn;
    Strophe.addNamespace( 'PING', "urn:xmpp:ping" );            
  },
  
  /**
   * Function: ping
   * 
   * Parameters:
   * (String) to	- the JID you want to ping
   * (Function) success	- Callback function on success
   * (Function) error	- Callback function on error
   */
  
  ping: function( jid, success, error ){

    var id = this._connection.getUniqueId('ping');
        
    var iq = $iq({ type:'get', to: jid, id: id }).c('ping', { xmlns: Strophe.NS.PING } );
    this._connection.sendIQ( iq, success, error );
    
  },
  
  /**
   * Function: pong
   * 
   * Parameters:
   * (Object) ping	-
   * (Function) success	-
   * (Function) error	-
   */*
  pong: function( ping, success, error ){
    
    var from = ping.getAttribute('from');
    var id = ping.getAttribute('id');
    
    var iq = $iq({ type:'result', to: from, id: id });
    this._connection.sendIQ( iq, success, error );
    
  },
  
  /**
   * Function: addPingHandler
   * 
   * Parameters:
   * (Function) handler - Ping handler
   * 
   * Returns:
   * A reference to the handler that can be used to remove it.
   */
  
  addPingHandler: function( handler ){
    return this._connection.addHandler( handler, Strophe.NS.PING, "iq", "get" );    
  }
});