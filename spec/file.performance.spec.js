var sizlate = require('../sizlate.js'),
	async = require("async");

describe('When given a pre-compiled template', function() {
	it("it should render very quickly", function(done) {
		
		var config = {
				settings : {
					views : "spec/fixtures",
					'view engine':"html"
				}
			};
		
		// Run once first to make sure we have a pre-compiled template
		// This also takes out the randomness of file i/o so that the 
		// tests are more predictable
		sizlate.__express('spec/fixtures/view-a.html', config, function(){
		
			var i = 0,
				startTime = new Date().getTime();
			// Then time subsequent renderings
			async.whilst( function(){ 
				return i++ < 2000;
			}, function(cb){
				sizlate.__express('spec/fixtures/view-a.html', config, cb );
			}, function(){
				expect(new Date().getTime() - startTime).toBeLessThan(20);
				done();
			});	
		});
		
	});
});

/*
describe('When given a file and a layout', function() {
	it("it should render quickly", function(done) {
		
		var i = 0,
			startTime = new Date().getTime(),
			config = {
				settings : {
					views : "spec/fixtures",
					'view engine':"html"
				},
				layout:"layout-a"
			};
		
		async.whilst( function(){ 
			return i++ < 100;
		}, function(cb){
			sizlate.__express('spec/fixtures/view-a.html', config, cb );
		}, function(){
			expect(new Date().getTime() - startTime).toBeLessThan(500);
			done();
		});
	});
});


describe('When given a file with partials', function() {
	it("it should pull them in quickly", function(done) {
		
		var i = 0,
			startTime = new Date().getTime(),
			config = {
				settings : {
					views : "spec/fixtures",
					'view engine':"html"
				},
				selectors : {
					'#partials': {
						partial: 'partial-a',
						data: [
							{ name: 'bob' },
							{ name: 'anna' }
						]
					}
				}
			};
		
		async.whilst( function(){ 
			return i++ < 100;
		}, function(cb){
			sizlate.__express('spec/fixtures/view-a.html', config, cb );
		}, function(){
			expect(new Date().getTime() - startTime).toBeLessThan(500);
			done();
		});
	});
});


describe('When given a file with layout and partials', function() {
	it("it should pull them in quickly", function(done) {
		
		var i = 0,
			startTime = new Date().getTime(),
			config = {
				settings : {
					views : "spec/fixtures",
					'view engine':"html"
				},
				layout:"layout-a",
				selectors : {
					'#partials': {
						partial: 'partial-a',
						data: [
							{ name: 'bob' },
							{ name: 'anna' }
						]
					}
				}
			};
		
		async.whilst( function(){ 
			return i++ < 100;
		}, function(cb){
			sizlate.__express('spec/fixtures/view-a.html', config, cb );
		}, function(){
			expect(new Date().getTime() - startTime).toBeLessThan(500);
			done();
		});
	});
});
*/
