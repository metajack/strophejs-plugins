describe("plugin", function() {
	var conn, epic;
	beforeEach(function() {
		conn = new Strophe.Connection();
		conn.authenticated = true;
		conn._changeConnectStatus(Strophe.Status.CONNECTED);
		epic = $("<div/>").epic({conn: conn});
	});

	it("shows item in roster", function() {
		var pres = $pres({from: 'n@d/r'});
		conn._dataRecv(createRequest(pres));
		expect(conn.roster.contacts).toEqual({'n@d/r': 'available'});
		expect(epic.find('.epic-roster-item').text()).toEqual('n@d/r');
	});

	it("gets commands and displays them", function() {
		var x = '<ul class="epic-roster"><li class="epic-roster-item">n@d/r</li></ul>';
		epic.append(x);
		spyOn(conn,'send').andCallFake(function(iq) {
			var res = $iq({type: 'result', id: $(iq).attr('id')});
			res.c('query', {xmlns: Strophe.NS.DISCO_ITEMS, node: Strophe.NS.CMDS});
			res.c('item', {name: 'aName', node: 'aNode', jid: $(iq).attr('from')});
			conn._dataRecv(createRequest(res));
			expect(epic.find('.epic-cmd-item').text()).toEqual('aName');

		});
		epic.find('.epic-roster-item').click();
	});

	it("executes command", function() {
		var x = '<ul class="epic-cmds"><li data-node="aNode" data-jid="n@d/r" class="epic-cmd-item">cmd</li></ul>';
		epic.append(x);
		spyOn(conn,'send');
		epic.find('.epic-cmd-item').click();
		expect(conn.send).toHaveBeenCalled();
	});

});
