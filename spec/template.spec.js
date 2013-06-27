var sizlate = require('../sizlate.js');

describe('When given single tag', function() {
	it("it should create an indexed array of three parts", function(done) {
		
		var output = sizlate.doRender('<div></div>', {'div': 'hi'});
				
		expect( output ).toEqual('<div>hi</div>');
		
		done();

	});
});
/*
describe('When given a id selector ', function() {
	it("it should set the innerHTML", function(done) {
		sizlate.__express('<div id="one"></div>', {'#one': 'hi'}, function(err,out){
			var expected = '<div id="one">hi</div>';
			expect(expected).toEqual(out);
			done();
		});
	});
});

describe('When given a id selector ', function() {
	it("it should set the innerHTML", function(done) {
		sizlate.__express('<div class="one"></div>', {'.one': 'hi'}, function(err,out){
			var expected = '<div class="one">hi</div>';
			expect(expected).toEqual(out);
			done();
		});
	});
});

describe('When given an object ', function() {
	it("it should set the appropriate attributes", function(done) {
		sizlate.__express('<div class="one"></div>', {'.one': { 'data-thing': 'bobby'}}, function(err,out){
			var expected = '<div class="one" data-thing="bobby"></div>';
			expect(expected).toEqual(out);
			done();
		});
	});
});

describe('When given an object with more than one attribute', function() {
	it("it should set the appropriate attributes", function(done) {
		sizlate.__express('<div class="one"></div>', {'.one': { 'data-thing': 'bobby', 'data-foobar': 'beepboop'}}, function(err,out){
			var expected = '<div class="one" data-thing="bobby" data-foobar="beepboop"></div>';
			expect(expected).toEqual(out);
			done();
		});
	});
});

describe('When given an object containing innerHTML ', function() {
	it("it should set the innerHTML", function(done) {
		sizlate.__express('<div class="one"></div>', {'.one': { 'innerHTML': 'bobby'}}, function(err,out){
			var expected = '<div class="one">bobby</div>';
			expect(expected).toEqual(out);
			done();
		});
	});
});


describe('When given an object containing className ', function() {
	it("it should set the class but not remove existing classes.", function(done) {
		sizlate.__express('<div class="one"></div>', {'.one': { 'className': 'bobby'}}, function(err,out){
			var expected = '<div class="one bobby"></div>';
			expect(expected).toEqual(out);
			done();
		});
	});
});
*/