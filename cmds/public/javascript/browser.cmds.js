(function(Strophe,$,_) {



	var getUrls = { 
		node: 'getUrls', 
		name: 'Retrieve Urls',
		addContent: function(req,res) {
			if(!this.callback) {  throw 'No callback provided'; }
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

	Strophe.Commands = {};
	Strophe.Commands['getUrls'] = getUrls;
})(Strophe,jQuery,_);
