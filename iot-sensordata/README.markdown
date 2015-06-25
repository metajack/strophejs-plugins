# Strophe.sensordata.js

Strophe.sensordata.js is a plugin to provide the functions to do basic read of values from Internet of Things (IoT) devices.
( [XEP-0323](http://xmpp.org/extensions/xep-0323.html) ).

## Usage

After you connected sucessfully to the XMPP server you can use strophe.disco to se if a device supports the XEP_323 and then call the Device JID :

  var seqnr = connection.sensordata.reqAll(JID, sensordataReqAllResultCallback);
  ...
  
  function sensordataReqAllResultCb(status, fromJid, seqnr, xep323FieldArray)
    ...
    switch(status)  {
     }

You can also send a specific request asking for a specific value:

  var seqnr = connection.sensordata.req(JID, "nodeId", "fieldName", sensordataReqOneResultCallback);