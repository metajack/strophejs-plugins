var StropheVcard = function(window, $) {
    var BOSH_URL = "/xmpp-httpbind";
    var DOMAIN = "speeqe.com";
    var con = null;
    var _connected = false;
    var onResult = function(stanza) {
    };
    var obj = {
        init: function() {
            conn = new Strophe.Connection(BOSH_URL);            
        },
        connected: function() {
            return _connected;
        },
        get: function(handler, jid) {
            conn.vcard.get(handler, jid);
        },
        disconnect: function() {
            conn.disconnect();
        },
        connect: function(handler) {
            conn.connect(DOMAIN, null, function (status) {
                if (status === Strophe.Status.CONNECTED) {
                    _connected = true;
                    handler();
                }
            });
        }
    };
    return obj;
}(window, jQuery);

$(function() {
    StropheVcard.init();
    StropheVcard.connect(function() {
        StropheVcard.get(function(stanza) {
            var $vCard = $(stanza).find("vCard");
            var img = $vCard.find('BINVAL').text();
            var type = $vCard.find('TYPE').text();
            var img_src = 'data:'+type+';base64,'+img;
            //display image using localStorage
            var ctx = $('#example').get(0).getContext('2d');
            var img = new Image();   // Create new Image object
            img.onload = function(){
                // execute drawImage statements here
                ctx.drawImage(img,0,0)
            }
            img.src = img_src;
        },
                         "thepug@speeqe.com");
    });
    //StropheVcard.disconnect();
});