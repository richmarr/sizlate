var fs = require('fs');
var cheerio = require('cheerio');
exports.version = '0.8.3';

// Cached templates
var _preparedTemplates = {};


var checkForInputs = function($, $node, data, selector, token ) {
	$node.each(function(i, elem) {
		if(this[0].name === 'input') {
			$(this[0]).attr('value', token+selector+token);
		}else {
			$(this[0]).html(token+selector+token);
		}
	});
};

var updateNodeWithObject = function($node, obj) {
	for(var key in obj){
		switch(key) {
			case 'selectors':
				// we need to iterate over the selectors here. 
				var selectors = obj[key];
				for(var selector in selectors) {
					$node.find(selector).html(selectors[selector]);
				}
			break;
			case 'className':
				$node.addClass(obj[key]);
			break;
			case'innerHTML' :
				$node.html(obj[key]);
			break;
			default: 
				$node.attr(key, obj[key]);
		}
	}
	return $node;
};

var updateNode = function($, $node, selector, data, token) {
	switch(typeof data) {
		case "string":
			if(data !== ""){
				checkForInputs($, $node, data, selector, token);
			}
		break;
		case "number": // TODO - confirm - this seems wrong - why only numbers to ids?
			if(selector == ".id"){
				$node.attr('id', data);
			}else if(selector == ".data-id") {
				$node.attr('data-id', data);
			}else {
				checkForInputs($, $node, data, selector, token);
			}
		break;
		case "object":
			$node = updateNodeWithObject($node, data, token);
		break;
	}
	return $node;
};

var selectorIterator = function(selectors, $) {
	for(var selector in selectors) {
		if(typeof selectors[selector] === 'function') {
			break;
		}
		var $domNode = $(selector);
		if($domNode) {
			$domNode = updateNode( $, $domNode, selector, selectors[selector]);
		}
	}
};

exports.classifyKeys = function(data, options) {
	if(!options.classifyKeys || typeof data == "undefined"){
		return data;
	}
	var c = data.length;
	var retArray = [];
	while(c--) {
		var newObj = {};
		for(var key in data[c]){
			newObj['.'+key] = data[c][key];
		}
		retArray.push(newObj);
	}
	return retArray;
};

//
// Default API for Express apps
//
exports.__express = function( filename, options, callback ){
	if ( _preparedTemplates[filename] ) {
		// We already have a compiled template for this file
		return callback( undefined, serveTemplate( _preparedTemplates[filename], options.selectors ) );
	}
	
	loadFile( filename, options, function( err, str ){
		if ( err ) return callback(err);
		
		// generate the template and cache it
		_preparedTemplates[filename] = generateIndexedArrayOfTemplateSlices( str, options.selectors );
	
		// populate the cached template with the given values
		return callback( undefined, serveTemplate( _preparedTemplates[filename], options.selectors ) );	
	
	});
};

function serveTemplate( template, selectors ){
	var out = template.slice(0);
		
	for( var selector in selectors ) {
		var data = selectors[selector];
		if ( data.partial ) continue; // TODO: partials
		out[template.index[selector]] = data;
	}
	return out.join("");
}



// Make sure we've loaded and prepared all of the templates for a given request
function loadTemplates( filename, options, callback ){
	var files = [];
	
	// Check to see if we've loaded this view before
	if ( !_preparedTemplates[filename] ) files.push({ file:filename, selectors:options.selectors });
	
	// Look for the layout, if there is one
	if ( options.layout && !_preparedTemplates[options.layout] ) files.push({ file:options.layout, selectors:options.selectors });
	
	// Now look up all the partials used
	for ( var selector in options.selectors ){
		var data = options.selectors[selector];
		if ( data.partial ){
			files.push( options.settings.views + '/partials/' + selectors[key].partial + '.'+options.settings['view engine'] );
		}
	}
	// Load them all
	var i = files.length,
		responded = 0;
	while ( i-- > 0 ) {
		loadTemplate( files[i].file, files[i].options, function( err, template ){
			
			if ( ++responded == files.length ) callback()
		});
	}
}

function loadTemplate( filename, options, callback ){
	loadFile( filename, options, function( err, str ){
		if ( err ) return callback(err);
		var html = insertTokensIntoHTML( str, options.selectors );
		
		_preparedTemplates[filename] 
	});
}

function loadFile( filename, options, callback ){
	fs.readFile( filename, 'utf8', function ( err, str ) {
		return callback( err, str );
	});
};


//
// Uses Cheerio to inject marker tokens into the DOM, then reserialise it. This is so that we can split up the HTML
// and manage it as a string for simple concatenation at query time
//
function insertTokensIntoHTML( html, token, selectors ){
	
	var $ = cheerio.load(html);
		
	for(var selector in selectors) {
		var data = selectors[selector];
		if( data && !data.partial ){ // not sure what to do about nested templates yet
			if( typeof data === 'function') break;
				
			var $domNode = $(selector);
			if( $domNode && $domNode.length) {
				$domNode = updateNode( $, $domNode, selector, data, token);
			}
		}
	}
	
	return $.html();
};


//
// Stateless synchronous method for generating an array of template slices
// Used by the two main API calls, doRender() and __express()
//
function generateIndexedArrayOfTemplateSlices( html, selectors ){
	
	// This token split process is the easiest way I could think of to break down "<i><b></b></i>" into ["<i><b>","","</b></i>"]
	// the process goes:
	//   1) Parse string into DOM using cheerio
	//   2) Push in tokens that look like "#sizlate#"+selector+"#sizlate#"
	//   3) Split on "#sizlate#"
	//   4) Loop through resulting array looking for each selector, removing it and marking its location in a lookup table
	//   5) Resulting data structure allows data population via a lookup table, then HTML serialisation via Array.join()	
	var token = "#sizlate#",
		slices = [];
		
	slices.index = {};
	
	insertTokensIntoHTML( html, token, selectors ).split(token).forEach(function( slice, i ){
		// Loop through the elements in the template array, looking for marked positions
		if ( slice ) {
			if ( selectors && selectors[slice] ) {
				// This slice is where a selector wants to put data, so index the location and leave an empty string
				slices.index[slice] = i;
				slices.push("");
			}
			else {
				// This is just HTML, so pass it through
				slices.push(slice);
			}
		}
	});

	return slices;
}

// 
// Uncached templating API for testing and utility
//
exports.doRender = function( str, selectors ){
	var indexedArray = generateIndexedArrayOfTemplateSlices( str, selectors );
	return serveTemplate( indexedArray, selectors );
};

