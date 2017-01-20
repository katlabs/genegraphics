(function () {
'use strict';

	angular.module('geneGraphApp.controllers')
		.controller('graphCtrl', ['$scope', '$q', 'geneService', 'colorService', 'popupMenuService', 'd3', function($scope, $q, geneService, colorService, popupMenuService, d3) {
			
			// Set up graph container size
			document.getElementById("graphcontainer").style.height = window.innerHeight - 200 + "px";
			
			$scope.graphSettings = {};
			$scope.graphSettings.graphwidth = document.getElementById('graphcontainer').offsetWidth - 100;
			$scope.graphSettings.maxwidth = 0;
			$scope.graphSettings.featureheight = 50;
			$scope.graphSettings.multilane = true;
			$scope.graphSettings.shiftgenes = false;
			$scope.graphSettings.keepgaps = false;
			$scope.graphSettings.scaleOn = true;
			$scope.graphSettings.displayedFunction = "";
			$scope.graphSettings.currentFilesList = [];
			$scope.graphSettings.pastingGenes = false;
			
			$scope.graphSettings.fontSizeOptions = [ "8pt", "10pt", "12pt", "14pt", "18pt", "24pt", "36pt"]
			
			$scope.graphSettings.labelPosOptions = [
				{value:'above', name:"Above"},
				{value:'middle', name:"Middle"},
				{value:'below', name:"Below"}
			]
			
			$scope.copy = {}
			$scope.copy.geneClipboard = [];
			$scope.copy.settings = { genecolor:{label:"Gene Color", value:true},
															 labelstyle:{label:"Label Style", value:false},
															 labelpos:{label:"Label Position", value:false},
															 labeltext:{label:"Label Text", value:false}
			}
			
			$scope.genome = {};
			$scope.genome.oldGenome;
			$scope.genome.newGenome;
			$scope.globalLabels = {}
			$scope.globalLabels.genomeColor = '#000000';
			$scope.globalLabels.geneColor = '#000000';
			$scope.spectrumOpts = {
				preferredFormat: "name",
				showInitial: true, 
				showInput: true, 
				showButtons: false,
				allowEmpty:true,
				showPaletteOnly: true,
				togglePaletteOnly: true,
				togglePaletteMoreText: 'custom...',
				togglePaletteLessText: 'less',
				showSelectionPalette: true,
				maxSelectionSize: 8,
				palette: [
				["000000",  "993300",  "333300",  "003300",  "003366",  "000080",  "333399",  "333333",],
				["800000",  "FF6600",  "808000",  "008000",  "008080",  "0000FF",  "666699",  "808080",],
				["FF0000",  "FF9900",  "99CC00",  "339966",  "33CCCC",  "3366FF",  "800080",  "999999",],
				["FF00FF",  "FFCC00",  "FFFF00",  "00FF00",  "00FFFF",  "00CCFF",  "993366",  "D3D3D3"],
				["FF99CC",  "FFCC99",  "FFFF99",  "CCFFCC",  "CCFFFF",  "99CCFF",  "CC99FF", "FFFFFF"],
				],
				localStorageKey: "spectrum.allcolors"
			};
			
			$scope.$watch("globalLabels['genomeColor']", function(newVal, oldVal){
				$scope.globalFontColor('genomes', newVal);
			}, true);
			
			$scope.$watch("globalLabels['geneColor']", function(newVal, oldVal){
				$scope.globalFontColor('genes', newVal);
			}, true);
			
			$scope.tinymceOpts = {
				height: 50,
				min_height: 50,
				max_height: 200,
				width: 377,
				elementpath: false,
				body_class: 'editor',
				content_css: 'styles/main.css',
				plugins: 'textcolor colorpicker',
				menubar: false,
				toolbar1: 'undo redo | bold italic | alignleft aligncenter alignright | valigntop valignmid valignbot',
				toolbar2: 'fontselect fontsizeselect | forecolor',
				textcolor_map: [
					"000000", "Black",
					"993300", "Burnt orange",
					"333300", "Dark olive",
					"003300", "Dark green",
					"003366", "Dark azure",
					"000080", "Navy Blue",
					"333399", "Indigo",
					"333333", "Very dark gray",
					"800000", "Maroon",
					"FF6600", "Orange",
					"808000", "Olive",
					"008000", "Green",
					"008080", "Teal",
					"0000FF", "Blue",
					"666699", "Grayish blue",
					"808080", "Gray",
					"FF0000", "Red",
					"FF9900", "Amber",
					"99CC00", "Yellow green",
					"339966", "Sea green",
					"33CCCC", "Turquoise",
					"3366FF", "Royal blue",
					"800080", "Purple",
					"999999", "Medium gray",
					"FF00FF", "Magenta",
					"FFCC00", "Gold",
					"FFFF00", "Yellow",
					"00FF00", "Lime",
					"00FFFF", "Aqua",
					"00CCFF", "Sky blue",
					"993366", "Red violet",
					"D3D3D3", "Light Gray",
					"FF99CC", "Pink",
					"FFCC99", "Peach",
					"FFFF99", "Light yellow",
					"CCFFCC", "Pale green",
					"CCFFFF", "Pale cyan",
					"99CCFF", "Light sky blue",
					"CC99FF", "Plum",
					"FFFFFF", "White"
				],
				setup: function(editor){
					var topbtn = editor.addButton('valigntop', {
						text: false,
						icon:false,
						image: 'images/ic_vertical_align_top_black_16px.svg',
						tooltip: 'Align top',
						disabled: true,
						onpostrender: function(){
							var btn = this;
							document.addEventListener("mousemove", function(){
								btn.disabled(popupMenuService.GeneMenuVisible == false);
								if (typeof $scope.geneData[$scope.selectedGene] == 'object'){
									btn.active($scope.geneData[$scope.selectedGene]['labelvertpos'] == 'top');
								}
								if (popupMenuService.GeneMenuVisible == false) {btn.active(false);}
							});
						}
					});
					var midbtn = editor.addButton('valignmid', {
						text: false,
						icon:false,
						image: 'images/ic_vertical_align_center_black_16px.svg',
						tooltip: 'Align middle',
						disabled: true,
						onpostrender: function(){
							var btn = this;
							document.addEventListener("mousemove", function(){
								btn.disabled(popupMenuService.GeneMenuVisible == false);
								if (typeof $scope.geneData[$scope.selectedGene] == 'object'){
									btn.active($scope.geneData[$scope.selectedGene]['labelvertpos'] == 'middle');
								}
								if (popupMenuService.GeneMenuVisible == false) {btn.active(false);}
							});
						}
					});
					var btmbtn = editor.addButton('valignbot', {
						text: false,
						icon:false,
						image: 'images/ic_vertical_align_bottom_black_16px.svg',
						tooltip: 'Align bottom',
						disabled: true,
						onpostrender: function(){
							var btn = this;
							document.addEventListener("mousemove", function(){
								btn.disabled(popupMenuService.GeneMenuVisible == false);
								if (typeof $scope.geneData[$scope.selectedGene] == 'object'){
									btn.active($scope.geneData[$scope.selectedGene]['labelvertpos'] == 'bottom');
								}
								if (popupMenuService.GeneMenuVisible == false) {btn.active(false);}
							});
						}
					});
					editor.buttons.valigntop.onclick = function() {
							$scope.geneData[$scope.selectedGene]['labelvertpos'] = 'top';
							this.active(true);
							$scope.$apply();
						}
					editor.buttons.valignmid.onclick = function() {
							$scope.geneData[$scope.selectedGene]['labelvertpos'] = 'middle';
							this.active(true);
							$scope.$apply();
						}
						editor.buttons.valignbot.onclick = function() {
							$scope.geneData[$scope.selectedGene]['labelvertpos'] = 'bottom';
							this.active(true);
							$scope.$apply();
						}
				}
			};
			
			var alreadyAlerted = false;
			
			var checkScroll = function(){
				if (($('#graphcontainer').height() < $('#svg').height()) && alreadyAlerted == false){
					$('#scrollpopup').fadeIn(2500, function(){
						$('#scrollpopup').fadeOut(3000)
					});
					alreadyAlerted = true;
				}
			}
			
			$scope.geneData = geneService.geneData;
			$scope.$on('updateGeneData', function(){
				$scope.geneData = geneService.geneData;
				$scope.genomesHash = geneService.genomesHash;
				$scope.graphSettings.maxwidth = geneService.getMaxWidth($scope.geneData);
				checkScroll();
			});
			
			$scope.$on('updateMenuStatus', function(){
				$scope.graphSettings.pastingGenes = popupMenuService.GeneCPDialogVisible;
				if ($scope.graphSettings.pastingGenes == false){
					$scope.copy.geneClipboard = [];
					$scope.copy.settings = { genecolor:{label:"Gene Color", value:true},
															 labeltext:{label:"Label Text", value:false}
															}
				}
			});
			
			$scope.minMenuSize = 400;
			$scope.selectGene = function(index, x, y){
				if( x + $scope.minMenuSize > window.innerWidth){
					x = window.innerWidth - $scope.minMenuSize - 30;
				}
				$("#popupbox").css("left", x);
				$("#popupbox").css("top", y);
				$scope.selectedGene = parseInt(index);
				popupMenuService.updateGeneMenu(true);
				$scope.$apply();
			};
			
			$scope.addToClipboard = function(index){
				var i = $scope.copy.geneClipboard.indexOf(index);
				if (i != -1){
					$scope.copy.geneClipboard.splice(i, 1);
				}
				else {
					$scope.copy.geneClipboard.push(index);
				}
				$scope.$apply();
			};
			
			$scope.selectGenome = function(index, x, y){
				$("#popupbox").css("left", x);
				$("#popupbox").css("top", y);
				$scope.selectedGene = parseInt(index);
				$scope.genome.newGenome = $scope.geneData[$scope.selectedGene]['genomehtml'];
				$scope.genome.oldGenome = $scope.geneData[$scope.selectedGene]['genomehtml'];
				popupMenuService.updateGenomeMenu(true);
        $scope.$apply();
			};
			
			$scope.checkForCopies = function(i){
				var i = i;
				if ($scope.genome.newGenome != $scope.genome.oldGenome){
					if ($scope.genome.newGenome in $scope.genomesHash){
						if (i == 1){
							$scope.genome.newGenome = $scope.genome.newGenome + " <!-- copy" + i +" -->";
						}
						else {
							var n = i-1;
							$scope.genome.newGenome = $scope.genome.newGenome.replace("<!-- copy" + n +" -->", "<!-- copy" + i +" -->");
						}
						$scope.checkForCopies(i+1);
					}
				}
				return;
			}
			
			function isInArray(value, array){
				return array.indexOf(value) > -1;
			}
			
			$scope.editGenomeName = function(){
				if ($scope.genome.newGenome != $scope.genome.oldGenome){
					$scope.checkForCopies(1);
					for (var i = 0; i < $scope.geneData.length; i++) {
						if (isInArray(i, $scope.genomesHash[$scope.genome.oldGenome])){
							$scope.geneData[i]['genomehtml'] = $scope.genome.newGenome;
						}
					}
					$scope.genomesHash[$scope.genome.newGenome] = $scope.genomesHash[$scope.genome.oldGenome];
					delete $scope.genomesHash[$scope.genome.oldGenome];
				}
				$scope.genome.newGenome = $scope.geneData[$scope.selectedGene]['genomehtml'];
				$scope.genome.oldGenome = $scope.geneData[$scope.selectedGene]['genomehtml'];
				return;
			}
			
			var updateNonHTML = function() {
				for (var i = 0; i < $scope.geneData.length; i++){
					try {
						var $tempdom = $($scope.geneData[i]['genomehtml']);
						$scope.geneData[i].genome = $tempdom[0].textContent;
					}
					catch (err) {
						$scope.geneData[i].genome = $scope.geneData[i].genomehtml;
					}
					try {
						var $tempdom = $($scope.geneData[i]['namehtml']);
						$scope.geneData[i].name = $tempdom[0].textContent;
					}
					catch (err) {
						$scope.geneData[i].name = $scope.geneData[i].namehtml;
					}
				}
			}
			
			$scope.toggleBold = {'genomes':false, 'genes':false};
			
			$scope.globalBold = function(labeltype){
				var origName;
				for (var i=0; i < $scope.geneData.length; i++){
					var change_name
					if (labeltype === 'genomes') { 
						if ($scope.geneData[i]['genomelocked'] == true){ continue;}
						change_name = $scope.geneData[i]['genomehtml'];}
					else if (labeltype === 'genes') {
						if ($scope.geneData[i]['genelocked'] == true) { continue;}
						change_name = $scope.geneData[i]['namehtml'];}
					else { return; }
					if (origName == change_name){
						continue;
					}
					change_name = change_name.replace(/<\/?strong>/g, "");
					if ($scope.toggleBold[labeltype] == false){
						var re = /<p[^>]*>/g
						var matches = change_name.match(re);
						if (matches != null){
							change_name = change_name.replace(re, matches[0] + "<strong>");
							change_name = change_name.replace(/<\/p>/g, "</strong></p>");
						}
						else {
							change_name = "<p><strong>"+change_name+"</strong></p>";
						}
					}
					origName = change_name;
					if (labeltype === 'genomes') {
						$scope.selectedGene = i;
						$scope.genome.newGenome = change_name;
						$scope.genome.oldGenome = $scope.geneData[i]['genomehtml'];
						$scope.editGenomeName();
						try {
							var $tempdom = $($scope.geneData[i]['genomehtml']);
							$scope.geneData[i].genome = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].genome = $scope.geneData[i].genomehtml;
						}
					}
					else {
						$scope.geneData[i]['namehtml'] = change_name;
						try {
							var $tempdom = $($scope.geneData[i]['namehtml']);
							$scope.geneData[i].name = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].name = $scope.geneData[i].namehtml;
						}
					}
				}
				$scope.toggleBold[labeltype] = !$scope.toggleBold[labeltype];
			}
			
			var boldButtonSetter = function(){
				if (popupMenuService.GlobalGenomeVisible == true){
					if ($scope['toggleBold']['genomes'] == true){
						$("#globalBold").css("background-color", '#d3d3d3');
					}
					else {
						$("#globalBold").css("background-color", '#f0f0f0');
					}
				}
				else if (popupMenuService.GlobalGeneVisible == true) {
					if ($scope['toggleBold']['genes'] == true){
						$("#globalBold").css("background-color", '#d3d3d3');
					}
					else {
						$("#globalBold").css("background-color", '#f0f0f0');
					}
				}
			}
			$scope.$watch('toggleBold', function(newVal, oldVal){
				boldButtonSetter();
			}, true);
			
			
			$scope.toggleItalic = {'genomes':false, 'genes':false};
			
			$scope.globalEm = function(labeltype){
				var origName;
				for (var i=0; i < $scope.geneData.length; i++){
					var change_name
					if (labeltype === 'genomes') { 
						if ($scope.geneData[i]['genomelocked'] == true){ continue;}
						change_name = $scope.geneData[i]['genomehtml'];}
					else if (labeltype === 'genes') {
						if ($scope.geneData[i]['genelocked'] == true) { continue;}
						change_name = $scope.geneData[i]['namehtml'];}
					else { return; }
					if (origName == change_name){
						continue;
					}
					change_name = change_name.replace(/<\/?em>/g, "");
					if ($scope.toggleItalic[labeltype] == false){
						var re = /<p[^>]*>/g
						var matches = change_name.match(re);
						if (matches != null){
							change_name = change_name.replace(re, matches[0] + "<em>");
							change_name = change_name.replace(/<\/p>/g, "</em></p>");
						}
						else {
							change_name = "<p><em>"+change_name+"</em></p>";
						}
					}
					origName = change_name;
					if (labeltype === 'genomes') {
						$scope.selectedGene = i;
						$scope.genome.newGenome = change_name;
						$scope.genome.oldGenome = $scope.geneData[i]['genomehtml'];
						$scope.editGenomeName();
						try {
							var $tempdom = $($scope.geneData[i]['genomehtml']);
							$scope.geneData[i].genome = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].genome = $scope.geneData[i].genomehtml;
						}
					}
					else {
						$scope.geneData[i]['namehtml'] = change_name;
						try {
							var $tempdom = $($scope.geneData[i]['namehtml']);
							$scope.geneData[i].name = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].name = $scope.geneData[i].namehtml;
						}
					}
				}
				$scope['toggleItalic'][labeltype] = !$scope['toggleItalic'][labeltype];
			}
			
			var italicButtonSetter = function(){
				if (popupMenuService.GlobalGenomeVisible == true){
					if ($scope['toggleItalic']['genomes'] == true){
						$("#globalEm").css("background-color", '#d3d3d3');
					}
					else {
						$("#globalEm").css("background-color", '#f0f0f0');
					}
				}
				else if (popupMenuService.GlobalGeneVisible == true) {
					if ($scope['toggleItalic']['genes'] == true){
						$("#globalEm").css("background-color", '#d3d3d3');
					}
					else {
						$("#globalEm").css("background-color", '#f0f0f0');
					}
				}
			}
			$scope.$watch('toggleItalic', function(newVal, oldVal){
				italicButtonSetter();
			}, true);
			
			$scope.$on('updateMenuStatus', function(){
				italicButtonSetter();
				boldButtonSetter();
			});
			
			$scope.globalFontFamily = function(labeltype, newfont){
				if (typeof newfont === 'undefined') { return;}
				var origName;
				for (var i=0; i < $scope.geneData.length; i++){
					var change_name
					if (labeltype === 'genomes') { 
						if ($scope.geneData[i]['genomelocked'] == true){ continue;}
						change_name = $scope.geneData[i]['genomehtml'];}
					else if (labeltype === 'genes') {
						if ($scope.geneData[i]['genelocked'] == true) { continue;}
						change_name = $scope.geneData[i]['namehtml'];}
					else { return; }
					if (origName == change_name){
						continue;
					}
					try {
						var $tempdom = $(change_name);
						if ($tempdom.length == 0){
							change_name = '<p><span style="font-family: ' +newfont.value+ ';">' + change_name + '</span></p>'
						}
						else {
							$tempdom.find('span').css('font-family', '');
							$tempdom.find('span:not([style])').contents().unwrap();
							change_name = $tempdom[0].outerHTML.replace(/(<p[\w\s\d-:=,"'#;]*>)/g, '$1<span style="font-family: ' + newfont.value + ';">');
							change_name = change_name.replace(/<\/p>/g, '</span></p>');
						}
					}
					catch(err){
						change_name = '<p><span style="font-family: ' +newfont.value+ ';">' + change_name + '</span></p>'
					}
					origName = change_name;
					if (labeltype === 'genomes') {
						$scope.selectedGene = i;
						$scope.genome.newGenome = change_name;
						$scope.genome.oldGenome = $scope.geneData[i]['genomehtml'];
						$scope.editGenomeName();
						try {
							var $tempdom = $($scope.geneData[i]['genomehtml']);
							$scope.geneData[i].genome = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].genome = $scope.geneData[i].genomehtml;
						}
					}
					else {
						$scope.geneData[i]['namehtml'] = change_name;
						try {
							var $tempdom = $($scope.geneData[i]['namehtml']);
							$scope.geneData[i].name = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].name = $scope.geneData[i].namehtml;
						}
					}
				}
			}
			
			$scope.openFontSizeMenu = function($mdOpenMenu, ev){
				$mdOpenMenu(ev);
			}
			
			$scope.globalFontSize = function(labeltype, newsize){
				if (typeof newsize === 'undefined') { return;}
				var origName;
				for (var i=0; i < $scope.geneData.length; i++){
					var change_name
					if (labeltype === 'genomes') { 
						if ($scope.geneData[i]['genomelocked'] == true){ continue;}
						change_name = $scope.geneData[i]['genomehtml'];}
					else if (labeltype === 'genes') {
						if ($scope.geneData[i]['genelocked'] == true) { continue;}
						change_name = $scope.geneData[i]['namehtml'];}
					else { return; }
					if (origName == change_name){
						continue;
					}
					try{
						var $tempdom = $(change_name);
						if ($tempdom.length == 0){
							change_name = '<p><span style="font-size: ' +newsize+ ';">' + change_name + '</span></p>'
						}
						else {
							$tempdom.find('span').css('font-size', '');
							$tempdom.find('span:not([style])').contents().unwrap();
							change_name = $tempdom[0].outerHTML.replace(/(<p[\w\s\d-:=,"'#;]*>)/g, '$1<span style="font-size: ' + newsize + ';">');
							change_name = change_name.replace(/<\/p>/g, '</span></p>');
						}
					}
					catch(err){
						change_name = '<p><span style="font-size: ' +newsize+ ';">' + change_name + '</span></p>'
					}
					origName = change_name;
					if (labeltype === 'genomes') {
						$scope.selectedGene = i;
						$scope.genome.newGenome = change_name;
						$scope.genome.oldGenome = $scope.geneData[i]['genomehtml'];
						$scope.editGenomeName();
						try {
							var $tempdom = $($scope.geneData[i]['genomehtml']);
							$scope.geneData[i].genome = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].genome = $scope.geneData[i].genomehtml;
						}
					}
					else {
						$scope.geneData[i]['namehtml'] = change_name;
						try {
							var $tempdom = $($scope.geneData[i]['namehtml']);
							$scope.geneData[i].name = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].name = $scope.geneData[i].namehtml;
						}
					}
				}
			}

			$scope.globalFontColor = function(labeltype, newcolor){
				if (typeof newcolor === 'undefined') { return;}
				var origName;
				for (var i=0; i < $scope.geneData.length; i++){
					var change_name
					if (labeltype === 'genomes') { 
						if ($scope.geneData[i]['genomelocked'] == true){ continue;}
						change_name = $scope.geneData[i]['genomehtml'];}
					else if (labeltype === 'genes') {
						if ($scope.geneData[i]['genelocked'] == true) { continue;}
						change_name = $scope.geneData[i]['namehtml'];}
					else { return; }
					if (origName == change_name){
						continue;
					}
					try{
						var $tempdom = $(change_name);
						if ($tempdom.length == 0){
							change_name = '<p><span style="color: ' +newcolor+ ';">' + change_name + '</span></p>'
						}
						else {
							$tempdom.find('span').css('color', '');
							$tempdom.find('span:not([style])').contents().unwrap();
							change_name = $tempdom[0].outerHTML.replace(/(<p[\w\s\d-:=,"'#;]*>)/g, '$1<span style="color: ' + newcolor + ';">');
							change_name = change_name.replace(/<\/p>/g, '</span></p>');
						}
					}
					catch(err) {
						change_name = '<p><span style="color: ' +newcolor+ ';">' + change_name + '</span></p>'
					}
					origName = change_name;
					if (labeltype === 'genomes') {
						$scope.selectedGene = i;
						$scope.genome.newGenome = change_name;
						$scope.genome.oldGenome = $scope.geneData[i]['genomehtml'];
						$scope.editGenomeName();
						try {
							var $tempdom = $($scope.geneData[i]['genomehtml']);
							$scope.geneData[i].genome = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].genome = $scope.geneData[i].genomehtml;
						}
					}
					else {
						$scope.geneData[i]['namehtml'] = change_name;
						try {
							var $tempdom = $($scope.geneData[i]['namehtml']);
							$scope.geneData[i].name = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].name = $scope.geneData[i].namehtml;
						}
					}
				}
			}
			
			
			$scope.toggleVertAl = "";
			
			$scope.globalAlign = function(labeltype, align){
				var labeltype = labeltype;
				if (typeof align == 'undefined') { return;}
				else if ( align == 'top' || align == 'middle' || align == 'bottom'){
					for (var i=0; i < $scope.geneData.length; i++){
					if (labeltype === 'genomes' && $scope.geneData[i]['genomelocked'] == true){ continue;}
					else if (labeltype === 'genes' && $scope.geneData[i]['genelocked'] == true) { continue;}
						$scope.geneData[i]['labelvertpos'] = align;
					}
					$scope.toggleVertAl = align;
					return;
				}
				for (var i=0; i < $scope.geneData.length; i++){
					var change_name
					if (labeltype === 'genomes') { 
						if ($scope.geneData[i]['genomelocked'] == true){ continue;}
						change_name = $scope.geneData[i]['genomehtml'];}
					else if (labeltype === 'genes') {
						if ($scope.geneData[i]['genelocked'] == true) { continue;}
						change_name = $scope.geneData[i]['namehtml'];}
					else { return; }
					var re = /text-align: [\w]+;/g
					var matches = change_name.match(re)
					if (matches != null){
						var newstr = "text-align: " + align + ";"
						change_name = change_name.replace(matches[0], newstr)
					}
					else {
						var newstr1 = '<p style="text-align: ' + align + ';">';
						var newstr2 = '</p>';
						change_name = change_name.replace(/<\/?p>/g, '');
						change_name = newstr1 + change_name + newstr2;
					}
					if (labeltype === 'genomes') {
						$scope.selectedGene = i;
						$scope.genome.newGenome = change_name;
						$scope.genome.oldGenome = $scope.geneData[i]['genomehtml'];
						$scope.editGenomeName();
						try {
							var $tempdom = $($scope.geneData[i]['genomehtml']);
							$scope.geneData[i].genome = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].genome = $scope.geneData[i].genomehtml;
						}
					}
					else {
						$scope.geneData[i]['namehtml'] = change_name;
						try {
							var $tempdom = $($scope.geneData[i]['namehtml']);
							$scope.geneData[i].name = $tempdom[0].textContent;
						}
						catch (err) {
							$scope.geneData[i].name = $scope.geneData[i].namehtml;
						}
					}
				}
				$("#alignleft").css("background-color", '#f0f0f0');
				$("#aligncenter").css("background-color", '#f0f0f0');
				$("#alignright").css("background-color", '#f0f0f0');
				$("#align"+align).css("background-color", '#d3d3d3');
			}
			
			$scope.$watch('toggleVertAl', function(newVal, oldVal){
				$("#topgenes").css("background-color", '#f0f0f0');
				$("#middlegenes").css("background-color", '#f0f0f0');
				$("#bottomgenes").css("background-color", '#f0f0f0');
				$("#"+newVal+"genes").css("background-color", '#d3d3d3');
				
			}, true);
			
			$scope.changeDisplayedFunction = function(newfunction){
				$scope.graphSettings.displayedFunction = newfunction;
				$scope.$apply();
			};
			
			$scope.changeGraphWidth = function(newWidth){
				$scope.graphSettings.graphwidth = parseInt(newWidth);
			};
			$scope.changeFeatureHeight = function(newHeight){
				$scope.graphSettings.featureheight = parseInt(newHeight);
			};
			
			$scope.clickMultiLane = function(){
				$scope.graphSettings.shiftgenes = false;
				$scope.graphSettings.keepgaps = false;
			}
			$scope.clickShiftgenes = function(){
				$scope.graphSettings.keepgaps = false;
			}
			
			$scope.clickPaste = function(){
				var copy = $scope.selectedGene
				for (var i = 0; i < $scope.copy.geneClipboard.length; i++){
					var paste = $scope.copy.geneClipboard[i];
					if ($scope.copy.settings.genecolor.value){
						$scope.geneData[paste]["color"] = $scope.geneData[copy]["color"];
					}
					if ($scope.copy.settings.labeltext.value){
						$scope.geneData[paste]["name"] = $scope.geneData[copy]["name"];
						$scope.geneData[paste]["namehtml"] = $scope.geneData[copy]["name"];
					}
				}
			}
			
			$scope.toggleLockGene = function(index){
				$scope.geneData[index]['genelocked'] = !$scope.geneData[index]['genelocked'];
			}
			
			$scope.toggleLockGenome = function(genomestr){
				for (var i = 0; i < $scope.geneData.length; i++){
					if ($scope.genomesHash[genomestr].indexOf(i) != -1){
						$scope.geneData[i]['genomelocked'] = !$scope.geneData[i]['genomelocked'];
					}
				}
			}
			
			$scope.unlockLabels = function(labeltype){
				var key = labeltype+"locked";
				for (var i = 0; i < $scope.geneData.length; i++){
					$scope.geneData[i][key] = false;
				}
			}
			
			
		}])
		.controller('autoCompCtrl', function($scope) {
			
			$scope.fonts        = [
				{value:"'andale mono', monospace", name:"Andale Mono"},
				{value:"arial, helvetica, sans-serif", name:"Arial"},
				{value:"'arial black', sans-serif", name:"Arial Black"},
				{value:"'book antiqua', palatino, sans-serif", name:"Book Antiqua"},
				{value:"'comic sans ms', sans-serif", name:"Comic Sans MS"},
				{value:"'courier new', courier, monospace", name:"Courier New"},
				{value:"georgia, palatino, serif", name:"Georgia"},
				{value:"helvetica, arial, sans-serif", name:"Helvetica"},
				{value:"impact, sans-serif", name:"Impact"},
				{value:"symbol", name:"Symbol"},
				{value:"tahoma, arial, helvetica, sans-serif", name:"Tahoma"},
				{value:"terminal, monaco, monospace", name:"Terminal"},
				{value:"'times new roman', Times, serif", name:"Times New Roman"},
				{value:"'trebuchet ms', geneva, sans-serif", name:"Trebuchet MS"},
				{value:"verdana, geneva, sans-serif", name:"Verdana"},
				{value:"webdings", name:"Webdings"},
				{value:"wingdings, 'zapf dingbats'", name:"Wingdings"},
			]
			
			$scope.querySearch = function querySearch (query) {
				var results = query ? $scope.fonts.filter( createFilterFor(query) ) : $scope.fonts,
						deferred;
				return results;
			}
			function createFilterFor(query) {
				var lowercaseQuery = angular.lowercase(query);

				return function filterFn(font) {
					return (font.name.toLowerCase().indexOf(lowercaseQuery) === 0);
				};
			}
		})
		.controller('tabsCtrl', [ function() {
			var self = this;
			self.tabs = [
				{title: 'Description', content:'views/description.html'},
				{title: 'Gene Graphics App', content:'views/app.html'},
				{title: 'Documentation', content:'views/doc.html'},
				{title: 'Tutorials', content:'views/tutorials.html'}
			];
		}])
		.controller('FileCtrl', ['$scope', '$http', 'geneService', 'colorService', 'popupMenuService', function($scope, $http, geneService, colorService, popupMenuService){
			$scope.data = [];
			$scope.parseTSV = function(lines){
				
					$scope.data = [];
					var header = lines[0];
					var headercols = header.split('\t');
					var headerpos = {genome:null, genomehtml:null, currLane:null, genevisible:null, genelocked:null, genomelocked:null, labelpos:null, labelvertpos:null, name:null, namehtml:null, genefunction:null, color:null, size:null, start:null, stop:null, strand:null};
					$scope.maxVertOff = geneService.maxVertOff;
					for(var i = 0; i < headercols.length; i++){
						var currHeaderCol = headercols[i].toLowerCase().replace(/ /g, '');
						if (currHeaderCol === 'genome'){
							headerpos.genome = i;
						}
						else if (currHeaderCol === 'genomehtml'){
							headerpos.genomehtml = i;
						}
						else if (currHeaderCol === 'genevisible'){
							headerpos.genevisible = i;
						}
						else if (currHeaderCol === 'genelocked'){
							headerpos.genelocked = i;
						}
						else if (currHeaderCol === 'genomelocked'){
							headerpos.genomelocked = i;
						}
						else if (currHeaderCol === 'labelpos'){
							headerpos.labelpos = i;
						}
						else if (currHeaderCol === 'labelvertpos'){
							headerpos.labelvertpos = i;
						}
						else if (currHeaderCol === 'name' || currHeaderCol === "genename"){
							headerpos.name = i;
						}
						else if (currHeaderCol === 'namehtml'){
							headerpos.namehtml = i;
						}
						else if (currHeaderCol === "function"){
							headerpos.genefunction = i;
						}
						else if (currHeaderCol === 'color' || currHeaderCol === 'genecolor'){
							headerpos.color = i;
						}
						else if (currHeaderCol === 'size' || currHeaderCol === 'size(nt)'){
							headerpos.size = i;
						}
						else if (currHeaderCol === 'start'){
							headerpos.start = i;
						}
						else if (currHeaderCol === 'stop'){
							headerpos.stop = i;
						}
						else if (currHeaderCol === 'strand'){
							headerpos.strand = i;
						}
					}
				
					var offset = {};
					var vertOff = {};
					
					for (var i = 1; i < lines.length; i++){
						
						if (lines[i].slice(0,14) === "GraphSettings:"){
							var newsettings = JSON.parse(lines[i].slice(14));
							for (var key in newsettings){
								if (key === 'graphwidth' || key === 'featureheight'){
									$scope.graphSettings[key] = parseFloat(newsettings[key]);
								}
								else if (key === 'labelPosition'){
									$scope.graphSettings[key] = newsettings[key];
								}
								else if (key === 'keepgaps' || key === 'multilane' || key === 'shiftgenes' || key === 'scaleOn'){
									if (newsettings[key].toLowerCase() === "true"){
										$scope.graphSettings[key] = true;
									}
									else {
										$scope.graphSettings[key] = false;
									}
								}
							}
						}
						else {
							var gene = {genome:null, genomehtml:null, genelocked:false, genomelocked:false, start:null, stop:null, size:null, strand:null, name:null, namehtml:null, genefunction:null, color:null, genevisible:true, labelvertpos:'middle', labelpos:{x:null, y:null}};
							var columns = lines[i].split('\t');
							
							var genome = columns[headerpos['genome']];
							for (var key in gene) {
								if(!offset.hasOwnProperty(genome)) {
								 vertOff[genome] = $scope.maxVertOff;
								 $scope.maxVertOff+=2;
								 offset[genome] = Math.min(parseInt(columns[headerpos['start']]), parseInt(columns[headerpos['stop']]));
								}
								if ((key === 'name' || key === 'namehtml' || key === 'genefunction' || key === 'strand' || key === 'color' || key === 'labelcolor' || key === 'labelstyle' || key === 'genome' || key === 'genomehtml' || key === 'labelvertpos') && headerpos[key] !== null){
									gene[key] = columns[headerpos[key]];
								}
								if ((key === 'genevisible' || key === 'genelocked' || key === 'genomelocked') && headerpos[key] !== null){
									if (columns[headerpos[key]].toLowerCase() === "true"){
										gene[key] = true;
									}
									else if (columns[headerpos[key]].toLowerCase() === "false"){
										gene[key] = false;
									}
								}
								if (key === 'labelpos' && headerpos[key] !== null){
									var getpositions = columns[headerpos[key]].split(",");
									gene[key].x = parseFloat(getpositions[0]);
									gene[key].y = parseFloat(getpositions[1]);
								}
								else if((key === 'start' || key === 'stop') && headerpos[key] !== null){
									gene[key] = parseInt(columns[headerpos[key]]) - offset[genome];
								}
								else if (key === 'size' && headerpos[key] !== null){
									gene[key] = parseInt(columns[headerpos[key]]);
								}
								else if((key === 'start' || key === 'stop') && headerpos[key] === null){
									alert("Important info missing!");
								}
								else if(key === 'strand' && headerpos[key] === null){
									if (gene['start'] <= gene['stop'])
										gene[key] = '+';
									else gene[key] = '-';
								}
								else if(key === 'size' && headerpos[key] === null){
									gene[key] = Math.abs(parseInt(columns[headerpos['stop']]) - parseInt(columns[headerpos['start']]));
								}
								else if(key === 'name' && headerpos[key] === null){
									gene[key] = "Gene_" + i;
								}
								else if(key === 'namehtml' && headerpos[key] === null){
									gene[key] = gene['name'];
								}
								else if(key === 'genomehtml' && headerpos[key] === null){
									gene[key] = gene['genome'];
								}
								else if(key === 'genefunction' && headerpos[key] === null){
									gene[key] = ""
								}
								else if(key === 'color' && headerpos[key] === null){
									gene[key] = colorService.getHashColor(gene['genefunction']);
								}
								gene['currLane']=vertOff[genome];
								gene['pasting']=false;
							}
							$scope.data.push(gene);
						}
					}
					geneService.updateGene($scope.data, $scope.maxVertOff);
				}
				
			$scope.parseGB = function(lines) {
					$scope.data = [];
					var organism = "";
					var i = 0;
					var j;
					var k;
					$scope.maxVertOff = geneService.maxVertOff;
					while (i < lines.length) {
						var offset = "";
						if ("ORGANISM" === lines[i].slice(2,10)){
							organism = lines[i].slice(10).trim();
						}
						else if ("FEATURES" === lines[i].slice(0,8)){
							j = i + 1;
							while (/^\s/.test(lines[j])){
								if (/^\s{5}CDS\s{13}(complement\()?\<?([\d]+)\.\.\>?([\d]+)/.test(lines[j])){
									// Get gene position
									// Incomplete genomes are not supported at this time 
									
									var positionmatch = lines[j].trim().match(/CDS\s{13}(complement\()?\<?([\d]+)\.\.\>?([\d]+)/);
									var startPos;
									var endPos;
									var strand;
									
										
									if (positionmatch[1] == "complement(") {
										strand = "-";
									} else {
										strand = "+";
									}
									if (offset === ""){
										offset = parseInt(positionmatch[2]);
									}
									startPos = parseInt(positionmatch[2]) - offset;
									endPos = parseInt(positionmatch[3] - offset);
									
									// Loop to find gene name specifics
									var genename = "";
									var protein_id = "";
									var locus_tag = "";
									var product = "";
									k = j+1
									while (/^\s{6}/g.test(lines[k])){
										if (/\/[\w|\W]*=[\w|\W]*/.test(lines[k])) {

											var matches = lines[k].trim().match(/\/([\w|\W]*)=([\w|\W]*)/);
											
											var matchval = matches[2];
											
											if(matchval.indexOf('"') != -1) {
												while(matchval.substr(matchval.length-1,1) != '"') {
													k++;
													matchval = matchval + ' ' + lines[k].trim();
												}
												matchval = matchval.substr(0, matchval.length)
											}
											
											if (matches[1] == "locus_tag"){
												locus_tag = matchval;
											}
											else if (matches[1] == "gene"){
												genename = matchval;
											}
											else if (matches[1] == "protein_id"){
												protein_id = matchval;
											}
											else if (matches[1] == "product"){
												product = matchval;
											}
										}
										
										k = k+1;
									}
									
									//name stuff
									if (product === ""){
										if (protein_id != ""){
											product = protein_id;
										} else {
											product = locus_tag;
										}
									}
									
									// Create gene item and push
									var genome = organism
									var genomestyles = [];
									
									var gene = {currLane:$scope.maxVertOff, genome:genome, genomehtml:genome, genelocked:false, genomelocked:false, start:startPos, stop:endPos, size:Math.abs(startPos-endPos), strand:strand, name:genename.slice(1, genename.length-1), namehtml:genename.slice(1, genename.length-1), genefunction:product.slice(1, product.length-1), color:null, labelvertpos:'middle', genevisible:true, labelpos:{x:null, y:null}, pasting:false};
									
									gene["color"] = colorService.getHashColor(gene['genefunction']);
									
									$scope.data.push(gene);
									
									j = k;
								}
								j = j+1;
							}
							i = j;
						}
						i = i+1;
					}
					geneService.updateGene($scope.data, $scope.maxVertOff);
				}
				
			$scope.parseFile = function($fileContent, $fileType){
				$scope.content = $fileContent;
				$scope.filetype = $fileType;
				$scope.graphSettings.currentFilesList.push($fileType.input);
				var lines = $scope.content.match(/[^\r\n]+/g);
				// Create a vertical genome offset
				if ($scope.filetype[0] === 'tsv'){
					$scope.parseTSV(lines);
				}
				else if ($scope.filetype[0] === 'gb' || $scope.filetype[0] === 'gff' || $scope.filetype[0] === 'gbk'){
					$scope.parseGB(lines);
				}
				else {
					console.log("Error, not a known filetype");
				}
			}
			
			$scope.gbItemChanged = function(item){
				if(typeof item !== 'undefined'){
					$scope.gb.genbankID = item.id;
				}
			}
			
			$scope.gb = {};
			$scope.gb.genbankID;
			$scope.gb.seqRange = "whole";
			$scope.gb.seqRangeStart;
			$scope.gb.seqRangeEnd;
			$scope.gb.statusMessage = "";
			$scope.gb.loadingFile = false;
			var baseURL;
			
			$scope.submitNCBIQuery = function(){
				$scope.gb.loadingFile = true;
				if(!$scope.gb.genbankID){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter an organism or Genbank ID.";
					return;
				}
				if ($scope.gb.seqRange == "whole") {
					baseURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=gb&id=";
				}
				else if ($scope.gb.seqRange == "custom") {
					if(!($scope.gb.seqRangeStart < $scope.gb.seqRangeEnd)){
						$scope.gb.loadingFile = false;
						$scope.gb.statusMessage = "Please enter a valid custom range.";
						return;
					}
					baseURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=gb&seq_start=" 
					+ $scope.gb.seqRangeStart + 
					"&seq_stop=" 
					+ $scope.gb.seqRangeEnd + 
					"&id=";
				}
				$http.get(baseURL + $scope.gb.genbankID).then(function parsePage(response) {
					$scope.gb.loadingFile = false;
					if(response.status == 200) {
						var lines = response.data.match(/[^\r\n]+/g);
						if(lines[0].substr(0,5)!="LOCUS") {
							$scope.gb.statusMessage = "Invalid file format retrieved!";
							return;
						} 
						else if (response.data.length > 500000) {
							$scope.gb.statusMessage = "File retrieved is too large to display, please select a custom range.";
							return;
						}
						else {
							$scope.gb.statusMessage = "";
							popupMenuService.updateMenuStatus(false);
							$scope.graphSettings.currentFilesList.push("NCBI query: " + $scope.gb.genbankID);
							$scope.parseGB(lines);
						}
					}else{
						$scope.gb.statusMessage = response.statusText;
					}
				}, function errorCallback(response) {
					$scope.gb.statusMessage = response.statusText;
				});
			}
			
			$scope.tutorialFile = function(url, ftype){
				$http({
					method: 'GET',
					url: url
				}).then(function sucessCallBack(response) {
						var filetype = [ftype];
						filetype.input = url.split('/').pop();
						$scope.parseFile(response.data, filetype);
				}, function errorCallback(response) {
					alert(response.statusText);
				});
			};
			
			$scope.clearAllGenomes = function(){
				var ret = confirm("Do you really want to clear all data?");
				if (ret == true){
					geneService.clearGenes();
					$scope.data =[];
					$scope.graphSettings.displayedFunction = "";
					$scope.graphSettings.currentFilesList = [];
					document.getElementById('file').value = '';
				}
				else {
					return;
				}
			};

		}])
		.controller('popupCtrl', ['$scope', 'popupMenuService', function($scope, popupMenuService){
			
			$scope.showPopupMenu = false;
			$scope.showGBSelect = false;
			$scope.showExportPanel = false;
			$scope.showGeneMenu = false;
			$scope.showGenomeMenu = false;
			$scope.showGraphSizeDialog = false;
			$scope.showLaneDialog = false;
			$scope.showScaleDialog = false;
			$scope.showGlobalGenome = false;
			$scope.showGlobalGene = false;
			$scope.showGeneCPDialog = false;
			
			
			$scope.$on('updateMenuStatus', function(){
				$scope.showPopupMenu = popupMenuService.MenuVisible;
				$scope.showGBSelect = popupMenuService.GBSelectVisible;
				$scope.showExportPanel = popupMenuService.ExportPanelVisible;
				$scope.showGeneMenu = popupMenuService.GeneMenuVisible;
				$scope.showGenomeMenu = popupMenuService.GenomeMenuVisible;
				$scope.showGraphSizeDialog = popupMenuService.GraphSizeDialogVisible;
				$scope.showLaneDialog = popupMenuService.LaneDialogVisible;
				$scope.showScaleDialog = popupMenuService.ScaleDialogVisible;
				$scope.showGlobalGenome = popupMenuService.GlobalGenomeVisible;
				$scope.showGlobalGene = popupMenuService.GlobalGeneVisible;
				$scope.showGeneCPDialog = popupMenuService.GeneCPDialogVisible;
				
				$( "#popupbox" ).draggable();
				
				if($scope.showExportPanel == true || 
						$scope.showGBSelect == true || 
						$scope.showGraphSizeDialog == true || 
						$scope.showLaneDialog == true ||
						$scope.showScaleDialog == true ||
						$scope.showGlobalGenome == true ||
						$scope.showGlobalGene == true ||
						$scope.showGeneCPDialog == true){
						$("#popupbox").css("left", '35%');
						$("#popupbox").css("top", '200px');
				}
				return;
			});
			
			$scope.openPopup = function(menuType){
				switch(menuType) {
					case 'genecpDialog':
						popupMenuService.updateGeneCPDialog(true);
						break;
					case 'GBSelect':
						popupMenuService.updateGBSelect(true);
						break;
					case 'exportPanel':
						popupMenuService.updateExportPanel(true);
						break;
					case 'geneMenu':
						popupMenuService.updateGeneMenu(true);
						break;
					case 'genomeMenu':
						popupMenuService.updateGenomeMenu(true);
						break;
					case 'graphSizeDialog':
						popupMenuService.updateGraphSizeDialog(true);
						break;
					case 'laneDialog':
						popupMenuService.updateLaneDialog(true);
						break;
					case 'scaleDialog':
						popupMenuService.updateScaleDialog(true);
						break;
					case 'globalGenome':
						popupMenuService.updateGlobalGenome(true);
						break;
					case 'globalGene':
						popupMenuService.updateGlobalGene(true);
				}
				return;
			};
			
			$scope.closePopup = function(){
				popupMenuService.updateGBSelect(false);
				popupMenuService.updateExportPanel(false);
				popupMenuService.updateGeneMenu(false);
				popupMenuService.updateGenomeMenu(false);
				popupMenuService.updateGraphSizeDialog(false);
				popupMenuService.updateLaneDialog(false);
				popupMenuService.updateScaleDialog(false);
				popupMenuService.updateGlobalGenome(false);
				popupMenuService.updateGlobalGene(false);
				popupMenuService.updateGeneCPDialog(false);
				return;
			};
		}])
		.controller('gbAutoCompCtrl', ['$scope', '$http', 'popupMenuService', function($scope, $http, popupMenuService){
			
			$scope.$on('updateMenuStatus', function(){
				if(popupMenuService.GBSelectVisible){
					console.log('retrieve ids');
					$scope.createData();
				}
			});

			$scope.genomesList = []
			
			$scope.createData = function(){
				console.log('get files');
				var url = 'data/genomes.ids';
				$http.get(url).then(function parseData(response){
					if(response.status == 200) {
						var lines = response.data.match(/[^\r\n]+/g);
						for (var row=0; row<lines.length; row++){
							var columns = lines[row].split('\t');
							var id = columns[4];
							var organism = columns[5];
							$scope.genomesList.push({id:id, organism:organism.toLowerCase(), display:organism + " (" + id + ")"});
						}
					}
				}, function errorCallback(response){
					console.log(response.statusText);
				});
				console.log($scope.genomesList);
			};
			
			$scope.querySearch = function querySearch (query) {
				var results = query ? $scope.genomesList.filter( createFilterFor(query) ) : $scope.genomesList,
						deferred;
				return results;
			}
			
			function createFilterFor(query) {
				var lowercaseQuery = angular.lowercase(query);

				return function filterFn(genome) {
					return (genome.organism.toLowerCase().indexOf(lowercaseQuery) >= 0);
				};
			}
			
		}])
}());
