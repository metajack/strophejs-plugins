# strophe.register.js

A Strophe Plugin for In-Band Registration.
( [XEP 0077](http://xmpp.org/extensions/xep-0077.html) )

## Usage

Just link the register plugin below the strophe library in your HTML head
section:

``` html
<head>
<!-- ... -->
<script type="text/javascript" src="strophe.min.js"></script>
<script type="text/javascript" src="strophe.register.js"></script>
<!-- ... -->
</head>
```

Before you connect:

``` javascript
var callback = function (status) {
    if (status === Strophe.Status.REGISTER) {
        connection.register.fields.username = "juliet";
        connection.register.fields.password = "R0m30";
        connection.register.submit();
    } else if (status === Strophe.Status.REGISTERED) {
        console.log("registered!");
        connection.authenticate();
    } else if (status === Strophe.Status.CONNECTED) {
        console.log("logged in!");
    } else {
        // every other status a connection.connect would receive
    }
};
connection.register.connect("example.com", callback, wait, hold);
```

After that you're logged in with a fresh smelling jid.

## ToDo

- write specs
