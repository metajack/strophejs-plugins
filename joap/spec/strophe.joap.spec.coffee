fs      = require('fs')
jsdom   = require('jsdom')
jquery  = fs.readFileSync("./lib/jquery.js").toString()
strophe = fs.readFileSync("./lib/strophe.js").toString()
rpc     = fs.readFileSync("./lib/strophe.rpc.js").toString()
jid     = fs.readFileSync("./lib/jid.js").toString()
joap    = fs.readFileSync("./strophe.joap.js").toString()

describe "strophe.joap loading", ->

  it "loads the strophe library", ->

    window = null
    Strophe = null
    $ = null
    $iq = null
    JID = null

    mockConnection = ->
      c = new Strophe.Connection()
      c.authenticated = true
      c.jid = 'n@d/r2'
      c._processRequest = ->
      c._changeConnectStatus Strophe.Status.CONNECTED
      c

    str = (builder) ->
      if builder.tree
        return Strophe.serialize(builder.tree())
      Strophe.serialize(builder)

    spyon = (obj, method, cb) ->
      spyOn(obj, method).andCallFake (res)->
        cb.call @, ($ str res)

    receive = (c,req) ->
      c._dataRecv(createRequest(req))
      expect(c.send).toHaveBeenCalled()

    createRequest = (iq) ->
      iq = iq.tree() if typeof iq.tree is "function"
      req = new Strophe.Request(iq, ->)
      req.getResponse = ->
        env = new Strophe.Builder('env', {type: 'mock'}).tree()
        env.appendChild(iq)
        env
      req

    jsdom.env
      html: '<html><body></body></html>'
      src: [ jquery, strophe, rpc, joap, jid]
      done: (errors, w) ->
        Strophe = w.Strophe
        $ = w.jQuery
        $iq = w.$iq
        JID = w.JID
        window = w

    waitsFor -> !!window

    runs ->
      (expect window.Strophe).toBeDefined()
      (expect window.$).toBeDefined()
      (expect window.jQuery).toBeDefined()
      (expect window.JID).toBeDefined()

    describe "strophe.joap plugin", ->

      beforeEach ->
        @c = mockConnection()
        @successHandler = jasmine.createSpy "successHandler"
        @errorHandler   = jasmine.createSpy "errorHandler"

      it "provides connection.joap", ->
        (expect window.Strophe).toBeDefined()
        (expect typeof @c.joap).toEqual "object"

      it "has a method for creating a new connection to an  object server", ->
        server = new @c.joap.JOAPServer "service.example.com"
        (expect server).toBeDefined()

      describe "object server", ->

        server = null

        beforeEach ->
          server = new @c.joap.JOAPServer "service.example.com"

        it "can create an instance", ->

          spyon @c, "send", (iq) ->
            (expect iq.attr "to").toEqual "user@service.example.com"
            (expect iq.attr "type").toEqual "set"

            child = $ iq.children()[0]

            (expect child.attr "xmlns").toEqual "jabber:iq:joap"
            (expect child[0].tagName).toEqual "ADD"
            (expect child.children().length).toEqual 2

            foo = $ child.children()[0]
            pass = $ child.children()[1]

            (expect foo[0].tagName).toEqual "ATTRIBUTE"
            (expect pass[0].tagName).toEqual "ATTRIBUTE"
            (expect foo.children().length).toEqual 2
            (expect foo.children()[0].tagName).toEqual "NAME"
            (expect foo.children()[1].tagName).toEqual "VALUE"
            (expect ($ "string", foo).text()).toEqual "foo"
            (expect pass.children().length).toEqual 2
            (expect child.children().length).toEqual 2
            (expect ($ "i4", pass).text()).toEqual "2"

          server.add "user", {name: "foo", pass: 2}, (iq, err, address) ->

        it "can parse an error message", ->
          spyon @c, "send", (req) =>
            res = $iq({type:'error', id: req.attr 'id'})
              .c("add").c("error", code:403).t("My error message")
            @c._dataRecv createRequest(res)
          server.add "User", {name: "foo", pass: 2}, (iq, err, instanceId) ->
            (expect err.message).toEqual "My error message"
            (expect err.code).toEqual 403

        it "can parse an 'service-unavailable' error", ->
          spyon @c, "send", (req) =>
            res = $iq({type:'error', id: req.attr 'id'})
              .c("add").c("error", code:503)
            @c._dataRecv createRequest(res)
          server.add "User", {name: "foo", pass: 2}, (iq, err, instanceId) ->
            (expect err.code).toEqual 503
            (expect err.message).toEqual "JOAP server is unavailable"

        it "can parse an error message", ->

        it "can parse the new instance id", ->
          spyon @c, "send", (req) =>
            res = $iq({type:'result', id: req.attr 'id'})
              .c("add").c("newAddress").t("User@example.org/markus")
            @c._dataRecv createRequest(res)
          server.add "User", {name: "foo", pass: 2}, (iq, err, instanceId) ->
            (expect instanceId).toEqual "User@example.org/markus"

        it "can add a new instance addressed by a full JID", ->
          spyon @c, "send", (req) =>
            res = $iq({type:'result', id: req.attr 'id'})
              .c("add").c("newAddress").t("User@service.example.org/markus")
            @c._dataRecv createRequest(res)
          @c.joap.add "User@service.example.org", {name: "foo", pass: 2}, (iq, err, instanceId) ->
            (expect instanceId).toEqual "User@service.example.org/markus"

        it "can edit an instance", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "User@service.example.com/myId"
            (expect iq.attr "type").toEqual "set"
            (expect ($ "edit",iq).attr "xmlns").toEqual "jabber:iq:joap"
            ($ "attribute",iq).each ->
              (expect ($ @).children().length).toEqual 2

            res = $iq({type:'result', id: iq.attr 'id'}).c("edit")
            @c._dataRecv createRequest(res)

          server.edit "User", "myId",{ name:"x", age: 33 },(iq, err) ->
            (expect typeof iq).toEqual "object"
            (expect err).toBeFalsy()

        it "can edit an instance addressed by a full JID", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "User@service.example.com/myId"
            res = $iq({type:'result', id: iq.attr 'id'}).c("edit")
            @c._dataRecv createRequest(res)

          @c.joap.edit "User@service.example.com/myId",{ name:"y", age: 66 },(iq, err) ->
            (expect typeof iq).toEqual "object"
            (expect err).toBeFalsy()

        it "can read an instance", ->
          spyon @c, "sendIQ", (iq) ->
            (expect iq.attr "to").toEqual "User@service.example.com/myId"
            (expect iq.attr "type").toEqual "get"
            (expect ($ "read",iq).attr "xmlns").toEqual "jabber:iq:joap"
          server.read "User", "myId", (iq, err, obj) ->

        it "can read from a full JID", ->
          spyon @c, "sendIQ", (iq) ->
            (expect iq.attr "to").toEqual "User@service.example.com/myId"
          @c.joap.read "User@service.example.com/myId", (iq, err, obj) ->

        it "can parse the read attributes", ->
          spyon @c, "send", (req) =>
            res = $iq({type:'result', id: req.attr 'id'})
              .c("read")
                .c("attribute")
                  .c("name").t("prop").up()
                  .c("value").c("int").t('5').up().up()
                .c("attribute")
                  .c("name").t("obj").up()
                  .c("value").c("struct")
                    .c("member")
                      .c("name").t("foo").up()
                      .c("value").c("string").t("bar").up().up().up().up().up()
                .c("attribute")
                  .c("name").t("arr").up()
                  .c("value")
                    .c("array")
                      .c("data")
                        .c("value").c("boolean").t('1').up().up()
                        .c("value").c("double").t("-0.5")

            @c._dataRecv createRequest(res)

          server.read "User", "id",(iq, err, obj) ->
            (expect obj.prop).toEqual 5
            (expect obj.obj.foo).toEqual "bar"
            (expect obj.arr).toEqual [ true, -0.5 ]

        it "can delete an instance", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "User@service.example.com/myId"
            (expect iq.attr "type").toEqual "set"
            (expect ($ "delete",iq).attr "xmlns").toEqual "jabber:iq:joap"
            res = $iq({type:'result', id: iq.attr 'id'}).c("delete")
            @c._dataRecv createRequest(res)

          server.delete "User", "myId", (iq, err) ->
            (expect typeof iq).toEqual "object"
            (expect err).toBeFalsy()

        it "can delete an instance addressed by a full JID", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "User@service.example.com/myId"
            res = $iq({type:'result', id: iq.attr 'id'}).c("delete")
            @c._dataRecv createRequest(res)

          @c.joap.delete "User@service.example.com/myId", (iq, err) ->
            (expect typeof iq).toEqual "object"
            (expect err).toBeFalsy()

        it "can search instances", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "User@service.example.com"
            (expect iq.attr "type").toEqual "get"
            (expect ($ "search",iq).attr "xmlns").toEqual "jabber:iq:joap"
            res = $iq({type:'result', id: iq.attr 'id'}).c("search")
              .c("item").t("Class@service.example.com/id0").up()
              .c("item").t("Class@service.example.com/id2").up()
            @c._dataRecv createRequest(res)

          server.search "User", (iq, err, result) ->
            (expect typeof iq).toEqual "object"
            (expect result[0]).toEqual "Class@service.example.com/id0"
            (expect result[1]).toEqual "Class@service.example.com/id2"

        it "can search instances addressed by a full JID", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "User@service.example.com"
            res = $iq({type:'result', id: iq.attr 'id'}).c("search")
              .c("item").t("Class@service.example.com/id0").up()
            @c._dataRecv createRequest(res)

          @c.joap.search "User@service.example.com", (iq, err, result) ->
            (expect typeof iq).toEqual "object"
            (expect result[0]).toEqual "Class@service.example.com/id0"

        it "can send a describe request to a class", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "Class@service.example.com"
            (expect iq.attr "type").toEqual "get"
            (expect ($ "describe", iq).attr "xmlns").toEqual "jabber:iq:joap"
            res = $iq({type:'result', id: iq.attr 'id'}).c("describe")
              .c("desc", "xml:lang":"en-US").t("Class description").up()
              .c("attributeDescription", { writeable:false, required:true })
                .c("name").t("myAttribute").up()
                .c("type").t("int").up()
                .c("desc", "xml:lang":"en-US").t("Foo").up()
                .c("desc", "xml:lang":"de-DE").t("Alles mögliche").up().up()
              .c("methodDescription", { allocation:"class"})
                .c("name").t("methodname").up()
                .c("returnType").t("boolean").up()
                .c("desc", "xml:lang":"en-US").t("myAttribute").up().up()
              .c("superclass").t("SuperClass@service.example.com").up()
              .c("timestamp").t("2003-01-07T20:08:13Z").up()
            @c._dataRecv createRequest(res)

          server.describe "Class", (iq, err, result) ->
            (expect typeof iq).toEqual "object"
            (expect typeof result).toEqual "object"
            (expect result.desc["en-US"]).toEqual "Class description"
            (expect result.attributes.myAttribute.type).toEqual "int"
            (expect result.attributes.myAttribute.desc["en-US"]).toEqual "Foo"
            (expect result.superclass).toEqual "SuperClass@service.example.com"

        it "can send a describe request to the server", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "service.example.com"
          server.describe (iq, err, result) ->

        it "can send a describe request to the server", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "service.example.com"
            res = $iq({type:'result', id: iq.attr 'id'}).c("describe")
              .c("desc", "xml:lang":"en-US").t("Server description").up()
            @c._dataRecv createRequest(res)
          @c.joap.describe "service.example.com" ,(iq, err, result) ->

        it "can send a describe requests to an instance", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "Class@service.example.com/id"
            res = $iq({type:'result', id: iq.attr 'id'}).c("describe")
              .c("desc", "xml:lang":"en-US").t("Instance description").up()
            @c._dataRecv createRequest(res)
          server.describe "Class", "id", (iq, err, result) ->

      describe "joap object", ->

        id = "Class@service.example.com/id"

        beforeEach ->
          @obj = new @c.joap.JOAPObject id

        it "can be created", ->

          joapObj = new @c.joap.JOAPObject id
          (expect joapObj.jid.toString()).toEqual id
          (expect typeof joapObj.read).toEqual "function"
          (expect typeof joapObj.edit).toEqual "function"
          (expect typeof joapObj.describe).toEqual "function"

        it "can read the remote state", ->

          spy = jasmine.createSpy "execSpy"
          spyon @c, "send", (req) =>
            res = $iq({type:'result', id: req.attr 'id'})
              .c("read")
                .c("attribute")
                  .c("name").t("prop").up()
                  .c("value").c("int").t('5').up().up()

            @c._dataRecv createRequest(res)

          @obj.read (iq, err, obj) ->
            (expect obj.prop).toEqual 5
            spy()
          (expect spy).toHaveBeenCalled()

        it "can edit a property", ->
          spy = jasmine.createSpy "execSpy"
          spyon @c, "send", (iq) =>
            (expect ($ "edit",iq).attr "xmlns").toEqual "jabber:iq:joap"
            (expect ($ "value",iq).text()).toEqual '33'

            res = $iq({type:'result', id: iq.attr 'id'}).c("edit")
            @c._dataRecv createRequest(res)

          @obj.edit { age: 33 },(iq, err) ->
            (expect typeof iq).toEqual "object"
            (expect err).toBeFalsy()
            spy()
          (expect spy).toHaveBeenCalled()

        it "provied the describe method", ->
          spyon @c, "send", (iq) =>
            (expect iq.attr "to").toEqual "Class@service.example.com/id"
            res = $iq({type:'result', id: iq.attr 'id'}).c("describe")
              .c("desc", "xml:lang":"en-US").t("Instance description").up()
            @c._dataRecv createRequest(res)
          @obj.describe (iq, err, result) ->

      describe "joap class", ->

        clz = null

        beforeEach ->
          clz = new @c.joap.JOAPClass "class@service.example.com"

        it "can be created", ->

          (expect clz.jid.toString()).toEqual "class@service.example.com"
          (expect typeof clz.read).toEqual "function"
          (expect typeof clz.edit).toEqual "function"
          (expect typeof clz.delete).toEqual "function"
          (expect typeof clz.add).toEqual "function"
          (expect typeof clz.search).toEqual "function"

        it "can read an instance", ->
          spyon @c, "send", (req) =>
            res = $iq({type:'result', id: req.attr 'id'})
              .c("read")
                .c("attribute")
                  .c("name").t("prop").up()
                  .c("value").c("int").t('3').up().up()

            @c._dataRecv createRequest(res)

          clz.read "123", (iq, err, obj) ->
            (expect obj.prop).toEqual 3

        it "can edit a property", ->
          spyon @c, "send", (iq) =>
            (expect ($ "edit",iq).attr "xmlns").toEqual "jabber:iq:joap"

            res = $iq({type:'result', id: iq.attr 'id'}).c("edit")
            @c._dataRecv createRequest(res)

          clz.edit "432", { age: 33 },(iq, err) ->
            (expect typeof iq).toEqual "object"
            (expect err).toBeFalsy()

