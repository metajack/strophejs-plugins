assert = chai.assert

describe 'JID', ->

  describe 'parsing', ->

    it 'should parse a "domain" JID', ->
      j = new JID 'd'
      assert.equal j.user,     null
      assert.equal j.domain,   'd'
      assert.equal j.resource, null

    it 'should parse a "user@domain" JID', ->
      j = new JID 'u@d'
      assert.equal j.user, 'u'
      assert.equal j.domain, 'd'
      assert.equal j.resource, null

    it 'should parse a "domain/resource" JID', ->
      j = new JID('d/r')
      assert.equal(j.user, null)
      assert.equal(j.domain, 'd')
      assert.equal(j.resource, 'r')

    it  'should parse a "user@domain/resource" JID', ->
      j = new JID 'u@d/r'
      assert.equal(j.user, 'u')
      assert.equal(j.domain, 'd')
      assert.equal(j.resource, 'r')

    it 'should parse an internationalized domain name as unicode', ->
      j = new JID('öko.de')
      assert.equal(j.domain, 'öko.de')

    it 'should parse an internationalized domain name as ascii/punycode', ->
      j = new JID 'xn--ko-eka.de'
      assert.equal j.domain, 'öko.de'

    it 'should parse a JID with punycode', ->
      j = new JID('Сергей@xn--lsa92diaqnge.xn--p1ai')
      assert.equal j.user, 'сергей'
      assert.equal j.domain, 'приме́р.рф'

  describe 'serialization', ->
    it 'should serialize a "domain" JID', ->
      j = new JID(null, 'd')
      assert.equal(j.toString(), 'd')

    it 'should serialize a "user@domain" JID', ->
      j = new JID('u', 'd')
      assert.equal(j.toString(), 'u@d')

    it 'should serialize a "domain/resource" JID', ->
       j = new JID(null, 'd', 'r')
       assert.equal(j.toString(), 'd/r')

    it 'should serialize a "user@domain/resource" JID', ->
      j = new JID 'u', 'd', 'r'
      assert.equal j.toString(), 'u@d/r'

  describe 'equality', ->

    it 'should parsed JIDs should be equal', ->
      j1 = new JID 'foo@bar/baz'
      j2 = new JID 'foo@bar/baz'
      assert.equal j1.equals(j2), yes

    it 'should parsed JIDs should be not equal', ->
      j1 = new JID 'foo@bar/baz'
      j2 = new JID 'quux@bar/baz'
      assert.equal j1.equals(j2), no

    it 'should should ignore case in user', ->
      j1 = new JID 'foo@bar/baz'
      j2 = new JID 'FOO@bar/baz'
      assert.equal j1.equals(j2), yes

    it 'should should ignore case in domain', ->
       j1 = new JID 'foo@bar/baz'
       j2 = new JID 'foo@BAR/baz'
       assert.equal(j1.equals(j2), true)

    it 'should should not ignore case in resource', ->
      j1 = new JID 'foo@bar/baz'
      j2 = new JID 'foo@bar/Baz'
      assert.equal j1.equals(j2), no

    it 'should should ignore international caseness', ->
      j1 = new JID 'föö@bär/baß'
      j2 = new JID 'fÖö@BÄR/baß'
      assert.equal j1.equals(j2), yes
