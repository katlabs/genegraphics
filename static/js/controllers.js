(function () {
'use strict';

	angular.module('geneGraphApp.controllers')
		.controller('graphCtrl', ['$scope', '$q', 'geneService', 'colorService', 'popupMenuService', 'd3', function($scope, $q, geneService, colorService, popupMenuService, d3) {
			
			// Set up graph container size
			document.getElementById("graphcontainer").style.height = window.innerHeight - 200 + "px";

			$scope.graphSettings = {};
			
			// localStorage should be loaded into variables. We wait until the graphcontainer
			// is loaded to load the data.
			var savedDataStr = null;
			var savedDataJson = null;
			var savedSettingsStr = null;
			var savedSettingsJson = null;
			
			if(typeof(Storage!=="undefined")) {
					$scope.graphSettings.lsSupport = true;
				if(localStorage.savedData!=null && localStorage.savedData!='null' && localStorage.savedData!=="[]"){
					savedDataStr = localStorage.savedData;
					savedDataJson = JSON.parse(savedDataStr);
				}
				if(localStorage.savedSettings!=null && localStorage.savedSettings!='null'){
					savedSettingsStr = localStorage.savedSettings;
					savedSettingsJson = JSON.parse(savedSettingsStr);
				}
			}else{
				$scope.graphSettings.lsSupport = false;
				alert("Your browser does not support saving. Please export your graphic manually on a regular basis so not to lose your data");
			}


			//$scope.graphSettings.graphwidth = document.getElementById('graphcontainer').offsetWidth - 100;
			$scope.graphSettings.maxwidth = 0;
			$scope.graphSettings.featureheight = 50;
			$scope.graphSettings.multilane = true;
			$scope.graphSettings.shiftgenes = false;
			$scope.graphSettings.keepgaps = false;
			$scope.graphSettings.scaleOn = true;
			$scope.graphSettings.arrows = true;
			$scope.graphSettings.displayedFunction = "";
			$scope.graphSettings.currentFilesList = [];
			$scope.graphSettings.pastingGenes = false;
			$scope.graphSettings.genomesHidden = false;
			
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

			$scope.tinymceOpts = {
				height: 50,
				min_height: 50,
				max_height: 200,
				width: 377,
				elementpath: false,
				body_class: 'editor',
				content_css: '/genegraphics/static/styles/main.css',
				plugins: 'textcolor colorpicker',
				menubar: false,
				toolbar1: 'undo redo | bold italic | alignleft aligncenter alignright | valigntop valignmid valignbot',
				toolbar2: 'fontsizeselect | forecolor',
				force_br_newlines: false,
				force_p_newlines: false,
				forced_root_block: '',
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
					editor.on('init', function(ed){
						ed.target.editorCommands.execCommand("fontName", false, "arial, helvetica, sans-serif");
						ed.target.editorCommands.execCommand("fontSize", false, "12pt");
					});

					var topbtn = editor.addButton('valigntop', {
						text: false,
						icon:false,
						image: '/genegraphics/static/images/ic_vertical_align_top_black_16px.svg',
						tooltip: 'Align top',
						disabled: true,
						onpostrender: function(){
							var btn = this;
							document.addEventListener("mousemove", function(){
								btn.disabled(popupMenuService.GeneMenuVisible == false);
								if (typeof $scope.geneData[$scope.graphSettings.selectedGene] == 'object'){
									btn.active($scope.geneData[$scope.graphSettings.selectedGene]['labelvertpos'] == 'top');
								}
								if (popupMenuService.GeneMenuVisible == false) {btn.active(false);}
							});
						}
					});
					var midbtn = editor.addButton('valignmid', {
						text: false,
						icon:false,
						image: '/genegraphics/static/images/ic_vertical_align_center_black_16px.svg',
						tooltip: 'Align middle',
						disabled: true,
						onpostrender: function(){
							var btn = this;
							document.addEventListener("mousemove", function(){
								btn.disabled(popupMenuService.GeneMenuVisible == false);
								if (typeof $scope.geneData[$scope.graphSettings.selectedGene] == 'object'){
									btn.active($scope.geneData[$scope.graphSettings.selectedGene]['labelvertpos'] == 'middle');
								}
								if (popupMenuService.GeneMenuVisible == false) {btn.active(false);}
							});
						}
					});
					var btmbtn = editor.addButton('valignbot', {
						text: false,
						icon:false,
						image: '/genegraphics/static/images/ic_vertical_align_bottom_black_16px.svg',
						tooltip: 'Align bottom',
						disabled: true,
						onpostrender: function(){
							var btn = this;
							document.addEventListener("mousemove", function(){
								btn.disabled(popupMenuService.GeneMenuVisible == false);
								if (typeof $scope.geneData[$scope.graphSettings.selectedGene] == 'object'){
									btn.active($scope.geneData[$scope.graphSettings.selectedGene]['labelvertpos'] == 'bottom');
								}
								if (popupMenuService.GeneMenuVisible == false) {btn.active(false);}
							});
						}
					});
					editor.buttons.valigntop.onclick = function() {
							$scope.geneData[$scope.graphSettings.selectedGene]['labelvertpos'] = 'top';
							this.active(true);
							$scope.$apply();
						}
					editor.buttons.valignmid.onclick = function() {
							$scope.geneData[$scope.graphSettings.selectedGene]['labelvertpos'] = 'middle';
							this.active(true);
							$scope.$apply();
						}
						editor.buttons.valignbot.onclick = function() {
							$scope.geneData[$scope.graphSettings.selectedGene]['labelvertpos'] = 'bottom';
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

			function waitForElement(elementId, callBack){
				window.setTimeout(function(){
					var element = document.getElementById(elementId);
					if(element){
						callBack(elementId, element);
					}else{
						waitForElement(elementId, callBack);
					}
				},500)
			};

			waitForElement("graphcontainer", function(){
				if(savedDataStr!=null && savedDataStr!='null' && savedDataStr!=="[]"){
					geneService.addGenes(savedDataJson);
				}
				if(savedSettingsStr!=null && savedSettingsStr!='null'){
					$scope.graphSettings = savedSettingsJson;
				}
			});

			$scope.$on('updateGeneData', function(){
				console.log("updateGeneData");
				$scope.geneData = geneService.geneData;
				$scope.genomesHash = geneService.genomesHash;
				$scope.graphSettings.maxwidth = geneService.getMaxWidth($scope.geneData);
				if ($scope.graphSettings.lsSupport == true){
					var stringed_data = JSON.stringify($scope.geneData);
					localStorage.setItem("savedData", JSON.stringify($scope.geneData));
				}
				checkScroll();
			});

			$scope.$watch('graphSettings', function(){
				localStorage.setItem("savedSettings", JSON.stringify($scope.graphSettings));
			}, true);
			
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
				$scope.graphSettings.selectedGene = parseInt(index);
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
				$scope.graphSettings.selectedGene = parseInt(index);
				$scope.genome.newGenome = $scope.geneData[$scope.graphSettings.selectedGene]['genomehtml'];
				$scope.genome.oldGenome = $scope.geneData[$scope.graphSettings.selectedGene]['genomehtml'];
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

						if ($scope.genome.oldGenome !== undefined){
							if (isInArray(i, $scope.genomesHash[$scope.genome.oldGenome])){
							$scope.geneData[i]['genomehtml'] = $scope.genome.newGenome;
							}
						}
					}
					$scope.genomesHash[$scope.genome.newGenome] = $scope.genomesHash[$scope.genome.oldGenome];
					delete $scope.genomesHash[$scope.genome.oldGenome];
				}
				$scope.genome.newGenome = $scope.geneData[$scope.graphSettings.selectedGene]['genomehtml'];
				$scope.genome.oldGenome = $scope.geneData[$scope.graphSettings.selectedGene]['genomehtml'];
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
						$scope.graphSettings.selectedGene = i;
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
						$scope.graphSettings.selectedGene = i;
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
							//$tempdom.find('span').css('font-size', '');
							//$tempdom.find('span:not([style])').contents().unwrap();
							$tempdom.find('[style*="font-size"]').contents().unwrap();
							change_name = $tempdom[0].outerHTML.replace(/(<p[\w\s\d-:=,"'#;]*>)/g, '$1<span style="font-size: ' + newsize + ';">');
							change_name = change_name.replace(/<\/p>/g, '</span></p>');
						}
					}
					catch(err){
						change_name = '<p><span style="font-size: ' +newsize+ ';">' + change_name + '</span></p>'
					}
					origName = change_name;
					if (labeltype === 'genomes') {
						$scope.graphSettings.selectedGene = i;
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
							//$tempdom.find('span').css('color', '');
							//$tempdom.find("[style='']").contents().unwrap();
							$tempdom.find('[style*="color"]').contents().unwrap();
							change_name = $tempdom[0].outerHTML.replace(/(<p[\w\s\d-:=,"'#;]*>)/g, '$1<span style="color: ' + newcolor + ';">');
							change_name = change_name.replace(/<\/p>/g, '</span></p>');
						}
					}
					catch(err) {
						change_name = '<p><span style="color: ' +newcolor+ ';">' + change_name + '</span></p>'
					}
					origName = change_name;
					if (labeltype === 'genomes') {
						$scope.graphSettings.selectedGene = i;
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
						$scope.graphSettings.selectedGene = i;
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
				if (!popupMenuService.GeneMenuVisible){
					$scope.graphSettings.displayedFunction = newfunction;
					$scope.$apply();
				}
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
				var copy = $scope.graphSettings.selectedGene
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

			$scope.deleteGene = function(index){
				var ret = confirm("This gene will be permenantly deleted. Are you sure?");
				if (ret == true){
					var newData = $scope.geneData;
					newData.splice(index, 1);
					geneService.newGenes(newData);
				}
				else{
					return;
				}
			}

			var updateFilesList = function(){
				var newFilesList = [];
				for(var i=0; i<$scope.geneData.length; i++){
					if (newFilesList.indexOf($scope.geneData[i]['file']) < 0){
						newFilesList.push($scope.geneData[i]['file']);
					}
				}
				$scope.graphSettings.currentFilesList = newFilesList;
			}

			$scope.deleteGenome = function(index){
				var ret = confirm("This genome will be permenantly deleted. Are you sure?");
				if (ret == true){
					var genomeKey = $scope.geneData[index]["genomehtml"];
					var geneList = geneService.genomesHash[genomeKey];
					var newData = [];
					for (var i=0; i < $scope.geneData.length; i++){
						if (geneList.indexOf(i) < 0){
							newData.push($scope.geneData[i]);
						}
					}
					geneService.newGenes(newData);
					updateFilesList();
				}
				else {
					return;
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

			$scope.remOrToggleLabels = function(labeltype){
				if (labeltype=='gene'){
					var ret = confirm("This will delete all gene labels and cannot be undone. Are you sure?");
					if(ret == true){
						for (var i = 0; i < $scope.geneData.length; i++){
							$scope.geneData[i]['name'] = "";
							$scope.geneData[i]['namehtml'] = "";
						}
					} else {
						return;
					}
				} else {
					$scope.graphSettings.genomesHidden = !$scope.graphSettings.genomesHidden;
				}

			}

			$scope.toggleGenomeLabels = function(){
			}
			
			$scope.$watch("globalLabels['genomeColor']", function(newVal, oldVal){
				if(typeof($scope.genomesHash)!=='undefined'){
					$scope.globalFontColor('genomes', newVal);
				}
			}, true);
			
			$scope.$watch("globalLabels['geneColor']", function(newVal, oldVal){
				if(typeof($scope.genomesHash)!=='undefined'){
				  $scope.globalFontColor('genes', newVal);
				}
			}, true);

			
		}])
		.controller('NavCtrl', ['$scope', '$location', function($scope, $location) {
			$scope.currentNavItem = $location.absUrl().split('/')[$location.absUrl().split('/').length-1];
		}])
		.controller('FileCtrl', ['$scope', '$http', 'geneService', 'colorService', 'popupMenuService', function($scope, $http, geneService, colorService, popupMenuService){
			if(typeof $scope.geneData === 'undefined') {
			  $scope.geneData = [];
			}
			$scope.gb = {};
			$scope.gb.searchText;
			$scope.gb.selectedItem;
			$scope.gb.fetchID = "";
			$scope.gb.geneName;
			$scope.gb.organismName;
			$scope.gb.idtypes = [{display:"Gene ID", db:"gene"},
				{display:"Protein ID", db:"protein"},
				{display:"Gene symbol and organism", db:"gene"},
				{display:"Genome location", db:"nuccore"}];
			$scope.gb.idtype = {display:"Gene ID", db:"gene"};
			$scope.gb.seqRangeStart = 0;
			$scope.gb.seqRangeEnd = 5000;
			$scope.gb.fullRange = 5000;
			$scope.gb.statusMessage = "";
			$scope.gb.loadingFile = false;
			var baseURL;
			$scope.fn = "";

			$scope.strip = function(html) {
				// Uses the browser to strip HTML 
				var tmp = document.createElement("DIV");
				tmp.innerHTML = html;
				return tmp.textContent || tmp.innerText || "";
			}

			$scope.parseTSV = function(lines){

				$scope.data = [];
				var header = lines[0];
				var headercols = header.split('\t');
				var headerpos = {genome:null, genomehtml:null, genelocked:null, genomelocked:null, labelpos:null, labelvertpos:null, name:null, namehtml:null, genefunction:null, color:null, size:null, start:null, stop:null, strand:null};
				$scope.maxVertOff = geneService.maxVertOff;
				for(var i = 0; i < headercols.length; i++){
					var currHeaderCol = headercols[i].toLowerCase().replace(/ /g, '');
					if (currHeaderCol === 'genome' || currHeaderCol === 'organism'){
						headerpos.genome = i;
					}
					else if (currHeaderCol === 'genomehtml'){
						headerpos.genomehtml = i;
					}
					else if (currHeaderCol === 'genelocked'){
						headerpos.genelocked = i;
					}
					else if (currHeaderCol === 'genomelocked'){
						headerpos.genomelocked = i;
					}
					else if (currHeaderCol === 'labelpos' || currHeaderCol === 'labelposition'){
						headerpos.labelpos = i;
					}
						else if (currHeaderCol === 'labelvertpos' || currHeaderCol === 'labelverticalposition'){
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
							else if (key === 'keepgaps' || key === 'multilane' || key === 'shiftgenes' || key === 'scaleOn' || key === 'arrows'){
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
						var gene = {genome:null, genomehtml:null, genelocked:false, genomelocked:false, start:null, stop:null, size:null, strand:null, name:null, namehtml:null, genefunction:null, color:null, labelvertpos:'middle', labelpos:{x:null, y:null}, file:$scope.fn};
						var columns = lines[i].split('\t');
						
						var genome = columns[headerpos['genome']];
						if(Object.entries(geneService.genomesHash).map(x=>$scope.strip(x[0])).indexOf(genome)!=-1) {
							var copynum = 0;
							for(var jj=1; jj < 100; jj++){
								var testgenome = genome+' ('+jj+')';
								if(Object.entries(geneService.genomesHash).map(x=>$scope.strip(x[0])).indexOf(testgenome)==-1){
									copynum = jj;
									break;
								}
							}
							genome = genome + " ("+copynum+")"
							// Replace the html with a new genome name, preserving the html
							if(headerpos['genomehtml'] != null) {
								columns[headerpos['genomehtml']] = columns[headerpos['genomehtml']].replace(columns[headerpos['genome']], genome)
							}
						}
						gene['genome'] = genome;

						for (var key in gene) {
							if ((key === 'name' || key === 'namehtml' || key === 'genefunction' || key === 'strand' || key === 'color' || key === 'labelcolor' || key === 'labelstyle' || key === 'genomehtml' || key === 'labelvertpos') && headerpos[key] !== null){
								gene[key] = columns[headerpos[key]];
							}
							if ((key === 'genelocked' || key === 'genomelocked') && headerpos[key] !== null){
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
								gene[key] = parseInt(columns[headerpos[key]]);
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
								gene[key] = '<p><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;">'+genome+'</span></p>';
							}
							else if(key === 'genefunction' && headerpos[key] === null){
								gene[key] = ""
							}
							else if(key === 'color' && headerpos[key] === null){
								gene[key] = colorService.getHashColor(gene['genefunction']);
							}
							gene['pasting']=false;
						}
						$scope.data.push(gene);
					}
				}
				geneService.addGenes($scope.data);
			}
			
			var process_location = function(location_string) {
				var index,
					matches = [],
					newlocation = '',
					segment = {},
					segs = [],
					i,
					segments = [];
				location_string = location_string.replace(/<|>/g, '');
				if (/[0-9]/g.test(location_string.slice(0, 1))) {
					matches = location_string.match(/(\d+)\.\.(\d+)/);
					if (matches != null){
						segment.start = matches[1];
						segment.end = matches[2];
						segments[0] = segment;
						return segments;
					} else {
						matches = location_string.match(/(\d+)/);
						segment.start = matches[1];
						segment.end = matches[1];
						segments[0] = segment;
						return segments;
					}
				}
				while (location_string.match(/complement|join/g)) {
					if (/[0-9]/g.test(location_string.slice(0, 1))) {
						index = location_string.match(/j|c/);
						newlocation = location_string.slice(0, index - 1);
						location_string = location_string.slice(index);
					} 
					else if (/complement/.test(location_string.slice(0, 10))) {
						location_string = location_string.replace(/(\d+)\.\.(\d+)/g, "$2..$1");
						location_string = location_string.slice(11, -1);
					} 
					else if (/join/.test(location_string.slice(0, 4))) {
						location_string = location_string.slice(5, -1);
					}
				}
				newlocation += location_string;
				if (/,/g.test(newlocation)) {
					segs = newlocation.split(/,/);
				} else {
					segs[0] = newlocation;
				}
				for (i = 0; i < segs.length; i += 1) {
					segment = {};
					matches = segs[i].match(/(\d+)\.\.(\d+)/);
					segment.start = matches[1];
					segment.end = matches[2];
					segments.push(segment);
				}
				return segments;
			}

			var readGBFeatures = function(lines) {
				var i = 0,
					j,
					k,
					textline,
					features = [],
					feature = {},
					obj = {},
					counter = -1,
					matches = [];
				obj.invalidFileType = false;
				obj.GBType;
				while (i < lines.length) {
					if ("ORGANISM" === lines[i].slice(2, 10)) {
						obj.organism = lines[i].slice(10).trim();
					}
					else if ("DEFINITION" === lines[i].slice(0, 10)) {
						if (/^MULTISPECIES:/g.test(lines[i].slice(10).trim())){
							obj.invalidFileType = "multispecies";
							return obj;
						}
					}
					else if ("DBSOURCE" === lines[i].slice(0, 8)) {
						var re = /[A-Z]+[_]?[A-Z]*[\d]+[\.]?[\d]?/;
						var matches = lines[i].match(re);
						obj.nuccsource = matches[0];
						j = i + 1;
						while (typeof lines[j] !== 'undefined') {
							textline = lines[j].trim().slice(1);
							matches = textline.match(/([\w|\W]*)=([\w|\W]*)/);
							if(matches != null && matches[1] == "coded_by"){
								obj.sourceloc = process_location(matches[2].replace(/\"/g, ''));
								return obj;
							}
							j++;
						}
						return obj;
					}
					else if ("FEATURES" === lines[i].slice(0, 8)) {
						j = i + 1;
						//Stop reading after the FEATURES section
						while (typeof lines[j] !== 'undefined' && /[A-Z]/.test( lines[j].charAt(0) ) == false ) {
							if (/^\s{5}\w/.test(lines[j])) {
								counter += 1;
								k = j + 1;
								textline = lines[j].trim();
								while (/^\s{6}/g.test(lines[k]) && /^[a-z0-9]/gi.test(lines[k].trim())){
									textline += lines[k].trim();
									j = k;
									k += 1;
								}
								textline = textline.trim().split(/\s+/g);
								feature = {};
								feature.feature = textline[0];
								feature.location = process_location(textline[1]);
								features[counter] = feature;
							}
							else if (/^\//.test(lines[j].trim())) {
								textline = lines[j].trim().slice(1);
								k = j + 1;
								while (/^\s{6}/g.test(lines[k]) && /^[A-Z]/g.test(lines[k].trim())) {
									textline += lines[k].trim();
									j = k;
									k += 1;
								}
								if (/[\w|\W]*=[\w|\W]*/.test(textline)) {
									var matches = textline.match(/([\w|\W]*)=([\w|\W]*)/);
									feature[matches[1]] = matches[2].replace(/\"/g, '');
									features[counter] = feature;
								}
							}
							i = j;
							j += 1;
						}
					}
					i += 1;
				}
				obj.features = features;
				return obj;
			}
			
			$scope.parseGB = function(lines) {
				var parsed = readGBFeatures(lines);
				var err = "success";
				// Return various errors
				if (angular.equals(parsed, {})){
					err = "No data parsed";
					return err;
				} else if (parsed.invalidFileType != false){
					err = "Invalid file type: " + parsed.invalidFileType;
				} else if (parsed.features.length == 0){
					err = "No features parsed";
					return err;
				} else if (parsed.features.length == 1){
					err = "Only one feature: " + parsed.features[0].feature;
					return err;
				// Otherwise, create and updata the data.
				} else {
					var i = 0;
					var data = [];
					var organism = parsed.organism;
					if (typeof parsed.organism == 'undefined'){
						organism = "unknown genome";
					}

					// Make sure the genome label is unique
					var organismhtmltest = '<p><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;">'+organism+'</span></p>';
					if (organismhtmltest in geneService.genomesHash || geneService.offset.hasOwnProperty(organismhtmltest)){
						var copynum = 0;
						for(var ii=1; ii<100; ii++){
							var testgenome = '<p><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;">'+organism+' ('+ii+')</span></p>';
							if(!(testgenome in geneService.genomesHash) && !(geneService.offset.hasOwnProperty(testgenome))){
								copynum = ii;
								break;
							}
						}
						organism = organism + " ("+copynum+")";
					}
					var supported_features = ["CDS","gene","mRNA"];
					while ( i < parsed.features.length){
						var j = i;
						if (supported_features.indexOf(parsed.features[i].feature) > -1){
							// Get basic info from gene feature
							var gene = parsed.features[i].gene;
							var locus_tag = parsed.features[i].locus_tag;
							var product = parsed.features[i].product;
							var protein_id = parsed.features[i].protein_id;
							var start = parseInt(parsed.features[i].location[0].start);
							var end = parseInt(parsed.features[i].location[0].end);
							var strand = (start <= end) ? "+" : "-";
							var size = Math.abs(end - start);

							while ((j < parsed.features.length) &&
								(parseInt(parsed.features[j].location[0].start) == start) && 
								(parseInt(parsed.features[j].location[0].end) == end)) {
								if (supported_features.indexOf(parsed.features[j].feature) > -1){
									if (typeof gene == 'undefined') gene = parsed.features[j].gene;
									if (typeof locus_tag == 'undefined') locus_tag = parsed.features[j].locus_tag;
									if (typeof product == 'undefined') product = parsed.features[j].product;
									if (typeof protein_id == 'undefined') protein_id = parsed.features[j].protein_id;
								}
								j++;
							}

							var genename = "";
							if (typeof gene != 'undefined') {genename = gene}
							else if (typeof locus_tag != 'undefined') {genename = locus_tag}
							else if (typeof protein_id != 'undefined') {genename = protein_id};

							var funct = "";
							if (typeof product != 'undefined') {funct = product}
							else if (genename != "") {funct = genename};

							var geneObj = {genome:organism, genomehtml:'<p><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;">'+organism+'</span></p>',
								genelocked:false, genomelocked:false, start:start, stop:end, size:size, strand:strand,
								name:genename, namehtml:genename, genefunction:funct, color:null, labelvertpos:'middle',
								labelpos:{x:null,y:null}, pasting:false, file:$scope.fn};

							geneObj.color = colorService.getHashColor(geneObj.genefunction);
							data.push(geneObj);
						}
						if ( i == j){
							i = j+1;
						} else {
							i = j;
						}
					}
					if (data.length > 0){
						geneService.addGenes(data);
					} else {
						err = "No supported features were found. Supported features include: \n" + supported_features.join(", ") + "\n";
					}
					return err;
				}
			}
	
			$scope.parseFile = function($fileContent, $fileType){
				$scope.content = $fileContent;
				$scope.filetype = $fileType;
				$scope.fn = $fileType.input;
				var numFileDup = $scope.graphSettings.currentFilesList.reduce(function(p,c){
					if($scope.fn === c){
						p++
					}
					else if($scope.fn === c.substring(0, c.length-(p < 10 ? 4 : 5))){
						p++;
					}
				    return p;
				},0);
				if (numFileDup > 0){
					$scope.fn = $scope.fn + " (" + numFileDup + ")"
				}
				$scope.graphSettings.currentFilesList.push($scope.fn);
				var lines = $scope.content.match(/[^\r\n]+/g);
				// Create a vertical genome offset
				if ($scope.filetype[0] === 'tsv'){
					$scope.parseTSV(lines);
				}
				else if ($scope.filetype[0] === 'gb' || $scope.filetype[0] === 'gff' || $scope.filetype[0] === 'gbk'){
					var err = $scope.parseGB(lines);
					if (err != "success"){
						alert("The file uploaded could not be parsed due to the following error: " + err + " Please try another file.");
					}
				}
				else {
					alert("Error, not a known filetype");
				}
				$('#file').val("");
			}
			
			$scope.gbItemChanged = function(){
				if (typeof $scope.gb.selectedItem !== 'undefined' && $scope.gb.selectedItem != null){
					$scope.gb.fetchID = $scope.gb.selectedItem.gbid;
					$scope.gb.organismName = $scope.gb.selectedItem.organism;
				}
				else {
					$scope.gb.fetchID = "";
				}
			}

			$scope.gbSearchTextChanged = function(){
				if (typeof $scope.gb.searchText !== 'undefined'){
					$scope.gb.fetchID = $scope.gb.searchText;
					if( $scope.gb.searchText !== "" ){
						$scope.gb.organismName = $scope.gb.searchText;
					}
				}
				else {
					$scope.gb.fetchID = "";
				}
			}

			var parseNuccoreRes = function(response){
				$scope.gb.loadingFile = false;
				if(response.status == 200) {
					var lines = response.data.match(/[^\r\n]+/g);
					$scope.gb.statusMessage = "";
					var numFileDup = $scope.graphSettings.currentFilesList.reduce(function(p,c){
						if($scope.fn === c){
							p++
						}
						else if($scope.fn === c.substring(0, c.length-(p < 10 ? 4 : 5))){
							p++;
						}
					    return p;
					},0);
					if (numFileDup > 0){
						$scope.fn = $scope.fn + " (" + numFileDup + ")"
					}
					var err = $scope.parseGB(lines);
					if (err != "success"){
						$scope.gb.statusMessage = "The GenBank file retrieved could not be parsed. ";
						$scope.gb.statusMessage = "It may be the master record for a whole genome shotgun sequence. ";
						$scope.gb.statusMessage = "Please try uploading your file manually.";
					} else {
						popupMenuService.updateMenuStatus(false);
						$scope.graphSettings.currentFilesList.push($scope.fn);
					}
					$scope.gb.fetchID = "";
					$scope.gb.seqRangeStart = 0;
					$scope.gb.seqRangeEnd = 5000;
					$scope.gb.fullRange = 5000;
				}else{
					$scope.gb.statusMessage = response.statusText;
					$scope.gb.fetchID = "";
				}
				return;
			}

			var handleInvGeneIDRes = function(text){
				$scope.gb.loadingFile = false;
				
				if (text.match(/This record was discontinued\./ig)){
					var matches = /ID: ([\d]+)/ig.exec(text);
					if (matches != null){
						var resGeneID = matches[1];
						$scope.gb.statusMessage = "Matching Gene ID " + resGeneID + ": ";
					}
					$scope.gb.statusMessage += "This record was discontinued. Please enter another ID.";
				} else if (text.match(/This record was replaced with GeneID: [\d]+/ig)){
					var matches = /This record was replaced with GeneID: ([\d]+)/ig.exec(text); 
					$scope.gb.fetchID = matches[1];
					getGeneID();
				} else {
					$scope.gb.statusMessage = "The Gene ID entered did not result in a match.";
				}
			}

			var parseGeneIDFetch = function(response){
				if(response.status == 200){
					var text = response.data;
					var re_err = /Error.+/ig;
					var err_match = re_err.exec(text);
					if (err_match != null){
						$scope.gb.loadingFile = false;
						$scope.gb.fetchID ="";
						$scope.gb.statusMessage = "The query resulted in an error. An invalid or unavailable Gene ID may have been entered.";
						return;
					}
					var re_listnum = /\d\. .+/g;
					var items = text.match(re_listnum);
					if (items != null && items.length != 1){
						$scope.gb.loadingFile = false;
						$scope.gb.fetchID = "";
						$scope.gb.statusMessage = "Unique match not found for the entered Gene ID.";
						return;
					}
					var re = /(?:Annotation:[\s]*)(?:Chromosome [\d|A-Z]+ )?([A-Z\_\d\.]+)[\s]*\(([\d]*)\.{2}([\d]*)(?:, complement\)|\))/ig;
					var num_matches = 0;
					var annot = re.exec(text);
					var start = null;
					var stop = null;
					while (true){
						if (annot == null && num_matches == 0){
							handleInvGeneIDRes(text);
							return;
							}
						var newID = annot[1];
						if (newID != $scope.gb.fetchID) {
							num_matches += 1;
						}
						if (num_matches > 1) {
							$scope.gb.loadingFile = false;
							$scope.gb.fetchID = "";
							$scope.gb.statusMessage = "Unique match not found for the entered Gene ID."
							return;
						}
						$scope.gb.fetchID = annot[1];
						start = parseInt(annot[2]);
						stop = parseInt(annot[3]);
						annot = re.exec(text);
						if (annot == null){
							break;
						}
					};
					var mid = Math.floor((stop + start)/2)
					$scope.gb.seqRangeStart = mid - Math.floor($scope.gb.fullRange/2);
					$scope.gb.seqRangeEnd = mid + Math.ceil($scope.gb.fullRange/2);
					var fetchURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=gbwithparts&retmode=text&seq_start="
						+ $scope.gb.seqRangeStart + "&seq_stop="
						+ $scope.gb.seqRangeEnd + "&id="
						+ $scope.gb.fetchID;

					$scope.fn = "NCBI query: " + $scope.gb.fetchID + "(" + $scope.gb.seqRangeStart + ".." + $scope.gb.seqRangeEnd + ")";

				$http.get(fetchURL).then(function successCallback(response){
					parseNuccoreRes(response);
				}, function errorCallback(response){
					handleErrResponse(response);
				});

				} else {
					$scope.gb.statusMessage = response.statusText;
					$scope.gb.fetchID = "";
				}
			}

			var parseProteinNameSearch = function(response){
				if(response.status == 200){
					var xmldoc = $.parseXML(response.data);
					var $xml = $(xmldoc);
					var $Id = $xml.find('Id');
					if ($Id.length != "1") {
						$scope.gb.statusMessage = "The query did not produce valid results. Please try another gene name and/or organism.";
						$scope.gb.statusMessage += " If the organism is only found in the NCBI database as a whole genome shotgun sequence, "
						$scope.gb.statusMessage += "you must use the specific scaffold's accession ID.";
						$scope.gb.loadingFile = false;
						return;
					}else{
						$scope.gb.fetchID = $Id.text();
						getProteinID();
					}
				}else{
					$scope.gb.statusMessage = response.statusText;
					$scope.gb.fetchID = "";
				}
				return;
			}

			var tryProteinName = function(){
				var searchTerm = "("+$scope.gb.organismName+"[Primary Organism]) AND "+$scope.gb.geneName;
				var searchTerm = encodeURI(searchTerm);
				var searchURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db="
					+ "protein&term="
					+ searchTerm;
				$http.get(searchURL).then(function successCallback(response){
					parseProteinNameSearch(response);
				}, function errorCallback(response){
					handleErrResponse(response);
				})
			}

			var parseGeneNameSearch = function(response){
				if(response.status == 200){
					var xmldoc = $.parseXML(response.data);
					var $xml = $(xmldoc);
					var $Id = $xml.find('Id');
					if ($Id.length != "1") {
						//$scope.gb.statusMessage = "The query did not produce valid results. Please try another gene name and/or organism.";
						//$scope.gb.loadingFile = false;
						tryProteinName();
						return;
					}else{
						$scope.gb.fetchID = $Id.text();
						var fetchURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=gene&id="
							+ $scope.gb.fetchID + "&retmode=text";
						$http.get(fetchURL).then(function successCallback(response){
							parseGeneIDFetch(response);
						}, function errorCallback(response){
							handleErrResponse(response);
						});
					}
				}else{
					$scope.gb.statusMessage = response.statusText;
					$scope.gb.fetchID = "";
				}
				return;
			}

			var handleErrResponse = function(response){
				$scope.gb.loadingFile = false;
				$scope.gb.fetchID = "";
				$scope.gb.geneName = "";
				$scope.gb.statusMessage = "Error: " + response.statusText;
				$scope.gb.statusMessage += " Please check the input and try again."
				return;
			}

			var getGenome = function(){
				$scope.gb.fullRange = $scope.gb.seqRangeEnd - $scope.gb.seqRangeStart;
				if($scope.gb.fetchID==""){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please search for an organism or use a valid genome ID."
					return;
				}
				else if (!(0 < ($scope.gb.fullRange) <= 100000)){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter a valid region (between 1 and 100,000 bp large).";
					return;
				}

				var fetchURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db="
					+ $scope.gb.idtype.db + "&rettype=gbwithparts&retmode=text&seq_start="
					+ $scope.gb.seqRangeStart + "&seq_stop="
					+ $scope.gb.seqRangeEnd + "&id="
					+ $scope.gb.fetchID;

				$scope.fn = "NCBI query: " + $scope.gb.fetchID + "(" + $scope.gb.seqRangeStart + ".." + $scope.gb.seqRangeEnd + ")";

				$http.get(fetchURL).then(function successCallback(response){
					parseNuccoreRes(response);
				}, function errorCallback(response){
					handleErrResponse(response);
				});
				
			}
			var getGeneName = function(){
				if($scope.gb.fetchID==""){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter a valid organism name or ID."
					return;
				}
				else if ($scope.gb.geneName==""){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter a gene symbol.";
					return;
				}
				else if (!(0 < ($scope.gb.fullRange) <= 100000)){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter a valid region (between 1 and 100,000 bp large).";
					return;
				}
				var searchTerm = "("+$scope.gb.fetchID+"[Nucleotide Accession]) AND "+$scope.gb.geneName+"[Gene Name]";
				var searchTerm = encodeURI(searchTerm);
				var searchURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db="
					+ $scope.gb.idtype.db + "&term="
					+ searchTerm;

				$http.get(searchURL).then(function successCallback(response){
					parseGeneNameSearch(response);
				}, function errorCallback(response){
					handleErrResponse(response);
				})
			}

			var parseGeneIDSearch = function(response){
				if(response.status == 200){
					var xmldoc = $.parseXML(response.data);
					var $xml = $(xmldoc);
					var $Id = $xml.find('Id');
					if ($Id.length != "1") {
						$scope.gb.statusMessage = "The query did not produce valid results. Please try another Gene ID.";
						$scope.gb.loadingFile = false;
						return;
					}else{
						$scope.gb.fetchID = $Id.text();
						getGeneID();
					}
				}else{
					$scope.gb.statusMessage = response.statusText;
					$scope.gb.fetchID = "";
				}
				return;
			}

			var tryGeneIDSearch = function(){
				var searchTerm = "("+ $scope.gb.fetchID + " AND (alive[prop]))";
				var searchTerm = encodeURI(searchTerm);
				var searchURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db="
					+ "gene&term="
					+ searchTerm;
				$http.get(searchURL).then(function successCallback(response){
					parseGeneIDSearch(response);
				}, function errorCallback(response){
					handleErrResponse(response);
				})
			}

			var getGeneID = function(){
				if($scope.gb.fetchID==""){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter a valid gene ID."
					return;
				}
				else if (!(0 < ($scope.gb.fullRange) <= 100000)){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter a valid region (between 1 and 100,000 bp large).";
					return;
				}
				if (/^\d+$/.test($scope.gb.fetchID)){
					var fetchURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db="
						+ $scope.gb.idtype.db + "&id="
						+ $scope.gb.fetchID + "&retmode=text";

					$http.get(fetchURL).then(function successCallback(response){
						parseGeneIDFetch(response);
					}, function errorCallback(response){
						handleErrResponse(response);
					});
				}
				else {
					tryGeneIDSearch();
				}
			}

			var getProteinID = function(){
				if($scope.gb.fetchID==""){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter a valid protein ID.";
					return;
				}
				else if ($scope.gb.fetchID.substring(0,3).toUpperCase() == "WP_"){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = $scope.gb.fetchID + " is a non-redundant protein sequence and may be found in multiple genome files."
					return;
				}
				else if (!(0 < ($scope.gb.fullRange) <= 100000)){
					$scope.gb.loadingFile = false;
					$scope.gb.statusMessage = "Please enter a valid region (between 1 and 100,000 bp large).";
					return;
				}
				var fetchURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id="
					+ $scope.gb.fetchID + "&rettype=gb&retmode=text";
				$http.get(fetchURL).then(function successCallback(response){
					if(response.status == 200){
						var parsed = readGBFeatures(response.data.match(/[^\r\n]+/g));
						if (parsed.invalidFileType != false){
							$scope.gb.loadingFile = false;
							$scope.gb.statusMessage = "Cannot parse " + parsed.invalidFileType + " file.";
							return;
						}
						var nuccsource = parsed.nuccsource;
						var sourcestart = false;
						var sourceend = false;
						if ("sourceloc" in parsed){
							sourcestart = parseInt(parsed["sourceloc"][0]["start"]);
							sourceend = parseInt(parsed["sourceloc"][0]["end"]);
						}
						if (typeof nuccsource === 'undefined' || nuccsource === null) {
							$scope.gb.loadingFile = false;
							$scope.gb.statusMessage = "No source genome found. The entry may represent a protein annotated on multiple different genomes.";
							return;
						} else if ( !sourcestart || !sourceend){
							$scope.gb.loadingFile = false;
							$scope.gb.statusMessage = "The location of " + $scope.gb.fetchURL + " could not be parsed.";
						} else {
							$scope.gb.fetchID = nuccsource;
							var region_flank = parseInt($scope.gb.fullRange/2);
							var gene_midpoint = parseInt((sourcestart+sourceend)/2);
							if (sourcestart < region_flank){
								$scope.gb.seqRangeStart = 0;
								$scope.gb.seqRangeEnd = $scope.gb.fullRange;
							} else {
								$scope.gb.seqRangeStart = gene_midpoint - region_flank;
								$scope.gb.seqRangeEnd = gene_midpoint + region_flank;
							}
						}
						var fetchURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=gbwithparts&retmode=text&seq_start="
							+ $scope.gb.seqRangeStart + "&seq_stop="
							+ $scope.gb.seqRangeEnd + "&id="
							+ $scope.gb.fetchID;

						$scope.fn = "NCBI query: " + $scope.gb.fetchID + "(" + $scope.gb.seqRangeStart + ".." + $scope.gb.seqRangeEnd + ")";
						$http.get(fetchURL).then(function successCallback(response){
							parseNuccoreRes(response);
						}, function errorCallback(response){
							handleErrResponse(response);
						});
					} else {
						$scope.gb.statusMessage = response.statusText;
						$scope.gb.loadingFile = false;
					}
				}, function errorCallback(response){
					handleErrResponse(response);
					return;
				});
			}

			$scope.submitNCBIQuery = function(){
				$scope.gb.statusMessage = "";
				$scope.gb.loadingFile = true;
				if($scope.gb.idtype.display == "Genome location"){
					getGenome();
				}
				else if($scope.gb.idtype.display == "Gene ID"){
					getGeneID();
				}
				else if($scope.gb.idtype.display == "Gene symbol and organism"){
					getGeneName();
				}
				else if($scope.gb.idtype.display == "Protein ID"){
					getProteinID();
				}
				else {
					$scope.gb.loadingFile = false;
				}
				$scope.gb.selectedItem = undefined;
				$scope.gb.searchText = '';
				$scope.$$childTail.gb.searchText = '';
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
				var ret = confirm("This will delete all genomes from the page.\nAre you sure you would like to clear the data?");
				if (ret == true){
					geneService.clearGenes();
					$scope.geneData =[];
					$scope.graphSettings.displayedFunction = "";
					$scope.graphSettings.currentFilesList = [];
					document.getElementById('file').value = '';
					localStorage.savedData = null;
				}
				else {
					return;
				}
			};

			$scope.clearGraphSettings = function(){
				var ret = confirm("This will clear all of your custom graph and font settings and return them to default values.\nAre you sure you would like to clear this data?");
				if (ret == true){
					localStorage.savedSettings = null;
					$scope.graphSettings.graphwidth = document.getElementById('graphcontainer').offsetWidth - 100;
					$scope.graphSettings.featureheight = 50;
					$scope.graphSettings.multilane = true;
					$scope.graphSettings.shiftgenes = false;
					$scope.graphSettings.keepgaps = false;
					$scope.graphSettings.scaleOn = true;
					$scope.graphSettings.arrows = true;
					$scope.globalLabels.genomeColor = '#000000';
					$scope.globalLabels.geneColor = '#000000';

					$scope.toggleBold["genomes"] = true;
					$scope.globalBold("genomes");
					$scope.toggleBold["genes"] = true;
					$scope.globalBold("genes");
					$scope.toggleItalic["genomes"] = true;
					$scope.globalEm("genomes");
					$scope.toggleItalic["genes"] = true;
					$scope.globalEm("genes");

					var defaultFontSize = "12pt";
					$scope.globalFontSize("genomes", defaultFontSize);
					$scope.globalFontSize("genes", defaultFontSize);
				}
				else {
					return;
				}
			};
		}])

		.controller('exportCtrl', ['$scope', '$log', '$http','exportStatus', 'd3', function($scope, $log, $http, exportStatus, d3) {


			$scope.exportTypes = ["TSV", "SVG", "PNG", "TIFF", "EPS", "EMF"];
			$scope.exportType;

			$scope.submitExport = function() {
				if ($scope.exportForm.$valid){
					exportStatus.setExportURL(false);
					exportStatus.setExportResult(false);
					exportStatus.setExportErr(false);

					$scope.startExport();

					} else {
						alert("Invalid form!");
					}
			}

			$scope.startExport = function() {
				// Get the TSV String
				var tsvstring = $scope.get_TSV_str();

				var svg = d3.select("svg")[0][0];
				//var svg_w = d3.select("svg").style("width").replace(/\D/g,'');
				//var svg_h = d3.select("svg").style("height").replace(/\D/g,'');

				$http.post('/genegraphics/export', {
					"filetype": $scope.exportType,
					"svgdata": new XMLSerializer().serializeToString(svg),
					"tsvdata": tsvstring,
				}).then(function successCallBack(response) {
					if (response['status'] == 202 && response['headers']('FilePath')) {
						exportStatus.setExportResult(response['headers']('FilePath'));
					} else if ( response['status'] == 202 && response['headers']('TaskStatus')) {
						var status_url = response['headers']('TaskStatus');
						exportStatus.setExportURL(status_url);
					} else {
						exportStatus.setExportErr('Something went wrong with the request. Please try again in a few minutes.');
					}

				}, function errorCallback(error) {
					if (error['headers']('Message')){
						exportStatus.setExportErr(error['headers']('Message'));
					} else {
					  exportStatus.setExportErr('Something went wrong with the request. Please try again in a few minutes.');
					}
				});
			}

			$scope.get_TSV_str = function() {
				var outputtext = "genome\tgenomehtml\tgenelocked\tgenomelocked\tlabelpos\tlabelvertpos\tname\tnamehtml\tcolor\tsize\tstart\tstop\tstrand\tfunction\n";
				var genelines = "";
				for (var i = 0; i < $scope.geneData.length; i++) {
					genelines += $scope.geneData[i].genome + "\t";
					genelines += $scope.geneData[i].genomehtml + "\t";
					genelines += $scope.geneData[i].genelocked + "\t";
					genelines += $scope.geneData[i].genomelocked + "\t";
					genelines += $scope.geneData[i].labelpos.x + "," + $scope.geneData[i].labelpos.x + "\t";
					genelines += $scope.geneData[i].labelvertpos + "\t";
					genelines += $scope.geneData[i].name + "\t";
					genelines += $scope.geneData[i].namehtml + "\t";
					genelines += $scope.geneData[i].color + "\t";
					genelines += $scope.geneData[i].size + "\t";
					genelines += $scope.geneData[i].start + "\t";
					genelines += $scope.geneData[i].stop + "\t";
					genelines += $scope.geneData[i].strand + "\t";
					genelines += $scope.geneData[i].genefunction + "\n";
				}
				outputtext += genelines;
				outputtext += "GraphSettings:{\"graphwidth\":\"" + $scope.graphSettings.graphwidth + "\",\"featureheight\":\"" + $scope.graphSettings.featureheight + "\",\"scaleOn\":\"" + $scope.graphSettings.scaleOn +  "\",\"keepgaps\":\"" + $scope.graphSettings.keepgaps + "\",\"multilane\":\"" + $scope.graphSettings.multilane + "\",\"shiftgenes\":\"" + $scope.graphSettings.shiftgenes + "\",\"arrows\":\"" + $scope.graphSettings.arrows + "\"}";
				return outputtext;
			}


		}])
	  .controller('progressbarCtrl', ['$scope', '$interval', '$timeout', '$http', 'exportStatus', 'd3', 'md5', function($scope, $interval, $timeout, $http, exportStatus, d3, md5) {

			$scope.percent = 0;
			$scope.message = '';
			$scope.image_path = false;
			$scope.image_name = false;
			$scope.status_url = exportStatus.getExportURL();

			$scope.update_progress = function(){
				$http.get($scope.status_url
				).then(function successCallback(response){
					$scope.percent = (response['data']['current']/response['data']['total'])*100;
					$scope.message = response['data']['message'];
					if (response['data']['state'] != 'PENDING' && response['data']['state'] != 'PROGRESS'){
						if ('result' in response['data']){
							// show result
							$scope.image_path = response['data']['result'];
							$scope.image_name = $scope.image_path.split("/")[-1]
						} else {
							// something went wrong
							exportStatus.setExportErr('The server had a problem exporting. Please try again in a few minutes.');
						}
					} else {
						// Update every 0.5 seconds
						setTimeout(function() {
							$scope.update_progress();
						}, 500);
					}
				}, function errorCallback(response){
					// request returned an error (task is not accessible)
					exportStatus.setExportErr('The server had a problem exporting. Please try again in a few minutes.');
				})
			}

			$scope.$on('updateExportURL', function(){
				var oldVal = $scope.status_url;
				var newVal = exportStatus.getExportURL();
				if (newVal !== oldVal) {
					$scope.status_url = newVal;
					if ($scope.status_url) $scope.update_progress();
				}
			});

			$scope.$on('updateExportErr', function(){
				$scope.message = exportStatus.getExportErr();
			});

			$scope.$on('updateExportResult', function(){
				$scope.image_path = exportStatus.getExportResult();
				if ($scope.image_path) $scope.image_name = $scope.image_path.split("/")[-1];
				if ($scope.image_path && !exportStatus.getExportErr()){ 
					$scope.message = "Task complete!";
				}
			});

		}])
		.controller('popupCtrl', ['$scope', '$interval', 'popupMenuService', function($scope, $interval, popupMenuService){
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
				$scope.showShapeDialog = popupMenuService.ShapeDialogVisible;
				$scope.showGlobalGenome = popupMenuService.GlobalGenomeVisible;
				$scope.showGlobalGene = popupMenuService.GlobalGeneVisible;
				$scope.showGeneCPDialog = popupMenuService.GeneCPDialogVisible;
				
				$( "#popupbox" ).draggable();
				
				if($scope.showExportPanel == true || 
						$scope.showGBSelect == true || 
						$scope.showGraphSizeDialog == true || 
						$scope.showLaneDialog == true ||
						$scope.showScaleDialog == true ||
						$scope.showShapeDialog == true ||
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
					case 'shapeDialog':
						popupMenuService.updateShapeDialog(true);
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
				popupMenuService.updateShapeDialog(false);
				popupMenuService.updateGlobalGenome(false);
				popupMenuService.updateGlobalGene(false);
				popupMenuService.updateGeneCPDialog(false);
				return;
			};

		}])
		.controller('gbAutoCompCtrl', ['$scope', '$http', 'popupMenuService', function($scope, $http, popupMenuService){

			$scope.genomesList = []
			
			$scope.createData = function(){
				var url = '/genegraphics/static/data/genomes/genomes.ids';
				$http.get(url).then(function parseData(response){
					if(response.status == 200) {
						var lines = response.data.match(/[^\r\n]+/g);
						for (var row=0; row<lines.length; row++){
							var columns = lines[row].split('\t');
							var taxonomy = columns[0];
							var refseq_id = columns[1];
							var gb_id = columns[4];
							var organism = columns[5]
							if(columns.length == 7){
								organism = organism + " " + columns[6];
							}
							$scope.genomesList.push({gbid:gb_id, refseqid:refseq_id, organism:organism, display:organism + " " + gb_id + " " + refseq_id});
						}
						//console.log('building complete');
					}
				}, function errorCallback(response){
					console.log(response.statusText);
				});
			};
			
			$scope.querySearch = function querySearch (query) {
				var results = query ? $scope.genomesList.filter( createFilterFor(query) ) : $scope.genomesList,
						deferred;
				return results;
			}
			
			function createFilterFor(query) {
				var lowercaseQuery = angular.lowercase(query);

				return function filterFn(genome) {
					return (genome.display.toLowerCase().indexOf(lowercaseQuery) >= 0);
				};
			}

			$scope.createData();
			
		}])
}());
