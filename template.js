var fs = require('fs');
var cheerio = require('cheerio');
var crypto = require('crypto');

var Template = exports.Template = function(){
};

Template.prototype.read = function( path, encoding, callback ){
	fs.readFile( path, encoding, function ( err, str ) {
		if ( err ) {
			console.error("Could not open file: %s", err);
			process.exit(1);
		}
		callback( cheerio.load(str) );
	});
};

Template.prototype.compile = function( path, encoding, options, callback ){
	var self = this;
	this.read( path, encoding, function( $ ){
		var selectors = options.selectors,
			out = [];
		for(var selector in selectors) {
			var data = selectors[selector];
			if( data && !data.partial ){ // not sure what to do about nested templates yet
				if( typeof data === 'function') break;
					
				var $domNode = $(selector);
				if( $domNode && $domNode.length) {
					$domNode = updateNode($, $domNode, selector, data);
				}
				
				out.push($.html());	
			}
		}
		self._compiled = out.join("");
		return callback.call( self, undefined, self._compiled );
	});
};

Template.prototype.render = function( path, encoding, options, callback ){
	if ( this._compiled ) return callback( undefined, replaceTokens( this._compiled, options ) );
	this.compile( path, encoding, options, function( err, compiled ){
		return callback( undefined, replaceTokens( compiled, options ) );
	});
};

function replaceTokens( str, options ){
	var selectors = options.selectors;
	for( var selector in selectors ) {
		var data = selectors[selector];
		if ( data.partial ) continue;
		str = str.replace( getSelectorToken(selector), data );
	}
	return str;
}

var updateNode = function($, $node, selector, data) {
	switch(typeof data) {
		case "string":
			if(data !== ""){
				checkForInputs($, selector, $node, data);
			}
		break;
		case "number": // TODO - confirm - this seems wrong - why only numbers to ids?
			if(selector == ".id"){
				$node.attr('id', data);
			}else if(selector == ".data-id") {
				$node.attr('data-id', data);
			}else {
				checkForInputs($, selector, $node, data);
			}
		break;
		case "object":
			$node = updateNodeWithObject($node, data);
		break;
	}
	return $node;
};	

var checkForInputs = function($, selector, $node, data) {
	$node.each(function(i, elem) {
		if(this[0].name === 'input') {
			$(this[0]).attr('value', getSelectorToken(selector) );
		}else {
			$(this[0]).html( getSelectorToken(selector) );
		}
	});
};

function getSelectorToken( text ){
	var hash = crypto.createHash('md5');
	hash.update(text,'utf8');
	var hex = hash.digest('hex');
	return hex;
}