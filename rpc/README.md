# Jabber-RPC Module

A strophe plugin for Jabber-RPC extension ([XEP-0009](http://xmpp.org/extensions/xep-0009.html)).

See the XEP abstract :

> This specification defines an XMPP protocol extension for transporting XML-RPC encoded requests and responses between two XMPP entities. The protocol supports all syntax and semantics of XML-RPC except that it uses XMPP instead of HTTP as the underlying transport.

This plugin does not aim at managing your flow of RPC. It is a simple helper to send and handle remote requests between two XMPP nodes.

## Usage

Just link the rpc plugin below the strophe library in your HTML head section:

``` html
<head>
<!-- ... -->
<script type="text/javascript" src="strophe.min.js"></script>
<script type="text/javascript" src="strophe.rpc.js"></script>
<!-- ... -->
</head>
```

It's preferable to also use the service discovery plugin to respond correctly to `disco#info` requests. You can [download it](https://github.com/metajack/strophejs-plugins/tree/master/disco) and add it as follow :

``` html
<head>
<!-- ... -->
<script type="text/javascript" src="strophe.min.js"></script>
<script type="text/javascript" src="strophe.disco.js"></script>
<script type="text/javascript" src="strophe.rpc.js"></script>
<!-- ... -->
</head>
```

## API

The plugin prototype is accessible from the `connection.rpc` variable

### Send an RPC

There are four functions to send RPC :

- `sendRequest(id, to, method, params)`
  - `method` is the string name of the method to call
  - `params` is an array of parameters to send
- `sendResponse(id, to, result)`
  - `result` is the object to send as the result of the request
- `sendError(id, to, code, message)`
  - `code` is the number of the error
  - `message` is the message describing the error
- `sendXMLElement(id, to, xml)`
  - `xml` is the XML Element that will be sent (whether it is properly formed or not)

The parameters `id` and `to` are respectively the id of the request and the the jid of the recipient.

### Handle incoming RPCs

It is possible to handle incoming RPCs using the functions :

- `addRequestHandler`
- `addResponseHandler`
- `addXMLHandler`

The handlers you pass to these functions take different parameters :

```javascript
var responseHandler = function(id, from, result, error) {
	// error is a boolean
	// it is true if the response was an error message
	if (error === true) { ... }
	else { ... }
}
connection.rpc.addResponseHandler(responseHandler);

var requestHandler = function(id, from, method, parameters) { ... }
connection.rpc.addRequestHandler(requestHandler);

var xmlHandler = function(xml) { ... }
connection.rpc.addXMLHandler(xmlHandler)
```

Note that the parser of this module won't throw any exception. However `result`, `method` and `parameters` will be set as `null` if the incoming message is not XML-RPC compliant.

### Whitelist

By default, this plugin will accept RPC from everyone. However, it is possible to use a whitelist of JID to filter incoming RPCs.

Use the function `addJidToWhiteList` to accept JIDs. Note that it is possible to use a wildcard for the node or the domain.

Examples :

```javascript
connection.rpc.addJidToWhiteList("me@jabber.org");
connection.rpc.addJidToWhiteList(["*@jabber.org", "me@*"]);
connection.rpc.addJidToWhiteList("*@*");
```

## Tests & specs

I use the node module `buster` for the tests. Install it and use it as follow :

```bash
$ npm install buster
$ buster server
```

Open a browser and navigate to `http://localhost:1111` and capture the browser.
Then you can run the tests:

```
$  buster test --browser
```
