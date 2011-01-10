
describe("GetUrlCommand", function() {
	var res = '';
	res += ' <iq from="n@d/r1" type="result" to="n@d/r2" id="ab6fa" >';
	res += '     <command xmlns="http://jabber.org/protocol/commands" node="getTabs" >';
	res += '         <urls xmlns="epic:x:urls">';
	res += '             <url>http://www.google.com/</url>';
	res += '             <url>chrome://newtab/</url>';
	res += '         </urls>';
	res += '     </command>';
	res += ' </iq>';

	it("produces matching response", function() {
		var iq = $iq({ type: 'get', to: 'n@d/r1', from: 'n@d/r2', id: 'ab6fa'}).c('command', { xmlns: Strophe.NS.CMDS, node: 'getTabs' });
		console.log(iq);
	});

});
