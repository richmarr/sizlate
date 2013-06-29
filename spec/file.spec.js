var sizlate = require('../sizlate.js'),
	cheerio = require("cheerio");

describe('When given a file', function() {
	it("it should render properly", function(done) {
		sizlate.__express('spec/fixtures/view-a.html', {
			settings : {
				views : "spec/fixtures",
				'view engine':"html"
			}
		}, function( err, html ){
			
			var $domNode,
				$ = cheerio.load(html);
		
			$domNode = $("#partials");
			expect($domNode.length).toEqual(1);
			
			done();
		});
	});
});

describe('When given a file and a layout', function() {
	it("it should render properly", function(done) {
		sizlate.__express('spec/fixtures/view-a.html', {
			settings : {
				views : "spec/fixtures",
				'view engine':"html"
			},
			layout:"layout-a"
		}, function( err, html ){
			var $domNode,
				$ = cheerio.load(html);
		
			$domNode = $("#partials");
			expect($domNode.length).toEqual(1);
			
			$domNode = $("html");
			expect($domNode.length).toEqual(1);
			
			done();
		});
	});
});

/*

describe('When given a file with partials', function() {
	it("it should pull them in properly", function(done) {
		sizlate.__express('spec/fixtures/view-a.html', {
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
		}, function( err, html ){
			
			var $domNode,
				$ = cheerio.load(html);
			
			$domNode = $(".partial.a");
			expect($domNode.length).toEqual(2);
			
			$domNode = $("#partials");
			expect($domNode.length).toEqual(1);
			
			done();
		});
	});
});


describe('When given a file with layout and partials', function() {
	it("it should pull them together properly", function(done) {
		sizlate.__express('spec/fixtures/view-a.html', {
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
		}, function( err, html ){
			
			var $domNode,
				$ = cheerio.load(html);
		
			$domNode = $("html");
			expect($domNode.length).toEqual(1);
			
			$domNode = $(".partial.a");
			expect($domNode.length).toEqual(2);
			
			$domNode = $("#container");
			expect($domNode.length).toEqual(1);
			
			done();
		});
	});
});
*/