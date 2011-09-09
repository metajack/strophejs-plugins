# Strophe.caps.js

Strophe.caps.js is a plugin for the XMPP library [Strophe.js]( http://code.stanziq.com/strophe )
to provide XMPP Entity Capabilities ( [ XEP-0115 ]( http://xmpp.org/extensions/xep-0115.html ) ).


## Usage

### Adding features:

    connection.caps.add( "myfeature" );

### Removing features:

    connection.caps.remove( "myfeature" );

### Sending presence

    conncection.caps.pres( attrs );

## Dependencies

- strophe.disco.js (by François de Metz)
- sha1.js

## ToDo

- write specs
- support service discovery data forms

## Licence

Strophe.caps.js is licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).

## Authors

- Markus Kohlhase
