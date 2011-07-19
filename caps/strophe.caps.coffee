# This plugin is distributed under the terms of the MIT licence.
# Please see the LICENCE file for details.
#
# Copyright (c) Markus Kohlhase, 2011

# File: strophe.caps.js
# A Strophe plugin for  ( http://xmpp.org/extensions/xep-0115.html )

# NOTE: This plugin has following dependencies:
#
# - Strophe.disco.js
# - sha1.js

Strophe.addConnectionPlugin 'caps', (->

  conn = null

  init = ( c ) ->
    conn = c
    Strophe.addNamespace 'CAPS', "http://jabber.org/protocol/caps"
    conn.disco.addNode Strophe.NS.CAPS

  addNode = (node, opts) -> conn.disco.addNode node, opts

  sendPres = -> conn.send $pres().c "c",
    xmlns: Strophe.NS.CAPS
    hash: "sha-1"
    node: conn.disco.identity.name
    ver: generateVerificationString()

  generateVerificationString = ->

    # 1. Initialize an empty string S.

    S = ""

    # 2. Sort the service discovery identities by category and then by type and
    # then by xml:lang (if it exists), formatted as CATEGORY '/' [TYPE] '/' [LANG]
    # '/' [NAME]. Note that each slash is included even if the LANG or NAME is not
    # included (in accordance with XEP-0030, the category and type MUST be
    # included.

    # not implemented yet

    # 3. For each identity, append the 'category/type/lang/name' to S, followed by
    # the '<' character.

    S += "client/pc//#{conn.disco.identity.name}<"

    # 4. Sort the supported service discovery features.
    
    features = []

    for ns of conn.disco.features
      features.push ns
    features.sort()

    # 5. For each feature, append the feature to S, followed by the '<' character.

    for ns in features
      S += "#{ns}<"

    # 6. If the service discovery information response includes XEP-0128 data forms,
    # sort the forms by the FORM_TYPE (i.e., by the XML character data of the
    # <value/> element).

    # not implemented yet

    # 7. For each extended service discovery information form:

    #  a) Append the XML character data of the FORM_TYPE field's <value/> element,
    #  followed by the '<' character.

    # not implemented yet

    #  b) Sort the fields by the value of the "var" attribute.

    # not implemented yet

    #  c) For each field other than FORM_TYPE:

    #     i. Append the value of the "var" attribute, followed by the '<'
    #     character.

    # not implemented yet

    #    ii. Sort values by the XML character data of the <value/> element.

    # not implemented yet

    #   iii. For each <value/> element, append the XML character data, followed by
    #   the '<' character.

    # not implemented yet

    # 8. Ensure that S is encoded according to the UTF-8 encoding.

    # not implemented yet

    # 9. Compute the verification string by hashing S using the algorithm
    # specified in the 'hash' attribute (e.g., SHA-1 as defined in RFC 3174 [19]).
    # The hashed data MUST be generated with binary output and encoded using
    # Base64 as specified in Section 4 of RFC 4648 [20] (note: the Base64 output
    # MUST NOT include whitespace and MUST set padding bits to zero).

    "#{b64_sha1 S}="

  # Public API
  
  init: init
  addNode: addNode
  sendPres: sendPres
  generateVerificationString: generateVerificationString

)()
