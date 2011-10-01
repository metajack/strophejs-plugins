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

  it "is installed to the connection object", ->
    (expect typeof @con.x).toEqual "object"

  it "can parse a result", ->

    res = $build("command").c("x",{type:"result"}).c("title").t("My title").tree()
    form = @con.x.parseFromResult res

    (expect form.type).toEqual "result"
    (expect form.title).toEqual "My title"

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

      (expect (new @Sx.Form).items).toEqual []
      (expect form.items).toEqual [new @Sx.Item i[0]]

    it "has a reported' property if items are defined", ->

      f1 = new @Sx.Field {var: "foo"}
      f2 = new @Sx.Field {var: "bar"}
      i = [{ fields: [f1,f2] }]
      form = new @Sx.Form { items:i }

      (expect (new @Sx.Form).reported).toEqual []
      (expect form.reported).toEqual ["foo","bar"]


    it "can have fields", ->
      f1 = new @Sx.Field { var: "foo", value: "bar"}
      f2 = new @Sx.Field { var: "test", value:123, required: true}
      (expect (new @Sx.Form).fields).toEqual []
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
        fields: [ f1.toJSON(), {
          type: "text-single",
          var: "test",
          values:["123"],
          required: true,
          options:[]}
        ]

    describe "conversion to HTML", ->

      beforeEach ->
        @f = new @Sx.Form
          title: "My title"
          instructions: "Please fillout the form"
          fields: [{
            type: "list-multi"
            label: "My label"
            var: "alist"
            options: [ {label: "One", value:"one"}, {label: "Two", value:"two"} ] },

            { type: "text-single", label: "Single label", var: "name" }
          ]

      it "creates a form as container", ->

        html = @f.toHTML()
        (expect html.nodeName).toEqual "FORM"
        (expect html.childNodes[0].nodeName).toEqual "H1"
        (expect html.childNodes[1].nodeName).toEqual "P"

      it "appends the fields with label to the fieldset", ->
        fs = @f.toHTML()
        (expect fs.childNodes[2].nodeName).toEqual "LABEL"
        (expect fs.childNodes[3].nodeName).toEqual "SELECT"
        (expect fs.childNodes[4].nodeName).toEqual "BR"
        (expect fs.childNodes[5].nodeName).toEqual "LABEL"
        (expect fs.childNodes[6].nodeName).toEqual "INPUT"

      it "appends puts items into fieldsets", ->

        f1 = new @Sx.Field {var: "foo"}
        f2 = new @Sx.Field {var: "bar"}
        f3 = new @Sx.Field {var: "foo"}
        f4 = new @Sx.Field {var: "bar"}

        form = new @Sx.Form
          items: [
            { fields: [f1,f2] }
            { fields: [f3,f4] }
          ]

        html = form.toHTML()
        (expect html.nodeName).toEqual "FORM"
        (expect html.childNodes[0].nodeName).toEqual "FIELDSET"
        (expect html.childNodes[1].nodeName).toEqual "FIELDSET"

    it "can be created from xml", ->

      f1 = new @Sx.Field {var: "foo"}
      f2 = new @Sx.Field {var: "bar"}
      f3 = new @Sx.Field {var: "foo"}
      f4 = new @Sx.Field {var: "bar"}

      form = new @Sx.Form
        title: "test"
        type: "result"
        instructions: "Some text"
        items: [
          { fields: [f1,f2] }
          { fields: [f3,f4] }
        ]

      (expect @Sx.Form.fromXML( form.toXML()).toJSON() ).toEqual form.toJSON()

      form = new @Sx.Form
        title: "test"
        type: "result"
        instructions: "Some text"
        fields: [f1,f2, f3,f4]

      (expect @Sx.Form.fromXML( form.toXML()).toJSON() ).toEqual form.toJSON()

    it "can be created from HTML", ->

      f1 = new @Sx.Field {var: "foo"}
      f2 = new @Sx.Field {var: "bar"}
      f3 = new @Sx.Field {var: "foo"}
      f4 = new @Sx.Field {var: "bar"}

      form = new @Sx.Form
        title: "test"
        type: "result"
        instructions: "Some text"
        items: [
          { fields: [f1,f2] }
          { fields: [f3,f4] }
        ]

      (expect @Sx.Form.fromHTML( form.toHTML()).toJSON()).toEqual form.toJSON()

      form = new @Sx.Form
        title: "test"
        type: "result"
        instructions: "Some text"
        fields: [f1,f2, f3,f4]

      (expect @Sx.Form.fromHTML( form.toHTML()).toJSON() ).toEqual form.toJSON()


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
      (expect (new @Sx.Field).values).toEqual []
      (expect (new @Sx.Field {value: "blub"}).values).toEqual ["blub"]
      (expect (new @Sx.Field {values: ["blub","foo"]}).values).toEqual []

    it "can have multiple values if type is '*-multi' or 'hidden'" , ->
      multiTypes = ["list-multi", "jid-multi","text-multi", "hidden"]
      for t in multiTypes
        (expect (new @Sx.Field {values: ["blub","foo"], type: t}).values).toEqual ["blub","foo"]

    it "can have options if the type is 'list-single' or 'list-multi'" , ->
      optArray = [ new @Sx.Option { label:"foo", value: "bar"} ]
      (expect (new @Sx.Field).options).toEqual []
      (expect (new @Sx.Field {options: optArray, type: "list-single" }).options).toEqual optArray
      (expect (new @Sx.Field {options: optArray, type: "list-multi" }).options).toEqual optArray
      (expect (new @Sx.Field {options: [{label:"test", value: "text"}], type: "list-multi" }).options)
        .toEqual [new @Sx.Option {label: "test", value: "text"} ]

    it "can't have options if the type isn't 'list-single' or 'list-multi'" , ->
      opt = [ new @Sx.Option { label:"foo", value: "bar"} ]
      (expect (new @Sx.Field).options).toEqual []
      (expect (new @Sx.Field {options: opt, type: "text-single" }).options).toEqual []

    it "provides a function to add a value", ->
      f = new @Sx.Field {value: "a" }
      (expect f.addValue("foo").values).toEqual ["a","foo"]

    it "provides a function to add one option", ->
      f = new @Sx.Field {type: "list-multi"}
      (expect f.addOption({ label: "foo", value: "bar" }).options)
        .toEqual [new @Sx.Option {label: "foo", value: "bar" }]

      f = new @Sx.Field {type: "text-single"}
      (expect f.addOption({ label: "foo", value: "bar" }).options).toEqual []

    it "provides a function to add multiple options", ->
      f = new @Sx.Field { type: "list-multi", options: ["a"] }
      (expect f.addOptions(["b","c"]).options)
        .toEqual [
          new @Sx.Option {value: "a"}
          new @Sx.Option {value: "b"}
          new @Sx.Option {value: "c"}
        ]
      f = new @Sx.Field { type: "list-multi" }

      (expect f.addOptions([
        {label: "a", value: "a"}
        {label: "b", value: "b"}
      ]).options)
        .toEqual [
          new @Sx.Option {label: "a", value: "a"}
          new @Sx.Option {label: "b", value: "b"}
        ]

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
        values: ["a", "1", "false"]
        options: []

      (expect f2.toJSON()).toEqual
        type: "text-single"
        var: "bar"
        required: true
        values: ["a"]
        options: []

      (expect f3.toJSON()).toEqual
        type: "text-single"
        var: "bar"
        required: false
        values: ["a"]
        options: []

    describe "conversion to HTML", ->

      beforeEach ->
        @f = new @Sx.Field { var: "bar" }

      it "uses sets the variable as the name property", ->
        html = @f.toHTML()
        (expect html.getAttribute "name").toEqual "bar"

      it "sets the required property", ->
        @f.required = true
        html = @f.toHTML()
        (expect html.getAttribute "required").toEqual "required"

      it "sets the description as placeholder property", ->
        @f.desc = "your name"
        @f.type = "text-single"
        html = @f.toHTML()
        (expect html.getAttribute "placeholder").toEqual "your name"

      it "converts to a single selection", ->

        @f.type = "list-single"
        @f.addValue 1
        @f.addOptions ["a", 1, false]

        html = @f.toHTML()
        (expect html.nodeName.toLowerCase()).toEqual "select"
        (expect html.getAttribute "multiple").toEqual null
        (expect ($ html).children().length).toEqual 3
        (expect ($ "option:selected", html).val() ).toEqual "1"

      it "converts to a multiple selection", ->

        @f.type = "list-multi"
        @f.addValues [1, false]
        @f.addOptions ["a", 1, false]

        html = @f.toHTML()
        (expect html.nodeName.toLowerCase()).toEqual "select"
        (expect html.getAttribute "multiple").toEqual "multiple"
        (expect ($ "option:selected", html).length ).toEqual 2

      it "converts a boolean field to a checkbox", ->
        @f.type = "boolean"
        @f.addValue { note: "i'm not a valid value for boolean fields" }
        html = @f.toHTML()
        (expect html.nodeName.toLowerCase()).toEqual "input"
        (expect html.getAttribute "type").toEqual "checkbox"
        (expect html.getAttribute "checked").toEqual null

      it "sets the checked property if the value is 'true'", ->
        @f.type = "boolean"
        @f.addValue true
        (expect @f.toHTML().getAttribute "checked").toEqual "checked"

      it "sets the checked property if the value is '1'", ->
        @f.type = "boolean"
        @f.addValue 1
        (expect @f.toHTML().getAttribute "checked").toEqual "checked"

      it "sets the checked property if the value is '1'", ->
        @f.type = "boolean"
        @f.addValue 1
        (expect @f.toHTML().getAttribute "checked").toEqual "checked"

      it "converts 'text-multi' to a textarea", ->
        @f.type = "text-multi"
        @f.addValues ["This is a multi","line text"]
        html = @f.toHTML()
        (expect html.nodeName).toEqual "TEXTAREA"
        (expect ($ html).text()).toEqual "This is a multi\nline text"

      it "converts 'jid-multi' to a textarea", ->
        @f.type = "text-multi"
        @f.addValues ["myjid@domain.tld/resource","yourjid@domain.tld"]
        html = @f.toHTML()
        (expect html.nodeName).toEqual "TEXTAREA"
        (expect ($ html).text()).toEqual "myjid@domain.tld/resource\nyourjid@domain.tld"

      it "converts 'text-private' to a password input field", ->
        @f.type = "text-private"
        html = @f.toHTML()
        (expect html.nodeName).toEqual "INPUT"
        (expect html.getAttribute "type").toEqual "password"

      it "converts 'hidden' to a hidden input field", ->
        @f.type = "hidden"
        html = @f.toHTML()
        (expect html.nodeName).toEqual "INPUT"
        (expect html.getAttribute "type").toEqual "hidden"

      it "converts 'fixed' to a read-only input field", ->
        @f.type = "fixed"
        html = @f.toHTML()
        (expect html.nodeName).toEqual "INPUT"
        (expect html.getAttribute "type").toEqual "text"
        (expect html.getAttribute "readonly").toEqual "readonly"

      it "converts 'jid-single' to an email input field", ->
        @f.type = "jid-single"
        html = @f.toHTML()
        (expect html.nodeName).toEqual "INPUT"
        (expect html.getAttribute "type").toEqual "email"

    it "can be created by an xml element", ->
      xml = $build("field",{ type:"list-single", label: "News", var: "news" })
        .c("desc").t("My desc").up()
        .c("required").up()
        .c("value").t("blue").up()
        .c("option",{label: "RED" }).t("red").up()
        .c("option",{label: "BLUE"}).t("blue").up()
        .c("option",{label: "YELLOW"}).t("yellow").up()
        .tree()
      field = @Sx.Field.fromXML xml

      (expect field.type).toEqual "list-single"
      (expect field.var).toEqual "news"
      (expect field.label).toEqual "News"
      (expect field.desc).toEqual "My desc"
      (expect field.required).toEqual true
      (expect field.values).toEqual ["blue"]
      (expect field.options).toEqual [
        new @Sx.Option { label: "RED", value: "red"}
        new @Sx.Option { label: "BLUE", value: "blue"}
        new @Sx.Option { label: "YELLOW", value: "yellow"}
      ]

      f1 = new @Sx.Field
        type: "list-multi"
        var: "bar"
        label: "myLabel"
        desc: "foo"
        required: false
        values: ["a",false]
        option: ["a", 1, false]

      (expect @Sx.Field.fromXML( f1.toXML()).toJSON() ).toEqual f1.toJSON()

    describe "parsing HTML", ->

      it "detects the correct field type", ->

        html = $ "<select>"
        (expect @Sx.Field.fromHTML(html).type).toEqual "list-single"

        html = $ "<select multiple='multiple'>"
        (expect @Sx.Field.fromHTML(html).type).toEqual "list-multi"

        html = $ "<textarea>"
        (expect @Sx.Field.fromHTML(html).type).toEqual "text-multi"

        html = $ "<input>"
        (expect @Sx.Field.fromHTML(html).type).toEqual "text-single"

        html = $ "<input type='email'>"
        (expect @Sx.Field.fromHTML(html).type).toEqual "jid-single"

        html = $ "<input type='hidden'>"
        (expect @Sx.Field.fromHTML(html).type).toEqual "hidden"

        html = $ "<input type='password'>"
        (expect @Sx.Field.fromHTML(html).type).toEqual "text-private"

        html = $ "<input type='text'>"
        (expect @Sx.Field.fromHTML(html).type).toEqual "text-single"

        html = $ "<input type='checkbox'>"
        (expect @Sx.Field.fromHTML(html).type).toEqual "boolean"

      it "parses the properties", ->

        html = $ """<select name ='news' required='required'>
            <option value="red">RED</option>
            <option value="blue" selected='selected'>BLUE</option>
            <option value="yellow">YELLOW</option>"""

        field = @Sx.Field.fromHTML html

        (expect field.var).toEqual "news"
        (expect field.required).toEqual true
        (expect field.values).toEqual ["blue"]
        (expect field.options).toEqual [
          new @Sx.Option { label: "RED", value: "red"}
          new @Sx.Option { label: "BLUE", value: "blue"}
          new @Sx.Option { label: "YELLOW", value: "yellow"}
        ]

        html = $ """<select name ='news' multiple='multiple'>
            <option value="red"  selected='selected'>RED</option>
            <option value="blue" selected='selected'>BLUE</option>
            <option value="yellow">YELLOW</option>"""

        field = @Sx.Field.fromHTML html

        (expect field.values).toEqual ["red","blue"]

      it "parses the textarea text", ->

        l1 = "Hello world!"
        l2 = "A new line"
        html = $ "<textarea>#{l1}\n#{l2}</textarea>"

        field = @Sx.Field.fromHTML html

        (expect field.values).toEqual [ l1,l2 ]

      it "parses the textfield text", ->

        text = "Hello world!"
        html = $ "<input type='text' value='#{text}' >"

        field = @Sx.Field.fromHTML html

        (expect field.values).toEqual [ text ]

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
      (expect json.value).toEqual "123"

    it "can be convertet into a HTML option object", ->
      o1 = new @Sx.Option { label: "foo", value: 123 }
      o2 = new @Sx.Option { value: 123 }

      o1html = o1.toHTML()
      o2html = o2.toHTML()
      (expect o1html.nodeName.toLowerCase()).toEqual "option"
      (expect o1html.getAttribute "value").toEqual "123"
      (expect o1html.textContent).toEqual "foo"
      (expect o2html.textContent).toEqual "123"

    it "can be created by an xml element", ->
      xml = $build("option",{ label:"news"}).c("value").t("Great news").tree()
      option = @Sx.Option.fromXML xml

      (expect option.label).toEqual "news"
      (expect option.value).toEqual "Great news"

      o = new @Sx.Option { label: "foo", value: 123 }

      (expect @Sx.Option.fromXML( o.toXML()).toJSON()).toEqual o.toJSON()

    it "can be parsed from HTML", ->

      html = $ "<option value='news'>Great news</option>"
      option = @Sx.Option.fromHTML html

      (expect option.value).toEqual "news"
      (expect option.label).toEqual "Great news"

      o = new @Sx.Option { label: "foo", value: 123 }

      (expect @Sx.Option.fromHTML( o.toHTML()).toJSON()).toEqual o.toJSON()


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
      (expect json.fields).toEqual [f1.toJSON(),{type: "list-multi", required: true , var:"foo", values:[], options: []}]

    it "can be created from XML", ->

      f1 = new @Sx.Field
      f2 = {type: "list-multi", required: "true" , var:"foo"}
      o = new @Sx.Item { fields: [ f1,f2 ] }

      (expect @Sx.Item.fromXML( o.toXML() ).toJSON() ).toEqual o.toJSON()

    it "can be created from HTML", ->

      f1 = new @Sx.Field
      f2 = {type: "list-multi", required: "true" , var:"foo"}
      o = new @Sx.Item { fields: [ f1,f2 ] }

      (expect @Sx.Item.fromHTML( o.toHTML() ).toJSON() ).toEqual o.toJSON()
