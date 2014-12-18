{exec}    = require 'child_process'

task 'test', "runnig tests", ->
  exec "coffee -c strophe.joap.coffee", (err, out) ->
      console.log err if err?
      console.log out
    exec "buster-test --browser", (err, out) ->
      console.log err if err?
      console.log out
