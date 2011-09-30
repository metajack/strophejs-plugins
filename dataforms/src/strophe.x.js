(function() {
  var Field, Form, Item, Option, helper;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __slice = Array.prototype.slice;
  helper = {
    fill: function(src, target, klass) {
      var f, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = src.length; _i < _len; _i++) {
        f = src[_i];
        _results.push(target.push(f instanceof klass ? f : new klass(f)));
      }
      return _results;
    }
  };
  Form = (function() {
    Form._types = ["form", "submit", "cancel", "result"];
    function Form(opt) {
      var f, i, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
      this.fields = [];
      this.items = [];
      this.reported = [];
      if (opt) {
        if (_ref = opt.type, __indexOf.call(Form._types, _ref) >= 0) {
          this.type = opt.type;
        }
        this.title = opt.title;
        this.instructions = opt.instructions;
        helper.fill = function(src, target, klass) {
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
            helper.fill(opt.fields, this.fields, Field);
          }
        } else if (opt.items) {
          if (opt.items) {
            helper.fill(opt.items, this.items, Item);
          }
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
      if (this.fields.length > 0) {
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          xml.cnode(f.toXML()).up();
        }
      } else if (this.items.length > 0) {
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
      if (this.fields.length > 0) {
        json.fields = [];
        _ref = this.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          json.fields.push(f.toJSON());
        }
      } else if (this.items.length > 0) {
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
    Form.prototype._createFieldset = function(fields) {
      var f, fieldset, id, _i, _len;
      fieldset = $("<fieldset>");
      for (_i = 0, _len = fields.length; _i < _len; _i++) {
        f = fields[_i];
        id = "Strophe.x.Field-" + f.type + "-" + f["var"];
        fieldset.append("<label for='" + id + "'>" + (f.label || '') + "</label>").append($(f.toHTML()).attr("id", id)).append("<br />");
      }
      return fieldset;
    };
    Form.prototype.toHTML = function() {
      var form, i, _i, _len, _ref;
      form = $("<form>");
      if (this.title) {
        form.append("<h1>" + this.title + "</h1>");
      }
      if (this.instructions) {
        form.append("<p>" + this.instructions + "</p>");
      }
      if (this.fields.length > 0) {
        (this._createFieldset(this.fields)).children().appendTo(form);
      } else if (this.items.length > 0) {
        _ref = this.items;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          (this._createFieldset(i.fields)).appendTo(form);
        }
      }
      return form[0];
    };
    Form.fromXML = function(xml) {
      var f, fields, i, instr, items, j, r, reported, title;
      xml = $(xml);
      f = new Form({
        type: xml.attr("type")
      });
      title = xml.find("title");
      if (title.length === 1) {
        f.title = title.text();
      }
      instr = xml.find("instructions");
      if (instr.length === 1) {
        f.instructions = instr.text();
      }
      fields = xml.find("field");
      items = xml.find("item");
      if (items.length > 0) {
        f.items = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = items.length; _i < _len; _i++) {
            i = items[_i];
            _results.push(Item.fromXML(i));
          }
          return _results;
        })();
      } else if (fields.length > 0) {
        f.fields = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = fields.length; _i < _len; _i++) {
            j = fields[_i];
            _results.push(Field.fromXML(j));
          }
          return _results;
        })();
      }
      reported = xml.find("reported");
      if (reported.length === 1) {
        fields = reported.find("field");
        f.reported = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = fields.length; _i < _len; _i++) {
            r = fields[_i];
            _results.push(($(r)).attr("var"));
          }
          return _results;
        })();
      }
      return f;
    };
    return Form;
  })();
  Field = (function() {
    Field._types = ["boolean", "fixed", "hidden", "jid-multi", "jid-single", "list-multi", "list-single", "text-multi", "text-private", "text-single"];
    Field._multiTypes = ["list-multi", "jid-multi", "text-multi", "hidden"];
    function Field(opt) {
      var _ref, _ref2;
      this.options = [];
      this.values = [];
      if (opt) {
        if (_ref = opt.type, __indexOf.call(Field._types, _ref) >= 0) {
          this.type = opt.type.toString();
        }
        if (opt.desc) {
          this.desc = opt.desc.toString();
        }
        if (opt.label) {
          this.label = opt.label.toString();
        }
        this["var"] = ((_ref2 = opt["var"]) != null ? _ref2.toString() : void 0) || "_no_var_was_defined_";
        this.required = opt.required === true || opt.required === "true";
        if (opt.options) {
          this.addOptions(opt.options);
        }
        if (opt.value) {
          opt.values = [opt.value];
        }
        if (opt.values) {
          this.addValues(opt.values);
        }
      }
    }
    Field.prototype.type = "text-single";
    Field.prototype.desc = null;
    Field.prototype.label = null;
    Field.prototype["var"] = "_no_var_was_defined_";
    Field.prototype.required = false;
    Field.prototype.addValue = function(val) {
      return this.addValues([val]);
    };
    Field.prototype.addValues = function(vals) {
      var multi, v, _ref;
      multi = (_ref = this.type, __indexOf.call(Field._multiTypes, _ref) >= 0);
      if (multi || (!multi && vals.length === 1)) {
        this.values = __slice.call(this.values).concat(__slice.call((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = vals.length; _i < _len; _i++) {
              v = vals[_i];
              _results.push(v.toString());
            }
            return _results;
          })()));
      }
      return this;
    };
    Field.prototype.addOption = function(opt) {
      return this.addOptions([opt]);
    };
    Field.prototype.addOptions = function(opts) {
      var o;
      if (this.type === "list-single" || this.type === "list-multi") {
        if (typeof opts[0] !== "object") {
          opts = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = opts.length; _i < _len; _i++) {
              o = opts[_i];
              _results.push(new Option({
                value: o.toString()
              }));
            }
            return _results;
          })();
        }
        helper.fill(opts, this.options, Option);
      }
      return this;
    };
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
    Field.prototype.toHTML = function() {
      var el, k, o, opt, val, _i, _j, _len, _len2, _ref, _ref2, _ref3;
      switch (this.type.toLowerCase()) {
        case 'text-single':
          el = ($("<input type='text' >")).attr('placeholder', this.desc);
          if (this.values) {
            el.val("" + this.values[0]);
          }
          break;
        case 'list-single':
        case 'list-multi':
          el = $("<select>");
          if (this.type === 'list-multi') {
            el.attr('multiple', 'multiple');
          }
          if (this.options.length > 0) {
            _ref = this.options;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              opt = _ref[_i];
              if (opt) {
                o = $(opt.toHTML());
                _ref2 = this.values;
                for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                  k = _ref2[_j];
                  if (k.toString() === opt.value.toString()) {
                    o.attr('selected', 'selected');
                  }
                }
                o.appendTo(el);
              }
            }
          }
          break;
        case 'boolean':
          el = $("<input type='checkbox'>");
          val = (_ref3 = this.values[0]) != null ? typeof _ref3.toString === "function" ? _ref3.toString() : void 0 : void 0;
          if (val && (val === "true" || val === "1")) {
            el.attr('checked', 'checked');
          }
          break;
        case 'fixed':
        case 'hidden':
        case 'jid-multi':
        case 'jid-single':
        case 'text-multi':
        case 'text-private':
          throw "not implemented yet";
      }
      el.attr('name', this["var"]);
      if (this.required) {
        el.attr('required', this.required);
      }
      return el[0];
    };
    Field.fromXML = function(xml) {
      var o, v;
      xml = $(xml);
      return new Field({
        type: xml.attr("type"),
        "var": xml.attr("var"),
        label: xml.attr("label"),
        desc: xml.find("desc").text(),
        required: xml.find("required").length === 1,
        values: (function() {
          var _i, _len, _ref, _results;
          _ref = xml.find("value");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            v = _ref[_i];
            _results.push(($(v)).text());
          }
          return _results;
        })(),
        options: (function() {
          var _i, _len, _ref, _results;
          _ref = xml.find("option");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            o = _ref[_i];
            _results.push(Option.fromXML(o));
          }
          return _results;
        })()
      });
    };
    return Field;
  })();
  Option = (function() {
    function Option(opt) {
      if (opt) {
        if (opt.label) {
          this.label = opt.label.toString();
        }
        if (opt.value) {
          this.value = opt.value.toString();
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
    Option.prototype.toHTML = function() {
      return ($("<option>")).attr('value', this.value).text(this.label || this.value)[0];
    };
    Option.fromXML = function(xml) {
      return new Option({
        label: ($(xml)).attr("label"),
        value: ($(xml)).text()
      });
    };
    return Option;
  })();
  Item = (function() {
    function Item(opts) {
      this.fields = [];
      if (opts != null ? opts.fields : void 0) {
        helper.fill(opts.fields, this.fields, Field);
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
    Item.fromXML = function(xml) {
      var f, fields;
      xml = $(xml);
      fields = xml.find("field");
      return new Item({
        fields: (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = fields.length; _i < _len; _i++) {
            f = fields[_i];
            _results.push(Field.fromXML(f));
          }
          return _results;
        })()
      });
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
