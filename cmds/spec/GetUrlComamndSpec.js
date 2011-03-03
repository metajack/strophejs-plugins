describe("GetUrlCommand", function() {

	var mockGetUrl = function(onSuccess, onError) {
		var mockData = ['http://www.google.com', 'chrome://newtab'];
		onSuccess.call(this,mockData);
	}, c;

	beforeEach(function() {
		c = mockConnection();
		iq = { type: 'set', to: 'n@d/r2', from: 'n@d/r1', id: 'ab6fa'};
	});


	it("#GetUrls calls callback and sends urls in response", function() {
		var req = $iq(iq).c('command', { xmlns: Strophe.NS.COMMANDS, node: 'getUrls' });
		c.cmds.add(Strophe.Commands.create('getUrls', mockGetUrl));
		spyon(c,'send',function(res) {
			expect(res.find('url').length).toEqual(2);
		});
		receive(c,req);
	});

	it("#SetUrls calls callback with urls received in request", function() {
		var req = $iq(iq).c('command', { xmlns: Strophe.NS.COMMANDS, node: 'setUrls' });
		req.c('url').t('http://www.google.com').up();
		req.c('url').t('chrome://newtab');

		var callback = jasmine.createSpy('callback').andCallFake(function(onSuccess,onError) {
			expect($(this.req).find('url').length).toEqual(2);
			onSuccess.call(this,{});
		});
		var cmd = Strophe.Commands.create('setUrls', callback);
		c.cmds.add(cmd);
		spyon(c,'send',function(res) {
			expect(res.find('command').attr('status')).toEqual('completed');
		});
		receive(c,req);
		expect(cmd.callback).toHaveBeenCalled();
	});

	xit("populates request for known command", function() {
		var cmd = Strophe.Commands.create('setUrls', function() {});
		c.cmds.add(cmd);
		spyon(c,'send',function(res) {
			expect(res.find('url').length).toEqual(2);
		});
		c.cmds.execute('n@d/r', 'setUrls', mockGetUrl());
	});

});
