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
						//console.log('data change');
						//console.log(newVals);
						//console.log(oldVals);
						scope.settings.maxwidth = geneService.getMaxWidth(newVals);
						geneService.updateGenomesHash(newVals);
						geneService.updateOffset(newVals);
						geneService.updateGeneNames();
						maxFontSizes(newVals);
						geneService.genomesHash = geneService.genomesHash;
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
						if (!popupMenuService.GeneMenuVisible && geneService.genomesHash!={}){
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
						
						console.log("render " + rennum);
						rennum = rennum + 1;

						var csstext = "text { font-family: Arial }";
						svg.selectAll("*").remove();
						svg.append("style").text(csstext);
						
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

						if (scope.settings.genomesHidden){
							var genomeBuffer = 0;
						} else {
							var genomeBuffer = (maxGenomeFontSize + (maxGenomeFontSize/4));
						}
						var geneBuffer = (maxGeneFontSize + (maxGeneFontSize/4));
						var scaleBuffer = 0;
						if (scope.settings.scaleOn) scaleBuffer = 50;
						var lanePart = 0;
						var genePushed = false; // True if genes in the genome were pushed down
						var lastGenomeLanes = 1; // How many lanes in prev genome
						var genomeStarts = {};

						var getFeatureY = function(d, i) {

							// Function to determine the first y position of the feature
							var laneMultiplier = 1; // Helps with multilane math

							// Check whether to push a gene down (lanepart=1)
							if (multilane){
								laneMultiplier = 2;
								if ((i>0) && (d.genomehtml == data[i-1].genomehtml) &&
								(Math.max(data[i-1].stop, data[i-1].start) > Math.min(d.stop, d.start))){
									if (lanePart == 1){
										lanePart = 0;
									} else {
										lanePart = 1;
										genePushed = true;
									}
								} else if (lanePart == 1){
									lanePart = 0;
								}
								if((i>0) && (d.genomehtml != data[i-1].genomehtml)){
									if(genePushed){
										lastGenomeLanes = 2;
										genePushed = false;
									} else {
										lastGenomeLanes = 1;
									}
								}
							}

							if (i==0){
								// The first genome starts at 10 + room for scale
								genomeStarts[d.genomeNum] = maxGenomeFontSize + scaleBuffer;
							} else if (d.genomeNum != data[i-1].genomeNum){
								// Other genomes start at the prev genome...
								genomeStarts[d.genomeNum] = genomeStarts[data[i-1].genomeNum]
									// + height of previous genome's features * number of lanes
									+ (featureheight*lastGenomeLanes)
									// + room for genome label + room for gene labels
									+ genomeBuffer + (3*geneBuffer) + (geneBuffer*(lastGenomeLanes-1));
							}
									
							// Y position of this feature
							var thisFeature = genomeBuffer + geneBuffer + (featureheight*lanePart) + (geneBuffer*(lanePart-1));

							// Return prev genome start + Y position of this feature
							var ret = genomeStarts[d.genomeNum] + thisFeature;

							return ret;
						}

						var getFeatureStart = function(d, i, prevX) {
							// no shifting overlapping genes or gaps
							if (!shiftgenes && !keepgaps){
								// first gene on lane
								if(i==0 || scope.data[i].genomehtml !== scope.data[i-1].genomehtml) {
									prevX = 10;
									return prevX;
								}
								// not first gene on lane
								else {
									prevX = ((Math.min(d.start, d.stop)/ maxwidth) *lanewidth) + 10;
									return prevX;
								}
							}
							// shift overlapping genes but no gaps
							else if (shiftgenes && !keepgaps){
								// start of a genome/lane
								if((i==0) || (scope.data[i].genomehtml !== scope.data[i-1].genomehtml)){
									prevX = 10;
								};
								// otherwise, keep and return prevX
								return prevX;
							}
							// shift overlapping genes and keep gaps
							else if (shiftgenes && keepgaps){
								var gap = 0;
								// start of genome/lane
								if(i==0 || scope.data[i].genomehtml !== scope.data[i-1].genomehtml){
									prevX = 10;
									return prevX;
								}
								// not start of a genome/lane
								else if((i>0) && (scope.data[i].genomehtml === scope.data[i-1].genomehtml)){
									var gap = ((Math.min(d.start, d.stop) - Math.max(scope.data[i-1].start, scope.data[i-1].stop))/maxwidth) * lanewidth;
									if ( gap < 0) {
										gap = 0;
									};
									prevX = prevX + gap;
									return prevX;
								};
							};
						}

						var getFeatureEnd = function(d, i, prevX) {
							prevX += ((d.size / maxwidth) *lanewidth);
							return prevX;
						}

						var getYPath = function(d, i){
							var result = getFeatureY(d, i);
							return result;
						}
						
						var getYGeneLabel = function(d, i, y1){
							if (d.labelvertpos == "top"){
								return genomeStarts[d.genomeNum] + genomeBuffer - 2;
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
							var result = genomeStarts[d.genomeNum];
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
								.attr("font-family", "arial, helvetica, sans-serif")
								.attr("font-size", "10px")
								.attr("fill", "black")
								.attr("font-style", "italic")
								.attr("text-anchor", "start")
							}
						var prevX;

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
									if (scope.settings.arrows === false){
										// get start and stop positions relative to max size
										if (d.strand === '+'){
											var x1 = getFeatureStart(d, i, prevX);
											prevX = x1;
											var x3 = getFeatureEnd(d, i, prevX);
											prevX = x3;
										}
										else if (d.strand === '-'){
											var x3 = getFeatureStart(d, i, prevX);
											prevX = x3;
											var x1 = getFeatureEnd(d, i, prevX);
											prevX = x1;
										}
										var y1 = getYPath(d, i);
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
										
										var points = [{"x":x1, "y":y1}, 
											{"x":x2, "y":y2},
											{"x":x3, "y":y3},
											{"x":x4, "y":y4},
											{"x":x5, "y":y5},
											{"x":x1, "y":y1}];
									} else if (scope.settings.arrows === true){
										
										if (d.strand === "+"){
											var x1 = getFeatureStart(d, i, prevX);
											prevX = x1;
											var x4 = getFeatureEnd(d, i, prevX);
											prevX = x4;
										}
										else if (d.strand === "-"){
											var x4 = getFeatureStart(d, i, prevX);
											prevX = x4;
											var x1 = getFeatureEnd(d, i, prevX);
											prevX = x1;
										}
										var y1 = getYPath(d, i)+(featureheight/4);
										var y2 = y1;
										var x2 = ((x4 - x1) * 0.8) + x1;
										var y3 = y1-(featureheight/4);
										var x3 = x2;
										var y4 = y3+(featureheight)/2;
										var y5 = y3+featureheight;
										var x5 = x3;
										var y6 = y5-(featureheight/4);
										var x6 = x5;
										var y7 = y6;
										var x7 = x1;

										if (x1 > scope.settings.graphwidth) {
											svg.attr("width", x1);
										}
										if (x4 > scope.settings.graphwidth) {
											svg.attr("width", x4);
										}
										if(y5 > globalMaxY) { globalMaxY = y5 + 50; }
										
										if (d.strand == '-')
											scope.data[i].labelpos.x = getXGeneLabel(x2, x1, d, i);
										else 
											scope.data[i].labelpos.x = getXGeneLabel(x1, x2, d, i);
										
										// Determine y position of label
										scope.data[i].labelpos.y = getYGeneLabel(d, i, y3);
										
										var points = [{"x":x1, "y":y1}, 
											{"x":x2, "y":y2},
											{"x":x3, "y":y3},
											{"x":x4, "y":y4},
											{"x":x5, "y":y5},
											{"x":x6, "y":y6}, 
											{"x":x7, "y":y7},
											{"x":x1, "y":y1}];
									}
									return lineFunction(points);
								})
								.attr("fill", function(d, i) {
									return d.color;
								})
								.attr("stroke", function(d, i) {
									if(scope.settings.selectedGene == i && (popupMenuService.GeneMenuVisible || popupMenuService.GeneCPDialogVisible)){
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
							svgstr = svgstr.replace(/(<\/strong>)|(<\/em>)|(<\/span>)|(<\/p>)/g, '</tspan>');
							return svgstr;
						}

						if (!scope.settings.genomesHidden){
							svg.selectAll(".genomelabel")
								.data(scope.data)
								.enter()
								.append("text")
								.each( function(d,i){
									if ((isInArray(i, geneService.genomesHash[d.genomehtml])) && (i == Math.min.apply(null, geneService.genomesHash[d.genomehtml]))){
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
						}

								
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
								var svgstr = htmltosvg(d.namehtml, d.name);
								return svgstr;
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
						var outputtext = "genome\tgenomehtml\tgenelocked\tgenomelocked\tlabelpos\tlabelvertpos\tname\tnamehtml\tcolor\tsize\tstart\tstop\tstrand\tfunction\n";
						var genelines = "";
						for (var i = 0; i < scope.data.length; i++) {
							genelines += scope.data[i].genome + "\t";
							genelines += scope.data[i].genomehtml + "\t";
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
						outputtext += "GraphSettings:{\"graphwidth\":\"" + scope.settings.graphwidth + "\",\"featureheight\":\"" + scope.settings.featureheight + "\",\"scaleOn\":\"" + scope.settings.scaleOn +  "\",\"keepgaps\":\"" + scope.settings.keepgaps + "\",\"multilane\":\"" + scope.settings.multilane + "\",\"shiftgenes\":\"" + scope.settings.shiftgenes + "\",\"arrows\":\"" + scope.settings.arrows + "\"}";
						var tsvstring = outputtext;

						// Render PNG and SVG serverside
						var svg = d3.select("svg")[0][0];
						document.getElementById("pnglink").innerHTML = '<i class="fa fa-spinner fa-pulse fa-2x fa-fw" aria-hidden="true"></i><br>Loading';
						document.getElementById("svglink").innerHTML = '<i class="fa fa-spinner fa-pulse fa-2x fa-fw" aria-hidden="true"></i><br>Loading';
						document.getElementById("emflink").innerHTML = '<i class="fa fa-spinner fa-pulse fa-2x fa-fw" aria-hidden="true"></i><br>Loading';
						document.getElementById("tsvlink").innerHTML = '<i class="fa fa-spinner fa-pulse fa-2x fa-fw" aria-hidden="true"></i><br>Loading';
						document.getElementById("tifflink").innerHTML = '<i class="fa fa-spinner fa-pulse fa-2x fa-fw" aria-hidden="true"></i><br>Loading';
						document.getElementById("epslink").innerHTML = '<i class="fa fa-spinner fa-pulse fa-2x fa-fw" aria-hidden="true"></i><br>Loading';
						var svg_w = d3.select("svg").style("width").replace(/\D/g,'');
						var svg_h = d3.select("svg").style("height").replace(/\D/g,'');
						console.log(svg_w);

						var req = {
							method: 'POST',
							url: '/cgi-bin/svgtopng.py',
							data: $.param({svgdata: new XMLSerializer().serializeToString(svg), 
										tsvdata: tsvstring,
										width: svg_w}), 
							headers: {'Content-Type': 'application/x-www-form-urlencoded'}
						}
						$http(req).then(function successCallback(response) {
							console.log(response.data);
							var files = response.data.split("\n");
							var whstr = files[6];

							var pnglink = document.getElementById("pnglink");
							pnglink.innerHTML = '<i class="fa fa-file-image-o fa-2x" aria-hidden="true"></i><br>PNG<br>';
							pnglink.href = files[0];
							var svglink = document.getElementById("svglink");
							svglink.innerHTML = '<i class="fa fa-file-code-o fa-2x" aria-hidden="true"></i><br>SVG';
							svglink.href = files[1];
							var emflink = document.getElementById("emflink");
							emflink.innerHTML = '<i class="fa fa-file-code-o fa-2x" aria-hidden="true"></i><br>EMF';
							emflink.href = files[2];
							var tsvlink = document.getElementById("tsvlink");
							tsvlink.innerHTML = '<i class="fa fa-file-excel-o fa-2x" aria-hidden="true"></i><br>TSV';
							tsvlink.href = files[3];
							var tifflink = document.getElementById("tifflink");
							tifflink.innerHTML = '<i class="fa fa-file-image-o fa-2x" aria-hidden="true"></i><br>TIFF';
							tifflink.href = files[4];
							var epslink = document.getElementById("epslink");
							epslink.innerHTML = '<i class="fa fa-file-code-o fa-2x" aria-hidden="true"></i><br>EPS';
							epslink.href = files[5];
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
