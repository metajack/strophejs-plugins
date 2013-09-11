XEP-0047: In-Band Bytestreams
=============================

http://xmpp.org/extensions/xep-0047.html

> This specification defines an XMPP protocol extension that enables any two entities to establish a one-to-one bytestream between themselves, where the data is broken down into smaller chunks and transported in-band over XMPP.

Usage
-----

Include the stream initiation and ibb plugins in the head.

``` html
<head>
<!-- ... -->
<script type="text/javascript" src="strophe.min.js"></script>
<script type="text/javascript" src="strophe.si-filetransfer.js"></script>
<script type="text/javascript" src="strophe.ibb.js"></script>
<!-- ... -->
</head>
```

Add handlers to listen for stream initiations and files, or use the api to send files of your own.

``` javascript
var connection = new Strophe.Connection();

var fileHandler = function(from, sid, filename, size, mime) {
	// received a stream initiation
  // save to data and be prepared to receive the file.
};
connection.si_filetransfer.addFileHandler(fileHandler);

var ibbHandler = function (type, from, sid, data, seq) {
	switch(type) {
    case "open":
      // new file, only metadata
      break;
    case "data":
      // data
      break;
    case "close":
      // and we're done
    default:
      throw new Error("shouldn't be here.")
  }
};
connection.ibb.addIBBHandler(ibbHandler);

// send a stream initiation
connection.si_filetransfer.send(to, sid, filename, filesize, mime, function (err) {
  if (err) {
    return console.log(err);
  }
  // successfully initiated the transfer, now open the band
  connection.ibb.open(to, sid, chunksize, function (err) {
    if (err) {
      return console.log(err);
    }
    // stream is open, start sending chunks of data
    connection.ibb.data(to, sid, seq, msg, function (err) {
      if (err) {
        return console.log(err);
      }
      // ... repeat calling data
      // keep sending until you're ready you've reached the end of the file
      connection.ibb.close(to, sid, function (err) {
        if (err) {
          return console.log(err);
        }
        // done
      });
    });
  });
});

```
