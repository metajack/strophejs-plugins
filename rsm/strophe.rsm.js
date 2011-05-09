// http://xmpp.org/extensions/xep-0059.html

Strophe.addNamespace('RSM', 'http://jabber.org/protocol/rsm');
   
Strophe.RSM = function(options) {
  this.attribs = ['max', 'first', 'last', 'after', 'before', 'index', 'count'];

  if (typeof options.xml != 'undefined') {
    this.fromXMLElement(options.xml);
  } else {
    for (var ii = 0; ii < this.attribs.length; ii++) {
      var attrib = this.attribs[ii];
      this[attrib] = options[attrib];
    }
  }
};

Strophe.RSM.prototype = {
  toXML: function() {
    var xml = $build('set', {xmlns: Strophe.NS.RSM});
    for (var ii = 0; ii < this.attribs.length; ii++) {
      var attrib = this.attribs[ii];
      if (typeof this[attrib] != 'undefined') {
        xml = xml.c(attrib).t(this[attrib].toString()).up();
      }
    }
    return xml.tree();
  },

  next: function(max) {
    var newSet = new Strophe.RSM({max: max, after: this.last});
    return newSet;
  },

  previous: function(max) {
    var newSet = new Strophe.RSM({max: max, before: this.first});
    return newSet;
  },

  fromXMLElement: function(xmlElement) {
    for (var ii = 0; ii < this.attribs.length; ii++) {
      var attrib = this.attribs[ii];
      var elem = xmlElement.getElementsByTagName(attrib)[0];
      if (typeof elem != 'undefined' && elem !== null) {
        this[attrib] = Strophe.getText(elem);
        if (attrib == 'first') {
          this.index = elem.getAttribute('index');
        }
      }
    }
  }
};
