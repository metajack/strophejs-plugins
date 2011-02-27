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

	var mockGetUrl = function(cb) {
		var mockData = ['http://www.google.com', 'chrome://newtab'];
		cb.call(this,mockData);
	};

	var c; 
	beforeEach(function() {
		c = mockConnection();
		iq = { type: 'set', to: 'n@d/r2', from: 'n@d/r1', id: 'ab6fa'};
	});

	xit("#getUrls has urls in response", function() {
		var req = $iq(iq).c('command', { xmlns: Strophe.NS.COMMANDS, node: 'getUrls' });
		var cmd = Strophe.Commands.getUrls;
		cmd.callback = mockGetUrl;
		c.cmds.add(cmd);
		spyon(c,'send',function(res) {
			expect(res.find('urls').attr('xmlns')).toEqual('epic:x:urls');
			expect(res.find('url').length).toEqual(2);
		});
		receive(c,req);
	});

	it("#GetUrls", function() {
		var req = $iq(iq).c('command', { xmlns: Strophe.NS.COMMANDS, node: 'getUrls' });
		var cmd = Strophe.Commands.GetUrls;
		cmd.callback = mockGetUrl;
		c.cmds.add(cmd);
		spyon(c,'send',function(res) {
			logStanza(res);
			expect(res.find('urls').attr('xmlns')).toEqual('epic:x');
			expect(res.find('url').length).toEqual(2);
		});
		receive(c,req);
	});

	xit("#setUrls calls callback with urls", function() {
		var req = $iq(iq).c('command', { xmlns: Strophe.NS.COMMANDS, node: 'setUrls' });
		var cmd = Strophe.Commands.setUrls;
		cmd.callback = jasmine.createSpy('callback');
		c.cmds.add(cmd);
		spyon(c,'send',function(res) {
			expect(res.find('urls').attr('xmlns')).toEqual('epic:x:urls');
			expect(res.find('url').length).toEqual(2);
		});
		receive(c,req);
	});

});
