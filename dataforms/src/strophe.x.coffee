# Copyright (c) Markus Kohlhase, 2011

# a little helper
fill = (src, target, klass) -> for f in src
  target.push if f instanceof klass then f else new klass f

class Form

  @_types: ["form","submit","cancel","result"]

  constructor: (opt) ->
    if opt
      @type = opt.type if opt.type in Form._types
      @title = opt.title
      @instructions = opt.instructions

      fill = (src, target, klass) -> for f in src
        target.push if f instanceof klass then f else new klass f

      if opt.fields
        fill opt.fields, @fields=[], Field if opt.fields
      else if opt.items
        fill opt.items,  @items=[],  Item  if opt.items
        @reported = []
        for i in @items
          for f in i.fields
            @reported.push f.var if not (f.var in @reported)

  type: "form"
  title: null
  instructions: null

  toXML: ->

    xml = ($build "x", { xmlns: "jabber:x:data", @type })

    xml.c("title").t(@title.toString()).up() if @title
    xml.c("instructions").t(@instructions.toString()).up() if @instructions

    if @fields
      for f in @fields
        xml.cnode(f.toXML()).up()

    else if @items
      xml.c("reported")

      for r in @reported
        xml.c("field",{var: r}).up()
      xml.up()

      for i in @items
        xml.cnode(i.toXML()).up()

    xml.tree()

  toJSON: ->
    json = {@type}
    json.title = @title if @title
    json.instructions = @instructions if @instructions
    if @fields
      json.fields = []
      for f in @fields
        json.fields.push f.toJSON()
    if @items
      json.items = []
      json.reported = @reported
      json.items.push i.toJSON() for i in @items

    json


class Field

  @_types: ["boolean","fixed","hidden","jid-multi","jid-single","list-multi",
    "list-single", "text-multi", "text-private", "text-single"]

  @_multiTypes = ["list-multi", "jid-multi", "text-multi", "hidden"]

  constructor: (opt) ->

    if opt
      @type = opt.type if opt.type in Field._types
      @desc = opt.desc if opt.desc
      @label = opt.label if opt.label
      @var = opt.var or "_no_var_was_defined_"
      @required = opt.required is true or opt.required is "true"

      if opt.options and ( @type is "list-single" or @type is "list-multi" )
        fill opt.options, @options=[], Option

      @values = [ opt.value ] if opt.value

      if opt.values
        multi = @type in Field._multiTypes
        if multi or ( not multi and opt.values.length is 1 )
          @values = (v for v in opt.values)

  type: "text-single"
  desc: null
  label: null
  var: "_no_var_was_defined_"
  required: false

  toJSON: ->
    json = { @type, @var, @required }
    json.desc = @desc if @desc
    json.label = @label if @label
    json.values = @values if @values

    if @options
      json.options = []
      for o in @options
        json.options.push o.toJSON()
    json

  toXML: ->
    attrs = {@type, @var}
    attrs.label = @label if @label

    xml = ($build "field", attrs )

    xml.c("desc").t(@desc).up() if @desc
    xml.c("required").up() if @required

    if @values
      for v in @values
        xml.c("value").t(v.toString()).up()

    if @options
      for o in @options
        xml.cnode(o.toXML()).up()
    xml.tree()

class Option

  constructor: (opt) ->
    if opt
      @label = opt.label if opt.label
      @value = opt.value if opt.value

  label: ""
  value: ""

  toXML: -> ($build "option", { label: @label })
    .c("value")
    .t(@value.toString())
    .tree()

  toJSON: -> { @label, @value }

class Item

  constructor: (opts) ->

    @fields = []
    fill opts.fields, @fields, Field if opts?.fields

  toXML: ->
    xml = $build "item"
    for f in @fields
      xml.cnode( f.toXML() ).up()
    xml.tree()

  toJSON: ->
    json = {}
    if @fields
      json.fields = []
      for f in @fields
        json.fields.push f.toJSON()
    json

Strophe.x =
  Form: Form
  Field: Field
  Option:Option
  Item:Item
