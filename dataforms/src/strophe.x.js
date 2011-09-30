(function() {
  var Field, Form, Item, Option, fill;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  fill = function(src, target, klass) {
    var f, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = src.length; _i < _len; _i++) {
      f = src[_i];
      _results.push(target.push(f instanceof klass ? f : new klass(f)));
    }
    return _results;
  };
  Form = (function() {
    Form._types = ["form", "submit", "cancel", "result"];
    function Form(opt) {
      var f, i, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
      if (opt) {
        if (_ref = opt.type, __indexOf.call(Form._types, _ref) >= 0) {
          this.type = opt.type;
        }
        this.title = opt.title;
        this.instructions = opt.instructions;
        fill = function(src, target, klass) {
          var f, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = src.length; _i < _len; _i++) {
            f = src[_i];
            _results.push(target.push(f instanceof klass ? f : new klass(f)));
          }
          return _results;
        };
        if (opt.fields) {
          if (opt.fields) {
            fill(opt.fields, this.fields = [], Field);
          }
        } else if (opt.items) {
          if (opt.items) {
            fill(opt.items, this.items = [], Item);
          }
          this.reported = [];
          _ref2 = this.items;
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            i = _ref2[_i];
            _ref3 = i.fields;
            for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
              f = _ref3[_j];
              if (!(_ref4 = f["var"], __indexOf.call(this.reported, _ref4) >= 0)) {
                this.reported.push(f["var"]);
              }
            }
          }
        }
      }
    }
    Form.prototype.type = "form";
    Form.prototype.title = null;
    Form.prototype.instructions = null;
    Form.prototype.toXML = function() {
      var f, i, r, xml, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      xml = $build("x", {
        xmlns: "jabber:x:data",
        type: this.type
      });
      if (this.title) {
        xml.c("title").t(this.title.toString()).up();
      }
      if (this.instructions) {
        xml.c("instructions").t(this.instructions.toString()).up();
      }
      if (this.fields) {
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          xml.cnode(f.toXML()).up();
        }
      } else if (this.items) {
        xml.c("reported");
        _ref2 = this.reported;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          r = _ref2[_j];
          xml.c("field", {
            "var": r
          }).up();
        }
        xml.up();
        _ref3 = this.items;
        for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
          i = _ref3[_k];
          xml.cnode(i.toXML()).up();
        }
      }
      return xml.tree();
    };
    Form.prototype.toJSON = function() {
      var f, i, json, _i, _j, _len, _len2, _ref, _ref2;
      json = {
        type: this.type
      };
      if (this.title) {
        json.title = this.title;
      }
      if (this.instructions) {
        json.instructions = this.instructions;
      }
      if (this.fields) {
        json.fields = [];
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          json.fields.push(f.toJSON());
        }
      }
      if (this.items) {
        json.items = [];
        json.reported = this.reported;
        _ref2 = this.items;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          i = _ref2[_j];
          json.items.push(i.toJSON());
        }
      }
      return json;
    };
    return Form;
  })();
  Field = (function() {
    Field._types = ["boolean", "fixed", "hidden", "jid-multi", "jid-single", "list-multi", "list-single", "text-multi", "text-private", "text-single"];
    Field._multiTypes = ["list-multi", "jid-multi", "text-multi", "hidden"];
    function Field(opt) {
      var multi, v, _ref, _ref2;
      if (opt) {
        if (_ref = opt.type, __indexOf.call(Field._types, _ref) >= 0) {
          this.type = opt.type;
        }
        if (opt.desc) {
          this.desc = opt.desc;
        }
        if (opt.label) {
          this.label = opt.label;
        }
        this["var"] = opt["var"] || "_no_var_was_defined_";
        this.required = opt.required === true || opt.required === "true";
        if (opt.options && (this.type === "list-single" || this.type === "list-multi")) {
          fill(opt.options, this.options = [], Option);
        }
        if (opt.value) {
          this.values = [opt.value];
        }
        if (opt.values) {
          multi = (_ref2 = this.type, __indexOf.call(Field._multiTypes, _ref2) >= 0);
          if (multi || (!multi && opt.values.length === 1)) {
            this.values = (function() {
              var _i, _len, _ref3, _results;
              _ref3 = opt.values;
              _results = [];
              for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
                v = _ref3[_i];
                _results.push(v);
              }
              return _results;
            })();
          }
        }
      }
    }
    Field.prototype.type = "text-single";
    Field.prototype.desc = null;
    Field.prototype.label = null;
    Field.prototype["var"] = "_no_var_was_defined_";
    Field.prototype.required = false;
    Field.prototype.toJSON = function() {
      var json, o, _i, _len, _ref;
      json = {
        type: this.type,
        "var": this["var"],
        required: this.required
      };
      if (this.desc) {
        json.desc = this.desc;
      }
      if (this.label) {
        json.label = this.label;
      }
      if (this.values) {
        json.values = this.values;
      }
      if (this.options) {
        json.options = [];
        _ref = this.options;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          o = _ref[_i];
          json.options.push(o.toJSON());
        }
      }
      return json;
    };
    Field.prototype.toXML = function() {
      var attrs, o, v, xml, _i, _j, _len, _len2, _ref, _ref2;
      attrs = {
        type: this.type,
        "var": this["var"]
      };
      if (this.label) {
        attrs.label = this.label;
      }
      xml = $build("field", attrs);
      if (this.desc) {
        xml.c("desc").t(this.desc).up();
      }
      if (this.required) {
        xml.c("required").up();
      }
      if (this.values) {
        _ref = this.values;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          v = _ref[_i];
          xml.c("value").t(v.toString()).up();
        }
      }
      if (this.options) {
        _ref2 = this.options;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          o = _ref2[_j];
          xml.cnode(o.toXML()).up();
        }
      }
      return xml.tree();
    };
    return Field;
  })();
  Option = (function() {
    function Option(opt) {
      if (opt) {
        if (opt.label) {
          this.label = opt.label;
        }
        if (opt.value) {
          this.value = opt.value;
        }
      }
    }
    Option.prototype.label = "";
    Option.prototype.value = "";
    Option.prototype.toXML = function() {
      return ($build("option", {
        label: this.label
      })).c("value").t(this.value.toString()).tree();
    };
    Option.prototype.toJSON = function() {
      return {
        label: this.label,
        value: this.value
      };
    };
    return Option;
  })();
  Item = (function() {
    function Item(opts) {
      this.fields = [];
      if (opts != null ? opts.fields : void 0) {
        fill(opts.fields, this.fields, Field);
      }
    }
    Item.prototype.toXML = function() {
      var f, xml, _i, _len, _ref;
      xml = $build("item");
      _ref = this.fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        xml.cnode(f.toXML()).up();
      }
      return xml.tree();
    };
    Item.prototype.toJSON = function() {
      var f, json, _i, _len, _ref;
      json = {};
      if (this.fields) {
        json.fields = [];
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          json.fields.push(f.toJSON());
        }
      }
      return json;
    };
    return Item;
  })();
  Strophe.x = {
    Form: Form,
    Field: Field,
    Option: Option,
    Item: Item
  };
}).call(this);
