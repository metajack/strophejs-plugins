Strophe.addConnectionPlugin('iexdomain', {
    init: function(conn) {
        // replace Strophe.Request._newXHR with new IE CrossDomain version
        var nativeXHR = new XMLHttpRequest();
        if (window.XDomainRequest && ! ("withCredentials" in nativeXHR)) {
            Strophe.Request.prototype._newXHR = function() {
                var xhr = new XDomainRequest();
                xhr.readyState = 0;

                xhr.onreadystatechange = this.func.prependArg(this);
                xhr.onerror = function() {
                    xhr.readyState = 4;
                    xhr.status = 500;
                    xhr.onreadystatechange(xhr.responseText);
                };
                xhr.ontimeout = function() {
                    xhr.readyState = 4;
                    xhr.status = 0;
                    xhr.onreadystatechange(xhr.responseText);
                };
                xhr.onload = function() {
                    xhr.readyState = 4;
                    xhr.status = 200;
                    var _response = xhr.responseText;
                    var _xml = new ActiveXObject('Microsoft.XMLDOM');
                    _xml.async = 'false';
                    _xml.loadXML(_response);
                    xhr.responseXML = _xml;
                    xhr.onreadystatechange(_response);
                };
                return xhr;
            };
        } else {
            console.info("Browser doesnt support XDomainRequest." + "  Falling back to native XHR implementation.");
        }
    }
});
