# <LICENCE>
# Copyright (c) <AUTHOR>, <YEAR>

Strophe.addConnectionPlugin 'PLUGIN_NAME', do ->

  # private variables
  conn = null

  # private methods
  myFunction = ->

  # public methods
  init = (c) ->
    conn = c
    # ...

  # public API
  init: init
