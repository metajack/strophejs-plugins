/*
  Copyright 2013, Joe Levy <jodoglevy@gmail.com>
*/

/**
 * JingleInfo Strophe Plugin
 * Implement https://developers.google.com/talk/jep_extensions/jingleinfo
 *
 * Requires Disco plugin
 */

Strophe.addNamespace('JINGLE_INFO', 'google:jingleinfo');

Strophe.addConnectionPlugin('jingleInfo',
{
    _connection: null,

    onNewInfo: null,

    /** Function: init
     * Plugin init
     *
     * Parameters:
     *   (Strophe.Connection) conn - Strophe connection
     */
    init: function(conn)
    {
        this._connection = conn;

        this._connection.disco.addFeature(Strophe.NS.JINGLE_INFO);

        // jingleinfo update event
        conn.addHandler(this._onJingleInfo.bind(this), Strophe.NS.JINGLE_INFO, 'iq', 'set', null, null);
    },

    setOnNewInfo: function (handler)
    {
        this.onNewInfo = handler;
    },

    /** Function: info
     * Info query
     *
     * Parameters:
     *   (String) jid - Jid
     *   (Function) success - Callback after success
     *   (Function) error - Callback after error
     *   (Function) timeout - Callback after timeout
     *
     */
    info: function(jid, success, error, timeout)
    {
        var attrs = { xmlns: Strophe.NS.JINGLE_INFO };

        var info = $iq({
            from: this._connection.jid,
            to: jid,
            type: 'get',
        }).c('query', attrs);

        this._connection.sendIQ(info, success, error, timeout);
    },
    
    _onJingleInfo: function(stanza)
    {
        if(this.onNewInfo) this.onNewInfo(stanza)
        return true;
    }
});