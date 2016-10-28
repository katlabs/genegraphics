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
		var customPrimary = {
        '50': '#50b6f2',
        '100': '#38acf1',
        '200': '#20a2ef',
        '300': '#1096e6',
        '400': '#0f87ce',
        '500': '#0d77b6',
        '600': '#0b679e',
        '700': '#0a5886',
        '800': '#08486f',
        '900': '#063957',
        'A100': '#68c0f4',
        'A200': '#80caf6',
        'A400': '#97d4f8',
        'A700': '#05293f',
				'contrastDefaultColor': 'light'
    };
    $mdThemingProvider
        .definePalette('customPrimary', 
                        customPrimary);

    var customAccent = {
        '50': '#175071',
        '100': '#1b5f86',
        '200': '#1f6e9c',
        '300': '#247db1',
        '400': '#288cc6',
        '500': '#3299d6',
        '600': '#5caede',
        '700': '#71b9e3',
        '800': '#87c3e7',
        '900': '#9cceeb',
        'A100': '#5caede',
        'A200': '#47a4da',
        'A400': '#3299d6',
        'A700': '#b1d8ef'
    };
    $mdThemingProvider
        .definePalette('customAccent', 
                        customAccent);

    var customWarn = {
        '50': '#ec6d6d',
        '100': '#e95757',
        '200': '#e64040',
        '300': '#e32a2a',
        '400': '#d81c1c',
        '500': 'C11919',
        '600': '#aa1616',
        '700': '#941313',
        '800': '#7d1010',
        '900': '#670d0d',
        'A100': '#ef8484',
        'A200': '#f29a9a',
        'A400': '#f5b1b1',
        'A700': '#500a0a'
    };
    $mdThemingProvider
        .definePalette('customWarn', 
                        customWarn);

    var customBackground = {
        '50': '#ffffff',
        '100': '#ffffff',
        '200': '#ffffff',
        '300': '#ffffff',
        '400': '#ffffff',
        '500': '#ffffff',
        '600': '#f2f2f2',
        '700': '#e6e6e6',
        '800': '#d9d9d9',
        '900': '#cccccc',
        'A100': '#ffffff',
        'A200': '#ffffff',
        'A400': '#ffffff',
        'A700': '#bfbfbf'
    };
    $mdThemingProvider
        .definePalette('customBackground', 
                        customBackground);

   $mdThemingProvider.theme('default')
       .primaryPalette('customPrimary')
       .accentPalette('customAccent')
       .warnPalette('customWarn')
       .backgroundPalette('customBackground')
			 
	});

	// setup dependency injection
	angular.module('geneGraphApp.services', []);
	angular.module('geneGraphApp.controllers', []);
	angular.module('geneGraphApp.directives', []);
}());