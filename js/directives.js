(function () {
	'use strict';

	angular.module('geneGraphApp.directives')
		.directive('d3Genes', ['d3', 'geneService', function(d3, geneService) {
			return {
				restrict: 'EA',
				scope: {
					data: "=",
					settings: "=settings",
					onClick: "&onClick",
					onClickGenome: "&onClickGenome"
				},
				link: function(scope, iElement, iAttrs) {
					
					// select the svg element and set its width
					var svg = d3.select(iElement[0])
							.append("svg")
							.attr("width", scope.settings.graphwidth);
					
					// maximum width of the data
					var maxwidth = 0;
					
					// on window resize, re-render d3 canvas
					window.onresize = function() {
						return scope.$apply();
					};
					
					scope.$watch(function(){
							return angular.element(window)[0].innerWidth;
						}, function(){
							return scope.render(scope.data);
						}
					);
					
					// re-render when there is a change in the data
					scope.$watch('data', function(newVals, oldVals) {
						scope.settings.maxwidth = geneService.getMaxWidth(newVals);
						return scope.render(newVals);
					}, true);
					
					// re-render when there is a change in the settings
					scope.$watch('settings', function(newVals, oldVals) {
						return scope.render(scope.data);
					}, true);
					
					// re-render when the graph width or gene height sliders are moved
					scope.$watchGroup(['settings.graphwidth', 'settings.featureheight'], function(newVals, oldVals, scope) {
							scope.settings.maxwidth = geneService.getMaxWidth(scope.data);
							scope.data = geneService.hideSmallGeneLabels(scope.data, scope.settings.maxwidth, scope.settings.graphwidth);
							for (var i = 0; i < scope.data.length; i++){
								scope.data[i].labelposchanged = false;
							}
							svg.attr("width", scope.settings.graphwidth);
							return scope.render(scope.data);
					});
					
					scope.render = function(data){
						// remove all previous items before render
						svg.selectAll("*").remove();
						
						//console.log(scope.data);
						
						// do nothing if there is no data
						if (data.length <= 0) {
							return;
						}
						
						console.log("rendering graph...");
						
						var graphwidth = parseInt(scope.settings.graphwidth);
						var featureheight = parseInt(scope.settings.featureheight);
						var maxwidth = scope.settings.maxwidth;
						var multilane = scope.settings.multilane;
						var shiftgenes = scope.settings.shiftgenes;
						var keepgaps = scope.settings.keepgaps;
						var buffer = 35;
						
						var currLane = 0;
						var lastLaneOffset = -1;
						var globalMaxY = 0;
						
						
						var whichLane = function(d, i) {
						// Function to determine the first y position of the feature
							var laneOffset = d.currLane;
							
							if (multilane == true){
								if (lastLaneOffset != laneOffset) {
									currLane = 0;
								}
								else if (Math.max(data[i-1].stop, data[i-1].start) > Math.min(data[i].stop, data[i].start)){
									if (currLane == 1)
										currLane -= 1;
									if (currLane == 0)
										currLane += 1;
								}
								else if( currLane > 0 ) {
									currLane -= 1;
								}
								lastLaneOffset = laneOffset;
								
								return buffer* ((currLane+1)+laneOffset) + ((laneOffset+1)*buffer) + (featureheight*(currLane + laneOffset));
							}
							else {
								//return buffer * (laneOffset+1) + ((laneOffset+1)*buffer) + (featureheight*laneOffset);
								return buffer * (laneOffset+1) + ((laneOffset+1)*buffer);
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
									var gap = ((Math.min(d.start, d.stop) - Math.max(scope.data[i-1].start, scope.data[i-1].stop))/maxwidth) *graphwidth;
								}
								return prevend + 1 + gap;
							}
							else {
								return (Math.min(d.start, d.stop) / maxwidth) * graphwidth;
							}
						}
						
						var getFeatureEnd = function(d, i) {
							if (shiftgenes == true && keepgaps == false) {
								if((i>0) && (scope.data[i].currLane !== scope.data[i-1].currLane)){
										//console.log(data[i].currLane);
										prevend = 0;
								}
								return prevend + 1 + ((d.size / maxwidth) * graphwidth);
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
									var gap = ((Math.min(d.start, d.stop) - Math.max(scope.data[i-1].start, scope.data[i-1].stop))/maxwidth) *graphwidth;
								//console.log("gap: " + gap);
								return prevend + 1 + gap + ((d.size / maxwidth) * graphwidth);
							}
							else {
								return (Math.max(d.start, d.stop) / maxwidth) * graphwidth;
							}
						}
						
						var lineFunction = d3.svg.line()
															.x(function(d) { return d.x; })
															.y(function(d) { return d.y; })
															.interpolate("linear");
															
						//create the arrow for genes
						svg.selectAll("path")
							.data(data)
							.enter()
								.append("path")
								.on("click", function(d, i){ return scope.onClick({index: i});})
								.attr("d", function(d, i) {
									// get start and stop positions relative to max size
									if (d.strand === '+')
										var x1 = getFeatureStart(d, i);
									else if (d.strand === '-')
										var x1 = getFeatureEnd(d, i);
									var y1 = whichLane(d, i);
									if (d.strand === '+')
										var x3 = getFeatureEnd(d, i);
									else if (d.strand === '-')
										var x3 = getFeatureStart(d, i);
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
										console.log(">>>>" + x1);
									}
									if (x3 > scope.settings.graphwidth) {
										svg.attr("width", x3);
										console.log(">>>>" + x3);
									}

									if(y4 > globalMaxY) { globalMaxY = y4 + 35; }
									
									if (d.labelposchanged === false) {
										// Determine x position of label
										if (d.strand == '-')
											scope.data[i].labelpos.x = x2;
										else 
											scope.data[i].labelpos.x = x1 + 5;
										
										// Determine y position of label
										if (scope.settings.labelPosition === 'middle') {
											scope.data[i].labelpos.y = y3;
										}
										else if (scope.settings.labelPosition === 'above') {
											scope.data[i].labelpos.y = y1;
										}
										else if (scope.settings.labelPosition === 'below') {
											scope.data[i].labelpos.y = y4+2;
										}
										else console.log("undefined label position");
									}
									
									scope.data[i].labelsize = 20;
									
									var points = [{"x":x1, "y":y1}, {"x":x2, "y":y2},{"x":x3, "y":y3}, {"x":x4, "y":y4}, {"x":x5, "y":y5}, {"x":x1, "y":y1}];
									return lineFunction(points);
								})
								.attr("fill", function(d, i) {
									return d.color;
								})
								.attr("stroke", "black")
								.attr("stroke-width", "2")
								
					var drag = d3.behavior.drag()
										.on('drag', function(d, i) { 
																	var newx = d3.event.x;
																	var newy = d3.event.y;
																	d3.select(this).attr('x', newx)
																									.attr('y', newy);
																									scope.data[i].labelpos.x = newx;
																									scope.data[i].labelpos.y = newy;
																									scope.data[i].labelposchanged = true;
																									});
																									
					var prevCurrLane = -1;
					
					svg.selectAll("text.genomelabel")
							.data(data)
							.enter()
								.append("text")
								.each(function(d) {
									var text = d3.select(this)
														.attr("fill", "#000000")
														.attr("font-family", function(){return scope.settings.fontFamily;})
														.attr("font-size", function(){return scope.settings.fontSize + "px";})
														.attr("dominant-baseline", function(d, i) {return "text-after-edge";})
														.attr("y", function(d, i){
																			currLane = 0;
																			lastLaneOffset = -1;
																			return whichLane(d, i) - 35;})
														.attr("x", function(d, i){return 0;})
														
									for (var n = 0; n < d.genome.length; n++) {
										text.append("tspan")
												.on("click", function(d, i){ 
													for (var j = 0; j < d.genome.length; j++){
														if (d3.select(this)[0][0].textContent === d.genome[j] + " "){
															var wind = j;
														}
													}
													for (var j = 0; j < scope.data.length; j++){
														if (d.genome == scope.data[j].genome){
															var gind = j;
														}
													}
													console.log(gind);
													return scope.onClickGenome({genomeindex: gind, wordindex: wind});})
												.attr("font-style", function(){
													if (d.genomestyles[n] === "italic" || d.genomestyles[n] === "bold,italic"){
														return 'italic';
													}
													else
														return 'normal';
												})
												.attr("font-weight", function(){
													if (d.genomestyles[n] === "bold" || d.genomestyles[n] === "bold, italic"){
														return 'bold';
													}
													else
														return 'normal';
												})
												.text(function(d,i){
													if(prevCurrLane < d.currLane) {
														return d.genome[n] + " ";
													}
													else return;
												})
									}
									prevCurrLane = d.currLane;
								})
									
					 svg.selectAll("text.genelabel")
							.data(data)
							.enter()
								.append("text")
								.call(drag)
								.on("click", function(d, i){ return scope.onClick({index: i});})
								.attr("fill", function(d, i){
									return d.labelcolor;
								})
								.attr("font-family", function(){return scope.settings.fontFamily;})
								.attr("font-size", function(){return scope.settings.fontSize + "px";})
								.attr("font-style", function(d, i){
									if (d.labelstylechanged === false){
										if (scope.settings.fontStyle === "italic" || scope.settings.fontStyle === "bold,italic"){
											return 'italic';
										}
										else
											return 'normal';
									}
									else if (d.labelstyle === "italic" || d.labelstyle === "bold,italic"){
										return 'italic';
									}
									else
										return 'normal';
									})
								.attr("font-weight", function(d, i){
									if (d.labelstylechanged === false){
										if (scope.settings.fontStyle === "bold" || scope.settings.fontStyle === "bold,italic"){
											return 'bold';
										}
										else
											return 'normal';
									}
									else if (d.labelstyle === "bold" || d.labelstyle === "bold,italic"){
										return 'bold';
									}
									else
										return 'normal';
									})
								.attr("dominant-baseline", function(d, i) {
									if (d.labelposchanged === true){
										return;
									}
									else if (scope.settings.labelPosition === 'middle') {
										return "middle";
									}
									else if (scope.settings.labelPosition === 'above') {
										return "text-after-edge";
									}
									else if (scope.settings.labelPosition === 'below') {
										return "text-before-edge";
									}
									else console.log("undefined label position");
									return;
								})
								.attr("y", function(d, i){return d.labelpos.y;})
								.attr("x", function(d, i){return d.labelpos.x;})
								.attr("visibility", function(d, i){ 
									if (d.labelhidden === false){
										return 'visible';
									}
									else if (d.labelhidden === true) {
										return 'hidden';
									}
								})
								.text(function(d){return d.name;});
								
							svg.attr("height", globalMaxY);
					};
				}
			};
		}])
		
		.directive('ngExport', ['d3', function(d3) {
			return {
				restrict: 'A',
				scope: false,
				link: function(scope, element, attrs){

					d3.select(element[0])
							.append("button")
							.html("Export PNG")
							.on("click",svgToPNG);
							
					function svgToPNG(){
						var svg = d3.select("svg"),
								img = new Image(),
								serializer = new XMLSerializer(),
								svgStr = serializer.serializeToString(svg[0][0]);
								
						img.src = 'data:image/svg+xml;base64,'+window.btoa(svgStr);
						var w = svg.attr('width');
						var h = svg.attr('height');
						
						var canvas = document.createElement("canvas");
						element.append(canvas);

						canvas.width = w;
						canvas.height = h;
						canvas.style.display="none";
						canvas.getContext("2d").drawImage(img,0,0,w,h);
						canvas.toBlob(function(blob) {
							saveAs(blob, "newgenegraphic.png");
						});
					};
				}
			};
		}])
		
		.directive('onReadFile', function ($parse) {
			return {
				restrict: 'A',
				scope: false,
				link: function(scope, element, attrs) {
					var fn = $parse(attrs.onReadFile);
	 
					element.on('change', function(onChangeEvent) {
						var reader = new FileReader();
						var file = (onChangeEvent.srcElement || onChangeEvent.target).files[0]
						if (typeof file === 'undefined'){
							return;
						}
						var fileType = /[^.]+$/.exec(file.name);
						
						reader.onload = function(onLoadEvent) {
							if (fileType == 'tsv') {
								scope.$apply(function() {
									fn(scope, {$fileContent:onLoadEvent.target.result, $fileType:fileType});
								});
							}
							else {
								alert("File must be a tsv file.");
							}
						};
						reader.readAsText(file);
					});
				}
			};
		})
		
		
		.directive("menu", function() {
				return {
						restrict: "E",
						template: "<div ng-class='{ show: visible, bottom: alignment === \"bottom\", right: alignment === \"right\" }' ng-transclude></div>",
						transclude: true,
						scope: {
								visible: "=",
								alignment: "@"
						}
				};
		});
}());
