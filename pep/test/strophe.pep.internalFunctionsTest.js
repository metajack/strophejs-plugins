TestCase("strophe.pep internal functions tests", {
  
  setUp: function(){
    
    this.jid = "strophe-pep@jabber.org";
    this.me = "markus-kohlhase@jabber.org/notebook";
    this.node = "events";
    this.xmlns = "http://jabber.org/protocol/pubsub";
    this.xmlns_event = "http://jabber.org/protocol/pubsub#event";
    this.type = "set";
    this.defaultSuccessHandler = function(){ console.log("it works!"); };
    this.defaultErrorHandler = function(){ console.log("standard error"); };
    

    this.conn = new Strophe.Connection('http://mydummydomain.org/http-bind/');
    this.conn.jid = this.me;
    this.defaultMathBare = this.conn.pep.defaults.matchBare;
 
  },
  
  "test Strophe.Connection object exist": function(){
    assertEquals( "object", typeof( this.conn ) );
  },
  
  "test Strophe.NS.* should be correct": function(){
    assertEquals( this.xmlns, Strophe.NS.PUBSUB );
    assertEquals( this.xmlns_event, Strophe.NS.PUBSUB_EVENT );
  },
  
  "test Strophe.Connection.pep object should exist": function(){
     assertEquals( "object", typeof( this.conn.pep ) );
  },
  
  "test _createSubscriptionIQ should return a correct object ": function(){

    assertEquals( "object", typeof( this.conn.pep._createSubscriptionIQ( this.jid, this.node  )) );
    var createdSub = this.conn.pep._createSubscriptionIQ( this.jid, this.node );
    
    var tree = createdSub.tree();
    var pubsub =  createdSub.tree().childNodes[0];
    
    assertEquals( 1 , tree.childNodes.length );
    assertEquals( this.type , tree.getAttribute('type') );
    assertEquals( this.xmlns , pubsub.getAttribute('xmlns') );
    assertEquals( 1, pubsub.childNodes.length );
    assertEquals( Strophe.getBareJidFromJid(this.me) , pubsub.childNodes[0].getAttribute('jid') );
    assertEquals( this.node , pubsub.childNodes[0].getAttribute('node') );
    
    createdSub = this.conn.pep._createSubscriptionIQ( this.jid, this.node, false );
    tree = createdSub.tree();
    pubsub =  createdSub.tree().childNodes[0];
    
    assertEquals( this.me , pubsub.childNodes[0].getAttribute('jid') );
   
  },
  
  "test _createUnsubscriptionIQ should return a correct iq object": function(){
    
    var createdUnSub = this.conn.pep._createUnsubscriptionIQ( this.jid, this.node );
    var tree = createdUnSub.tree();
    var pubsub =  createdUnSub.tree().childNodes[0];
    
    assertEquals( 1 , tree.childNodes.length );
    assertEquals( this.jid , tree.getAttribute('to') );
    assertEquals( this.type , tree.getAttribute('type') );
    assertEquals( this.xmlns ,pubsub.getAttribute('xmlns') );
    assertEquals( 1, pubsub.childNodes.length );
    assertEquals( Strophe.getBareJidFromJid(this.me) , pubsub.childNodes[0].getAttribute('jid') );
    assertEquals( this.node , pubsub.childNodes[0].getAttribute('node') );
    
  },
  
  "test _textToXml": function(){
    
    var xmlString = "<mytag><y id='sample'>sampleText</y></mytag>";
    
    assertEquals( "mytag", this.conn.pep._textToXml( xmlString ).nodeName.toLowerCase() );
    assertEquals( "y", this.conn.pep._textToXml( xmlString ).childNodes[0].nodeName.toLowerCase() );
    assertEquals( "sample", this.conn.pep._textToXml( xmlString ).childNodes[0].getAttribute('id').toLowerCase() );
    assertEquals( "sampleText", this.conn.pep._textToXml( xmlString ).childNodes[0].childNodes[0].nodeValue );
    assertNull( this.conn.pep._textToXml("this is not an xml string") );
    
  },
 
  "test _createPublishItem should work with strings, numbers and boolean values": function(){
    
    var txt = "hello world";
    var bool = false;
    var nr = 55;
        
    assertEquals( "item", this.conn.pep._createPublishItem( txt ).tagName.toLowerCase() );
    assertEquals( 1, this.conn.pep._createPublishItem( txt ).childNodes.length );    
    assertEquals( txt, this.conn.pep._createPublishItem( txt ).childNodes[0].nodeValue );
    assertEquals( txt, this.conn.pep._createPublishItem( txt ).childNodes[0].data );
    assertEquals( "false", this.conn.pep._createPublishItem( bool ).childNodes[0].data );  
    assertEquals( "false", this.conn.pep._createPublishItem( bool ).childNodes[0].nodeValue );
    assertEquals( "55", this.conn.pep._createPublishItem( nr ).childNodes[0].data );
    assertEquals( "55", this.conn.pep._createPublishItem( nr ).childNodes[0].nodeValue );
  },
  
  "test _createPublishItem should work with xml strings": function(){
    
    var xmlString = "<mytag><y id='sample'>sampleText</y></mytag>";
    
    assertEquals( "item", this.conn.pep._createPublishItem( xmlString ).tagName.toLowerCase() );    
    assertEquals( 1, this.conn.pep._createPublishItem( xmlString ).childNodes.length );
    
    var node = this.conn.pep._createPublishItem( xmlString ).childNodes[0];
    assertEquals( 1, node.childNodes.length );   
    assertEquals( "mytag", node.tagName );
    assertEquals( "y", node.childNodes[0].tagName );
    assertEquals( "sample", node.childNodes[0].getAttribute('id'));

   },
  
  "test _createPublishItem should work with xml elements": function(){
    
    var xmlString = "<mytag><y id='sample'>sampleText</y></mytag>";
    var xmlElem = this.conn.pep._textToXml( xmlString );
            
    assertEquals( "item", this.conn.pep._createPublishItem( xmlElem ).tagName.toLowerCase() );
    assertEquals( "mytag", this.conn.pep._createPublishItem( xmlElem ).childNodes[0].tagName.toLowerCase() );
    assertEquals( "y", this.conn.pep._createPublishItem( xmlElem ).childNodes[0].childNodes[0].tagName.toLowerCase() );
    
    xmlElem = Strophe.xmlElement("mytag",[]);
    xmlElem.appendChild( document.createElement("y") );
    
    assertEquals( "mytag", this.conn.pep._createPublishItem( xmlElem ).childNodes[0].tagName.toLowerCase() );
    assertEquals( "y", this.conn.pep._createPublishItem( xmlElem ).childNodes[0].childNodes[0].tagName.toLowerCase() );
    
  },
  
  "test _createPublishItem should work with html dom elements": function(){
    
    var node = document.createElement("mytag");    
    assertEquals( "item", this.conn.pep._createPublishItem( node ).tagName.toLowerCase() );
    assertEquals( node.tagName, this.conn.pep._createPublishItem( node ).childNodes[0].tagName );
    
  },
  
  "test _createPublishIQ should work correctly" : function(){
        
    var createdPublishIQ = this.conn.pep._createPublishIQ( this.node, "hello world" ); 
    
    var tree = createdPublishIQ.tree();
    var pubsub = tree.childNodes[0];
    
    assertEquals( 1 , tree.childNodes.length );
    assertEquals( this.type , tree.getAttribute('type') );
    assertEquals( this.xmlns , pubsub.getAttribute('xmlns') );
    assertEquals( 1, pubsub.childNodes.length );
    
    var publish = pubsub.childNodes[0];
    
    assertEquals( this.node , publish.getAttribute('node') );    
    assertEquals( "publish", publish.tagName );
    assertEquals( 1, publish.childNodes.length );    
    assertEquals( "item", publish.childNodes[0].tagName );
    
    var items = ["hello world", "sample", "<p>some text</p>"];
    
    createdPublishIQ = this.conn.pep._createPublishIQ( this.node, items  ); 
    tree = createdPublishIQ.tree();
    pubsub = tree.childNodes[0];
    publish = pubsub.childNodes[0];
    
    assertEquals( items.length , publish.childNodes.length );
    assertEquals( items[0] , publish.childNodes[0].childNodes[0].data );
    assertEquals( items[1] , publish.childNodes[1].childNodes[0].data );
    assertEquals( "p" , publish.childNodes[2].childNodes[0].tagName );
    assertEquals( "some text" , publish.childNodes[2].childNodes[0].childNodes[0].data );    
    
  },
   
  "test _getAppropriateHandler": function(){
             
    assertEquals("function", typeof( this.conn.pep._getAppropriateHandler ) );
    assertEquals("function", typeof( this.conn.pep._getAppropriateHandler() ) );   
    assertEquals("function", typeof( this.conn.pep._getAppropriateHandler( null, "success" ) ) );   
    assertEquals("function", typeof( this.conn.pep._getAppropriateHandler( null, "error" ) ) );        
           
    this.conn.pep.defaults.success = this.defaultSuccessHandler
    this.conn.pep.defaults.error = this.defaultErrorHandler
    
    assertEquals( this.defaultSuccessHandler, this.conn.pep._getAppropriateHandler( null, "success" ) );
    assertEquals( this.defaultErrorHandler, this.conn.pep._getAppropriateHandler( null, "error") );
    
    var successHandler = function(){ console.log("yeah!"); };
    var errorHandler = function(){ console.log("error"); };
    
    assertEquals( successHandler, this.conn.pep._getAppropriateHandler( successHandler ));
    assertEquals( errorHandler, this.conn.pep._getAppropriateHandler( errorHandler ) );
    assertEquals( successHandler, this.conn.pep._getAppropriateHandler( successHandler, "error" ));
    assertEquals( successHandler, this.conn.pep._getAppropriateHandler( successHandler, "success" ));
    assertEquals( errorHandler, this.conn.pep._getAppropriateHandler( errorHandler, "error" ) );
    assertEquals( errorHandler, this.conn.pep._getAppropriateHandler( errorHandler, "success" ) );    
    
    this.conn.pep.defaults.success = null;
    this.conn.pep.defaults.error = null;
            
  },
  
  "test _getAppropriateJid": function(){    
    
    var bare = Strophe.getBareJidFromJid( this.me );
    var full = this.me;
    
    assertEquals("function", typeof( this.conn.pep._getAppropriateJid ) );
      
    assertEquals( bare, this.conn.pep._getAppropriateJid( full )  );   
    assertEquals( bare, this.conn.pep._getAppropriateJid( full, true )  );
    assertEquals( full, this.conn.pep._getAppropriateJid( full, false )  );
    
    this.conn.pep.defaults.matchBare = false;
     
    assertEquals( full, this.conn.pep._getAppropriateJid( full )  );
    assertEquals( bare, this.conn.pep._getAppropriateJid( full, true )  );
    assertEquals( full, this.conn.pep._getAppropriateJid( full, false )  );
     
    this.conn.pep.defaults.matchBare = null;
     
     assertEquals( full, this.conn.pep._getAppropriateJid( full )  );
     assertEquals( bare, this.conn.pep._getAppropriateJid( full, true )  );
     assertEquals( full, this.conn.pep._getAppropriateJid( full, false )  );
    
    this.conn.pep.defaults.matchBare = this.defaultMathBare;
    
  },
  
  "test _isCorrectNode" : function(){
    assertEquals("function", typeof( this.conn.pep._isCorrectNode ) );
  },
  
  "test _getJid": function(){
       
    var bare = Strophe.getBareJidFromJid( this.me );
    var full = this.me;
    
    assertEquals("function", typeof( this.conn.pep._getJid ) );
    assertEquals( bare, this.conn.pep._getJid() );
    assertEquals( bare, this.conn.pep._getJid( true ) );
    assertEquals( full, this.conn.pep._getJid( false ) );
    
    this.conn.pep.defaults.matchBare = false;
    assertEquals( full, this.conn.pep._getJid() );
    
    this.conn.pep.defaults.matchBare = null;
    assertEquals( full, this.conn.pep._getJid() );
    
     this.conn.pep.defaults.matchBare = this.defaultMathBare;
  }, 
   
  "test _isNode": function(){
    assertEquals("function", typeof( this.conn.pep._isNode ) );
  },
  
  "test _isElement": function(){
    assertEquals("function", typeof( this.conn.pep._isElement ) );
  }
  
});