# Strophe.private.js

Strophe.private.js is a plugin for the XMPP library [Strophe.js](http://code.stanziq.com/strophe) 
to provide XMPP Private XML Storage ( XEP-0049 ).

Strophe.private.js is licensed under the MIT license.

## Usage

After you connected successfully to the XMPP server you can save your data:

    connection.private.set( myTagName, myNamespace, myData, success, error );

Receive your data by specifing the tag name and the namespace:

    conncection.private.get( myTagName, myNamespace, success, error );