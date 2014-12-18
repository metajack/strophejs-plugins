# strophe.cmds.js

strophe.cmds.js is a plugin to provide Ad-Hoc Commands
( [XEP-0050](http://xmpp.org/extensions/xep-0050.html) ).

## Usage

### Client side

    cmd = new Strophe.Commands.RemoteCommand(conn, jid, node);

    cmd.execute({

      success: function(res, cmd){

        proccessFields( cmd.form.fields );
        doSomething();
        resp = new Strophe.x.Form();
        cmd.complete({ responseForm: resp });

      error: myErrorFunction

    }});

You can also use the interactive GUI mode

    cmd.execute({gui:true});

### Server side

    conn.cmds.add({node: "nodename", name: "Command description"},
        function(request, result) {
            var command_successful = doSomething(request);

            result.attrs({status: "completed"});

            if (command_successful) {
                result.c('note', {type: "info"}, 'infotext');
            } else {
                result.c('note', {type: "info"}, 'infotext');
                result.c('error', {type: 'cancel'});
                result.c('forbidden', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'});
            }
            return result;
    });

## Dependencies

- strophe.disco.js
- strophe.x.js
- jQuery
- jQueryUI (for GUI mode)

## ToDo

- Write specs for UI commands
- Write better documentation

## Authors

- [amaierhofer](https://github.com/amaierhofer)
- [tjahma](https://github.com/tjahma)
- [flosse](https://github.com/flosse)
