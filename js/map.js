(function ( $ ) {
 
	$.fn.cigto = function(params) {
 
		var options = $.extend({ zoom: 2,center: [0,0] }, params),
 			cache = {
 				get: function(url){

 					if(localStorage.getItem(url) == null){
	 					$.getJSON(url, function( data ) { 
	 						localStorage[url] = JSON.stringify(data);
	 						return localStorage[url];
	 					})
	 				}else return JSON.parse(localStorage[url]);
 				}
 				// remove: function(url){}
 			},
			map = new ol.Map({
				controls: ol.control.defaults().extend([
					new ol.control.FullScreen()
				]),
				layers: [
					new ol.layer.Tile({
						source: new ol.source.OSM()
					}),
				],
				target: this.attr("id"),
				view: new ol.View({
					center: options.center,
					zoom: options.zoom
				})
			}),

			vectorSource = new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: options.data.geo
			}),

			dataDraw = {
				getStyle: function(reg){
					return new ol.style.Style({
						fill: new ol.style.Fill({
							color: (function() {
								return	{
										 "Asia": "rgba(255, 255, 0, 0.1)",
										 "Europe": "rgba(255, 0, 0, 0.1)",
										 "Africa": "rgba(255, 165, 0, 0.1)",
										 "Oceania": "rgba(0, 0, 255, 0.1)",
										 "Americas": "rgba(0, 255, 0, 0.1)"
										}[reg] || "rgba(0, 255, 0, 1)"
							})()
						})
					})
				},

				/*@Adds features to the map@*/
				Fill: function(){
					$.getJSON(options.data.info, function( data ) {
						$.each(data, function( key, val ) {
							var x = vectorSource.getFeatureById(val.cca2);
							if(x != null){
								x.set("info",val);
								map.addOverlay(
									new ol.FeatureOverlay({
										map:map,
										style: dataDraw.getStyle(val.region),
										features: [x]
									})
								);
							}else console.log(val.cca2);
						})
					})
				},

				/*@Removes all features from map@*/
				Clear: function(){
					while(map.getOverlays().getArray().length > 0){
						map.removeOverlay(map.getOverlays().getArray()[0])
					}
				},

				highlighted: undefined,
				hscache: {},

				Highlight: new ol.FeatureOverlay({
					map: map,
						style: function(feature, resolution) {
							var text = resolution < 5000 ? feature.get('name') : '';
							if (!dataDraw.hscache[text]) {
								dataDraw.hscache[text] = [new ol.style.Style({
									stroke: new ol.style.Stroke({
										color: '#f00',
										width: 1
									}),
									fill: new ol.style.Fill({
										color: 'rgba(255,0,0,0.1)'
									}),
									text: new ol.style.Text({
										font: '12px Calibri,sans-serif',
										text: text,
										fill: new ol.style.Fill({
											color: '#000'
										}),
										stroke: new ol.style.Stroke({
											color: '#f00',
											width: 3
										})
									})
								})];
							}
							return dataDraw.hscache[text];
						}
				}),

				info: function(pixel) {

					var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
						return feature;
					});
					if (options.debug != undefined){
						options.debug.html(feature ? feature.getId() + ': ' + feature.get('name') : '&nbsp;');
					}


					if (feature !== this.highlight) {
						if (this.highlight) {
							this.Highlight.removeFeature(this.highlight);
						}
						if (feature) {
							this.Highlight.addFeature(feature);
						}
						this.highlight = feature;
					}

				}

			}
			// $(map.getViewport()).on('mousemove', function(evt) {
			// 	var pixel = map.getEventPixel(evt.originalEvent);
			// 	c.info(pixel);
			// });
			$(window).load(function() {
				dataDraw.Fill()
				map.on('click', function(evt) {
					dataDraw.info(evt.pixel);
				});

				$(map.getViewport()).on('mousemove', function(evt) {
					dataDraw.info(map.getEventPixel(evt.originalEvent));
				});
			})



	};
}( jQuery ));