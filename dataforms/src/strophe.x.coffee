# Copyright (c) Markus Kohlhase, 2011

# a little helper
helper =
  fill: (src, target, klass) -> for f in src
    target.push if f instanceof klass then f else new klass f

class Form

  @_types: ["form","submit","cancel","result"]

  constructor: (opt) ->
    if opt
      @type = opt.type if opt.type in Form._types
      @title = opt.title
      @instructions = opt.instructions

      helper.fill = (src, target, klass) -> for f in src
        target.push if f instanceof klass then f else new klass f

      if opt.fields
        helper.fill opt.fields, @fields=[], Field if opt.fields
      else if opt.items
        helper.fill opt.items,  @items=[],  Item  if opt.items
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

  _createFieldset: (fields) ->
    fieldset = $ "<fieldset>"
    for f in fields
      id = "Strophe.x.Field-#{ f.type }-#{f.var}"
      fieldset
        .append("<label for='#{id}'>#{f.label or ''}</label>")
        .append( $(f.toHTML()).attr("id", id ) )
        .append("<br />")
    fieldset

  toHTML: ->

    form = $("<form>")
    form.append("<h1>#{@title}</h1>") if @title
    form.append("<p>#{@instructions}</p>") if @instructions

    if @fields
      (@_createFieldset @fields).children().appendTo form

    else if @items
      (@_createFieldset i.fields ).appendTo form for i in @items

    form[0]

class Field

  @_types: ["boolean","fixed","hidden","jid-multi","jid-single","list-multi",
    "list-single", "text-multi", "text-private", "text-single"]

  @_multiTypes = ["list-multi", "jid-multi", "text-multi", "hidden"]

  constructor: (opt) ->

    @options = []
    @values = []

    if opt
      @type = opt.type if opt.type in Field._types
      @desc = opt.desc if opt.desc
      @label = opt.label if opt.label
      @var = opt.var or "_no_var_was_defined_"
      @required = opt.required is true or opt.required is "true"
      @addOptions opt.options if opt.options
      opt.values = [ opt.value ] if opt.value
      @addValues opt.values if opt.values

  type: "text-single"
  desc: null
  label: null
  var: "_no_var_was_defined_"
  required: false

  addValue: (val) -> @addValues [val]

  addValues: (vals) ->
    multi = @type in Field._multiTypes
    if multi or ( not multi and vals.length is 1 )
      @values = [@values..., (v for v in vals)...]
    @

  addOption: (opt) -> @addOptions [opt]

  addOptions: (opts) ->
    if @type is "list-single" or @type is "list-multi"
      if typeof opts[0] isnt "object"
        opts =  (new Option { value: o.toString() } for o in opts)
      helper.fill opts, @options, Option
    @

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

  toHTML: ->

    switch @type.toLowerCase()

      when 'text-single'
        el = ($ "<input type='text' >").attr('placeholder', @desc )
        el.val "#{@values[0]}" if @values

      when 'list-single', 'list-multi'

        el = ($ "<select>")
        el.attr 'multiple', 'multiple' if @type is 'list-multi'

        if @options.length > 0
          for opt in @options when opt
            o = $ opt.toHTML()
            for k in @values
              o.attr 'selected', 'selected' if k.toString() is opt.value.toString()
            o.appendTo el

      when 'boolean'
        el = ($ "<input type='checkbox'>")
        val = @values[0]?.toString?()
        el.attr('checked','checked') if val and ( val is "true" or val is "1" )

      when 'fixed', 'hidden','jid-multi','jid-single','text-multi','text-private'
        throw "not implemented yet"

    el.attr('name', @var )
    el.attr('required', @required ) if @required
    el[0]

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

  toHTML: -> ($ "<option>").attr('value', @value ).text( @label or @value )[0]

class Item

  constructor: (opts) ->

    @fields = []
    helper.fill opts.fields, @fields, Field if opts?.fields

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
