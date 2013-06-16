var Template = require('../template').Template,
	async = require("async");

describe('When given a file', function() {
	it("it should render quickly", function(done) {
		
		var i = 0,
			startTime = new Date().getTime(),
			config = {
				settings : {
					views : "spec/fixtures",
					'view engine':"html"
				},
				selectors : {
					'span.a':'hello',
					'#partials': {
						partial: 'partial-a',
						data: [
							{ name: 'bob' },
							{ name: 'anna' }
						]
					}
				}
			};
		
		var template = new Template('spec/fixtures/view-a.html', 'utf-8');
		
		async.whilst( function(){ 
			return i++ < 2000;
		}, function(cb){
			template.render( config, cb );
		}, function(){
			expect(new Date().getTime() - startTime).toBeLessThan(200);
			done();
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
			expect(new Date().getTime() - startTime).toBeLessThan(400);
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
			expect(new Date().getTime() - startTime).toBeLessThan(400);
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
			expect(new Date().getTime() - startTime).toBeLessThan(400);
			done();
		});
	});
});
*/