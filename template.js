var fs = require('fs');
var cheerio = require('cheerio');
var crypto = require('crypto');

var Template = exports.Template = function( path, encoding ){
	this.path = path;
	this.encoding = encoding;
	return this;
};

Template.prototype.read = function( callback ){
	fs.readFile( this.path, this.encoding, function ( err, str ) {
		if ( err ) {
			console.error("Could not open file: %s", err);
			process.exit(1);
		}
		callback( cheerio.load(str) );
	});
};

Template.prototype.compile = function( options, callback ){
	var self = this;
	this.read( function( $ ){
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


Template.prototype.render = function( options, callback ){
	if ( this._compiled ) return callback( undefined, replaceTokens( this._compiled, options ) );
	this.compile( options, function( err, compiled ){
		return callback( undefined, replaceTokens( compiled, options ) );
	});
};


Template.prototype.prepareTemplateSlices = function( options, callback ){
	//if ( this._compiled ) return callback( undefined, splitOnTokens( this._compiled, options ) );
	this.compile( options, function( err, compiled ){
		if ( err ) return callback(err);
		var self = this;
		self._selectorIndexes = {};
		self._slices = compiled.split("#sizlate#");
		var selectors = options.selectors;
			
		this._slices.forEach(function(slice,i){
			if ( selectors[slice] ) {
				self._selectorIndexes[slice] = i;
				console.log(i);
			}
		});
		return callback( undefined );
	});
};

Template.prototype.render = function( options, callback ){
	var self = this;
	if ( this._slices ) return callback( undefined, self.joinTemplateSlices( options ) );
	this.prepareTemplateSlices( options, function( err ){
		return callback( undefined, self.joinTemplateSlices( options ) );
	});
};

Template.prototype.joinTemplateSlices = function( options ){
	var selectors = options.selectors,
		out = this._slices.slice(0),
		indexes = this._selectorIndexes;
	for( var selector in selectors ) {
		var data = selectors[selector];
		if ( data.partial ) continue;
		out[this._selectorIndexes[selector]] = data;
	}
	return out.join("");
}

Template.prototype.splitOnTokensAndReturnIndexes = function( str, options ){
	var slices = str.split("#sizlate#"),
		selectorIndexes;
	slices.forEach(function(slice,i){
		console.log(i);
	})
}

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
	return "#sizlate#"+text+"#sizlate#";
	
	var hash = crypto.createHash('md5');
	hash.update(text,'utf8');
	var hex = hash.digest('hex');
	return hex;
}