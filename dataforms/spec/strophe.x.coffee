describe "XMPP Data Forms (0004)", ->

  mockConnection = ->
    c = new Strophe.Connection()
    c.authenticated = true
    c.jid = 'n@d/r2'
    c._processRequest = ->
    c._changeConnectStatus Strophe.Status.CONNECTED
    c

  beforeEach ->
    @con = mockConnection()
    @successHandler = jasmine.createSpy "successHandler"
    @errorHandler   = jasmine.createSpy "errorHandler"
    @Sx = Strophe.x

  describe "Form", ->

    it "has one of four possible type attributes", ->
      (expect (new @Sx.Form {type:"form"  }).type).toEqual "form"
      (expect (new @Sx.Form {type:"submit"}).type).toEqual "submit"
      (expect (new @Sx.Form {type:"cancel"}).type).toEqual "cancel"
      (expect (new @Sx.Form {type:"result"}).type).toEqual "result"
      (expect (new @Sx.Form {type:"foo"}).type).toEqual "form"

    it "uses 'form' as default type attribute", ->
      (expect (new @Sx.Form).type).toEqual "form"

    it "has an optional title", ->
      (expect (new @Sx.Form).title).toEqual null
      (expect (new @Sx.Form {title: "foo"}).title).toEqual "foo"

    it "has an optional instruction property", ->
      (expect (new @Sx.Form).instructions).toEqual null
      (expect (new @Sx.Form {instructions: "foo"}).instructions).toEqual "foo"

    it "can have items", ->
      f1 = new @Sx.Field
      i = [{ fields: [f1] }]
      form = new @Sx.Form { items:i }

      (expect (new @Sx.Form).items).toBeUndefined()
      (expect form.items).toEqual [new @Sx.Item i[0]]

    it "has a reported' property if items are defined", ->

      f1 = new @Sx.Field {var: "foo"}
      f2 = new @Sx.Field {var: "bar"}
      i = [{ fields: [f1,f2] }]
      form = new @Sx.Form { items:i }

      (expect (new @Sx.Form).reported).toBeUndefined()
      (expect form.reported).toEqual ["foo","bar"]


    it "can have fields", ->
      f1 = new @Sx.Field { var: "foo", value: "bar"}
      f2 = new @Sx.Field { var: "test", value:123, required: true}
      (expect (new @Sx.Form).fields).toBeUndefined()
      (expect (new @Sx.Form {fields: [f1,f2]}).fields).toEqual [f1,f2]

    it "converts a form into an xml object", ->

      f1 = new @Sx.Field
        var: "foo"
        value: "bar"
        type: "list-multi"
        options: [ { label:"bla", value:"blub"}, { label:"foo", value:"bar" }]

      f2 = { var: "test", value:123, required: true}

      f = new @Sx.Form
        type: "submit"
        title: "foo"
        instructions: "bar"
        fields: [f1,f2 ]

      xml = f.toXML()

      (expect xml.nodeName).toEqual "x"
      (expect xml.getAttribute "xmlns" ).toEqual "jabber:x:data"
      (expect xml.getAttribute "type" ).toEqual "submit"
      (expect xml.childNodes[0].nodeName).toEqual "title"
      (expect xml.childNodes[0].textContent).toEqual "foo"
      (expect xml.childNodes[1].nodeName).toEqual "instructions"
      (expect xml.childNodes[1].textContent).toEqual "bar"

      f1 = { var: "a", value:"one" }
      f2 = { var: "b", value:"two" }
      f3 = { var: "a", value:"three"}
      f4 = { var: "b", value:"four"}

      f = new @Sx.Form
        type: "submit"
        items: [{fields:[f1,f2]},{ fields:[ f3,f4]} ]

      xml = f.toXML()

      (expect xml.nodeName).toEqual "x"
      (expect xml.getAttribute "xmlns" ).toEqual "jabber:x:data"
      (expect xml.getAttribute "type" ).toEqual "submit"
      (expect xml.childNodes[0].nodeName).toEqual "reported"
      (expect xml.childNodes[1].nodeName).toEqual "item"

    it "can be convertet into a JSON object", ->

      f1 = new @Sx.Field
        var: "foo"
        value: "bar"
        type: "list-multi"
        options: [ { label:"bla", value:"blub"}, { label:"foo", value:"bar" }]

      f2 = { var: "test", value:123, required: true}

      o = new @Sx.Form
        type: "submit"
        title: "foo"
        instructions: "bar"
        fields: [f1,f2]

      json = o.toJSON()
      (expect json).toEqual
        type: "submit"
        title: "foo"
        instructions: "bar"
        fields: [ f1.toJSON(), { type: "text-single", var: "test", values:[123], required: true}]

  describe "Field", ->

    it "has one of ten possible type attributes", ->

      types = ["boolean","fixed","hidden","jid-multi","jid-single","list-multi",
        "list-single", "text-multi", "text-private", "text-single"]
      for t in types
        (expect (new @Sx.Field {type:t }).type).toEqual t

      (expect (new @Sx.Field {type: "foo" }).type).toEqual "text-single"

    it "uses 'text-single' as default type attribute", ->
      (expect (new @Sx.Field).type).toEqual "text-single"

    it "must provide a var attribute", ->
      (expect typeof (new @Sx.Field).var).toEqual "string"
      (expect (new @Sx.Field {var: "foo"}).var).toEqual "foo"

    it "has an optional description", ->
      (expect (new @Sx.Field).desc).toEqual null
      (expect (new @Sx.Field {desc: "foo"}).desc).toEqual "foo"

    it "has an optional label", ->
      (expect (new @Sx.Field).label).toEqual null
      (expect (new @Sx.Field {label: "foo"}).label).toEqual "foo"

    it "can be an required filed", ->
      (expect (new @Sx.Field).required).toEqual false
      (expect (new @Sx.Field {required: "foo" }).required).toEqual false
      (expect (new @Sx.Field {required: true}).required).toEqual true
      (expect (new @Sx.Field {required: "true"}).required).toEqual true

    it "can have a value" , ->
      (expect (new @Sx.Field).values).toBeUndefined()
      (expect (new @Sx.Field {value: "blub"}).values).toEqual ["blub"]
      (expect (new @Sx.Field {values: ["blub","foo"]}).values).toBeUndefined()

    it "can have multiple values if type is '*-multi' or 'hidden'" , ->
      multiTypes = ["list-multi", "jid-multi","text-multi", "hidden"]
      for t in multiTypes
        (expect (new @Sx.Field {values: ["blub","foo"], type: t}).values).toEqual ["blub","foo"]

    it "can have options if the type is 'list-single' or 'list-multi'" , ->
      optArray = [ new @Sx.Option { label:"foo", value: "bar"} ]
      (expect (new @Sx.Field).options).toBeUndefined()
      (expect (new @Sx.Field {options: optArray, type: "list-single" }).options).toEqual optArray
      (expect (new @Sx.Field {options: optArray, type: "list-multi" }).options).toEqual optArray
      (expect (new @Sx.Field {options: [{label:"test", value: "text"}], type: "list-multi" }).options)
        .toEqual [new @Sx.Option {label: "test", value: "text"} ]

    it "can't have options if the type isn't 'list-single' or 'list-multi'" , ->
      opt = [ new @Sx.Option { label:"foo", value: "bar"} ]
      (expect (new @Sx.Field).options).toBeUndefined()
      (expect (new @Sx.Field {options: opt, type: "text-single" }).options).toBeUndefined()

    it "can be convertet into an XML object", ->
      o = new @Sx.Field
        type: "list-multi"
        var: "bar"
        label: "myLabel"
        desc: "foo"
        required: true
        values: ["a", 1, false]
        options: [{label:"foo", value: "bar"},{label:"test", value: 321 }]

      xml = o.toXML()

      (expect xml.nodeName).toEqual "field"
      (expect xml.getAttribute "label" ).toEqual "myLabel"
      (expect xml.getAttribute "type" ).toEqual "list-multi"
      (expect xml.getAttribute "var" ).toEqual "bar"
      (expect xml.childNodes[0].nodeName).toEqual "desc"
      (expect xml.childNodes[0].textContent).toEqual "foo"
      (expect xml.childNodes[1].nodeName).toEqual "required"

    it "can be convertet into a JSON object", ->
      f1 = new @Sx.Field
        type: "list-multi"
        var: "bar"
        label: "myLabel"
        desc: "foo"
        required: 123
        values: ["a", 1, false]

      f2 = new @Sx.Field
        var: "bar"
        required: true
        value: "a"

      f3 = new @Sx.Field
        var: "bar"
        values: ["a"]

      (expect f1.toJSON()).toEqual
        type: "list-multi"
        var: "bar"
        label: "myLabel"
        desc: "foo"
        required: false
        values: ["a", 1, false]

      (expect f2.toJSON()).toEqual
        type: "text-single"
        var: "bar"
        required: true
        values: ["a"]

      (expect f3.toJSON()).toEqual
        type: "text-single"
        var: "bar"
        required: false
        values: ["a"]

  describe "Option", ->

    it "has a label attribute", ->
      (expect typeof (new @Sx.Option {label:"foo"})).toEqual "object"
      (expect (new @Sx.Option {label:"foo"}).label).toEqual "foo"
      (expect (new @Sx.Option).label).toEqual ""

    it "has a value", ->
      (expect (new @Sx.Option {value:"foo"}).value).toEqual "foo"
      (expect (new @Sx.Option).value).toEqual ""

    it "can be convertet into an XML object", ->
      o = new @Sx.Option
        label: "foo"
        value: 123

      xml = o.toXML()

      (expect xml.nodeName).toEqual "option"
      (expect xml.getAttribute "label" ).toEqual "foo"
      (expect xml.childNodes[0].nodeName).toEqual "value"
      (expect xml.childNodes[0].textContent).toEqual "123"

    it "can be convertet into a JSON object", ->
      o = new @Sx.Option
        label: "foo"
        value: 123

      json = o.toJSON()
      (expect json.label).toEqual "foo"
      (expect json.value).toEqual 123

  describe "Item", ->

    it "can have multiple fields", ->
      f1 = new @Sx.Field
      f2 = {type: "list-multi", required:"true", var:"foo"}

      (expect (new @Sx.Item).fields).toEqual []
      (expect (new @Sx.Item {fields: [f1,f2]}).fields).toEqual [f1, new @Sx.Field f2]

    it "can be convertet into an XML object", ->

      o = new @Sx.Item {fields: [ new @Sx.Field, {type: "list-multi", required:"true", var:"foo"} ] }
      xml = o.toXML()

      (expect xml.nodeName).toEqual "item"
      (expect xml.childNodes[0].nodeName).toEqual "field"

    it "can be convertet into a JSON object", ->
      f1 = new @Sx.Field
      f2 = {type: "list-multi", required: "true" , var:"foo"}
      o = new @Sx.Item { fields: [ f1,f2 ] }

      json = o.toJSON()
      (expect json.fields).toEqual [f1.toJSON(),{type: "list-multi", required: true , var:"foo"}]
