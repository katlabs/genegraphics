(function () {
'use strict';

	angular.module('geneGraphApp.controllers')
		.controller('graphCtrl', ['$scope', 'geneService', 'colorService', function($scope,
		geneService, colorService) {
			
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
			$scope.graphSettings.currLane = 0;
			$scope.graphSettings.lastFile = "No File Chosen";
			$scope.graphSettings.displayedFunction = "";
      
			$scope.geneData = geneService.geneData;
      
			$scope.$on('updateGeneData', function(){
				$scope.geneData = geneService.geneData;
				$scope.graphSettings.maxwidth = geneService.getMaxWidth($scope.geneData);
				$scope.geneData = geneService.hideSmallGeneLabels($scope.geneData,$scope.graphSettings.maxwidth, $scope.graphSettings.graphwidth);
			});
			
			
			$scope.selectGene = function(index, x, y){
				$scope.$emit('geneClicked');
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
				console.log($scope.graphSettings.displayedFunction);
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
		.controller("FileCtrl", ['$scope',  '$http', 'geneService', 'colorService', function($scope, $http, geneService, colorService){
			
			$scope.parseTSV = function(lines){
					var header = lines[0];
					var headercols = header.split('\t');
					var headerpos = {genome:null, genomestyles:null, currLane:null, labelcolor:null, labelcolorchanged:null, labelhidden:null, labelpos:null, labelposchanged:null, labelsize:null, labelstyle:null, labelstylechanged:null, name:null, genefunction:null, color:null, size:null, start:null, stop:null, strand:null};
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
					$scope.data = [];
					var offset = {};
					var vertOff = {};
					var maxVertOff = 0; // A counter to keep track of how many offets we'd made
					
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
							var gene = {genome:null, genomestyles:null, start:null, stop:null, size:null, strand:null, name:null, genefunction:null, color:null, labelcolor:null, labelstyle:'normal', labelhidden:false,  labelcolorchanged:false, labelstylechanged:false, labelpos:{x:null, y:null}, labelposchanged:false};
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
								 //console.log("--" + genome + " - " + maxVertOff);
								 vertOff[genome] = maxVertOff;
								 maxVertOff+=2;
								 offset[genome] = Math.min(parseInt(columns[headerpos['start']]), parseInt(columns[headerpos['stop']]));
								}
								if ((key === 'name' || key === 'genefunction' || key === 'strand' || key === 'color' || key === 'labelcolor' || key === 'labelstyle') && headerpos[key] !== null){
									gene[key] = columns[headerpos[key]];
								}
								if ((key === 'labelhidden' || key === 'labelcolorchanged' || key === 'labelstylechanged' || key === 'labelposchanged') && headerpos[key] !== null){
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
									gene[key] = colorService.getRandomColor();
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
					geneService.updateGene($scope.data);
				}
				
			$scope.parseGB = function(lines) {
					$scope.data = [];
					var organism = "";
					var i = 0;
					var j;
					var k;
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
										
											if (matches[1] == "locus_tag"){
												locus_tag = matches[2];
											}
											else if (matches[1] == "gene"){
												genename = matches[2];
											}
											else if (matches[1] == "protein_id"){
												protein_id = matches[2];
											}
											else if (matches[1] == "product"){
												product = matches[2];
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
									
									var gene = {currLane:0, genome:genome, genomestyles:null, start:startPos, stop:endPos, size:Math.abs(startPos-endPos), strand:strand, name:genename.slice(1, genename.length-1), genefunction:product.slice(1, genename.length-1), color:null, labelcolor:null, labelstyle:'normal', labelhidden:false,  labelcolorchanged:false, labelstylechanged:false, labelpos:{x:null, y:null}, labelposchanged:false};
									
									for (var j = 0; j < genome.length; j++){
										genomestyles.push("italic");
									}
									
									gene["color"] = colorService.getRandomColor();
									gene["labelcolor"] = colorService.getTextColor(gene['color']);
									
									gene["genomestyles"] = genomestyles;
									
									console.log(gene);
									
									$scope.data.push(gene);
									
									j = k;
								}
								j = j+1;
							}
							i = j;
						}
						i = i+1;
					}
					geneService.updateGene($scope.data);
				}
				
			
			$scope.parseFile = function($fileContent, $fileType){
				$scope.content = $fileContent;
				$scope.filetype = $fileType;
				$scope.graphSettings.lastFile = $fileType.input;
				console.log($scope.graphSettings.lastFile);
				console.log($scope.filetype);
				var lines = $scope.content.match(/[^\r\n]+/g);
				// Create a vertical genome offset
				if ($scope.filetype[0] === 'tsv'){
					console.log("Match tsv");
					$scope.parseTSV(lines);
				}
				else if ($scope.filetype[0] = 'gb'){
					console.log("Match genbank");
					$scope.parseGB(lines);
				}
				

			}
			
			$scope.getWebGenome = function(){
				var genbank = prompt("Enter genbank ID...");
				
				if(!genbank) { return; }
				
				var baseURL = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&rettype=gb&seq_start=1&seq_stop=8000&id=";
				
				console.log(baseURL+genbank);
				$http.get(baseURL + genbank).then(function parsePage(response) {
					if(response.status == 200) {
						var lines = response.data.match(/[^\r\n]+/g);
						if(lines[0].substr(0,5)!="LOCUS") {
							alert("Invalid file format retrieved!");
						} else {
							$scope.parseGB(lines);
						}						
					}else{
						alert(response.statusText);
					}
				}, function errorCallback(response) {
					alert(response.statusText);
				});
			};
				
					
			
		}])


}());
