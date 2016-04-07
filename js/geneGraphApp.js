(function () {
	'use strict';

	// create the angular app
	var geneGraphApp = angular.module('geneGraphApp', [
		'ngMaterial',
		'angularSpectrumColorpicker',
		'geneGraphApp.services',
		'geneGraphApp.controllers',
		'geneGraphApp.directives'
		]);
	
	geneGraphApp.config(function($mdThemingProvider) {
		$mdThemingProvider.theme('default')
			.primaryPalette('blue')
			.accentPalette('light-blue')
	});

	// setup dependency injection
	angular.module('geneGraphApp.services', []);
	angular.module('geneGraphApp.controllers', []);
	angular.module('geneGraphApp.directives', []);
}());