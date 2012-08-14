# Jabber Object Access Protocol

A strophe plugin for the Jabber Object Access Protocol
([XEP-0075](http://xmpp.org/extensions/xep-0075.html)).

## Usage

Link the `rpc`, `jid` and the `joap` plugin below the strophe library in your
HTML head section:

``` html
<head>
<!-- ... -->
<script type="text/javascript" src="strophe.min.js"></script>
<script type="text/javascript" src="jid.js"></script>
<script type="text/javascript" src="strophe.disco.js"></script>
<script type="text/javascript" src="strophe.rpc.js"></script>
<script type="text/javascript" src="strophe.joap.js"></script>
<!-- ... -->
</head>
```

After your client is sucessfully connected you can create, read, update and
delete objects.

### Server

``` coffeescript
objectServer = new connection.joap.JOAPServer "component.example.org"

# requesting the server description
objectServer.describe (iq, err, parsedDescription) ->

# requesting a class description
objectServer.describe "User", (iq, err, parsedDescription) ->

# creating a new instance
objectServer.add "User", { name:"My Name", age: 99 }, (iq, err, instanceAddress) ->

# reading an instance
objectServer.read "User", "instanceId", (iq, err, parsedResult) ->

# reading only a few properties of an instance
objectServer.read "User", "instanceId", ["email", "age"], (iq, err, parsedResult) ->

# modifying properties of an instance
objectServer.edit "User", "instanceId", { age: 27 }, (iq, err) ->

# deleting an instance
objectServer.delete "User", "instanceId", (iq, err) ->

# searching for instances
objectServer.search "User", {age: 60} , (iq, err, arrayOfInstanceIDs) ->
```

### Class

``` coffeescript
aClass = new connection.joap.JOAPClass "myClass@component.example.org"

# requesting a class description
aClass.describe (iq, err, parsedDescription) ->

# searching for class instances
aClass.search (iq, err, arrayOfInstanceIDs) ->

# creating a new instance
aClass.add { aProperty:"aValue" }, (iq, err, instanceAddress) ->
```

### Object

``` coffeescript
obj = new connection.joap.JOAPObject "myClass@component.example.org/instanceId"

# modifying properties
obj.edit { key: 'value' }, (iq, err) ->
```

## Dependencies

- jid.js
- [rpc](https://github.com/metajack/strophejs-plugins/tree/master/rpc)
- [service discovery](https://github.com/metajack/strophejs-plugins/tree/master/disco) (optional)

## Available JOAP server implementations

- [node-xmpp-joap](https://github.com/flosse/node-xmpp-joap)

## ToDos

- RPC support

## Tests & specs

[buster.js](https://github.com/busterjs/) and
[buster-coffee](https://github.com/jodal/buster-coffee) and
are required (`npm install -g buster buster-coffee`) for running the tests.

First start a test server

```bash
buster server
```

Then navigate with one or more browsers to `localhost:1111` and capture them.
Afterwards you can run the specs:

```bash
cake test
```
