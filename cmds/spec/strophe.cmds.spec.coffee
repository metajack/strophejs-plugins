describe "Commands", ->

  beforeEach ->
    @c = mockConnection()
    @iq =
      to: "n@d/r2"
      from: "n@d/r1"
      type: "get"
      id: "abc"

  it "disco#info includes command feature", ->
    req = $iq(@iq).c("query", xmlns: Strophe.NS.DISCO_INFO)
    spyon @c, "send", (res) ->
      feat = ( ($ f).attr("var") for f in res.find "feature" )
      (expect Strophe.NS.COMMANDS in feat).toBeTruthy()
    receive @c, req

  it "disco#items includes added commands", ->
    @c.cmds.add { node: "a" }
    req = $iq(@iq).c "query",
      xmlns: Strophe.NS.DISCO_ITEMS
      node: Strophe.NS.COMMANDS

    spyon @c, "send", (res) ->
      items = $(res[0]).find "item[node='a']"
      expect(items.first().attr("node")).toEqual "a"
      expect(items.first().attr("jid")).toEqual "n@d/r2"

    receive @c, req

  it "responds to command execution", ->
    @c.cmds.add
      node: "a"
      name: "aName"

    iq = $iq(type: "set").c("command",{
      action: "execute"
      node: "a"
      xmlns: Strophe.NS.COMMANDS })

    spyon @c, "send", (res) ->
      expect(res.find("command").attr("status")).toEqual "completed"
    receive @c, iq

  it "responds with notFound for unknown command", ->
    iq = $iq(type: "set").c "command",
      action: "execute"
      node: "a"
      xmlns: Strophe.NS.COMMANDS

    spyon @c, "send", (res) -> expect(res.find("item-not-found").length).toEqual 1
    receive @c, iq

  it "can execute command", ->
    console.warn "exec"
    spyon @c, "send", (req) ->
      expect(req.find("command").attr("node")).toEqual "aCmd"
      expect(req.find("command").attr("action")).toEqual "execute"

    @c.cmds.execute "n@d/r", "aCmd"
    expect(@c.send).toHaveBeenCalled()

  it "can execute command with data", ->
    @c.cmds.add
      name: "foo"
      node: "foo"
      item: "foo"

    spyon @c, "send", (req) ->
      expect(req.find("command").attr("node")).toEqual "foo"
      expect(req.find("command").attr("action")).toEqual "execute"
      expect(req.find("foo").size()).toEqual 2
      expect(req.find("command foo").size()).toEqual 0

    @c.cmds.execute "n@d/r", "foo", { data: [ "foo", "bar" ] }
    expect(@c.send).toHaveBeenCalled()

    describe "Command", ->

      beforeEach ->
        @c = mockConnection()
        @c.cmds.add name: "foo", node: "foo"
        @cmd = new Strophe.Commands.RemoteCommand @c, "n@d/r", "foo"

      it "has the correct properties", ->
        (expect @cmd.jid).toEqual "n@d/r"
        (expect @cmd.node).toEqual "foo"

      it "can be converted to an iq object", ->

        iq = $iq(to: "n@d/r", type: "set").c "command",
          xmlns: Strophe.NS.COMMANDS
          node: "foo"
          action: "execute"

        (expect @cmd.toIQ().toString()).toEqual iq.toString()

      it "can be executed", ->
        spyon @c, "send", (req) ->
          expect(req.find("command").attr("node")).toEqual "foo"
          expect(req.find("command").attr("action")).toEqual "execute"

        @cmd.execute()
        expect(@c.send).toHaveBeenCalled()

      it "can be canceled", ->
        @cmd.execute()
        spyon @c, "send", (req) ->
          expect(req.find("command").attr("action")).toEqual "cancel"

        @cmd.cancel()
        expect(@c.send).toHaveBeenCalled()

      it "can exectute the 'next' action", ->
        @cmd.execute()
        spyon @c, "send", (req) ->
          expect(req.find("command").attr("action")).toEqual "next"

        @cmd.next()
        expect(@c.send).toHaveBeenCalled()

      it "can exectute the 'prev' action", ->
        @cmd.execute()
        spyon @c, "send", (req) ->
          expect(req.find("command").attr("action")).toEqual "prev"

        @cmd.prev()
        expect(@c.send).toHaveBeenCalled()

      it "can exectute the 'complete' action", ->
        @cmd.execute()
        spyon @c, "send", (req) ->
          expect(req.find("command").attr("action")).toEqual "complete"

        @cmd.complete()
        expect(@c.send).toHaveBeenCalled()

      it "holds all allowed actions based on the current stage", ->

        spyon @c, "send", (res) ->
          console.log res
          expect(res.find("command").attr("status")).toEqual "completed"
        receive @c, @cmd.toIQ()

        (expect @cmd.actions).toEqual []
