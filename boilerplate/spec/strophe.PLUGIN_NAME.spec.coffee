describe "strophe.PLUGIN_NAME", ->

  mockConnection = ->
    c = new Strophe.Connection()
    c.authenticated = true
    c.jid = 'n@d/r2'
    c._processRequest = ->
    c._changeConnectStatus Strophe.Status.CONNECTED
    c

  realConnection = (jid, pw, host = 'http://localhost/xmpp-httpbind') ->
    c = new Strophe.Connection host
    c.connect jid, pw
    c

  beforeEach ->
    @con = mockConnection()
    # or 
    # @con = realConnection("myJID@host.tld","myPassword")

    @successHandler = jasmine.createSpy "successHandler"
    @errorHandler   = jasmine.createSpy "errorHandler"

  it "does exist", ->
    (expect @con.PLUGIN_NAME).toBeDefined()
