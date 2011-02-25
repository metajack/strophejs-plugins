
describe("GetUrlCommand", function() {
	var res = '';
	res += ' <iq from="n@d/r1" type="result" to="n@d/r2" id="ab6fa" >';
	res += '     <command xmlns="http://jabber.org/protocol/commands" node="getUrls" >';
	res += '         <urls xmlns="epic:x:urls">';
	res += '             <url>http://www.google.com/</url>';
	res += '             <url>chrome://newtab/</url>';
	res += '         </urls>';
	res += '     </command>';
	res += ' </iq>';

	var xx = $iq({to: 'n@d/r1', type: 'result', id: 'ab6fa'});
	xx.c('command', { xmlns: Strophe.NS.CMDS, node: 'getUrls' });
	xx.c('urls', {xmlns: 'epic:x:urls'});
	xx.c('url').t('http://www.google.com').up();
	xx.c('url').t('chrome://newtab');

	var conn, cmds;

	var mockGetUrl = function(cb) {
		var mockData = ['http://www.google.com', 'chrome://newtab'];
		cb.call(this,mockData);
	}

	var getUrls = { node: 'getUrls', name: 'Retrieve Urls',
		callback: mockGetUrl,
		addContent: function(res) {
			var urls = Strophe.xmlElement('urls',[['xmlns','epic:x:urls']]);
			res.c('urls', {xmlns: 'epic:x:urls'});
			this.callback(function(urls) {
				_.each(urls, function(url) {
					res.c('url').t(url).up();
				});
			});
			return res;
		}
	};

	function GetUrls() {

	}


	beforeEach(function() {
		conn = new Strophe.Connection();
		conn.authenticated = true;
		conn._processRequest = function() {};
		conn._changeConnectStatus(Strophe.Status.CONNECTED);
		cmds = conn.cmds;
	});

	it("produces matching response", function() {
		var iq = $iq({ type: 'set', to: 'n@d/r2', from: 'n@d/r1', id: 'ab6fa'}).c('command', { xmlns: Strophe.NS.CMDS, node: 'getUrls' });
		conn.cmds.addCommand(getUrls);
		spyOn(conn,'send').andCallFake(function(result) {
			var str = Strophe.serialize(result.tree());
			var expected = Strophe.serialize(xx.tree());
			expect(str).toEqual(expected);
		});
		conn._dataRecv(createRequest(iq));
		expect(conn.send).toHaveBeenCalled();
	});

});
