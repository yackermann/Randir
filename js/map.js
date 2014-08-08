(function ( $ ) {
 
	$.fn.cigto = function(params) {
 
		var options = $.extend({ zoom: 2,center: [0,0] }, params),
			cache = {
				get: function(url){
					if(localStorage.getItem(url) == null){

						$.when($.ajax({url: url, dataType: 'json', async: false})).done(function( data ){
								localStorage[url] = JSON.stringify(data);
								return localStorage[url];
						});

					}else return localStorage[url];
				}
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
					zoom: options.zoom,
					minZoom: 2,
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
										}[reg] || "rgba(0, 0, 0, 0.4)"
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
				selected: undefined,
				hscache: {},

				Select: new ol.FeatureOverlay({
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
				Highlight: new ol.FeatureOverlay({
					map: map,
					style: new ol.style.Style({
							fill: new ol.style.Fill({
								color: 'rgba(255,0,0,0.1)'
							}),
						})
				}),

				info: function(pixel, a) {

					var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
						return feature;
					});

					if (options.debug != undefined){
						options.debug.html(feature ? feature.getId() + ': ' + feature.get('name') : '&nbsp;');
					}

					var action = {
						"highlight":function(){
								if (feature !== dataDraw.highlighted) {
									if (dataDraw.highlighted) dataDraw.Highlight.removeFeature(dataDraw.highlighted);
									if (feature) dataDraw.Highlight.addFeature(feature);
									dataDraw.highlighted = feature;
								}
						},

						"select": function(){
								if (feature !== dataDraw.selected) {
									if (dataDraw.selected){
										options.wiki.html('&nbsp;')
										dataDraw.Select.removeFeature(dataDraw.selected);
									}
									if (feature){
										dataDraw.Select.addFeature(feature);
										var url = "https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=" + feature.get("info").name + "&callback=?";
										var x;
										var resolver = setInterval(function(){
											if(!x){
												x = cache.get(url);
											}else{
												if (feature == dataDraw.selected) {
													clearInterval(resolver)
													var datap = JSON.parse(x)
												  	var blurb = $('<div></div>').html(datap.parse.text["*"]);
													blurb.find('a').each(function() { $(this).replaceWith($(this).html()); });
													blurb.find('sup').remove();
													blurb.find('.mw-ext-cite-error').remove();
													blurb.find('#coordinates').parent().parent().remove()
													blurb.find('.nowrap').remove()
													$(options.wiki).html($(blurb).find('p'));
												}
											}
										}, 500);
									}
									dataDraw.selected = feature;
								}
						}
					}[a]()
				}

			}
			$(window).load(function() {
				dataDraw.Fill()
				map.on('click', function(evt) {
					dataDraw.info(evt.pixel,"select");
				});

				$(map.getViewport()).on('mousemove', function(evt) {
					dataDraw.info(map.getEventPixel(evt.originalEvent),"highlight");
				});
			})



	};
}( jQuery ));