/**
 * <LICENCE>
 * Copyright (c) <AUTHOR>, <YEAR>
 */

Strophe.addConnectionPlugin('PLUGIN_NAME', (function(){

  // private variables
  var conn = null;

  // private methods
  var myFunction = function(){};

  // public methods
  var init = function(c){
    conn = c
    // ...
  };

  // public API
  return ({
    init: init
  });

}())
