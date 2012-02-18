# Copyright (c) Markus Kohlhase, 2011

# a little helper
helper =

  fill: (src, target, klass) -> for f in src
    target.push if f instanceof klass then f else new klass f

  createHtmlFieldCouple: (f) ->
    div = $ "<div>"
    id = "Strophe.x.Field-#{ f.type }-#{f.var}"
    div
      .append("<label for='#{id}'>#{f.label or ''}</label>")
      .append( $(f.toHTML()).attr("id", id ) )
      .append("<br />")
    div.children()

  getHtmlFields: (html) ->
    html = $ html
    [html.find("input")..., html.find("select")..., html.find("textarea")...]

class Form

  @_types: ["form","submit","cancel","result"]

  constructor: (opt) ->

    @fields = []
    @items = []
    @reported = []

    if opt
      @type = opt.type if opt.type in Form._types
      @title = opt.title
      @instructions = opt.instructions

      helper.fill = (src, target, klass) -> for f in src
        target.push if f instanceof klass then f else new klass f

      if opt.fields
        helper.fill opt.fields, @fields, Field if opt.fields
      else if opt.items
        helper.fill opt.items, @items, Item if opt.items
        for i in @items
          for f in i.fields
            @reported.push f.var if not (f.var in @reported)

  type: "form"
  title: null
  instructions: null

  toXML: =>

    xml = ($build "x", { xmlns: "jabber:x:data", @type })

    xml.c("title").t(@title.toString()).up() if @title
    xml.c("instructions").t(@instructions.toString()).up() if @instructions

    if @fields.length > 0
      for f in @fields
        xml.cnode(f.toXML()).up()

    else if @items.length > 0
      xml.c("reported")

      for r in @reported
        xml.c("field",{var: r}).up()
      xml.up()

      for i in @items
        xml.cnode(i.toXML()).up()

    xml.tree()

  toJSON: =>
    json = {@type}
    json.title = @title if @title
    json.instructions = @instructions if @instructions

    if @fields.length > 0
      json.fields = []
      for f in @fields
        json.fields.push f.toJSON()
    else if @items.length > 0
      json.items = []
      json.reported = @reported
      json.items.push i.toJSON() for i in @items

    json


  toHTML: =>

    form = $("<form data-type='#{@type}'>")
    form.append("<h1>#{@title}</h1>") if @title
    form.append("<p>#{@instructions}</p>") if @instructions

    if @fields.length > 0
      (helper.createHtmlFieldCouple f).appendTo form for f in @fields

    else if @items.length > 0
      ($ i.toHTML()).appendTo form for i in @items

    form[0]

  @fromXML: (xml) ->
    xml = $ xml
    f = new Form
      type: xml.attr "type"

    title = xml.find "title"
    if title.length is 1
      f.title = title.text()

    instr = xml.find "instructions"
    if instr.length is 1
      f.instructions = instr.text()

    fields = xml.find "field"
    items = xml.find "item"

    if items.length > 0
      f.items = ( Item.fromXML i for i in items)

    else if fields.length > 0
      f.fields = ( Field.fromXML j for j in fields)

    reported = xml.find "reported"
    if reported.length is 1
      fields = reported.find "field"
      f.reported = ( ($ r).attr("var") for r in fields)
    f

  @fromHTML: (html) ->
    html = $ html


    f = new Form
      type: html.attr "data-type"

    title = html.find("h1").text()
    f.title = title if title

    instructions = html.find("p").text()
    f.instructions = instructions if instructions

    items = html.find "fieldset"
    fields = helper.getHtmlFields html

    if items.length > 0
      f.items = ( Item.fromHTML i for i in items)

      for item in f.items
        for field in item.fields
          f.reported.push field.var if not (field.var in f.reported)

    else if fields.length > 0
      f.fields = ( Field.fromHTML j for j in fields )

    f


