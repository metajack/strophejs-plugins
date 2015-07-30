# strophe.mam.js

strophe.mam.js is a plugin to provide Message Archiving Management
( [XEP-0313]( http://xmpp.org/extensions/xep-0313.html ) ).

This plugin requires that the [Strophe.RSM](https://github.com/strophe/strophejs-plugins/blob/master/rsm/strophe.rsm.js)
plugin be loaded as well.

## Usage

### Querying an archive

`connection.mam.query(where, parameters)`

`where` is the JID hosting the archive.  In most cases you will want to 
set this to your own bare JID in order query your personal archive, but 
it could also be a MUC room, an archiving component or a bot.

`parameters` is an object containing parameters for the query.  This can 
have properties from two and a half categories:

**Handlers**: `onMessage` which gets called for each message received, 
and `onComplete` which is called when the query is completed. 

**Filtering**: Half of this is the parameters defined by MAM; `with`, 
`start` or `end`, which allow you to filter the results on who the 
conversation was *with*, and the time range.

Additionally, parameters from [Result Set Management][RSM] can be 
supplied.  You would probably be most interested in the `after` and 
`before` properties, which allow you to do pagination of the result set, 
and the `max` property, which allow you to limit the number of items in 
each page.  *Note:* Better RSM integration is on the TODO, you currently
have to pick out the `last` or `first` items yourself and pass 
those as `after` or `before` respectively.

[RSM]: http://xmpp.org/extensions/xep-0059.html

### Example

To query, for example, your personal archive for conversations with 
`juliet@capulet.com` you could do:

    connection.mam.query("you@example.com", {
      "with": "juliet@capulet.com",
      onMessage: function(message) {
				console.log("Message from ", $(message).find("forwarded message").attr("from"),
					": ", $(message).find("forwarded message body").text());
				return true;
      },
      onComplete: function(response) {
				console.log("Got all the messages");
      }
		});


