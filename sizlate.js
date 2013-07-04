var fs = require('fs');
var cheerio = require('cheerio');
exports.version = '0.8.3';

// Cached templates
var _preparedTemplates = {};

exports.reset = function(){ delete _preparedTemplates; _preparedTemplates = {} };



var checkForInputs = function($, $node, data, selector, token ) {
	$node.each(function(i, elem) {
		if(this[0].name === 'input') {
			$(this[0]).attr('value', token+selector+token);
		}else {
			$(this[0]).html(token+selector+token);
		}
	});
};

var updateNodeWithObject = function( $node, obj, selector, token ) {
	for(var key in obj){
		switch(key) {
			case 'partial':
				// insert a placeholder for this partial selector
				$node.html(token+selector+token);
			break;
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
			case 'data':
				if ( obj.partial ) break; // this is data for the partial rather than being a data HTML attribute
			default: 
				$node.attr(key, obj[key]);
		}
	}
	return $node;
};

var updateNode = function($, $node, selector, data, token) {
	switch(typeof data) {
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
			$node = updateNodeWithObject( $node, data, selector, token );
		break;
		default:
			if(data !== ""){
				checkForInputs($, $node, data, selector, token);
			}
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
	if ( _preparedTemplates[filename] && !( options.layout || _preparedTemplates[layoutPath(options)] ) ) {
		// We already have a compiled template for this file
		return callback( undefined, generateHtmlFromTemplate( _preparedTemplates[filename], options.layout, options, options.selectors ) );
	}
	
	loadFiles( filename, options, options.selectors, function( err ){
		if ( err ) return callback(err);
		// populate the cached template with the given values
		return callback( undefined, generateHtmlFromTemplate( _preparedTemplates[filename], options.layout, options, options.selectors ) );	
	
	});
};

//
// Combines the various sets of arrays from views, layouts, and partials, into an HTML string
//
function generateHtmlFromTemplate( template, layout, options, selectors ){
	
	var htmlArr = [],
		viewPosition = Infinity;
	
	// Prepare the layout template if there is one
	if ( layout ){
		preparedLayout = _preparedTemplates[layoutPath(options)];
		viewPosition = preparedLayout.index["#container"];
		htmlArr = injectDataIntoTemplate( preparedLayout, selectors, options );
	}
	
	// splice the view into the layout. There's a bit of shenannigans here to make this fit into the arguments of Array.splice()
	var viewArgs = injectDataIntoTemplate( template, selectors, options );
	viewArgs.unshift(viewPosition,0);
	Array.prototype.splice.apply( htmlArr, viewArgs );
	
	return htmlArr.join('');
	
}

//
// Pushes data into a copy of a template, but keeps it as an array so that it can be combined 
// with other template arrays, see generateHtmlFromTemplate()
//
function injectDataIntoTemplate( template, selectors, options ){
	
	// make sure we have a *copy* of the template array, rather than modifying an original
	//if ( template.index ) template = template.slice(0);
	
	var out = template.slice(0),
		templatePositions;
		
	for( var selector in selectors ) {
		var data = selectors[selector],
			value = data;
			
		if ( data.partial ) {
			var partials = [],
				len = data.data && data.data.length || 1; // at least 1, to make the data array optional
			
			for ( var i = 0; i < len; i++ ){
				partials.push( injectDataIntoTemplate( _preparedTemplates[partialPath( data.partial, options )], data.data[i] ).join("") );
			}
			
			value = partials.join("");
		}
		
		if ( templatePositions = template.index[selector] ){
			templatePositions.forEach(function(i){
				out[i] = value;
			});
		}
	}
	
	// also copy the index so that we can deal with template/partial injection
	//out.index = template.index;
	
	return out;
}

// Helpers to generate consistent paths from given config options
function layoutPath(options){ return options.settings.views+"/"+options.layout+'.'+options.settings['view engine']; }
function partialPath(name,options){ return options.settings.views+"/partials/"+name+'.'+options.settings['view engine']; }


// Make sure we've loaded and prepared all of the templates for a given request
function loadFiles( filename, options, selectors, callback ){
	var files = [],
		counts = {};
	counts.open = 0;
	counts.closed = 0;
	
	// Look for the main view
	counts.open++;
	loadTemplate( filename, options, selectors, function(){
		if ( ++counts.closed == counts.open && counts.finished ) callback();
	});
	
	// Look for the layout, if there is one
	if ( options.layout ){
		counts.open++;
		loadTemplate( layoutPath(options), options, selectors, function(){
			if ( ++counts.closed == counts.open && counts.finished ) callback();
		});
	}
	
	// Load in any partial templates needed
	loadPartialTemplates( selectors, options, counts, callback );
}

// Currently doesn't support nested partials
function loadPartialTemplates( selectors, options, counts, callback ){
	var i = 0;
	for ( var selector in options.selectors ){
		i++;
		var conf = options.selectors[selector];
		if ( conf.partial ){
			counts.open++;
			loadTemplate( partialPath(conf.partial,options), options, getPartialSelectors(conf.data), function(){
				if ( ++counts.closed === counts.open ) callback();
			});
		}
	}
	counts.finished = true;
	if ( i == 0 && counts.closed == counts.open ) callback();
}

function getPartialSelectors( dataArr ){
	var selectors = {};
	dataArr.forEach(function(item){
		for ( var key in item ) selectors[key] = true;
	});
	return selectors;
}
	
function loadTemplate( filename, options, selectors, callback ){
	if ( _preparedTemplates[filename] ) {
		return callback();
	}
	loadFile( filename, options, function( err, str ){
		if ( err ) throw err;
		_preparedTemplates[filename] = generateTemplateFromHtml( str, selectors );
		callback();
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
	
	for( var selector in selectors ) {
		var data = selectors[selector];
		if ( data ){ // not sure what to do about nested templates yet
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
function generateTemplateFromHtml( html, selectors ){
	
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
				// Selectors can select more than one location, so we need an array rather than a simple index
				if ( !slices.index[slice] ) slices.index[slice] = [];
				slices.index[slice].push(i);
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
	var template = generateTemplateFromHtml( str, selectors );
	return generateHtmlFromTemplate( template, undefined, undefined, selectors );
};

