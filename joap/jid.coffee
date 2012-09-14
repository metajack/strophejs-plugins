###
This program is distributed under the terms of the MIT license.
Copyright 2012 (c) Markus Kohlhase <mail@markus-kohlhase.de>
###

###
This is coffee-script fork of
https://github.com/astro/node-xmpp/blob/master/lib/xmpp/jid.js
###

toUnicode  = punycode?.toUnicode or (a) -> a

class JID

  constructor: (a, b, c) ->

    if a and not b? and not c?
      @parseJID a
    else if b?
      @setUser a
      @setDomain b
      @resource = c
    else
      throw new Error 'Argument error'

  user     : null
  resource : null
  domain   : null

  parseJID: (s) ->
    if  s.indexOf('@') >= 0
        @setUser(s.substr(0, s.indexOf('@')))
        s = s.substr(s.indexOf('@') + 1)
    if (s.indexOf('/') >= 0)
        @resource = s.substr(s.indexOf('/') + 1)
        s = s.substr(0, s.indexOf('/'))
    @setDomain s

  toString: ->
    s = @domain
    s = @user + '@' + s if @user
    s += '/' + @resource if @resource
    s

  # Convenience method to distinguish users
  bare : ->
    if @resource then new JID @user, @domain, null
    else @

  # Comparison function
  equals: (other) ->
    @user     is other.user    and
    @domain   is other.domain  and
    @resource is other.resource

  # Setters that do stringprep normalization.
  setUser: (user) -> @user = user and user.toLowerCase()

  # http://xmpp.org/rfcs/rfc6122.html#addressing-domain
  setDomain: (domain) ->
    @domain = domain and
        (domain.split(".").map(toUnicode).join(".")).toLowerCase()

window.JID = JID
