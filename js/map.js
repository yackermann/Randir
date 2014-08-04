(function ( $ ) {
 
	$.fn.cigto = function( options ) {
 
		var settings = $.extend({
			mapId: this.attr("id"),
			zoom: 2,
			center: [0,0]
		}, options );
 		
		var map = new ol.Map({
			controls: ol.control.defaults().extend([
				new ol.control.FullScreen()
			]),
			layers: [
				new ol.layer.Tile({
					source: new ol.source.OSM()
				}),
			],
			target: settings.mapId,
			view: new ol.View({
				center: settings.center,
				zoom: settings.zoom
			})
		});
	};
}( jQuery ));