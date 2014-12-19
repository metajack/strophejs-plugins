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

# searching and reading in one step
objectServer.searchAndRead "User", {type: "admin"}, ["email"], (iq, err, arrayOfInstancObjects) ->

# performing a method call
objectServer.methodCall "myMethod", "User", ["param1","param2"], (iq, err, result) ->
```

### Class

``` coffeescript
aClass = new connection.joap.JOAPClass "myClass@component.example.org"

# requesting a class description
aClass.describe (iq, err, parsedDescription) ->

# searching for class instances
aClass.search (iq, err, arrayOfInstanceIDs) ->

# searching and reading
aClass.searchAndRead filter, limits, (iq, err, arrayOfInstances) ->

# creating a new instance
aClass.add { aProperty:"aValue" }, (iq, err, instanceAddress) ->

# subscribe to attribute changes of all instances
aClass.subscribe successHandler, changeHandler, {bare:true}
```

### Object

``` coffeescript
obj = new connection.joap.JOAPObject "myClass@component.example.org/instanceId"

# modifying properties
obj.edit { key: 'value' }, (iq, err) ->

# subscribe to attribute changes of this instance
aClass.subscribe successHandler, changeHandler, {bare:true}
```

## Dependencies

- jid.js
- [rpc](https://github.com/metajack/strophejs-plugins/tree/master/rpc)
- [punycode](https://github.com/bestiejs/punycode.js/) (optional)
- [service discovery](https://github.com/metajack/strophejs-plugins/tree/master/disco) (optional)

## Available JOAP server implementations

- [node-xmpp-joap](https://github.com/flosse/node-xmpp-joap)

## Run tests

```bash
npm i && npm test
```
