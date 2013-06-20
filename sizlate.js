var fs = require('fs');
var cheerio = require('cheerio');
exports.version = '0.8.3';

var checkForInputs = function($node, data) {
	$node.each(function(i, elem) {
		if(this[0].name === 'input') {
			$(this[0]).attr('value', data);
		}else {
			$(this[0]).html(data);
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
var updateNode = function($node, selector, data) {
	switch(typeof data) {
		case "string":
			if(data !== ""){
				checkForInputs($node, data);
			}
		break;
		case "number": // TODO - confirm - this seems wrong - why only numbers to ids?
			if(selector == ".id"){
				$node.attr('id', data);
			}else if(selector == ".data-id") {
				$node.attr('data-id', data);
			}else {
				checkForInputs($node, data);
			}
		break;
		case "object":
			$node = updateNodeWithObject($node, data);
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
			$domNode = updateNode($domNode, selector, selectors[selector]);
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

exports.doRender = function(str, selectors) {
	/*if(!selectors){
		return str;
	}
	var selectors = ( typeof selectors[0] == 'undefined' ) ? [selectors] : selectors; // make sure we have an array.
	var selectorCount = selectors.length;
	var out = [];
	while(selectorCount--){
		$ = cheerio.load(str);
		selectorIterator(selectors[selectorCount], $);
		out.push($.html());
	}
	return out.join('');
	*/
	
		var $ = cheerio.load(str),
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
		return out.join("");
		
};

var _preparedTemplates = {};

exports.__express = function( filename, options, callback ){
	if ( _preparedTemplates[filename] ) {
		// We already have a compiled template for this file
		return callback( undefined, serveTemplate( _preparedTemplates[filename], options ) );
	}
	// Previously unknown template, we need to compile it before serving up HTML
	prepareTemplate( filename, options, function( err ){
		if ( err ) throw err;
		return callback( undefined, serveTemplate( _preparedTemplates[filename], options ) );
	});
};


//
//	Precompiles a template into an intermediate format
//
function prepareTemplate( filename, options, callback ){
	prepareLayout( options, function( err ){
		insertTokensAccordingToSelectors( filename, options, function( err, compiled ){
			if ( err ) return callback(err);
		
			// make a blank template
			if ( !_preparedTemplates[filename] ) _preparedTemplates[filename] = {};
			var template = _preparedTemplates[filename];
			template.selectorIndexes = {};
			template.slices = [];
		
			var selectors = options.selectors || {};
			
			compiled.split("#sizlate#").forEach(function( slice, i ){
				console.log(slice);
				if ( slice ) {
					if ( selectors[slice] ) {
						template.selectorIndexes[slice] = i;
						template.slices.push("");
					}
					else {
						template.slices.push(slice);
					}
				}
			});
		
			return callback( undefined );
		});
	});
};

function prepareLayout( options, callback ){
	if ( !options.layout ) return callback();
	
	var filepath = options.layout,
		ext = options.settings['view engine'];
		
	fs.readFile( filepath+"."+ext, 'utf8', function ( err, str ) {
		if ( err ) return callback(err);
		
		var $ = cheerio.load(str),
			selectors = options.selectors;
			
		for(var selector in selectors) {
			var data = selectors[selector];
			if( data && !data.partial ){ // not sure what to do about nested templates yet
				if( typeof data === 'function') break;
					
				var $domNode = $(selector);
				if( $domNode && $domNode.length) {
					$domNode = updateNode($, $domNode, selector, data);
				}
			}
		}
		
		return callback( undefined, $.html() );
	});
}

function serveTemplate( template, options ){
	var selectors = options.selectors,
		out = template.slices.slice(0),
		indexes = template.selectorIndexes;
		
	for( var selector in selectors ) {
		var data = selectors[selector];
		if ( data.partial ) continue; // TODO: partials
		out[indexes[selector]] = data;
	}
	return out.join("");
}
/*
function insertTokensAccordingToSelectors( filename, options, callback ){
	var template = _preparedTemplates[filename];
	fs.readFile( filename, 'utf8', function ( err, str ) {
		if ( err ) {
			console.error("Could not open file: %s", err);
			process.exit(1);
		}
		return callback( undefined, exports.doRender( str, options.selectors ) );
	});
};*/

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
			files.push( options.settings.views + '/partials/' + selectors[key].partial + '.'+options.settings['view engine']
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

function insertTokensIntoHTML( html, selectors ){
	
	var $ = cheerio.load(html);
		
	for(var selector in selectors) {
		var data = selectors[selector];
		if( data && !data.partial ){ // not sure what to do about nested templates yet
			if( typeof data === 'function') break;
				
			var $domNode = $(selector);
			if( $domNode && $domNode.length) {
				$domNode = updateNode($, $domNode, selector, data);
			}
		}
	}
	
	return $.html();
};

/*

string:
	parse string
	replace tokens
	split into slices
	record indexes
	serve content

file:
	read file
		parse string
		replace tokens
		split into slices
		record indexes
		serve content



exports.__express = function(filename, options, callback) {
	var selectors = options.selectors;
	var wait = false;
	var count = 0; // keep track of total number of callbacks to wait for
	var complete = 0; // completed callbacks count.
	for(var key in selectors) {
		if(selectors[key] && selectors[key].partial){// this is a partial.
			if(selectors[key].data && selectors[key].data.length > 0){ // make sure we are passed in data and that the data is not empty.
				wait = true;
				count++;
				fs.readFile(options.settings.views + '/partials/' + selectors[key].partial + '.sizlate', 'utf8', function (key, err, data) {
					selectors[key] = exports.doRender(data, exports.classifyKeys(selectors[key].data, selectors[key]));	// adding and then stripping body tag for jsdom.
					complete++;
					if(complete === 1) {
						doRendering();
					}
				}.bind({}, key));
			}
		}
	}

	var doRendering = function() {
		if(options.layout) {
			fs.readFile(options.settings.views + '/' + options.layout + '.'+ options.settings['view engine'], 'utf8', function(error, template) {
				fs.readFile(filename, 'utf8', function(err,data){
				  if(err) {
				    console.error("Could not open file: %s", err);
				    process.exit(1);
				  }
				  var selectors = {};
				  selectors[options.container || '#container'] = data;
				  var markup = exports.doRender(template,  selectors) ;
				  callback(null, exports.doRender(markup, options.selectors));
				});
			});
		} else { // no layouts specified, just do the render.
			fs.readFile(filename, 'utf8', function(err,data){
			  if(err) {
			    console.error("Could not open file: %s", err);
			    process.exit(1);
			  }
			  callback(null, exports.doRender(data, options.selectors)	);
			});
		}
	}
	if(!wait) {
		doRendering();
	}
};*/