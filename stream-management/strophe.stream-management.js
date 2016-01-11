
/**
 * StropheJS - Stream Management XEP-0198
 *
 * This plugin implements stream mangemament ACK capabilities of the specs XEP-0198.
 * Note: Resumption is not supported in this current implementation.
 *
 * Reference: http://xmpp.org/extensions/xep-0198.html
 *
 * @class streamManagement
 */
Strophe.addConnectionPlugin('streamManagement', {

    /**
     * @property {Boolean} autoSendCountOnEveryIncomingStanza: Set to true to send an 'a' response after every stanza.
     * @default false
     * @public
     */
    autoSendCountOnEveryIncomingStanza: false,

    /**
     * @property {Integer} requestResponseInterval: Set this value to send a request for counter on very interval
     * number of stanzas sent. Set to 0 to disable.
     * @default 5
     * @public
     */
    requestResponseInterval: 5,

    /**
     * @property {Pointer} _c: Strophe connection instance.
     * @private
     */
    _c: null,

    /**
     * @property {String} _NS XMPP Namespace.
     * @private
     */
    _NS: 'urn:xmpp:sm:3',

    /**
     * @property {Boolean} _isStreamManagementEnabled
     * @private
     */
    _isStreamManagementEnabled: false,

    /**
     * @property {Integer} _serverProcesssedStanzasCounter: Keeps count of stanzas confirmed processed by the server.
     * The server is the source of truth of this value. It is the 'h' attribute on the latest 'a' element received
     * from the server.
     * @private
     */
    _serverProcesssedStanzasCounter: null,

    /**
     * @property {Integer} _clientProcessedStanzasCounter: Counter of stanzas received by the client from the server.
     * Client is the source of truth of this value. It is the 'h' attribute in the 'a' sent from the client to
     * the server.
     * @private
     */
    _clientProcessedStanzasCounter: null,

    /**
     * @property {Integer} _clientSentStanzasCounter
     * @private
     */
    _clientSentStanzasCounter: null,

    /**
     * Stores a reference to Strophe connection send function to wrap counting functionality.
     * @method _originalSend
     * @type {Handler}
     * @private
     */
    _originalSend: null,

    /**
     * @property {Handler} _requestHandler: Stores reference to handler that process count request from server.
     * @private
     */
    _requestHandler: null,

    /**
     * @property {Handler} _incomingHanlder: Stores reference to hanlder that processes incoming stanzas count.
     * @private
     */
    _incomingHandler: null,

    /**
     * @property {Integer} _requestResponseIntervalCount: Counts sent stanzas since last response request.
     */
    _requestResponseIntervalCount: 0,

    init: function(conn) {
        this._c = conn;
        Strophe.addNamespace('SM', this._NS);

        // Storing origina send function to use additional logic
        this._originalSend = this._c.send;
        this._c.send = this.send.bind(this);
    },

    statusChanged: function (status) {
        if (status === Strophe.Status.CONNECTED || status === Strophe.Status.DISCONNECTED) {

            this._serverProcesssedStanzasCounter = 0;
            this._clientProcessedStanzasCounter = 0;

            this._clientSentStanzasCounter = 0;

            this._isStreamManagementEnabled = false;
            this._requestResponseIntervalCount = 0;

            if (this._requestHandler) {
                this._c.deleteHandler(this._requestHandler);
            }

            if (this._incomingHandler) {
                this._c.deleteHandler(this._incomingHandler);
            }

            this._requestHandler = this._c.addHandler(this._handleServerRequestHandler.bind(this), this._NS, 'r');
            this._incomingHandler = this._c.addHandler(this._incomingStanzaHandler.bind(this));
        }
    },

    enable: function() {
        this._c.send($build('enable', {xmlns: this._NS, resume: false}));
    },

    /**
     * This method overrides the send method implemented by Strophe.Connection
     * to count outgoing stanzas
     *
     * @method Send
     * @public
     */
    send: function(elem) {
        if (Strophe.isTagEqual(elem, 'iq') ||
            Strophe.isTagEqual(elem, 'presence') ||
            (elem.node && elem.node.tagName === 'message')) {
            this._increaseSentStanzasCounter();
        }

        return this._originalSend.call(this._c, elem);
    },

    _incomingStanzaHandler: function(elem) {
        if (Strophe.isTagEqual(elem, 'enabled') && elem.getAttribute('xmlns') === this._NS) {
            this._isStreamManagementEnabled = true;
        }

        if (Strophe.isTagEqual(elem, 'iq') || Strophe.isTagEqual(elem, 'presence') || Strophe.isTagEqual(elem, 'message'))  {
            this._increaseReceivedStanzasCounter();

            if (this.autoSendCountOnEveryIncomingStanza) {
                this._answerProcessedStanzas();
            }
        }

        if (Strophe.isTagEqual(elem, 'a')) {
            this._setSentStanzasCounter(parseInt(elem.getAttribute('h')));

            if (this.requestResponseInterval > 0) {
                this._requestResponseIntervalCount = 0;
            }
        }

        return true;
    },

    getClientSentStanzasCounter: function() {
        return this._clientSentStanzasCounter;
    },

    _setSentStanzasCounter: function(count) {
        this._serverProcesssedStanzasCounter = count;

        if (this._clientSentStanzasCounter !== this._serverProcesssedStanzasCounter) {
            console.error('Stream Management stanzas counter mismatch. Client value: ' + this._clientSentStanzasCounter + ' - Server value: ' + this._serverProcesssedStanzasCounter);
        }
    },

    _handleServerRequestHandler: function() {
        this._answerProcessedStanzas();
        return true;
    },

    _answerProcessedStanzas: function() {
        if (this._isStreamManagementEnabled) {
            this._c.send($build('a', { xmlns: this._NS, h: this._clientProcessedStanzasCounter }));
        }
    },

    _increaseSentStanzasCounter: function() {
        if (this._isStreamManagementEnabled) {

            this._clientSentStanzasCounter++;

            if (this.requestResponseInterval > 0) {
                this._requestResponseIntervalCount++;

                if (this._requestResponseIntervalCount === this.requestResponseInterval) {
                    this._requestResponseIntervalCount = 0;
                    setTimeout(function(){
                        this._originalSend.call(this._c, $build('r', { xmlns: this._NS }));
                    }.bind(this), 100);
                }
            }
        }
    },

    _increaseReceivedStanzasCounter: function() {
        if (this._isStreamManagementEnabled) {
            this._clientProcessedStanzasCounter++;
        }
    }

});
