# strophe.x.js

strophe.x.js is a plugin to provide Data Forms
( [XEP-0004](http://xmpp.org/extensions/xep-0004.html) ).

## Usage

### Creating data elements

Creating a form is easy:

    Strophe.x.Form({
      type: "submit",
      title: "myTitle",
      instructions: "Tell something",
      fields: [f1, f2]
    });

You can also use items within the form:

    Strophe.x.Form({
      type: "result",
      title: "Search result",
      items: [ item1, { fields: [f1,f5]}, item3 ]
    });

Here you don't have to define the `reported` property (it is generated
automatically).

Creating fields is similar

    Strophe.x.Field({
      type: "text-single",
      "var": "myVariableName",
      desc: "a description",
      label: "My Label",
      required: true,
      value: 1234
    });

You can also use options

    Strophe.x.Field({
      type: "list-multi",
      "var": "myVariableName",
      desc: "a description",
      label: "My Label",
      required: true,
      values: ["a", "c"]
      options: [
        {label:"One", value: "a"}
        {label:"Two", value: "b"}
        {label:"Three", value: "c"}
    ]});

### Convert to XML, HTML or JSON

Every object can be converted to xml by using the `toXML`, `toHML` or `toJSON` function

### Parse XML

You can easily create a form by parsing XML:

    var Form = Strophe.x.Form.fromXML(xml); 

The same can be done with `fromHML` for HTML as source.

## Dependencies

- jQuery
