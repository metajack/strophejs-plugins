# strophe.archive.js

strophe.archive.js is a plugin to provide Message Archiving
( [XEP-0136](http://xmpp.org/extensions/xep-0136.html) ).

## Notes on Browser support
If you want to support Browsers which do not support setISO8601 on a Date-Object (like e.g. FF 11), include iso8601_support.js, too.

## Usage

Make sure you include Strophe.rsm as well as Strophe.archive

Init Archive

    # `connection` is Strophe.Connection
    connection.archive.init(connection)

Retrieve Archive

    var jid = 'username@your_xmpp_server';

    connection.listCollections(jid, null, function(collections, responseRsm) {
        // Now you can iterate over the collections. Here we retrieve
        // all the messages contained in each collection.
        collections.forEach(function(collection) {
            collection.retrieveMessages(function(null, function(messages) {
                // Your callback here to process all the messages in this collection.
            });
        });
    });

Retrieve Archive with RSM

    var cachedResponseRsm = null;

    var jid = 'username@your_xmpp_server';

    // Retrieve a max of 1 collections.
    var rsm = new Strophe.RSM({max: 1});

    // Fetch the first collection.
    connection.listCollections(jid, rsm, function(firstCollection, firstRsm) {
        // To demonstrate paging, we use the responseRsm to fetch the next collection.
        var nextRsm = firstRsm.next();
        connection.listCollections(jid, nextRsm, function(secondCollection, secondRsm) {
            // Now we have access to the secondCollection here.
        });
    });

## ToDo

- write specs
