//= require <strophe>

/* serverdate plugin
**
** This plugin syncs a local clock to the servers using the response header
** on the BOSH connection
**
*/

var ServerDate = function(){
  if( arguments.length === 0 ){
    return new Date( new Date().valueOf() + ServerDate.skew );
  }
  else if ( arguments.length === 1 ){
    // Covers case where a string is passed in
    return new Date( arguments[0] );
  }
  else {
    return new Date( Date.UTC.apply( null, arguments ) + ((new Date()).getTimezoneOffset() * 60000) );    
  }
};
ServerDate.parse = Date.parse;
ServerDate.UTC   = Date.UTC;
ServerDate.now   = function(){ return (new ServerDate()).valueOf(); };
ServerDate.skew  = 0;

Strophe.addConnectionPlugin('serverdate', {
  init: function(connection){    
    Strophe.Request.prototype._newXHR = function () {
      var xhr = null;
      if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
        if (xhr.overrideMimeType) {
          xhr.overrideMimeType("text/xml");
        }
      } else if (window.ActiveXObject) {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
      }
    
      var handler = this.func.prependArg(this);
    
      xhr.onreadystatechange = function(){
        if(this.readyState == 2){
          var header = this.getResponseHeader('Date');
          var server_date = new Date(header);
          if ( header && server_date != 'Invalid Date' ){
            system_date = new Date();
            skew_ms = server_date - system_date;
            ServerDate.skew = skew_ms;
          }
        }
        handler();
      };
    
      return xhr;
    };
  }
});