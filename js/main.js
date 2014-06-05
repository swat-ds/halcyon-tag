/*

*
		<コ:彡
*
		HalcyNamer
*

*		nabil kashyap (www.nabilk.com)
		MIT license
*		crowdsourced metadata tagging for
		Swarthmore Colleges local contentDM instance
*

*/

function test(arg){
	string = arg || 'fire';
	console.log(string);
}

// setup app namespace
var HN = {
	registry: []
};

// initial years index data
HN.yearsList = [ 1964, 1969, 1974, 1979, 1984, 1989, 1994, 1999, 2004, 2009 ];

// set up routes
HN.routes = Backbone.Router.extend({

	routes: {
		'' : 'index',
		'class/:year' : 'getclass',
		'pop' : 'pop'
	},

	// initialize the indexview
	initialize: function(){
		test('init');
		this.indexview = new HN.indexView({ model: new HN.years(HN.yearsList) });
	},
	// render the index
	index: function(){
		test('index');
		this.indexview.render();
	},

	// because page data is not changing and otherwise too many zombie listeners were created: a fetch success method
	getclass: function(year){

		this.volumeview = new HN.volumeView({ collection: new HN.volume() });
		var volumeview = this.volumeview;
		this.volumeview.collection.fetch({
			data: { year: year },
			processData: true,
			success: function() { volumeview.render();},
			error: function(a,b,c) { test(b); }
		});
	}
});

HN.years = Backbone.Model.extend({});

HN.page = Backbone.Model.extend({});

// for saving the model, if I ever get to that!
HN.form = Backbone.Model.extend({

	url: 'http://localhost:8888/halcyon-tag/php/halcyon.php?save=1',
	defaults: { tag: '' }
});

// this fetch url won't work without data: { year: '' }
HN.volume = Backbone.Collection.extend({

	model: HN.page,
	url: './php/halcyon.php',
});

HN.indexView = Backbone.View.extend({
	
	el: '#main',
	template: _.template($('#index-template').html()),
	initialize: function(){
	},

	render: function(){
		test('render index');
		var el = this.$el;
		var template = this.template;
		el.empty();
		_.each( this.model.attributes, function(d){
			el.append(template({'year': d }));
		});
		return this;
	}
});

HN.pageView = Backbone.View.extend({

	tagName:'ul',
	template: _.template($('#page-template').html()),
	events: {

	},
	initialize: function(){

		this.listenTo(this.model, 'change', this.render);
	},
	render: function(){

		this.$el.append( this.template( this.model.toJSON() ));
		this.parentView.$el.append(this.$el);
		return this;
	}
});

HN.formView = Backbone.View.extend({

	tagName: 'form',
	className: 'tags',
	template: _.template($('#form-template').html()),
	events: {
		'click input:submit': 'saveform',
		'change #tags-list': 'input'
	},
	initialize: function(){
	},
	render: function(){
		var that = this;
		this.$el.append(this.template(this.model.toJSON()));
		this.parentView.$el.append(this.$el);
		$('#tags-' + this.model.attributes.id).tagit({
			allowSpaces: true,
			singleField: true,
			placeholderText: 'enter a name',
			afterTagAdded: function(d){ that.input(d) }
			});
		this.$el.hide();
		return this;
	},
	saveform: function(e){
		e.preventDefault();
		test('submit');
		test(this.model);
		this.model.save();
	},
	input: function(e){

		test('input change');
		var $input = $(e.target);
		this.model.set($input.attr('name'), $input.val());
	},
	tagInput: function(d){
		test(d);
	}
});

HN.volumeView = Backbone.View.extend({
	el: '#main',
	counter: 0,
	isShowing: true,
	template: _.template($('#page-template').html()),
	events: {
		'click button.left' : 'count',
		'click button.right' : 'count',
		'click button.tag' : 'tagToggle'
	},
	count: function(e){
		e.preventDefault();
		var dir = $(e.target).attr('class');
		var max = $('.page ul').length - 1;
		// counter logic
		if (dir.contains('right')) { this.counter = (this.counter == max) ? 0 : this.counter + 1; } 
		else if (dir.contains('left')) {  this.counter = (this.counter  === 0) ? max : this.counter - 1; }
		this.show();
	},
	// quick function for showing and hiding the right page
	show: function(){
		$('div.page').hide();
		$($('div.page')[this.counter]).show();
		$('form').hide();
	},
	tagToggle: function(){

		test(this.counter);
		var currentform = $($('form')[this.counter]);

		currentform.toggle(this.isShowing);
		(this.isShowing === true) ? currentform.addClass('showing') : currentform.removeClass('showing');
		(this.isShowing === true) ? $($('.page img')[this.counter]).addClass('with-form') : $($('.page img')[this.counter]).removeClass('with-form');
		
		this.isShowing = !this.isShowing;
	},	
	// doesn't really do anything -- I like the idea of binding to reset, like on fetch, but doesn't seem to happen
	initialize: function(){
		this.listenTo(this.collection, 'reset', this.render);

	},
	render: function(){
		test('render volume');
		this.$el.empty();
		var thisView = this;
		this.$el.append($('#button-left-template').html());

		this.collection.each(function(d){
			var pageview = new HN.pageView({ model: d });
			pageview.parentView = thisView;
			pageview.render();

			var form = new HN.form(d.attributes);
			var formview = new HN.formView({ model: form });
			formview.parentView = thisView;
			formview.render();
		});
		this.show();
		this.$el.append($('#button-right-template').html());
		return this;
	}
});

var readysetgo = new HN.routes();

$(function() { Backbone.history.start(); });