class Field

  @_types: ["boolean","fixed","hidden","jid-multi","jid-single","list-multi",
    "list-single", "text-multi", "text-private", "text-single"]

  @_multiTypes = ["list-multi", "jid-multi", "text-multi", "hidden"]

  constructor: (opt) ->

    @options = []
    @values = []

    if opt
      @type = opt.type.toString() if opt.type in Field._types
      @desc = opt.desc.toString() if opt.desc
      @label = opt.label.toString() if opt.label
      @var = opt.var?.toString() or "_no_var_was_defined_"
      @required = opt.required is true or opt.required is "true"
      @addOptions opt.options if opt.options
      opt.values = [ opt.value ] if opt.value
      @addValues opt.values if opt.values

  type: "text-single"
  desc: null
  label: null
  var: "_no_var_was_defined_"
  required: false

  addValue: (val) => @addValues [val]

  addValues: (vals) =>
    multi = @type in Field._multiTypes
    if multi or ( not multi and vals.length is 1 )
      @values = [@values..., (v.toString() for v in vals)...]
    @

  addOption: (opt) => @addOptions [opt]

  addOptions: (opts) =>
    if @type is "list-single" or @type is "list-multi"
      if typeof opts[0] isnt "object"
        opts =  (new Option { value: o.toString() } for o in opts)
      helper.fill opts, @options, Option
    @

  toJSON: =>
    json = { @type, @var, @required }
    json.desc = @desc if @desc
    json.label = @label if @label
    json.values = @values if @values

    if @options
      json.options = []
      for o in @options
        json.options.push o.toJSON()
    json

  toXML: =>
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

  toHTML: =>

    switch @type.toLowerCase()


      when 'list-single', 'list-multi'

        el = ($ "<select>")
        el.attr 'multiple', 'multiple' if @type is 'list-multi'

        if @options.length > 0
          for opt in @options when opt
            o = $ opt.toHTML()
            for k in @values
              o.attr 'selected', 'selected' if k.toString() is opt.value.toString()
            o.appendTo el

      when 'text-multi', 'jid-multi'
        el = $ "<textarea>"
        txt = (line for line in @values).join '\n'
        el.text txt if txt

      when 'text-single', 'boolean','text-private', 'hidden', 'fixed', 'jid-single'

        el = $ "<input>"
        el.val @values[0] if @values

        switch @type.toLowerCase()

          when 'text-single'
            el.attr 'type', 'text'
            el.attr 'placeholder', @desc

          when 'boolean'
            el.attr 'type', 'checkbox'
            val = @values[0]?.toString?()
            el.attr('checked','checked') if val and ( val is "true" or val is "1" )

          when 'text-private'
            el.attr 'type', 'password'

          when 'hidden'
            el.attr 'type', 'hidden'

          when 'fixed'
            el.attr('type','text').attr('readonly','readonly')

          when 'jid-single'
            el.attr 'type', 'email'

      else
        el = $ "<input type='text'>"

    el.attr('name', @var )
    el.attr('required', @required ) if @required
    el[0]

  @fromXML: (xml) ->
    xml = $ xml
    new Field
      type:  xml.attr "type"
      var:   xml.attr "var"
      label: xml.attr "label"
      desc:  xml.find("desc").text()
      required: (xml.find("required").length is 1)
      values: ( ($ v).text() for v in xml.find "value" )
      options: ( Option.fromXML o for o in xml.find "option" )

  @_htmlElementToFieldType: (el) ->

    el = $ el

    switch el[0].nodeName.toLowerCase()

      when "textarea"
        type = "text-multi" # or jid-multi

      when "select"

        if el.attr("multiple") is "multiple"
          type = "list-multi"
        else
          type = "list-single"

      when "input"
        switch el.attr "type"
          when "checkbox"
            type = "boolean"
          when "email"
            type = "jid-single"
          when "hidden"
            type = "hidden"
          when "password"
            type = "text-private"
          when "text"
            r = el.attr("readonly") is "readonly"
            if r
              type = "fixed"
            else
              type = "text-single"
    type

  @fromHTML: (html) ->

    html = $ html
    type =  Field._htmlElementToFieldType html

    f = new Field
      type:type
      var: html.attr "name"
      required: (html.attr("required") is "required")

    switch type
      when "list-multi","list-single"
        f.values = ( ($ el).val() for el in html.find "option:selected" )
        f.options= ( Option.fromHTML el for el in html.find "option" )
      when "text-multi","jid-multi"
        txt = html.text()
        f.values = txt.split('\n') if txt.trim() isnt ""
      when 'text-single', 'boolean','text-private', 'hidden', 'fixed', 'jid-single'
        f.values = [ html.val() ] if html.val().trim() isnt ""

    f

class Option

  constructor: (opt) ->
    if opt
      @label = opt.label.toString() if opt.label
      @value = opt.value.toString() if opt.value

  label: ""
  value: ""

  toXML: => ($build "option", { label: @label })
    .c("value")
    .t(@value.toString())
    .tree()

  toJSON: => { @label, @value }

  toHTML: => ($ "<option>").attr('value', @value ).text( @label or @value )[0]

  @fromXML: (xml) ->
    new Option { label: ($ xml).attr("label"), value: ($ xml).text() }

  @fromHTML: (html) ->
    new Option { value: ($ html).attr("value"), label: ($ html).text() }

class Item

  constructor: (opts) ->

    @fields = []
    helper.fill opts.fields, @fields, Field if opts?.fields

  toXML: =>
    xml = $build "item"
    for f in @fields
      xml.cnode( f.toXML() ).up()
    xml.tree()

  toJSON: =>
    json = {}
    if @fields
      json.fields = []
      for f in @fields
        json.fields.push f.toJSON()
    json

  toHTML: =>
    fieldset = $ "<fieldset>"
    (helper.createHtmlFieldCouple f).appendTo fieldset for f in @fields
    fieldset[0]

  @fromXML: (xml) ->
    xml = $ xml
    fields = xml.find "field"
    new Item
      fields: ( Field.fromXML f for f in fields)

  @fromHTML: (html) ->
    new Item fields: ( Field.fromHTML f for f in helper.getHtmlFields(html))

Strophe.x =
  Form: Form
  Field: Field
  Option:Option
  Item:Item

$form = (opt) -> new Strophe.x.Form opt
$field = (opt) -> new Strophe.x.Field opt
$opt = (opt) -> new Strophe.x.Option opt
$item = (opts) -> new Strophe.x.Item opts

Strophe.addConnectionPlugin 'x',

  init : (conn) ->
    Strophe.addNamespace 'DATA', 'jabber:x:data'
    conn.disco.addFeature Strophe.NS.DATA if conn.disco

  parseFromResult: (result) ->
    if result.nodeName.toLowerCase() is "x"
      Form.fromXML result
    else
      Form.fromXML ($ result).find("x")?[0]
