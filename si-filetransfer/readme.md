XEP-0096: SI File Transfer
==========================

http://xmpp.org/extensions/xep-0096.html

> This specification defines a profile of the XMPP stream initiation extension for transferring files between two entities. The protocol provides a modular framework that enables the exchange of information about the file to be transferred as well as the negotiation of parameters such as the transport to be used.

Usage
-----

Include `strophe.si-filetransfer.js` in the head of your page. The will allow you to send and receive stream initiations. In order to actually transfer files, you'll need to also include a transport mechanism, like In-Band Bytestreams or Out-of-Band Data.

``` html
<head>
<!-- ... -->
<script type="text/javascript" src="strophe.min.js"></script>
<script type="text/javascript" src="strophe.si-filetransfer.js"></script>
<!-- ... -->
</head>
```

Add a handler to listen for stream initiations, or use `send` to initiate some of your own.

``` javascript
var connection = new Strophe.Connection();

var fileHandler = function (from, sid, filename, size, mime) {
	// received a stream initiation
  // be prepared
};
connection.si_filetransfer.addFileHandler(fileHandler);

// send a stream initiation
connection.si_filetransfer.send(to, sid, filename, size, mime, function (err) {
  if (err) {
    return console.log(err);
  }
  // start sending file
});
```
