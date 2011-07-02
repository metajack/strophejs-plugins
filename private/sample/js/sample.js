var sample = {
  
  boshurl: "http://" + document.domain + "/http-bind/",
  
  init: function(){ 	 
    
    if( localStorage.jid && localStorage.sid && localStorage.rid ){               
      sample.connection = new Strophe.Connection( this.boshurl );
      sample.connection.attach( localStorage.jid, localStorage.sid, localStorage.rid , this.onStatusChanged, 60 );      
    }
    else {
      console.debug("xmpp: no connection to attache available");
    }
  },    
  
  connection: null,
    
  login: function( jid, pw ){
    
    var conn = new Strophe.Connection( this.boshurl );
    conn.connect( jid, pw, sample.onStatusChanged );
    this.connection = conn;
    
  },
  
  setProgress: function( val ){
    if( val <= 0 || val >= 100 ){
      $("#progressbar").hide();
    }else{
      $("#progressbar").progressbar({ value: val }).show();      
    }
  },
  
  onStatusChanged: function( status ){
    
    console.info( "xmpp status changed: "+ status );
    
    var s = Strophe.Status;
    
    switch( status ){

      case s.ERROR:
	sample.onError();
	break;

      case s.CONNECTING:
	sample.onConnecting();
	break;

      case s.CONFAIL:
	sample.onConFail();
	break;

      case s.AUTHENTICATING:
	sample.onAuth();
	break;

      case s.AUTHFAIL:
	sample.onAuthFail();
	break;

      case s.CONNECTED:
	sample.onConnected();
	break;

      case s.DISCONNECTED:
	sample.onDisconnected();
	break;

      case s.DISCONNECTING:
	sample.onDisconnecting();
	break;

      case s.ATTACHED:
	sample.onAttached();    
	break;
    }
  },
  
  onError: function(){
    alert("An error occoured.");
    this.setProgress(0);
  },
  
  onConnecting: function(){
    console.debug("connecting");
    this.setProgress(33);
  },
  
  onConFail: function(){
    alert("Connection failed!");
    this.setProgress(0);
  },
  
  onAuth: function(){
    this.setProgress(66);
  },
  
  onAuthFail: function(){
    alert("Authentication failed!");
    this.setProgress(0);
  },
  
  onConnected: function(){
    console.info("Connection was successfull.");
    this.connection.send( $pres() );
    this.setProgress(100);
  },
  
  onDisconnected: function(){
    $("#login").dialog("open");
    this.connection = null;
    this.setProgress(0);
  },
  
  onAttached: function(){
    $("#login").dialog("close");
    this.setProgress(100);
  },
  
  save: function(){
    var text = $("#input").val().trim();
    console.log(text);
    sample.connection.private.set( "sample", "sample", text, 
      function(){
	console.info( "saved" );
      },
      function( err ){
	console.error( "could not save" );
	console.error( err );
      });
  },
  
  load: function(){
    console.log( "loading");
    sample.connection.private.get( "sample", "sample", function( data ){
      console.log("received data")
      console.log(data)
      //$("received").append(data);
    });
  },
  
//   messageHandler: function( msg ){   
//     console.debug("received message:");
//     console.debug( msg );
// 
//     var jid = $(msg).attr('from');         
//     var items = $("items", msg);       
//     var node = items.attr('node');   
//     
//     var li = $("<li>");
//     $("#message-list").append( li );
//     	
//     var div = $("<div><h3>" + jid + '/' + node + "<h3></div>");
//     li.append( div );
//     
//     var ul = $("<ul>");
//     div.append(ul);
//     
//     console.debug( "adding msg items" );
//     items.find("item").each(function(){
//      var li = $("<li>");
//      var content = sample.dom_obj_to_string(this.childNodes);
//       li.text(content);
//       console.debug(content);
//       ul.append( li );
//     });
//     console.debug("done");
//     return true;
//   },
  
  dom_obj_to_string: function( obj ){
    return $('<div>').append( $(obj).clone() ).remove().html();
  },
  
  logout: function(){
  
    if( sample.connection !== null ){

      sample.clearData();
      sample.connection.pause();    
      sample.connection.disconnect();

    } else {
      sample.clearData();
    }    
  },
  
  isLoggedIn: function(){
    if( sample.connection ){
      return true;      
    }
    return false;
  },
   
  saveData: function(){
    
    localStorage.jid =    sample.connection.jid; 
    localStorage.sid =     sample.connection.sid; 
    localStorage.rid =     sample.connection.rid;
  },
  
  clearData: function(){
    localStorage.clear();
   },
   
   
//   getDataFromSubscriptionDialog: function(){
//     
//     var jid = $("#pep-jid");
//     var node = $("#pep-node");
//   
//     if( jid.val() !== ""  &&
// 	jid.val() !== " " &&
// 	node.val() !== "" &&
// 	node.val() !== " "
//     ){	
//       return { jid: jid.val(), node: node.val() };
//     } else{
//       return false;
//     }     
//   },
  
//   closeSubscriptionDialog: function(){
//     $("#pep-jid").val('');
//     $("#pep-node").val('');
//     $("#subscription-dialog").dialog("close");	    
//   },
//   
//   subscribe: function(){
//     
//     var input = sample.getDataFromSubscriptionDialog();
// 	
//     if( input ){	    
//       sample.connection.pep.subscribe( 
// 	input.jid, 
// 	input.node,
// 	function( iq ){ console.debug( iq );},
// 	function( iq ){ alert("Could not subscribe");},
// 	sample.messageHandler
//       );	    
//       sample.closeSubscriptionDialog();
//     }    
//   },
//   
//   unsubscribe: function(){
//     
//     var input = sample.getDataFromSubscriptionDialog();
// 	
//     if( input ){	
//     
//       sample.connection.pep.unsubscribe( 
// 	input.jid, 
// 	input.node,
// 	function( iq ){ console.debug( iq );},
// 	function( iq ){ alert("Could not unsubscribe");}
//       );	    
//       sample.closeSubscriptionDialog();	    
//     }    
//   },
//   
//   publish: function(){
//     
//     var text = $("#publishinput").text();
//     var domObj = $("<sampletag>" + text + "</sampletag>" )[0];
//     var node = $("#publishnode").val();
//     
//     sample.connection.pep.publish(
//       node, 
//       domObj,
//       function( iq ){ console.debug( iq );},
//       function( iq ){ alert("Could not publish"); console.debug(iq) }
//     );
//   }
  
};

$(document).ready(function(){

  $("#progressbar").hide().position({my: "center center", at:"center center", of:"body"});
  
  $("#login").dialog({
    autoOpen: true,
    modal: true,
    title: "Login",
    buttons:{
      "Login": function(){
	      
	var jid = $("#jid");
	var pw = $("#pw");
	
	if( jid.val() !== ""  &&
	    jid.val() !== " " &&
	    pw.val() !== "" &&
	    pw.val() !== " "
	){	
	  sample.login( jid.val(), pw.val() );		  
    
	  jid.val('');
	  pw.val('');
	  
	  $(this).dialog("close");
	}
      }
    }
  });

  $("#logoutButton").button().click( sample.logout );
  $("#saveButton").button().click( sample.save );
  $("#loadButton").button().click( sample.load );
  
  $(window).unload( function() {
  
    if( sample.isLoggedIn() ){
      sample.connection.pause();
      sample.saveData();
    }else{
      sample.clearData();
    }
  });

  sample.init();

});