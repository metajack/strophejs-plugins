describe("GetUrlCommand", function() {
	var mockGetUrl = function(onSuccess, onError) {
		var mockData = ['http://www.google.com', 'chrome://newtab'];
		onSuccess.call(this,mockData);
	}, c;

	beforeEach(function() {
		c = mockConnection();
		iq = { type: 'set', to: 'n@d/r2', from: 'n@d/r1', id: 'ab6fa'};
		success = jasmine.createSpy('success');
	});

	it("called with no urls", function() {
		c.cmds.add(Strophe.Commands.create('getUrls', mockGetUrl));
		spyon(c,'send',function(res) { expect(res.find('url').length).toEqual(0); });
		c.cmds.exec('n@d/r', 'getUrls');
	});

	it("called with no urls also calls callback", function() {
		c.cmds.add(Strophe.Commands.create('getUrls', mockGetUrl));
		spyon(c,'send',function(req) {
			var res = $iq({type: 'result', id: req.attr('id')});
			c._dataRecv(createRequest(res));
		});
		c.cmds.execute('n@d/r', 'getUrls', { success: success});
		expect(success).toHaveBeenCalled();
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

	it("populates request for known command", function() {
		var cmd = Strophe.Commands.create('setUrls', function() {});
		var urls = ['http://www.google.com', 'chrome://newtab'];
		c.cmds.add(cmd);
		spyon(c,'send',function(res) {
			expect(res.find('url').length).toEqual(2);
			expect(res.find('url:eq(0)').text()).toEqual('http://www.google.com');
		});
		c.cmds.execute('n@d/r', 'setUrls', {data:urls});
	});

});
