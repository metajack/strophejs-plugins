/**

 *  This program is distributed under the terms of the MIT license.
 *  Please see the LICENSE file for details.
 *
 *  Copyright 2014, Sustainable Innovation AB http://sust.se, and Swedish Institute computer Science http://sisc.se.
 *  This was developed as part of the http://iea.sust.se project.
 *  Authors: Olov Stahl, Anders Wallberg
*/

/** File: strophe.control.js
 *  Strophe IOT control (XEP 325) plugin
 *  
 *  Implements basic functionality of the xmpp-iot functinality 
 *  ToDo add forms mgmt
 */

var CONTROL_SET_EVENT = 'control_set_event';
var CONTROL_PARAM_EVENT = 'control_param_event';
var CONTROL_SET_ERROR_EVENT = 'control_set_error_event';
var CONTROL_GET_ERROR_EVENT = 'control_get_error_event';

var XEP_325_TYPE_BOOLEAN = 'boolean';
var XEP_325_TYPE_INT = 'int';
var XEP_325_TYPE_LONG = 'long';
var XEP_325_TYPE_DOUBLE = 'double';
var XEP_325_TYPE_STRING = 'string';
var XEP_325_TYPE_DATE = 'date';
var XEP_325_TYPE_TIME = 'time';
var XEP_325_RESULT = 'result';
var XEP_325_ERROR = 'error';
var XEP_325_SET_RESPONSE = 'setResponse';
var XEP_325_GET_FORM_RESPONSE = 'getFormResponse';
var XEP_325_RESPONSE_CODE = 'responseCode';
var XEP_325_RESPONSE_CODE_OK = 'OK';
var XEP_325_NODE = 'node';
var XEP_325_FIELD = 'field';
var XEP_325_VAR = 'var';
var XEP_325_TYPE = 'type';


/** Function: Strophe.addConnectionPlugin
 *  Extend Strophe.Connection to have member 'control'
 *
 *  Parameters:
 *    (String) ns - name
 *    (Object) dictionary with plugin functions 
 *
 *  Returns:
 *    
 */
Strophe.addConnectionPlugin('control', {
    init: function (connection) {
	this.connection = connection;
	connection.addHandler(control_on_iq_error, null, 'iq', XEP_325_ERROR);
	connection.addHandler(control_on_iq_result, null, 'iq', XEP_325_RESULT);
    },
    set: function (to, nodeId, param, type, val) {
	log('control.set to=' + to + ' nodeId=' + nodeId + ' param=' + param + ' type=' + type + ' value=' + val);
	var iq = $iq({type: 'set', to: to}).c('set', {xmlns: control_getXmlNameSpace(), 'xml:lang': 'en'}).c('node', {'nodeId': nodeId}).up().c(type, {name: param, value: val}); // XXX validate type

//	var iq = $iq({type: 'set', to: to}).c('set', {xmlns: control_getXmlNameSpace(), 'xml:lang': 'en'}).c(type, {name: param, value: val}); // XXX validate type

	connection.sendIQ(iq);
    },
    getForm: function(to) {
//	log('control.getForm to=' + to);
	var iq = $iq({type: 'get', to: to}).c('getForm', {xmlns: control_getXmlNameSpace()});
	connection.sendIQ(iq);
    }
});

/** Function: control_getXmlNameSpace 
 *  
 */
function control_getXmlNameSpace() {
    return 'urn:xmpp:iot:control'; // XXX
}

/** Function: control_on_iq_error
 * called when we receive a iq message of type error
 */
function control_on_iq_error(stanza) {
    var type = $(stanza).attr('type');
    var from = $(stanza).attr('from');
    var id = $(stanza).attr('id');
//    log('control_on_iq_error type=' + type + ' from=' + from + ' id=' + id);
    var tag = $(stanza).find(XEP_325_SET_RESPONSE);
    if (tag.length > 0) {
	$(document).trigger(CONTROL_SET_ERROR_EVENT, [from, id]);
    } else {
	tag = $(stanza).find(XEP_325_GET_FORM_RESPONSE);
	if (tag.length > 0) {
	    $(document).trigger(CONTROL_GET_ERROR_EVENT, [from]);
	} else {
//	    log('control_on_iq: ignoring message');
	}
    }	
    return true;
}
/** Function: control_on_iq_error
 * called when we receive a iq message of type result
 */
function control_on_iq_result(stanza) {
    var type = $(stanza).attr('type');
    var from = $(stanza).attr('from');
//    log('control_on_iq_result type=' + type + ' from=' + from);
    var tag = $(stanza).find(XEP_325_SET_RESPONSE);
    if (tag.length > 0) {
	var code = $(tag).attr(XEP_325_RESPONSE_CODE);
	log('control_on_iq: response code is ' + code);
	var nodeId = null;
	var fieldName = null;
	var node = $(tag).find(XEP_325_NODE);
	$(document).trigger(CONTROL_SET_EVENT, [from, nodeId, fieldName, code]);
    } else {
	tag = $(stanza).find(XEP_325_GET_FORM_RESPONSE);
	if (tag.length > 0) {
	    $(tag).find(XEP_325_FIELD).each(function() {
		var paramName = $(this).attr(XEP_325_VAR);
		var paramType = $(this).attr(XEP_325_TYPE);
		$(document).trigger(CONTROL_PARAM_EVENT, [from, paramName, paramType]);
	    });
	} else {
//	    log('control_on_iq: ignoring message');
	}
    }
    return true;
}
