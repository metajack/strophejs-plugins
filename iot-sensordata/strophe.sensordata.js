/**
 *  This program is distributed under the terms of the MIT license.
 *  Please see the LICENSE file for details.
 *
 *  Copyright 2014, Sustainable Innovation AB http://sust.se, and Swedish Institute computer Science http://sisc.se.
 *  This was developed as part of the http://iea.sust.se project.
 *  Authors: Olov Stahl, Anders Wallberg
*/

/**
 * File: Strophe.sensordata.js
 * plugin for Internet of Things - Sensor Data (XEP 323)
 * http://xmpp.org/extensions/xep-0323.html
 *
 *
 * Todo:
 *   - Extract XEP_323_FIELD_TYPE from messages
 *   - Rename reqAll
 *   - Include seqnr in callbacks and events
 */

/**
 * Events that may be triggered.
 */
var XEP_323_EVENT = {
    FIELDS :         'xep323_fields_event',
    CANCELLED :      'xep323_cancelled_event',
    REJECTED :       'xep323_rejected_event',
    NOT_IMPLEMENTED: 'xep323_not_implemented_event',
    CANCEL :         'xep323_cancel_event',
    ERROR :          'xep323_error_event'
}

var XEP_323_ACCEPTED = 'accepted';
var XEP_323_STARTED = 'started';
var XEP_323_REJECTED = 'rejected';
var XEP_323_ERROR = 'error';
var XEP_323_CANCELLED = 'cancelled';
var XEP_323_CANCEL = 'cancel';
var XEP_323_SEQNR = 'seqnr';
var XEP_323_TYPE = 'type';
var XEP_323_REQ = 'req';
var XEP_323_GET = 'get';
var XEP_323_FIELDS = 'fields';
var XEP_323_NODE = 'node';
var XEP_323_NODEID = 'nodeId';
var XEP_323_TIMESTAMP = 'timestamp';
var XEP_323_WRITABLE = 'writable';
var XEP_323_NUMERIC = 'numeric';
var XEP_323_STRING = 'string';
var XEP_323_BOOLEAN = 'boolean';
var XEP_323_ENUM = 'enum';
var XEP_323_TIMESPAN = 'timeSpan';
var XEP_323_DATETIME = 'dateTime';
var XEP_323_NAME = 'name';
var XEP_323_VALUE = 'value';
var XEP_323_UNIT = 'unit';
var XEP_323_MODIFIABLE = 'modifiable'; // FIXME:AW Not in xep 323
var XEP_323_DONE = 'done';
var XEP_323_RESULT = 'result';
var XEP_323_UNIT_HOURS = 'h';
var XEP_323_UNIT_NUMBER = 'nr';
var XEP_323_UNIT_TEMP_CELSIUS = 'C';
var XEP_323_UNIT_NONE = '';
var XEP_323_FEATURE_NOT_IMPLEMENTED = 'feature-not-implemented';

/**
 * These types are conceptual types (of a field), similar to categories.
 */
var XEP_323_FIELD_TYPE = {
    unspecified :       0,
    computed :          1 << 0,
    historicalSecond :  1 << 1,
    historicalMinute :  1 << 2,
    historicalHour :    1 << 3,
    historicalDay :     1 << 4,
    historicalWeek :    1 << 5,
    historicalMonth :   1 << 6,
    historicalQuarter : 1 << 7,
    historicalYear :    1 << 8,
    historicalOther :   1 << 9,
    historical:         1 << 10,
    identity :          1 << 11,
    momentary :         1 << 12,
    peak :              1 << 13,
    status :            1 << 14
}

/** Function: isFieldType
 * Returns true if the supplied string is a field type, false otherwise.
 */
function isFieldType(str) {
    return XEP_323_FIELD_TYPE.hasOwnProperty(str);
}

/** Function: XEP_323_Field
 *  A xep 323 field
 *  Parameters:
 *    (String) nodeId - Each JID can have several nodes each with fields
 *    (String) name - The name of the field
 *    (String) fieldType - XEP_323_FIELD_TYPE
 *    (String) value - the actual value as string
 *    (String) valueType - boolean,ineteger etc
 *    (String) unit - string representing the unit eg C,Pa,etc
 *    (boolean) modifiable - true if the value can be set with XEP-325
 *    (string) timestamp
 *
 *  Returns:
 *    the field object 
 */
