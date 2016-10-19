(function () {
'use strict';

	angular.module('geneGraphApp.controllers')
		.controller('graphCtrl', ['$scope', 'geneService', 'colorService', 'd3', function($scope,
		geneService, colorService, d3) {
			
			// Set up graph container size
			document.getElementById("graphcontainer").style.height = window.innerHeight - 200 + "px";
			//console.log(document.getElementById("graphcontainer").style.height);
			
			// Add some event listeners
			document.addEventListener("click", function(e) {
				$scope.$broadcast("documentClicked", e.target);
			});
			document.getElementById("graphcontainer").addEventListener("click", function(e) {
				$scope.$broadcast("graphClicked", e.target);
			});
			
			
			$scope.keepMenu = false;
			$scope.menuVisible = false;
			$scope.graphSettings = {};
			$scope.graphSettings.graphwidth = document.getElementById('graphcontainer').offsetWidth - 20;
			$scope.graphSettings.graphwidthoriginal = document.getElementById('graphcontainer').offsetWidth - 20;
			$scope.graphSettings.graphwidthpercent = 100;
			$scope.graphSettings.maxwidth = 0;
			$scope.graphSettings.featureheight = 50;
			$scope.graphSettings.fontFamily = 'Arial, Helvetica, sans-serif';
			$scope.graphSettings.fontFamilyOptions = [
				{value:"Arial, Helvetica, sans-serif", name:"Arial"},
				{value:"'Arial Black', Gadget, sans-serif", name:"Arial Black"},
				{value:"'Comic Sans MS', cursive, sans-serif", name:"Comic Sans MS"},
				{value:"'Courier New', Courier, monospace", name:"Courier New"},
				{value:"Georgia, serif", name:"Georgia"},
				{value:"Impact, Charcoal, sans-serif", name:"Impact"},
				{value:"'Lucida Console', Monaco, monospace", name:"Lucida Console"},
				{value:"Tahoma, Geneva, sans-serif", name:"Tahoma"},
				{value:"'Times New Roman', Times, serif", name:"Times New Roman"},
				{value:"'Trebuchet MS', Helvetica, sans-serif", name:"Trebuchet MS"},
				{value:"Verdana, Geneva, sans-serif", name:"Verdana"}
			]
			$scope.graphSettings.fontStyle = 'normal';
			$scope.graphSettings.fontStyleOptions = [
				{value:'normal', name:"Normal"},
				{value:'italic', name:"Italic"},
				{value:'bold', name:"Bold"},
				{value:'bold,italic', name:"Bold/Italic"}
			]
      $scope.graphSettings.fontSize = 18;
      $scope.graphSettings.labelPosition = 'middle';
			$scope.graphSettings.multilane = true;
			$scope.graphSettings.shiftgenes = false;
			$scope.graphSettings.keepgaps = false;
			$scope.graphSettings.scaleOn = true;
			$scope.graphSettings.currLane = 0;
			$scope.graphSettings.displayedFunction = "";
			$scope.graphSettings.currentFilesList = [];
			$scope.graphSettings.addScale = true;
			$scope.geneClipboard = {};
			$scope.showExportPanel = false;
			$scope.closeExportPanel = function(){
				$scope.showExportPanel = false;
			}
			
			
			$scope.geneData = geneService.geneData;
			
			$scope.minMenuSize = 296;
      
			$scope.$on('updateGeneData', function(){
				$scope.geneData = geneService.geneData;
				$scope.graphSettings.maxwidth = geneService.getMaxWidth($scope.geneData);
				$scope.geneData = geneService.hideSmallGeneLabels($scope.geneData,$scope.graphSettings.maxwidth, $scope.graphSettings.graphwidth);
			});
			
			$scope.selectGene = function(index, x, y){
				$scope.$emit('geneClicked');
				if( x + $scope.minMenuSize > window.innerWidth)
				{
					x = window.innerWidth - $scope.minMenuSize - 30;
				}
				$("#geneMenu").css("left", x);
				$("#geneMenu").css("top", y);
				//console.log("menuVisible = true");
				$scope.menuVisible = true;
				$scope.selectedGenome = -1;
				$scope.selectedGene = parseInt(index);
				$scope.$apply();
			};
			$scope.selectGenome = function(genomeindex, wordindex, x, y){
				$scope.$emit('geneClicked');
				$("#geneMenu").css("left", x);
				$("#geneMenu").css("top", y);
				//console.log("menuVisible = true");
				$scope.menuVisible = true;
				$scope.selectedGene = -1;
				$scope.selectedGenome = parseInt(genomeindex);
				$scope.selectedWord = parseInt(wordindex);
        $scope.$apply();
			};
			$scope.changeDisplayedFunction = function(newfunction){
				$scope.graphSettings.displayedFunction = newfunction;
				$scope.$apply();
			};

			$scope.changeGraphWidthPercent = function(newWidth){
				$scope.graphSettings.graphwidth = Math.round((parseInt(newWidth) / 100) * $scope.graphSettings.graphwidthoriginal);
			};
			$scope.changeGraphWidth = function(newWidth){
				$scope.graphSettings.graphwidth = parseInt(newWidth);
			};
			$scope.changeFeatureHeight = function(newHeight){
				$scope.graphSettings.featureheight = parseInt(newHeight);
			};
			$scope.changeLabelColor = function(selectedGene){
				$scope.geneData[selectedGene].labelcolorchanged = true;
			}
			$scope.changeLabelStyle = function(selectedGene){
				$scope.geneData[selectedGene].labelstylechanged = true;
			}
			
			$scope.copyGeneAttrs = function(selectedGene){
				$scope.geneClipboard['color'] = $scope.geneData[selectedGene]['color'];
				$scope.geneClipboard['labelcolor'] = $scope.geneData[selectedGene]['labelcolor'];
			}
			
			$scope.pasteGeneAttrs = function(selectedGene){
				$scope.geneData[selectedGene]['color'] = $scope.geneClipboard['color'];
				$scope.geneData[selectedGene]['labelcolor'] = $scope.geneClipboard['labelcolor'];
			}
			
			$scope.changeDefaultStyle = function(){
				for (var i = 0; i < $scope.geneData.length; i++){
					if ($scope.geneData[i].labelstylechanged === false){
						$scope.geneData[i].labelstyle = $scope.graphSettings.fontStyle;
					}
				}
			}
			
			$scope.clickMultiLane = function(){
				if ($scope.graphSettings.multilane == true){
					$scope.graphSettings.shiftgenes = false;
					$scope.graphSettings.keepgaps = false;
				}
			}
			$scope.clickShiftgenes = function(){
				if ($scope.graphSettings.shiftgenes == false){
					$scope.graphSettings.keepgaps = false;
				}
			}
			$scope.changeAllLabels = function(status) {
				for (var i = 0; i < $scope.geneData.length; i++){
					$scope.geneData[i].labelhidden = status;
				}
			}
			$scope.colorAllLabels = function(color) {
				for (var i = 0; i < $scope.geneData.length; i++){
					$scope.geneData[i].labelcolor = color;
				}
			}
			
			$scope.$watch('graphSettings.labelPosition', function(newVal) {
				if (newVal === 'above' || newVal === 'below') {
					for (var i = 0; i < $scope.geneData.length; i++){
						if ($scope.geneData[i].labelcolorchanged === false && $scope.geneData[i].labelposchanged === false) {
							$scope.geneData[i].labelcolor = "#000000";
						}
					}
				}
				else if (newVal === 'middle') {
					for (var i = 0; i < $scope.geneData.length; i++){
						if ($scope.geneData[i].labelcolorchanged === false && $scope.geneData[i].labelposchanged === false) {
							$scope.geneData[i].labelcolor = colorService.getTextColor($scope.geneData[i].color);
						}
					}
				}
			});
			$scope.close = function() {
				$scope.menuVisible = false;
				$scope.keepMenu = false;
			}
			$scope.$on("menuClicked", function(e) {
				//console.log("ctrl menu clicked");
				$scope.keepMenu = true;
				e.stopPropagation();
			});
			$scope.$on("documentClicked", _docClick);
			
			function _docClick() {
				//console.log("doc Click");
				if (!$scope.keepMenu) {
					//console.log("keepMenu = false");
					if ($scope.menuVisible == true) {
						//console.log("menuVisible = true");
						$scope.keepMenu = false;
						$scope.$apply();
					}
					//console.log("closing menu...");
					$scope.$apply(function(){
						$scope.close();
					});
				}
				else if ($scope.keepMenu) {
					$scope.keepMenu = false;
					return;
				}
				$scope.$apply();
			}
			
		}])
		.controller('tabsCtrl', ['$scope', function($scope) {
			$scope.tabs = [
				{title: 'Description', content:'views/description.html'},
				{title: 'Gene Graphics App', content:'views/app.html'},
				{title: 'Documentation', content:'views/doc.html'},
				{title: 'Tutorial', content:'views/tutorial.html'}
			];
		}])
		.controller("FileCtrl", ['$scope',  '$http', 'geneService', 'colorService', 'popupMenuService', function($scope, $http, geneService, colorService, popupMenuService){
			$scope.data = [];
			console.log("filectrl");
			console.log($scope.data);
			$scope.showPopupMenu = popupMenuService.menuVisible;
			$scope.parseTSV = function(lines){
				
				console.log("parseTSV");
					$scope.data = [];
					var header = lines[0];
					var headercols = header.split('\t');
					var headerpos = {genome:null, genomestyles:null, currLane:null, labelcolor:null, labelcolorchanged:null, labelhidden:null, genehidden:null, labelpos:null, labelposchanged:null, labelsize:null, labelstyle:null, labelstylechanged:null, name:null, genefunction:null, color:null, size:null, start:null, stop:null, strand:null};
					$scope.maxVertOff = geneService.maxVertOff;
					for(var i = 0; i < headercols.length; i++){
						//console.log(i);
						var currHeaderCol = headercols[i].toLowerCase().replace(/ /g, '');
						//console.log(currHeaderCol);
						if (currHeaderCol === 'genome'){
							//console.log(i);
							headerpos.genome = i;
						}
						else if (currHeaderCol === 'genomestyles'){
							headerpos.genomestyles = i;
						}
						else if (currHeaderCol === 'labelcolor'){
							headerpos.labelcolor = i;
						}
						else if (currHeaderCol === 'labelcolorchanged'){
							headerpos.labelcolorchanged = i;
						}
						else if (currHeaderCol === 'labelhidden'){
							headerpos.labelhidden = i;
						}
						else if (currHeaderCol === 'genehidden'){
							headerpos.genehidden = i;
						}
						else if (currHeaderCol === 'labelpos'){
							headerpos.labelpos = i;
						}
						else if (currHeaderCol === 'labelposchanged'){
							headerpos.labelposchanged = i;
						}
						else if (currHeaderCol === 'labelsize'){
							headerpos.labelsize = i;
						}
						else if (currHeaderCol === 'labelstyle'){
							headerpos.labelstyle = i;
						}
						else if (currHeaderCol === 'labelstylechanged'){
							headerpos.labelstylechanged = i;
						}
						else if (currHeaderCol === 'name' || currHeaderCol === "genename"){
							headerpos.name = i;
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
							console.log("settings:");
							var newsettings = JSON.parse(lines[i].slice(14));
							for (var key in newsettings){
								if (key === 'graphwidth' || key === 'featureheight' || key === 'fontSize'){
									$scope.graphSettings[key] = parseFloat(newsettings[key]);
								}
								else if (key === 'fontFamily' || key === 'fontStyle' || key === 'labelPosition'){
									$scope.graphSettings[key] = newsettings[key];
								}
								else if (key === 'keepgaps' || key === 'multilane' || key === 'shiftgenes'){
									if (newsettings[key].toLowerCase() === "true"){
										$scope.graphSettings[key] = true;
									}
									else {
										$scope.graphSettings[key] = false;
									}
								}
							}
							console.log($scope.graphSettings);
						}
						else {
							var gene = {genome:null, genomestyles:null, genomehidden:false, start:null, stop:null, size:null, strand:null, name:null, genefunction:null, color:null, labelcolor:null, labelstyle:'normal', labelhidden:false, genehidden:false,  labelcolorchanged:false, labelstylechanged:false, labelpos:{x:null, y:null}, labelposchanged:false};
							var columns = lines[i].split('\t');
							
							var genome = columns[headerpos['genome']].split(" ");
							var genomestyles = [];
							gene['genome'] = genome;
							for (var j = 0; j < genome.length; j++){
								genomestyles.push("italic");
							}
							//console.log(gene['genome']);
							for (var key in gene) {
								if(!offset.hasOwnProperty(genome)) {
								 //console.log("--" + genome + " - " + $scope.maxVertOff);
								 vertOff[genome] = $scope.maxVertOff;
								 $scope.maxVertOff+=2;
								 offset[genome] = Math.min(parseInt(columns[headerpos['start']]), parseInt(columns[headerpos['stop']]));
								}
								if ((key === 'name' || key === 'genefunction' || key === 'strand' || key === 'color' || key === 'labelcolor' || key === 'labelstyle') && headerpos[key] !== null){
									gene[key] = columns[headerpos[key]];
								}
								if ((key === 'labelhidden' || key === 'genehidden' || key === 'labelcolorchanged' || key === 'labelstylechanged' || key === 'labelposchanged') && headerpos[key] !== null){
									if (columns[headerpos[key]].toLowerCase() === "true"){
										gene[key] = true;
									}
								}
								if (key === 'labelpos' && headerpos[key] !== null){
									var getpositions = columns[headerpos[key]].split(",");
									gene[key].x = parseFloat(getpositions[0]);
									gene[key].y = parseFloat(getpositions[1]);
								}
								if (key === 'genomestyles' && headerpos[key] !== null){
									console.log(columns);
									genomestyles = columns[headerpos[key]].split(" ");
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
								else if(key === 'genefunction' && headerpos[key] === null){
									gene[key] = ""
								}
								else if(key === 'color' && headerpos[key] === null){
									//gene[key] = colorService.getRandomColor();
									gene[key] = colorService.getHashColor(gene['genefunction']);
								}
								else if(key === 'labelcolor' && headerpos[key] === null){
									gene[key] = colorService.getTextColor(gene['color']);
								}
								gene['currLane']=vertOff[genome];
							}
							gene["genomestyles"] = genomestyles;
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
							console.log(organism);
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
											//console.log("Testing line..\n");
											var matches = lines[k].trim().match(/\/([\w|\W]*)=([\w|\W]*)/);
											
											//console.log("  " + matches[0]);
											
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
									var genome = organism.split(" ");
									var genomestyles = [];
									
									var gene = {currLane:$scope.maxVertOff, genome:genome, genomehidden:false, genomestyles:null, start:startPos, stop:endPos, size:Math.abs(startPos-endPos), strand:strand, name:genename.slice(1, genename.length-1), genefunction:product.slice(1, product.length-1), color:null, labelcolor:null, labelstyle:'normal', labelhidden:false, genehidden:false, labelcolorchanged:false, labelstylechanged:false, labelpos:{x:null, y:null}, labelposchanged:false};
									
									for (var j = 0; j < genome.length; j++){
										genomestyles.push("italic");
									}
									
									gene["color"] = colorService.getHashColor(gene['genefunction']);
									gene["labelcolor"] = colorService.getTextColor(gene['color']);
									
									gene["genomestyles"] = genomestyles;
									
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
				console.log($scope.filetype);
				var lines = $scope.content.match(/[^\r\n]+/g);
				// Create a vertical genome offset
				if ($scope.filetype[0] === 'tsv'){
					console.log("Match tsv");
					$scope.parseTSV(lines);
				}
				else if ($scope.filetype[0] === 'gb' || $scope.filetype[0] === 'gff' || $scope.filetype[0] === 'gbk'){
					console.log("Match genbank");
					$scope.parseGB(lines);
				}
				
			}
			
			$scope.$on('updateGeneData', function(){
        $scope.data = geneService.geneData;
      })
			
			$scope.$on('updateMenuStatus', function(){
				$scope.showPopupMenu = popupMenuService.menuVisible;
			});
			$scope.openPopup = function(){
				popupMenuService.updateMenuStatus(true);
			}
			$scope.closePopup = function(err){
				popupMenuService.updateMenuStatus(false);
				if (err == -1) {
					return;
				}
				else if (err == 0) {
					return;
				}
			}
			
			$scope.genbankID;
			$scope.seqRange = "whole";
			$scope.seqRangeStart;
			$scope.seqRangeEnd;
			$scope.statusMessage = "";
			var baseURL;
			
			$scope.submitNCBIQuery = function(){
				$scope.statusMessage = "Loading file...";
				if(!$scope.genbankID){
					$scope.statusMessage = "Please enter a genbank ID.";
					return;
				}
				if ($scope.seqRange == "whole") {
					baseURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=gb&id=";
				}
				else if ($scope.seqRange == "custom") {
					if(!($scope.seqRangeStart < $scope.seqRangeEnd)){
						$scope.statusMessage = "Please enter a valid custom range.";
						return;
					}
					baseURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=gb&seq_start=" 
					+ $scope.seqRangeStart + 
					"&seq_stop=" 
					+ $scope.seqRangeEnd + 
					"&id=";
				}
				$http.get(baseURL + $scope.genbankID).then(function parsePage(response) {
					if(response.status == 200) {
						var lines = response.data.match(/[^\r\n]+/g);
						if(lines[0].substr(0,5)!="LOCUS") {
							$scope.statusMessage = "Invalid file format retrieved!";
							return;
						} 
						else if (response.data.length > 500000) {
							$scope.statusMessage = "File retrieved is too large to display, please select a custom range.";
							return;
						}
						else {
							console.log(response.data.length);
							$scope.statusMessage = "";
							$scope.closePopup(0);
							$scope.graphSettings.currentFilesList.push("NCBI query: " + $scope.genbankID);
							$scope.parseGB(lines);
						}
					}else{
						$scope.statusMessage = response.statusText;
					}
				}, function errorCallback(response) {
					$scope.statusMessage = response.statusText;
				});
			}
			
			$scope.showWebGenomePopup = function(){
				$scope.openPopup();
			};
			
			$scope.clearAllGenomes = function(){
				var ret = confirm("Do you really want to clear all data?");
				if (ret == true){
					geneService.clearGenes();
					$scope.data =[];
					$scope.graphSettings.displayedFunction = "";
					$scope.graphSettings.currentFilesList = [];
					console.log("cleared");
				}
				else {
					return;
				}
			};

		}])
		.controller('tutorialCtrl', function ($scope, $sce) {
			$scope.slides = [];
			$scope.console = console;
			$scope.tutorial1 = [
			{image: 'images/tutorial1/img0.png', description: $sce.trustAsHtml('We will be creating an image similar to part b of this Supplementary Figure 4 from the paper <a href="http://www.nature.com/nchembio/journal/v12/n8/full/nchembio.2108.html">"A family of metal-dependent phosphatases implicated in metabolite damage-control"</a>.')},
			{image: 'images/tutorial1/img1.png', description: $sce.trustAsHtml('Navigate your web browser to <a href="http://pubseed.theseed.org/">http://pubseed.theseed.org/</a>.')},
			{image: 'images/tutorial1/img2.png', description: $sce.trustAsHtml('Use the search box to find "Methanococcus vannieli DUF89". Click the feature link for the first result.')},
			{image: 'images/tutorial1/img3.png', description: $sce.trustAsHtml('On the feature page, scroll down to see the Compare Regions tool.')},
			{image: 'images/tutorial1/img4.png', description: $sce.trustAsHtml('Click on the "Advanced" button in Display options. Edit the Number of Regions to 1000, and then change the Pinned CDS selection option to "PGfams". Then, press the "draw" button.')},
			{image: 'images/tutorial1/img5.png', description: $sce.trustAsHtml('After the Visual Region Information loads with the new settings, click the "uncheck all" button. Then, go through the genomes listed and find the ones that you want to include in the final image. For this tutorial, we need nine genomes. After you have checked them all, click on the "update with selected" button.')},
			{image: 'images/tutorial1/img6.png', description: $sce.trustAsHtml('The result should show just the nine genomes that you selected.')},
			{image: 'images/tutorial1/img7.png', description: $sce.trustAsHtml('We can get rid of some of the extra genes by limiting the Region Size to 6000 bp as shown. Click "draw" to load again.')},
			{image: 'images/tutorial1/img8.png', description: $sce.trustAsHtml('Click on the Tabular Region Information tab, then click on the "export table" button.')},
			{image: 'images/tutorial1/img9.png', description: $sce.trustAsHtml('Open the file you exported in a spreadsheet editor.')},
			{image: 'images/tutorial1/img10.png', description: $sce.trustAsHtml('We can delete the last three columns, since the genegraphics tool does not use them for any purpose. However, it is not a problem to leave the extra columns in the file, the genegraphics tool can still read it.')},
			{image: 'images/tutorial1/img11.png', description: $sce.trustAsHtml('It is easiest to delete any unwanted genes from the file before uploading.')},
			{image: 'images/tutorial1/img12.png', description: $sce.trustAsHtml('The result should look like this.')},
			{image: 'images/tutorial1/img13.png', description: $sce.trustAsHtml('Edit the genome names in the file by using the "Replace All" function.')},
			{image: 'images/tutorial1/img14.png', description: $sce.trustAsHtml('This is what your file should look like so far.')},
			{image: 'images/tutorial1/img15.png', description: $sce.trustAsHtml('We can also add a column to name some of our genes. These nmes will show up as the gene labels in our image. After you are done editing the file, save it once again as a TSV file (or a TXT file with a TSV extension).')},
			{image: 'images/tutorial1/img16.png', description: $sce.trustAsHtml('Now, upload the file to the genegraphics tool by clicking File, then "Choose a File". A prompt will ask you to choose the file you would like to upload. Select the file you previously saved.')},
			{image: 'images/tutorial1/img17.png', description: $sce.trustAsHtml('Click on Graph Settings, then edit the Image width and the Gene height. These settings determine the width of the final image and the height of the genes, respectively.')},
			{image: 'images/tutorial1/img18.png', description: $sce.trustAsHtml('Uncheck the box that says "Multiple lanes for overlapping genes." This will pull all of the genes onto one lane, even when they overlap.')},
			{image: 'images/tutorial1/img19.png', description: $sce.trustAsHtml('Either right click or double click on genes to bring up options for that gene. Here, you can edit the name of the gene and its colors. Change the first DUF89 gene color to red, and change its label color to white. Then select "Copy Gene Colors". This will copy the color settings so that you can paste them to other genes.')},
			{image: 'images/tutorial1/img20.png', description: $sce.trustAsHtml('Right click or double click on the other DUF89 genes and select "Paste Gene Colors" in order to transfer the same colors to the other DUF89 genes.')},
			{image: 'images/tutorial1/img21.png', description: $sce.trustAsHtml('Follow the same procedures to change all of the purine synthesis genes to the same color. Then, change all of the other genes whose functions are not relevent to white.')},
			{image: 'images/tutorial1/img22.png', description: $sce.trustAsHtml('Click on Label Settings, then choose Font Style and select Italic in order to italicize all of the gene labels.')},
			{image: 'images/tutorial1/img23.png', description: $sce.trustAsHtml('We neglected some gene names in our file, but we can edit the names of the rest of the genes by right clicking or double clicking on the gene.')},
			{image: 'images/tutorial1/img24.png', description: $sce.trustAsHtml('You can toggle the scale on and off by clicking Graph Settings and checking or unchecking Scale on. For this image, turn the scale off.')},
			{image: 'images/tutorial1/img25.png', description: $sce.trustAsHtml('Click on the Export button and you will see a pop-up with the export links. Follow the instructions on the pop-up based on your operating system to save the PNG file.')},
			{image: 'images/tutorial1/img26.png', description: $sce.trustAsHtml('Your final image should look like this. You have finished this tutorial!')}
			];
			$scope.currentIndex=0;
			
			$scope.setCurrentSlideIndex = function(index) {
				$scope.currentIndex = index;
			};
			
			$scope.isCurrentSlideIndex = function(index) {
				return $scope.currentIndex == index;
			};
			
			$scope.prevSlide = function(){
				$scope.currentIndex = ($scope.currentIndex < $scope.slides.length - 1) ? ++$scope.currentIndex : 0;
			};
			
			$scope.nextSlide = function() {
				$scope.currentIndex = ($scope.currentIndex > 0) ? --$scope.currentIndex : $scope.slides.length -1;
			};
			
		});

}());
