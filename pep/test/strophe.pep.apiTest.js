TestCase("strophe.pep API tests", {
  
  setUp: function(){   
    this.conn = new Strophe.Connection('http://mydummydomain.org/http-bind/');
  },
  
  "test defaults object should exist": function(){    
    assertEquals( "object", typeof( this.conn.pep.defaults ) );
    assertEquals( "boolean", typeof( this.conn.pep.defaults.matchBare ) );    
  },
  
  "test init should exist": function(){  
    assertEquals( "function", typeof( this.conn.pep.init ) );        
  },
  
  "test subscribe should exist": function(){
    assertEquals( "function", typeof( this.conn.pep.subscribe ) );
  },
  
  "test unsubscribe should exist": function(){
    assertEquals( "function", typeof( this.conn.pep.unsubscribe ) );
  },
  
  "test publish should exist": function(){
    assertEquals( "function", typeof( this.conn.pep.publish ) );
  },
    
  
});