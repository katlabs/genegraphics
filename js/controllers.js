(function () {
'use strict';

	angular.module('geneGraphApp.controllers')
		.controller('graphCtrl', ['$scope', 'geneService', 'colorService', 'd3', function($scope,
		geneService, colorService, d3) {
			
			// Set up graph container size
			document.getElementById("graphcontainer").style.height = window.innerHeight - 200 + "px";
			//console.log(document.getElementById("graphcontainer").style.height);
			
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
			$scope.graphSettings.labelPosOptions = [
				{value:'above', name:"Above"},
				{value:'middle', name:"Middle"},
				{value:'below', name:"Below"}
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
				if( x + $scope.minMenuSize > window.innerWidth)
				{
					x = window.innerWidth - $scope.minMenuSize - 30;
				}
				$("#geneMenu").css("left", x);
				$("#geneMenu").css("top", y);
				//console.log("menuVisible = true");
				$scope.menuVisible = true;
				console.log("index = " + index);
				$scope.selectedGenome = -1;
				$scope.selectedGene = parseInt(index);
				$scope.$apply();
			};
			$scope.selectGenome = function(genomeindex, wordindex, x, y){
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
			//geneMenu Events
			$(window).click(function() {
				$scope.menuVisible = false;
				$scope.$apply();
			});
				
			$('#geneMenu').click(function(event){
				event.stopPropagation();
			});
			
		}])
		.controller('tabsCtrl', ['$scope', function($scope) {
			$scope.tabs = [
				{title: 'Description', content:'views/description.html'},
				{title: 'Gene Graphics App', content:'views/app.html'},
				{title: 'Documentation', content:'views/doc.html'},
				{title: 'Tutorials', content:'views/tutorials.html'}
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
					var headerpos = {genome:null, currLane:null, labelcolor:null, labelcolorchanged:null, labelhidden:null, genehidden:null, labelpos:null, labelposchanged:null, labelsize:null, labelstyle:null, labelstylechanged:null, name:null, genefunction:null, color:null, size:null, start:null, stop:null, strand:null};
					$scope.maxVertOff = geneService.maxVertOff;
					for(var i = 0; i < headercols.length; i++){
						//console.log(i);
						var currHeaderCol = headercols[i].toLowerCase().replace(/ /g, '');
						//console.log(currHeaderCol);
						if (currHeaderCol === 'genome'){
							headerpos.genome = i;
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
								else if (key === 'keepgaps' || key === 'multilane' || key === 'shiftgenes' || key === 'scaleOn'){
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
							var gene = {genome:null, genomehidden:false, start:null, stop:null, size:null, strand:null, name:null, genefunction:null, color:null, labelcolor:null, labelstyle:'normal', labelhidden:false, genehidden:false,  labelcolorchanged:false, labelstylechanged:false, labelpos:{x:null, y:null}, labelposchanged:false};
							var columns = lines[i].split('\t');
							
							var genome = columns[headerpos['genome']];
							for (var key in gene) {
								if(!offset.hasOwnProperty(genome)) {
								 //console.log("--" + genome + " - " + $scope.maxVertOff);
								 vertOff[genome] = $scope.maxVertOff;
								 $scope.maxVertOff+=2;
								 offset[genome] = Math.min(parseInt(columns[headerpos['start']]), parseInt(columns[headerpos['stop']]));
								}
								if ((key === 'name' || key === 'genefunction' || key === 'strand' || key === 'color' || key === 'labelcolor' || key === 'labelstyle' || key === 'genome') && headerpos[key] !== null){
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
									var genome = organism
									var genomestyles = [];
									
									var gene = {currLane:$scope.maxVertOff, genome:genome, genomehidden:false, start:startPos, stop:endPos, size:Math.abs(startPos-endPos), strand:strand, name:genename.slice(1, genename.length-1), genefunction:product.slice(1, product.length-1), color:null, labelcolor:null, labelstyle:'normal', labelhidden:false, genehidden:false, labelcolorchanged:false, labelstylechanged:false, labelpos:{x:null, y:null}, labelposchanged:false};
									
									gene["color"] = colorService.getHashColor(gene['genefunction']);
									gene["labelcolor"] = colorService.getTextColor(gene['color']);
									
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
					console.log("scrolling...");
					var graphContainer = document.getElementById("graphcontainer");
					graphContainer.scrollTop = graphContainer.scrollHeight;
				}
				else if ($scope.filetype[0] === 'gb' || $scope.filetype[0] === 'gff' || $scope.filetype[0] === 'gbk'){
					console.log("Match genbank");
					$scope.parseGB(lines);
				}
				else {
					console.log("Error, not a known filetype");
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
			
			$scope.tutorialFile = function(url, ftype){
				$http({
					method: 'GET',
					url: url
				}).then(function sucessCallBack(response) {
						console.log(response.data);
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
					console.log("cleared");
				}
				else {
					return;
				}
			};

		}]) 
}());
