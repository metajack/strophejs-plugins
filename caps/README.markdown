# Strophe.CAPS.js

Strophe.caps.js is a plugin to provide XMPP Entity Capabilities
( [ XEP-0115 ]( http://xmpp.org/extensions/xep-0115.html ) ).


## Usage

### Adding features

    connection.caps.add( "myfeature" );

### Removing features

    connection.caps.remove( "myfeature" );

### Sending presence

    conncection.caps.pres( attrs );

## Dependencies

- strophe.disco.js (by François de Metz)
- sha1.js

## ToDo

- write specs
- support service discovery data forms

## Authors

- Markus Kohlhase

# Strophe.caps.jsonly.js

Strophe.caps.jsonly.js is a similar plugin as Strophe.CAPS.js but isn't developed in coffeescript. 
In order to prevent naming conflicts, it has been renamed to this.

It uses strophe.disco.js to add features etc.

## Usage

See [strophe.disco.js](https://github.com/metajack/strophejs-plugins/tree/master/disco) for more info.

## Dependencies

- strophe.disco.js (by François de Metz)
- sha1.js

## Authors

- [Michael Weibel](http://github.com/mweibel)
