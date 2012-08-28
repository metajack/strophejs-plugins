buster.spec.expose()

if require?
  JID = require('./../lib/xmpp').JID
else if window?
  JID = window.JID

describe 'JID', ->

  describe 'parsing', ->

    it 'should parse a "domain" JID', ->
      j = new JID 'd'
      assert.equals j.user,     null
      assert.equals j.domain,   'd'
      assert.equals j.resource, null

    it 'should parse a "user@domain" JID', ->
      j = new JID('u@d')
      assert.equals(j.user, 'u')
      assert.equals(j.domain, 'd')
      assert.equals(j.resource, null)

    it 'should parse a "domain/resource" JID', ->
      j = new JID('d/r')
      assert.equals(j.user, null)
      assert.equals(j.domain, 'd')
      assert.equals(j.resource, 'r')

    it  'should parse a "user@domain/resource" JID', ->
      j = new JID 'u@d/r'
      assert.equals(j.user, 'u')
      assert.equals(j.domain, 'd')
      assert.equals(j.resource, 'r')

    it 'should parse an internationalized domain name as unicode', ->
      j = new JID('öko.de')
      assert.equals(j.domain, 'öko.de')

    it 'should parse an internationalized domain name as ascii/punycode', ->
      j = new JID 'xn--ko-eka.de'
      assert.equals j.domain, 'öko.de'

    it 'should parse a JID with punycode', ->
      j = new JID('Сергей@xn--lsa92diaqnge.xn--p1ai')
      assert.equals j.user, 'сергей'
      assert.equals j.domain, 'приме́р.рф'

  describe 'serialization', ->
    it 'should serialize a "domain" JID', ->
      j = new JID(null, 'd')
      assert.equals(j.toString(), 'd')

    it 'should serialize a "user@domain" JID', ->
      j = new JID('u', 'd')
      assert.equals(j.toString(), 'u@d')

    it 'should serialize a "domain/resource" JID', ->
       j = new JID(null, 'd', 'r')
       assert.equals(j.toString(), 'd/r')

    it 'should serialize a "user@domain/resource" JID', ->
      j = new JID('u', 'd', 'r')
      assert.equals(j.toString(), 'u@d/r')

  describe 'equality', ->

    it 'should parsed JIDs should be equal', ->
      j1 = new JID('foo@bar/baz')
      j2 = new JID('foo@bar/baz')
      assert.equals(j1.equals(j2), true)

    it 'should parsed JIDs should be not equal', ->
      j1 = new JID('foo@bar/baz')
      j2 = new JID('quux@bar/baz')
      assert.equals(j1.equals(j2), false)

    it 'should should ignore case in user', ->
      j1 = new JID('foo@bar/baz')
      j2 = new JID('FOO@bar/baz')
      assert.equals(j1.equals(j2), true)

    it 'should should ignore case in domain', ->
       j1 = new JID('foo@bar/baz')
       j2 = new JID('foo@BAR/baz')
       assert.equals(j1.equals(j2), true)

    it 'should should not ignore case in resource', ->
      j1 = new JID('foo@bar/baz')
      j2 = new JID('foo@bar/Baz')
      assert.equals(j1.equals(j2), false)

    it 'should should ignore international caseness', ->
      j1 = new JID('föö@bär/baß')
      j2 = new JID('fÖö@BÄR/baß')
      assert.equals(j1.equals(j2), true)
