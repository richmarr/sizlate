var Template = require('../template.js').Template;

describe('When given a file', function() {
	it("it should instantiate properly", function(done) {
		
		var template = new Template('spec/fixtures/view-a.html', 'utf-8');
		template.render({
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
		}, function( err, compiled ){
			console.log(err,compiled);
			//expect(expected).toEqual(out);
			done();
		});
		
	});
});
