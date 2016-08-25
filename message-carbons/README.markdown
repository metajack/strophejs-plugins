# strophe.message-carbons.js

strophe.message-carbons.js is a plugin to provide simplified support for Message Carbons
( [XEP-0280]( http://xmpp.org/extensions/xep-0280.html ) ).

## Usage

### Enabling message carbons

`connection.messageCarbons.enable(onMessageCarbon)`

`onMessageCarbon` is a function that gets called back when new message carbons are recieved.  More information about this handler is found in the section below.

Sometime after connecting to a server, call this function to send the proper IQ packet to the server to enable message carbons for this connection.  Additionally, pass in a callback that gets called when a carbon is recieved.

### Disabling message carbons

`connection.messageCarbons.disable()`

This call will send the proper IQ packet to the server to disable message carbons for this connection.  The only real use of this function is to save bandwidth for the remainder of the connection, as it's better to just not call `enable` in the first place if carbons are not desired.

### Handling carbons

The function passed into the `enable` function is called whenever a Message Carbon is recieved.  It has the following prototype:

`onMessageCarbon(carbon)`

`carbon` is defined as follows:

	{
		// Direction of the carbon message
		direction: 'sent' | 'received',
		
		// Type of message in the sub-message, usually 'chat'
		// Same as $(innerMessage).attr("type")
		type: '',
		
		// Receipient of the message.  
		// Same as $(innerMessage).attr("to")
		to: '', 
		
		// Sender of the message.  
		// Same as $(innerMessage).attr("from")
		from: '', 
		
		// The inner message object
		innerMessage: {}
	}

### Example

	function onConnected() {
		// ...
		connection.messageCarbons.enable(onMessageCarbon);
	}
	
	function onMessageCarbon(carbon) {
		// Status messages are also sent as carbons.  Instead of filtering them 
		// at a module level, we let you decide if you want to handle them.
		var body = $(carbon.innerMessage).children("body").text() || "";
		if (!body)
			return;

		if (carbon.direction === 'sent') {
			var contact = findContactInRoster(Strophe.getBareJidFromJid(carbon.to));
			if (contact && carbon.type == "chat") {
				// Handle a message sent FROM this user, but from another device
				var conversationItem = { text: body, to: carbon.to, isMe: true, dt: new Date() };
				contact.conversation.push(conversationItem);
				// Update view by sending a broadcast or event
			}
		}
		else {
			// On received messages, unless you have a special way to display them, 
			// you can just call your original message handler
			onMessage(carbon.innerMessage);
		}
	}
