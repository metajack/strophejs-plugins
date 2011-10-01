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
  
    @c.cmds.execute "n@d/r", "foo", [ "foo", "bar" ]
    expect(@c.send).toHaveBeenCalled()