function XEP_323_Field(nodeId, name, fieldType, value, valueType, unit, modifiable, timestamp) {
    this.nodeId = nodeId;
    this.name = name;
    this.fieldType = fieldType;
    this.value = value;
    this.valueType = valueType;
    this.unit = unit;
    this.modifiable = modifiable;
    this.timestamp = timestamp;
}

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([
            "strophe"
        ], function (Strophe) {
            factory(
                Strophe.Strophe,
                Strophe.$build,
                Strophe.$iq ,
                Strophe.$msg,
                Strophe.$pres
            );
            return Strophe;
        });
    } else {
        // Browser globals
        factory(
            root.Strophe,
            root.$build,
            root.$iq ,
            root.$msg,
            root.$pres
        );
    }
}(this, function (Strophe, $build, $iq, $msg, $pres) {

// sequence number to number the requests
var sensordata_nextSeqNr = 1;

/**  Function: Strophe.serialize
 * Strophe's serialize forces attribute names to be lowercase.
 * XEP 323 spec contain attribute names with both lower and upper case.
 * This is taken from strophe's serialize, the only difference being
 * that it preserves case in attribute names.
 */
Strophe.serialize = function (elem)
{
    var result;
    
    if (!elem) { return null; }
    
    if (typeof(elem.tree) === "function") {
        elem = elem.tree();
    }
    
    var nodeName = elem.nodeName;
    var i, child;
    
    if (elem.getAttribute("_realname")) {
        nodeName = elem.getAttribute("_realname");
    }
    
    result = "<" + nodeName;
    for (i = 0; i < elem.attributes.length; i++) {
        if(elem.attributes[i].nodeName != "_realname") {
            result += " " + elem.attributes[i].nodeName +
                "='" + elem.attributes[i].value
                .replace(/&/g, "&amp;")
                .replace(/\'/g, "&apos;")
                .replace(/>/g, "&gt;")
                .replace(/</g, "&lt;") + "'";
        }
    }
    
    if (elem.childNodes.length > 0) {
        result += ">";
        for (i = 0; i < elem.childNodes.length; i++) {
            child = elem.childNodes[i];
            switch( child.nodeType ){
            case Strophe.ElementType.NORMAL:
                // normal element, so recurse
                result += Strophe.serialize(child);
                break;
            case Strophe.ElementType.TEXT:
                // text element to escape values
                result += Strophe.xmlescape(child.nodeValue);
                break;
            case Strophe.ElementType.CDATA:
                // cdata section so don't escape values
                result += "<![CDATA["+child.nodeValue+"]]>";
            }
        }
        result += "</" + nodeName + ">";
    } else {
        result += "/>";
    }
    
    return result;
}
/** Function: Strophe.addConnectionPlugin
 *  Extend Strophe.Connection to have member 'sensordata'
 *
 *  Parameters:
 *    (String) ns - name
 *    (Object) dictionary with plugin functions 
 */
Strophe.addConnectionPlugin('sensordata', {

    /**
     *
     */
    init: function (connection) {
	this.connection = connection;
	connection.addHandler(sensordata_on_iq_result, null, 'iq', XEP_323_RESULT);
	connection.addHandler(sensordata_on_iq_error, null, 'iq', XEP_323_ERROR);
	connection.addHandler(sensordata_on_msg, null, 'message');
    },

    /**
     * Request all field values from a remote device
     *
     * The arguments to the optional callback function are as follows:
     *   (status, fromJid, fieldsArray)
     * where status may be one of:
     *   XEP_323_DONE, XEP_323_CANCELLED, XEP_323_REJECTED 
     */
    reqAll: function (to, callbackFn) {
	var seqnr = sensordata_getNextSeqNr();
//	log('sensordata.reqAll to=' + to + ' seqnr=' + seqnr);
	if (callbackFn && typeof(callbackFn) === "function") {
	    addToSeqNrMap(seqnr, callbackFn);
	} else {
	    addToSeqNrMap(seqnr, null);
	}
	var iq = $iq({type: XEP_323_GET, to: to}).c(XEP_323_REQ, {xmlns: sensordata_getXmlNameSpace(), seqnr: seqnr, status: 'true', identity: 'true', momentary: 'true'}); 
	connection.sendIQ(iq);
	return seqnr;
    },

    /**
     * Request the value of a specific field from a remote device
     *
     * The arguments to the optional callback function are as follows:
     *   (status, fromJid, fieldsArray)
     * where status may be one of:
     *   XEP_323_DONE, XEP_323_CANCELLED, XEP_323_REJECTED 
     */
    req: function (to, nodeId, fieldName, callbackFn) {
	var seqnr = sensordata_getNextSeqNr();
//	log('sensordata.req to=' + to + ' seqnr=' + seqnr + ' nodeId ' + nodeId + ' fieldName ' + fieldName);
	if (callbackFn && typeof(callbackFn) === "function") {
	    addToSeqNrMap(seqnr, callbackFn);
	} else {
	    addToSeqNrMap(seqnr, null);
	}
	var iq = $iq({type: XEP_323_GET, to: to}).c(XEP_323_REQ, {xmlns: sensordata_getXmlNameSpace(), seqnr: seqnr, momentary: 'true'}).c('node', {nodeId: nodeId}).up().c('field', {name: fieldName});
	connection.sendIQ(iq);
	return seqnr;
    },

    /**
     * The arguments to the optional callback function are as follows:
     *   (status, fromJid, fieldsArray)
     * where status may be one of:
     *   XEP_323_DONE, XEP_323_CANCELLED, XEP_323_REJECTED 
     */
    reqFieldHistory: function(to, nodeId, fieldName, fromTimestamp, toTimestamp, callbackFn) {
	if (toTimestamp <= fromTimestamp) {
	    log('Ignoring reqFieldHistory - toTimestamp <= fromTimestamp');
	    return -1;
	}
	// FIXME:AW time zones
	var fromDate = iea_formatLocalDate(new Date(fromTimestamp*1000));
	//log ('fromDate=' + fromDate);
	var toDate = iea_formatLocalDate(new Date(toTimestamp*1000));
	//log ('toDate=' + toDate);
	var seqnr = sensordata_getNextSeqNr();
	log('sensordata.reqFieldHistory to=' + to + ' seqnr=' + seqnr + ' nodeId=' + nodeId + ' fieldName=' + fieldName + ' from=' + fromDate + ' to=' + toDate);
	if (callbackFn && typeof(callbackFn) === "function") {
	    addToSeqNrMap(seqnr, callbackFn);
	} else {
	    addToSeqNrMap(seqnr, null);
	}
	var iq = $iq({type: 'get', to: to}).c('req', {xmlns: sensordata_getXmlNameSpace(), seqnr: seqnr, historical: 'true', from: fromDate, to: toDate}).c('node', {nodeId: nodeId}).up().c('field', {name: fieldName});
	//log('iq=' + iq.toString());
	connection.sendIQ(iq);
	return seqnr;
    },

    /**
     *
     */
    cancel: function(to, seqnr) {
//	log('sensordata.reqAll to=' + to + ' seqnr=' + seqnr);
	var iq = $iq({type: 'get', to: to}).c('cancel', {xmlns: sensordata_getXmlNameSpace(), seqnr: seqnr});
	connection.sendIQ(iq);
    }
});
/** Function: sensordata_getXmlNameSpace
 */
function sensordata_getXmlNameSpace() {
    return 'urn:xmpp:iot:sensordata'; // XXX
}
/** Function: sensordata_getNextSeqNr
 */
function sensordata_getNextSeqNr() {
    var seqNr = this.sensordata_nextSeqNr;
    this.sensordata_nextSeqNr++;
    return seqNr;
}

/** Function:  sensordata_on_iq_result
 *
 *  Parameters:
 *    (Object) stanza
 */
function sensordata_on_iq_result(stanza) {
    var type = $(stanza).attr(XEP_323_TYPE);
    var from = $(stanza).attr('from');
//    log('sensordata_on_iq_result type=' + type + ' from=' + from);
    var tag = $(stanza).find(XEP_323_ACCEPTED);
    if (tag.length > 0) {
	var seqnr = $(tag).attr(XEP_323_SEQNR);
	log('sensordata_on_iq: ACCEPTED, seqnr=' + seqnr);
    } else {
	tag = $(stanza).find(XEP_323_CANCELLED);
	if (tag.length > 0) {
	    var seqnr = $(tag).attr(XEP_323_SEQNR);
	    var info = getInfoFromSeqNrMap(seqnr);
	    if (info && info.callbackFn) {
		info.callbackFn(XEP_323_CANCELLED, from, seqnr, null);
	    }
	    $(document).trigger(XEP_323_EVENT.CANCELLED, seqnr, [from]);
	    deleteFromSeqNrMap(seqnr);
	} else {
//	    log('sensordata_on_iq: ignoring message');
	}
    }

    return true; // prevent handler from being removed
}
/** Function:  sensordata_on_iq_error
 *  Parameters:
 *    (Object) stanza
 */
function sensordata_on_iq_error(stanza) {
    var type = $(stanza).attr(XEP_323_TYPE);
    var from = $(stanza).attr('from');
//    log('sensordata_on_iq_error type=' + type + ' from=' + from);
    var tag = $(stanza).find(XEP_323_REJECTED);
    if (tag.length > 0) {
	var seqnr = $(tag).attr(XEP_323_SEQNR);
	var info = getInfoFromSeqNrMap(seqnr);
	if (info && info.callbackFn) {
	    info.callbackFn(XEP_323_REJECTED, from, seqnr, null);
	}
	$(document).trigger(XEP_323_EVENT.REJECTED, [from]);
	deleteFromSeqNrMap(seqnr);
    } else {
	tag = $(stanza).find(XEP_323_REQ);
	if (tag.length > 0) {
	    var seqnr = $(tag).attr(XEP_323_SEQNR);
	    tag = $(stanza).find(XEP_323_ERROR);
	    if (tag.length > 0) {
		var errorType = $(tag).attr(XEP_323_TYPE);
		var info = getInfoFromSeqNrMap(seqnr);
		if (errorType == XEP_323_CANCEL) {
		    var cause = $(tag).find(XEP_323_FEATURE_NOT_IMPLEMENTED);
		    if (cause.length > 0) {
			if (info && info.callbackFn) {
			    info.callbackFn(XEP_323_FEATURE_NOT_IMPLEMENTED, from, seqnr, null);
			} else {
			    $(document).trigger(XEP_323_EVENT.NOT_IMPLEMENTED, [from]);
			}
		    } else {
			if (info && info.callbackFn) {
			    info.callbackFn(XEP_323_CANCEL, from, seqnr, null);
			} else {
			    $(document).trigger(XEP_323_EVENT.CANCEL, [from]);
			}
		    }
		} else {
		    if (info && info.callbackFn) {
			info.callbackFn(XEP_323_ERROR, from, seqnr, null);
		    } else {
			$(document).trigger(XEP_323_EVENT.ERROR, [from]);
		    }
		}
	    }
	    deleteFromSeqNrMap(seqnr);
	}
    }

    return true; // prevent handler from being removed
}
/** Function:  
 *  Parameters:
 *    (Object) stanza
 */
function sensordata_on_msg(stanza) {
//    log(stanza.outerHTML);
    var from = $($(stanza)).attr('from');
//    log('sensordata_on_msg, from=' + from);
    var tag = $(stanza).find(XEP_323_STARTED);
    if (tag.length > 0) {
	var seqnr = $(tag).attr(XEP_323_SEQNR);
	log('sensordata_on_msg: STARTED seqnr=' + seqnr);
    } else {
	tag = $(stanza).find(XEP_323_FIELDS);
	if (tag.length > 0) {
	    var seqnr = $(tag).attr(XEP_323_SEQNR);
	    var done = $(tag).attr(XEP_323_DONE);
	    var info = getInfoFromSeqNrMap(seqnr);
	    if (!info) {
		log('sensordata_on_msg - No info for seqnr=' + seqnr);
	    }
	    $(tag).find(XEP_323_NODE).each(function() {
		var nodeId = $(this).attr(XEP_323_NODEID); 
		//log('sensordata_on_msg nodeId=' + nodeId);
		$(this).find(XEP_323_TIMESTAMP).each(function() {
		    var timeValue = $(this).attr(XEP_323_VALUE);
		    $(this).find(XEP_323_NUMERIC).each(function() {
			var fieldName = $(this).attr(XEP_323_NAME);
			var fieldValue = $(this).attr(XEP_323_VALUE);
			var fieldUnit = $(this).attr(XEP_323_UNIT);
			var fieldModifiable = $(this).attr(XEP_323_WRITABLE);
			var writable = (fieldModifiable == 'true');
			var fieldType = XEP_323_FIELD_TYPE.unspecified;
			var attributes = $(this).get(0).attributes;
			for (var i = 0; i < attributes.length; i++) {
			    if (isFieldType(attributes[i].nodeName)) {
				fieldType += XEP_323_FIELD_TYPE[attributes[i].nodeName];
			    }
			}
			//log('total fieldType for field ' + fieldName + ' is ' + fieldType);
			if (info) {
			    xep323Field = new XEP_323_Field(nodeId, fieldName, fieldType, fieldValue, XEP_323_NUMERIC, fieldUnit, writable, timeValue);
			    info.fields.push(xep323Field);
			}
			//$(document).trigger(SENSORDATA_FIELD_EVENT, [from, nodeId, fieldName, fieldValue, XEP_323_NUMERIC, fieldUnit, true, timeValue]);
		    });
		    $(this).find(XEP_323_STRING).each(function() {
			var fieldName = $(this).attr(XEP_323_NAME);
			var fieldValue = $(this).attr(XEP_323_VALUE);
			var fieldModifiable = $(this).attr(XEP_323_WRITABLE);
			var writable = (fieldModifiable == 'true');
			var fieldType = XEP_323_FIELD_TYPE.unspecified;
			var attributes = $(this).get(0).attributes;
			for (var i = 0; i < attributes.length; i++) {
			    if (isFieldType(attributes[i].nodeName)) {
				fieldType += XEP_323_FIELD_TYPE[attributes[i].nodeName];
			    }
			}
			//log('total fieldType for field ' + fieldName + ' is ' + fieldType);
			if (info) {
			    xep323Field = new XEP_323_Field(nodeId, fieldName, fieldType, fieldValue, XEP_323_STRING, XEP_323_UNIT_NONE, writable, timeValue);
			    info.fields.push(xep323Field);
			}
			//$(document).trigger(SENSORDATA_FIELD_EVENT, [from, nodeId, fieldName, fieldValue, XEP_323_STRING, '', true, timeValue]);
		    });
		    $(this).find(XEP_323_BOOLEAN).each(function() {
			var fieldName = $(this).attr(XEP_323_NAME);
			var fieldValue = $(this).attr(XEP_323_VALUE);
			var fieldModifiable = $(this).attr(XEP_323_WRITABLE);
			var writable = (fieldModifiable == 'true');
			var fieldType = XEP_323_FIELD_TYPE.unspecified;
			var attributes = $(this).get(0).attributes;
			for (var i = 0; i < attributes.length; i++) {
			    if (isFieldType(attributes[i].nodeName)) {
				fieldType += XEP_323_FIELD_TYPE[attributes[i].nodeName];
			    }
			}
			//log('total fieldType for field ' + fieldName + ' is ' + fieldType);
			if (info) {
			    xep323Field = new XEP_323_Field(nodeId, fieldName, fieldType, fieldValue, XEP_323_BOOLEAN, XEP_323_UNIT_NONE, writable, timeValue);
			    info.fields.push(xep323Field);
			}
			//$(document).trigger(SENSORDATA_FIELD_EVENT, [from, nodeId, fieldName, fieldValue, XEP_323_BOOLEAN, '', true, timeValue]);
		    });
		});
	    });
	    if (done == 'true') {
		doneReadOut(seqnr, from, info);
	    } else {
		tag = $(stanza).find(XEP_323_DONE);
		if (tag.length > 0) {
		    doneReadOut(seqnr, from, info);
		}
	    }
	} else {
	    tag = $(stanza).find(XEP_323_DONE);
	    if (tag.length > 0) {
		var seqnr = $(tag).attr(XEP_323_SEQNR);
		var info = getInfoFromSeqNrMap(seqnr);
		doneReadOut(seqnr, from, info);
	    } else {
//		log('sensordata_on_msg - ignoring message');
	    }
	}
    }

    return true; // prevent handler from being removed
}

function doneReadOut(seqnr, from, info) {
    if (info) {
	if (info.callbackFn) {
	    info.callbackFn(XEP_323_DONE, from, seqnr, info.fields);
	}
	$(document).trigger(XEP_323_EVENT.FIELDS, [from, info.fields]);
    } else {
	log('doneReadOut - No info during callback/event generation');
    }
    deleteFromSeqNrMap(seqnr);
}

// Mapping seqNr (request id) to resulting info and message handling
var seqNrMap = {};

function seqNrInfo(callbackFn) {
    this.fields = new Array();
    this.callbackFn = callbackFn;
}

function addToSeqNrMap(seqNr, callbackFn) {
    seqNrMap[seqNr] = new seqNrInfo(callbackFn);
}

function sizeOfSeqNrMap() {
    var size = 0, key;
    for (key in seqNrMap) {
        if (seqNrMap.hasOwnProperty(key)) size++;
    }
    return size;
}

function getInfoFromSeqNrMap(seqNr) {
    if (seqNrMap.hasOwnProperty(seqNr)) {
	return seqNrMap[seqNr];
    } else {
	return null;
    }
}

function deleteFromSeqNrMap(seqNr) {
    if (seqNrMap.hasOwnProperty(seqNr)) {
	//log('deleteFromSeqNrMap - deleting seqnr=' + seqNr);
	delete seqNrMap[seqNr];
    }
}
}
