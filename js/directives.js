(function () {
	'use strict';

	angular.module('geneGraphApp.directives')
		.directive('updateOnEnter', function() {
			return {
				restrict: 'A',
				require: 'ngModel',
				link: function(scope, element, attrs, ctrl) {
					element.on("keyup", function(ev) {
						if (ev.keyCode == 13) {
							ctrl.$commitViewValue();
							scope.$apply(ctrl.$setTouched);
						}
					});
				}
			}
		})
		.directive('d3Genes', ['d3','popupMenuService', 'geneService', function(d3, popupMenuService, geneService) {
			return {
				restrict: 'EA',
				scope: {
					data: "=",
					genomes: "=genomes",
					settings: "=settings",
					copy: "=copy",
					onClick: "&onClick",
					onClickPaste: "&onClickPaste",
					onClickGenome: "&onClickGenome",
					onMouseOverGene: "&onMouseOverGene"
				},
				link: function(scope, iElement, iAttrs) {
					var maxGeneFontSize;
					var maxGenomeFontSize;
					
					// select the svg element and set its width
					var svg = d3.select(iElement[0])
						.append("svg")
						.attr("xmlns", "http://www.w3.org/2000/svg")
						.attr("width", scope.settings.graphwidth)
						.attr("id", "svg");
					// maximum width of the data
					var maxwidth = 0;
					var rennum = 1;
					var rerender = true;

					/*
					scope.$watch(function(){
						return angular.element(window)[0].innerWidth;
					}, 
						function(){
							scope.genomes = geneService.genomesHash;
							return scope.render(scope.data);
						}
					);*/
					
					// get max font sizes
					var maxFontSizes = function(gdata){
						maxGeneFontSize = 0;
						maxGenomeFontSize = 0;
						for (var i=0; i < gdata.length; i++){
							var genehtml = gdata[i]['namehtml'];
							var re = /font-size:\s(\d+)pt;/g
							var match = re.exec(genehtml)
							while (match != null){
								if (parseInt(match[1]) > maxGeneFontSize){
									maxGeneFontSize = parseInt(match[1]);
								}
								match = re.exec(genehtml);
							}
							
							var genomehtml = gdata[i]['genomehtml'];
							var match = re.exec(genomehtml);
							while (match != null){
								if (parseInt(match[1]) > maxGenomeFontSize){
									maxGenomeFontSize = parseInt(match[1]);
								}
								match = re.exec(genomehtml);
							}
						}
						if (maxGeneFontSize==0){maxGeneFontSize=12};
						if (maxGenomeFontSize==0){maxGenomeFontSize=12};
					}

					maxFontSizes(scope.data);
					
					// re-render when there is a change in the data
					scope.$watch('data', function(newVals, oldVals) {
						scope.settings.maxwidth = geneService.getMaxWidth(newVals);
						geneService.updateGenomesHash(newVals);
						geneService.updateGeneNames();
						maxFontSizes(newVals);
						scope.genomes = geneService.genomesHash;
						return scope.render(newVals);
					}, true);

					scope.$watch('copy.geneClipboard', function(newVal, oldVal) {
						if (newVal != oldVal){
							return scope.render(scope.data);
						}
					}, true);
					
					scope.$watch('settings', function(newVal, oldVal) {
						if (newVal != oldVal){
							return scope.render(scope.data);
						}
					}, true);

					scope.$on('updateMenuStatus', function(){
						if (!popupMenuService.GeneMenuVisible){
							scope.render(scope.data);
							return;
						}
					});
					
					// re-render when the graph width or gene height sliders are moved
					scope.$watchGroup(['settings.graphwidth', 'settings.featureheight'], function(newVals, oldVals, scope) {
							scope.settings.maxwidth = geneService.getMaxWidth(scope.data);
							svg.attr("width", scope.settings.graphwidth);
							return scope.render(scope.data);
					});

					scope.render = function(data){
						
						//console.log("render " + rennum);
						//rennum = rennum + 1;
						
						svg.selectAll("*").remove();
						
						// do nothing if there is no data
						if (data.length <= 0) {
							return;
						}
						
						var lanewidth = parseInt(scope.settings.graphwidth) - 20;
						var featureheight = parseInt(scope.settings.featureheight);
						var maxwidth = scope.settings.maxwidth;
						var multilane = scope.settings.multilane;
						var shiftgenes = scope.settings.shiftgenes;
						var keepgaps = scope.settings.keepgaps;
						
						var currLane = 1;
						var lastLaneOffset = -1;
						var globalMaxY = 0;
						
						var getGeneFontSize = function(d, i){
							var result = 0;
							var genehtml = d.namehtml;
							var re = /font-size:\s(\d+)pt;/g
							var match = re.exec(genehtml)
							while (match != null){
								if (parseInt(match[1]) > result){
									result = parseInt(match[1]);
								}
								match = re.exec(genehtml);
							}
							if (result==0){result=12};
							return result;
						}
						
						var getGenomeFontSize = function(d, i){
							var result = 0;
							var genomehtml = d.genomehtml;
							var re = /font-size:\s(\d+)pt;/g
							var match = re.exec(genomehtml)
							while (match != null){
								if (parseInt(match[1]) > result){
									result = parseInt(match[1]);
								}
								match = re.exec(genomehtml);
							}
							if (result==0){result=12};
							return result;
						}
						
						var genomeBuffer = (maxGenomeFontSize + (maxGenomeFontSize/4));
						var geneBuffer = (maxGeneFontSize + (maxGeneFontSize/4));
						var scaleBuffer = 40;
						var whichLane = function(d, i) {;
						// Function to determine the first y position of the feature
							var laneOffset = d.currLane;
							if(i==0){
								lastLaneOffset = -1;
							}
							if (multilane == true){
								if (lastLaneOffset != laneOffset) {
									currLane = 1;
								}
								else if (Math.max(data[i-1].stop, data[i-1].start) > Math.min(data[i].stop, data[i].start)){
									if (currLane == 2)
										currLane -= 1;
									if (currLane == 1)
										currLane += 1;
								}
								else if( currLane > 1 ) {
									currLane -= 1;
								}
								lastLaneOffset = laneOffset;
								if (scope.settings.scaleOn == false){
									return 10 + (genomeBuffer + geneBuffer + (featureheight*(currLane-1)) + (geneBuffer + (maxGeneFontSize/4))*(currLane-1))+(laneOffset*(featureheight+geneBuffer+genomeBuffer+(maxGeneFontSize/4)));
								}
								return scaleBuffer + (genomeBuffer + geneBuffer + (featureheight*(currLane-1)) + (geneBuffer + (maxGeneFontSize/4))*(currLane-1))+(laneOffset*(featureheight+geneBuffer+genomeBuffer+(maxGeneFontSize/4)));
							}
							else {
								if (scope.settings.scaleOn == false){
									return 10 + (genomeBuffer + geneBuffer + (featureheight*(currLane-1)) + geneBuffer*(currLane-1))+(laneOffset*(geneBuffer+genomeBuffer)*1.4);
								}
								return scaleBuffer + (genomeBuffer + geneBuffer + (featureheight*(currLane-1)) + geneBuffer*(currLane-1))+(laneOffset*(geneBuffer+genomeBuffer)*1.4);
							}
						}
						var prevend = 0;
						
						
						var getFeatureStart = function(d, i) {
							if (shiftgenes == true && keepgaps == false) {
								if((i>0) && (scope.data[i].currLane !== scope.data[i-1].currLane)){
										//console.log(data[i].currLane);
										prevend = 0;
								}
								return prevend + 1;
							}
							else if (shiftgenes == true && keepgaps == true) {
								if((i>0) && (scope.data[i].currLane !== scope.data[i-1].currLane)){
										//console.log(data[i].currLane);
										prevend = 0;
								}
								if (i < 1 || (scope.data[i].currLane !== scope.data[i-1].currLane)){
									var gap = 0;
								}
								else {
									var gap = ((Math.min(d.start, d.stop) - Math.max(scope.data[i-1].start, scope.data[i-1].stop))/maxwidth) * lanewidth;
								}
								return prevend + 1 + gap;
							}
							else {
								return (Math.min(d.start, d.stop) / maxwidth) * lanewidth;
							}
						}
						
						var getFeatureEnd = function(d, i) {
							if (shiftgenes == true && keepgaps == false) {
								if((i>0) && (scope.data[i].currLane !== scope.data[i-1].currLane)){
										//console.log(data[i].currLane);
										prevend = 0;
								}
								return prevend + 1 + ((d.size / maxwidth) * lanewidth);
							}
							else if (shiftgenes == true && keepgaps == true) {
								if((i>0) && (scope.data[i].currLane !== scope.data[i-1].currLane)){
										//console.log(data[i].currLane);
										prevend = 0;
								}
								if (i < 1 || (scope.data[i].currLane !== scope.data[i-1].currLane)){
									var gap = 0;
								}
								else
									var gap = ((Math.min(d.start, d.stop) - Math.max(scope.data[i-1].start, scope.data[i-1].stop))/maxwidth) * lanewidth;
								//console.log("gap: " + gap);
								return prevend + 1 + gap + ((d.size / maxwidth) * lanewidth);
							}
							else {
								return (Math.max(d.start, d.stop) / maxwidth) * lanewidth;
							}
						}
						
						var getYPath = function(d, i){
							var lane = whichLane(d, i);
							var result = lane;
							return result;
						}
						
						var getYGeneLabel = function(d, i, y1){
							if (d.labelvertpos == "top"){
								return y1 - (getGeneFontSize(d,i)/3.5);
							}
							else if (d.labelvertpos == "middle"){
								return y1 + (featureheight/2) + (getGeneFontSize(d,i)/2);
							}
							else if (d.labelvertpos == "bottom"){
								return y1 + featureheight + (getGeneFontSize(d,i)) + (getGeneFontSize(d,i)/5);
							}
						}
						

						var getXGeneLabel = function(leftx, rightx, d, i){
							var html = d.namehtml;
							var re = /<p style=\"text-align:\s?(left|center|right);"/g;
							var match = re.exec(html);
							if (match == null){
								return leftx + 3;
							}
							else if (match[1] == 'left'){
								return leftx + 3;
							}
							else if (match[1] == 'center'){
								return (rightx + leftx)/2;
							}
							else if (match[1] == 'right'){
								return rightx - 3;
							}
							else{
								console.log('No horizontal text alignment found.');
							}
						}

						var getXGenomeLabel = function(d, i){
							var html = d.genomehtml;
							var re = /<p style=\"text-align:\s?(left|center|right);"/g;
							var match = re.exec(html);
							if (match == null) {
								return 10;
							}
							else if (match[1] == 'left'){
								return 10;
							}
							else if (match[1] == 'center'){
								return (lanewidth/2);
							}
							else if (match[1] == 'right'){
								return lanewidth;
							}
							else { 
								console.log('No horizontal text alignment found.');
							}
							return;
						}

						var getYGenomeLabel = function(d, i){
							var lane = whichLane(d, i);
							var result = lane - maxGeneFontSize - maxGeneFontSize/4 - maxGenomeFontSize/4;
							return result;
						}
						
						var lineFunction = d3.svg.line()
							.x(function(d) { return d.x; })
							.y(function(d) { return d.y; })
							.interpolate("linear");
															
						if (scope.settings.scaleOn == true){
							var scaleLinePoints = function(){
								var bigX = (((1000 / maxwidth) * lanewidth) + 10).toString();
								var string = "10,10,10,25,"
								string += bigX;
								string += ",25,"
								string += bigX;
								string += ",10"
								return string;
							}

							svg.append("polyline")
								.attr("fill", "none")
								.attr("stroke", "black")
								.attr("stroke-width", 2)
								.attr("points", scaleLinePoints());
								
							svg.append("text")
								.attr("x", 10)
								.attr("y", 35)
								.text("Scale: 1kB")
								.attr("font-family", function(){return scope.settings.fontFamily;})
								.attr("font-size", "10px")
								.attr("fill", "black")
								.attr("font-style", "italic")
								.attr("text-anchor", "start")
							}
							
						//create the arrow for genes
						svg.selectAll("path")
							.data(scope.data)
							.enter()
								.append("path")
								.on("mouseover", function(d, i){ return scope.onMouseOverGene({newfunction:d.genefunction});})
								.on("click", function(d, i){ 
									if(scope.settings.pastingGenes == true){
										return scope.onClickPaste({index: i});
									}
									else {
										return scope.onClick({index: i, x: d3.event.clientX, y: d3.event.clientY});
									} 
								})
								.attr("d", function(d, i) {
									// get start and stop positions relative to max size
									if (d.strand === '+')
										var x1 = getFeatureStart(d, i) + 10;
									else if (d.strand === '-')
										var x1 = getFeatureEnd(d, i) + 10;
									var y1 = getYPath(d, i);
									if (d.strand === '+')
										var x3 = getFeatureEnd(d, i) + 10;
									else if (d.strand === '-')
										var x3 = getFeatureStart(d, i) + 10;
									prevend = Math.max(x1, x3);
									var y3 = y1+(featureheight)/2;
									var x2 = ((x3 - x1) * 0.8) + x1;
									var y2 = y1;
									var x4 = x2;
									var y4 = y1+featureheight;
									var x5 = x1;
									var y5 = y4;


									if (x1 > scope.settings.graphwidth) {
										svg.attr("width", x1);
									}
									if (x3 > scope.settings.graphwidth) {
										svg.attr("width", x3);
									}

									if(y4 > globalMaxY) { globalMaxY = y4 + 50; }
									
									if (d.strand == '-')
										scope.data[i].labelpos.x = getXGeneLabel(x2, x1, d, i);
									else 
										scope.data[i].labelpos.x = getXGeneLabel(x1, x2, d, i);
									
									// Determine y position of label
									scope.data[i].labelpos.y = getYGeneLabel(d, i, y1);
									
									var points = [{"x":x1, "y":y1}, {"x":x2, "y":y2},{"x":x3, "y":y3}, {"x":x4, "y":y4}, {"x":x5, "y":y5}, {"x":x1, "y":y1}];
									return lineFunction(points);
								})
								.attr("fill", function(d, i) {
									if (d.genevisible == false){
										return "transparent";
									}
									else return d.color;
								})
								.attr("stroke", function(d, i) {
									if (d.genevisible == false){
										return "transparent";
									}
									else if(scope.settings.selectedGene == i && (popupMenuService.GeneMenuVisible || popupMenuService.GeneCPDialogVisible)){
										return "blue";
									}
									else if(scope.settings.pastingGenes && (scope.copy.geneClipboard.indexOf(i) != -1)){
										return "red";
									}
									else return "black";
								})
								.attr("stroke-width", function(d,i) { "2"
									if (scope.settings.pastingGenes && (scope.copy.geneClipboard.indexOf(i) != -1)){
										return "4";
									}
									else if(scope.settings.selectedGene == i && (popupMenuService.GeneMenuVisible || popupMenuService.GeneCPDialogVisible)){
										return "4";
									}
										else return "2";
								})
								.attr("z-index", 95)
								
						var prevCurrLane = -1;
						
						
						function isInArray(value, array){
							return array.indexOf(value) > -1;
						}

						var htmltosvg = function(htmlstr, namestr){
							var aligns = {left: 'start', center: 'middle', right: 'end'};
							var svgstr = htmlstr.replace(/<strong>/g, '<tspan font-weight="bold">');
							svgstr = svgstr.replace(/<em>/g, '<tspan font-style="italic">');
							var re = /<p style=\"text-align:\s?(left|center|right);"/g
							var match = re.exec(svgstr);
							if(match == null){
								svgstr = svgstr.replace(/<p/g, '<tspan text-anchor="start"');
							}
							else {
								var replacement = '<tspan text-anchor="' + aligns[match[1]] + '"';
								svgstr = svgstr.replace(re, replacement);
							}
							svgstr = svgstr.replace(/<span/g, '<tspan');
							svgstr = svgstr.replace(/style=\"(font-family|font-size):\s?([^\"\;]*);"/g, '$1="$2"');
							svgstr = svgstr.replace(/style=\"(color):\s?([^\"\;]*);"/g, 'fill="$2"');
							svgstr = svgstr.replace(/<\/[strong|em|span|p]/g, '</tspan');
							return svgstr;
						}

						svg.selectAll(".genomelabel")
							.data(scope.data)
							.enter()
							.append("text")
							.each( function(d,i){
								if ((isInArray(i, scope.genomes[d.genomehtml])) && (i == Math.min.apply(null, scope.genomes[d.genomehtml]))){
									var ind = i;
									var text = d3.select(this)
										.on("click", function(d,i){
											d3.event.stopPropagation();
											if (scope.settings.pastingGenes == true){
												return;
											}
											else {
												return scope.onClickGenome({index: ind, x: d3.event.clientX, y: d3.event.clientY});
											}
										})
										.attr("class", "genomelabel")
										.attr("y", function(d,i){ return getYGenomeLabel(d,i);})
										.attr("x", function(d,i){ return getXGenomeLabel(d,i);})
										.attr("z-index", 100)
									var svgstr = htmltosvg(d.genomehtml, d.genome);
									text.html(svgstr);
								}
								else {
									d3.select(this).remove();
								}
							});

								
						svg.selectAll(".genelabel")
							.data(scope.data)
							.enter()
							.append("text")
							.on("mouseover", function(d, i){ return scope.onMouseOverGene({newfunction:d.genefunction});})
							.on("click", function(d, i){ 
								if(scope.settings.pastingGenes == true){
									return scope.onClickPaste({index: i});
								}
									else {
									return scope.onClick({index: i, x: d3.event.clientX, y: d3.event.clientY});
								}
							})
							.attr("class", "genelabel")
							.attr("y", function(d, i){return d.labelpos.y;})
							.attr("x", function(d, i){return d.labelpos.x;})
							.attr("z-index", 100)
							.html(function(d,i){
								if (!d.genevisible){
									return;
								}
								else{
									var svgstr = htmltosvg(d.namehtml, d.name);
									return svgstr;
								}
							});

							svg.attr("height", globalMaxY);
					};
				}
			};
		}])
		.directive('ngExportbutton', ['d3', '$http', function(d3, $http) {
			return {
				restrict: 'AE',
				scope: {
					data: "=data",
					settings: "=settings",
					showexportpanel: "=showexportpanel"
				},
				link: function(scope, element, attrs){
					
					element.bind('click', function exportFiles() {

						if (scope.data == null){
							return;
						}
						// Create TSV String
						var outputtext = "genome\tgenomehtml\tgenevisible\tgenelocked\tgenomelocked\tlabelpos\tlabelvertpos\tname\tnamehtml\tcolor\tsize\tstart\tstop\tstrand\tfunction\n";
						var genelines = "";
						for (var i = 0; i < scope.data.length; i++) {
							genelines += scope.data[i].genome + "\t";
							genelines += scope.data[i].genomehtml + "\t";
							genelines += scope.data[i].genevisible + "\t";
							genelines += scope.data[i].genelocked + "\t";
							genelines += scope.data[i].genomelocked + "\t";
							genelines += scope.data[i].labelpos.x + "," + scope.data[i].labelpos.x + "\t";
							genelines += scope.data[i].labelvertpos + "\t";
							genelines += scope.data[i].name + "\t";
							genelines += scope.data[i].namehtml + "\t";
							genelines += scope.data[i].color + "\t";
							genelines += scope.data[i].size + "\t";
							genelines += scope.data[i].start + "\t";
							genelines += scope.data[i].stop + "\t";
							genelines += scope.data[i].strand + "\t";
							genelines += scope.data[i].genefunction + "\n";
						}
						outputtext += genelines;
						outputtext += "GraphSettings:{\"graphwidth\":\"" + scope.settings.graphwidth + "\",\"featureheight\":\"" + scope.settings.featureheight + "\",\"scaleOn\":\"" + scope.settings.scaleOn +  "\",\"keepgaps\":\"" + scope.settings.keepgaps + "\",\"multilane\":\"" + scope.settings.multilane + "\",\"shiftgenes\":\"" + scope.settings.shiftgenes + "\"}";
						var tsvstring = outputtext;

						// Render PNG and SVG serverside
						var svg = d3.select("svg")[0][0];
						document.getElementById("pnglink").innerHTML = "Loading...";
						document.getElementById("svglink").innerHTML = "Loading...";
						document.getElementById("tsvlink").innerHTML = "Loading...";

						var req = {
							method: 'POST',
							url: '/cgi-bin/svgtopng.py',
							data: $.param({svgdata: new XMLSerializer().serializeToString(svg), tsvdata: tsvstring }), 
							headers: {'Content-Type': 'application/x-www-form-urlencoded'}
						}
						$http(req).then(function successCallback(response) {
							console.log(response.data);
							var files = response.data.split("\n");
							var pnglink = document.getElementById("pnglink");
							pnglink.innerHTML = "Export PNG";
							pnglink.href = files[0];
							var svglink = document.getElementById("svglink");
							svglink.innerHTML = "Export SVG";
							svglink.href = files[1];
							var tsvlink = document.getElementById("tsvlink");
							tsvlink.innerHTML = "Export TSV";
							tsvlink.href = files[2];
						});

						
						scope.showexportpanel = true;
					});
				}
			}
		}])
		.directive('onReadFile', function ($parse) {
			return {
				restrict: 'A',
				scope: false,
				link: function(scope, element, attrs) {
					var fn = $parse(attrs.onReadFile);
	 
					element.on('change', function(onChangeEvent) {
						var reader = new FileReader();
						var file = (onChangeEvent.srcElement || onChangeEvent.target).files[0];
						if (typeof file === 'undefined'){
							return;
						}
						var fileType = /[^.]+$/.exec(file.name);
						
						reader.onload = function(onLoadEvent) {
							if (fileType == 'tsv' || fileType == 'gb') {
								scope.$apply(function() {
									fn(scope, {$fileContent:onLoadEvent.target.result, $fileType:fileType});
								});
							}
							else {
								alert("File must be a valid file type.");
							}
						};
						reader.readAsText(file);
					});;
				}
			};
		})
}());
