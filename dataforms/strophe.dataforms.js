/*
  Copyright 2010, François de Metz <francois@2metz.fr>
*/
/**
 *
 */
Strophe.Field = function(field) {
    /**
     * @type String
     */
    this.type = field.getAttribute("type");
    /**
     * @type String
     */
    this.variable = field.getAttribute("var");
    /**
     * @type String
     */
    this.label = field.getAttribute("label");
    /**
     * @type Boolean
     */
    this.required = this._isRequired(field);
    /**
     * @type String
     */
    this.desc = this._getDesc(field);
    /**
     * @type String
     */
    this.value = null;
    /**
     * @type Array
     */
    this.values = [];

    this.media = null;

    this._fillValues(field);
    this._parseMedia(field);
    /**
     * @type Array
     */
    this.options = this._parseOptions(field);
    if (this.type != "fixed" && this.variable == null) {
        throw "must have a var attribute";
    }
};
Strophe.Field.prototype = {
    _isRequired: function(field) {
        var required = field.getElementsByTagName("required");
        if (required.length == 1) {
            return true;
        }
        return false;
    },

    _getDesc: function(field) {
        var desc = field.getElementsByTagName("desc");
        if (desc.length == 1) {
            return desc.item(0).textContent;
        }
        return null;
    },

    _fillValues: function(field)
    {
        var values = field.getElementsByTagName("value");
        if (values.length > 1)
        {
            var authorized = ["list-multi", "jid-multi",
                              "text-multi", "hidden"];
            if (authorized.indexOf(this.type) == -1)
            {
                throw "cannot have multiple value";
            }
            for (var i = 0; i < values.length; i++)
            {
                this.values.push(values.item(i).textContent);
            }
        }
        else if (values.length == 1)
        {
            this.value = values.item(0).textContent;
        }
    },

    _parseMedia: function(field)
    {
        var media = field.getElementsByTagNameNS(Strophe.NS.DATA_MEDIA, 'media');
        if (media.length == 1)
        {
            this.media = {
                height : media.item(0).getAttribute('height'),
                width  : media.item(0).getAttribute('width'),
                uri    : []
            };
            var uris = media.item(0).getElementsByTagName('uri');
            for (var i = 0; i < uris.length; i++)
            {
                if (!uris.item(i).hasAttribute('type'))
                {
                    throw "uri element must have an type attribute";
                }
                if (uris.item(i).textContent == "")
                {
                    throw "uri element must have a value";
                }
                this.media.uri.push({
                                        type  : uris.item(i).getAttribute('type'),
                                        value : uris.item(i).textContent
                                    });
            }
        }
    },

    _parseOptions: function(field)
    {
        var options = field.getElementsByTagName("option");
        if (options.length == 0) {
            return [];
        }
        var authorized = ["list-single", "list-multi"];
        if (authorized.indexOf(this.type) == -1) {
            throw "cannot have option";
        }
        var o = [];
        for (var i = 0; i < options.length; i++) {
            var value = this._getValue(options.item(i));
            var label = options.item(i).getAttribute("label") || value;
            o.push({value: value, label: label});
        }
        return o;
    },

    _getValue : function(node) {
        var value = node.getElementsByTagName("value");
        if (value.length > 1 || value.length == 0) {
            throw "must have only one value";
        }
        return value.item(0).textContent;
    }
};

/**
 * Data Forms strophe plugin
 * http://xmpp.org/extensions/xep-0004.html Data Forms
 * http://xmpp.org/extensions/xep-0221.html Data Forms Media Element
 * TODO: implement http://xmpp.org/extensions/xep-0122.html Data Forms Validation
 * TODO: implement http://xmpp.org/extensions/xep-0141.html Data Forms Layout
 */
Strophe.addConnectionPlugin('dataforms',
{
    /** Function: init
     * Plugin init
     *
     * Parameters:
     *   (Strophe.Connection) conn - Strophe connection
     */
    init : function(conn)
    {
        Strophe.addNamespace('DATA', 'jabber:x:data');
        Strophe.addNamespace('DATA_MEDIA', 'urn:xmpp:media-element');
        if (conn.disco)
        {
            conn.disco.addFeature(Strophe.NS.DATA);
        }
    },
    /** Function: parse
     * Parse form
     * TODO: multiple title
     * TODO: multiple instructions
     * TODO: reported and item element
     * Parameters:
     *   (DOMElement) form
     *
     */
    parse: function(form)
    {
        return {
            type : form.getAttribute("type"),
            title : this._getTitle(form),
            instructions : this._getInstructions(form),
            fields : this._parseFields(form)
        };
    },

    _getTitle: function(form)
    {
        var title = form.getElementsByTagName("title");
        if (title.length > 0)
        {
            return title.item(0).textContent;
        }
        return null;
    },

    _getInstructions: function(form)
    {
        var instructions = form.getElementsByTagName("instructions");
        if (instructions.length > 0)
        {
            return instructions.item(0).textContent;
        }
        return null;
    },

    _parseFields: function(form)
    {
        var fields = form.getElementsByTagName("field");
        var f = [];
        for (var i = 0; i < fields.length; i++) {
            f.push(new Strophe.Field(fields.item(i)));
        }
        return f;
    }
});
