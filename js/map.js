(function ( $ ) {
 
	$.fn.cigto = function(params) {
 
		var options = $.extend({ zoom: 2,center: [0,0] }, params),
 			cache = {},
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
				Fill: (function(){
					$.getJSON(options.data.info, function( data ) {
						$.each( data, function( key, val ) {
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

							}else{
								console.log(val.cca2)
							}
						});
					})
				})(),
				Clear: function(){
					while(map.getOverlays().getArray().length > 0){
						map.removeOverlay(map.getOverlays().getArray()[0])
					}
				}
			}

	};
}( jQuery ));