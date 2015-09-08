(function () {
	'use strict';

	// create the angular app
	var geneGraphApp = angular.module('geneGraphApp', [
		'angularSpectrumColorpicker',
		'geneGraphApp.services',
		'geneGraphApp.controllers',
		'geneGraphApp.directives'
		]);

	geneGraphApp.run(function($rootScope) {
		document.addEventListener("keyup", function(e) {
				if (e.keyCode === 27)
						$rootScope.$broadcast("escapePressed", e.target);
		});

		document.addEventListener("click", function(e) {
				$rootScope.$broadcast("documentClicked", e.target);
		});

		document.getElementById("navMenu").addEventListener("click", function(e) {
				$rootScope.$broadcast("menuClicked", e.target);
		})
		document.getElementById("graphcontainer").addEventListener("click", function(e) {
				$rootScope.$broadcast("graphClicked", e.target);
		})

	});

	// setup dependency injection
	angular.module('geneGraphApp.services', []);
	angular.module('geneGraphApp.controllers', []);
	angular.module('geneGraphApp.directives', []);
}());