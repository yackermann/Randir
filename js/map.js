(function($) {

    $.fn.cigto = function(params) {
        var struct = {},
            visacodes = {
                'a': { colour : 'rgba(255, 255, 0, 0.2)', description : 'Visa on arrival.'},
                'r': { colour : 'rgba(255, 0, 0, 0.2)', description : 'Visa required.'},
                'd': { colour : 'rgba(0, 0, 0, 0.4)', description : 'Visa refused.'},
                'u': { colour : 'rgba(0, 0, 255, 0.2)', description : 'Customs union.'},
                'f': { colour : 'rgba(0, 255, 0, 0.2)', description : 'Visa not required'},
                'o': { colour : 'rgba(204, 255, 255, 0.4)', description : 'Visa gained online' },
                'e': { colour : 'rgba(152, 251,152, 0.5)', description : 'Electronic visa required.'},
                'self': { colour : 'rgba(0, 0, 255, 0.4)', description : ''}
            },
            mode = 'select',
            options = $.extend({
                zoom: 2,
                center: [0, 0]
            }, params),
            message = function(msg, status){
                options.notify.html('<span class=\'' + status + '\'></span> ' + msg);
                options.notify.animate({bottom:0},500).delay(3000).animate({bottom:-200},500);
            },
            cache = {
                get: function(url, callback) {
                    if (localStorage.getItem(url) === null) {
                        $.getJSON(url).done(function(data){
                            localStorage[url] = JSON.stringify(data);
                            callback(data);
                        })
                        .fail(function() {
                            return '@error@'
                        })
                    } else{
                        callback(JSON.parse(localStorage[url]));
                    }
                }
            },
            map = new ol.Map({
                
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.BingMaps({
                          key: 'ArsgdK7CnP8NYclbhmgF2dCv2hBdIIXlaJJ5ImlxzXsQmSxfB_nHSomedphqRl6f',
                          imagerySet: 'AerialWithLabels'
                        })
                    })
                    // new ol.layer.Tile({
                    //     source: new ol.source.TileJSON({
                    //         url: '//api.tiles.mapbox.com/v3/mapbox.world-dark.jsonp'
                    //     })
                    // })
                    // new ol.layer.Tile({
                    //     source: new ol.source.OSM()
                    // })
                ],
                target: this.attr('id'),
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
                /*@Adds features to the map@*/
                Visa: function(from) {
                    mode = 'notselect';
                    dataDraw.Clear();
                    var overlayer = function(k, v) {
                        var x = vectorSource.getFeatureById(k);
                        if (x != null) {
                            x.set('info', struct[k]);
                            x.set('type', v);
                            map.addOverlay(
                                new ol.FeatureOverlay({
                                    map: map,
                                    style: new ol.style.Style({
                                        stroke: new ol.style.Stroke({
                                            color: '#fff',
                                            width: 0.5
                                        }),
                                        fill: new ol.style.Fill({
                                            color: visacodes[v].colour || 'rgba(255, 165, 0, 0.1)'
                                        })
                                    }),
                                    features: [x]
                                })
                            );
                        } //else console.log(k);
                    };
                    $.getJSON('data/visa/' + from + '.visa.json', function(data) {
                        overlayer(from, 'self')
                        $.each(data.requirements, function(key, val) {
                            overlayer(key, val.type)
                        })
                    }).fail(function() {
                        message('Sorry, visa information for '+ vectorSource.getFeatureById(from).get('name') + ' is not available yet.', 'a')
                        console.log('Блеять! 404 епта!')
                    })
                },

                /*@Geo features to the map@*/
                Fill: function() {
                    dataDraw.Clear();

                    mode = 'select';
                    $.getJSON(options.data.info, function(data) {
                        $.each(data, function(key, val) {
                            var x = vectorSource.getFeatureById(val.cca2);
                            if (x != null) {
                                x.set('info', val);
                                x.set('type', '');
                                map.addOverlay(
                                    new ol.FeatureOverlay({
                                        map: map,
                                        style: new ol.style.Style({
                                            stroke: new ol.style.Stroke({
                                                color: '#fff',
                                                width: 0.5
                                            }),
                                            fill: new ol.style.Fill({
                                                color: (function() {
                                                    return {
                                                        'Asia': 'rgba(255, 255, 0, 0.2)',
                                                        'Europe': 'rgba(255, 0, 0, 0.2)',
                                                        'Africa': 'rgba(255, 165, 0, 0.2)',
                                                        'Oceania': 'rgba(0, 0, 255, 0.2)',
                                                        'Americas': 'rgba(0, 255, 0, 0.2)'
                                                    }[val.region] || 'rgba(0, 0, 0, 0.4)'
                                                })()
                                            })
                                        }),
                                        features: [x]
                                    })
                                );
                            } //else console.log(val.cca2);
                        })
                    })

                },

                /*@Removes all features from map@*/
                Clear: function() {
                    dataDraw.Info([-100,-100], 'select');
                    dataDraw.Info([-100,-100], 'highlight');
                    while (map.getOverlays().getArray().length > 0) {
                        map.removeOverlay(map.getOverlays().getArray()[0]);
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
                                    width: 2
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(255,0,0,0.1)'
                                }),
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

                Info: function(pixel, a) {

                    var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                        return feature;
                    });
                    if(feature){
                        if(feature.get('type') && feature){
                            options.info.html('<h3>' + feature.get('name') + ' <span class=\'circle ' + feature.get('type') + '\'></span> ' + visacodes[feature.get('type')].description + '</h3>')
                            // console.log(options.info.html())
                        }else{
                            options.info.html('<h3>' + feature.get('name') + '</h3>');
                        }
                        
                    }else{options.info.html('');}

                    var action = {
                        'highlight': function() {
                            if (feature !== dataDraw.highlighted) {
                                if (dataDraw.highlighted) dataDraw.Highlight.removeFeature(dataDraw.highlighted);
                                if (feature) dataDraw.Highlight.addFeature(feature);
                                dataDraw.highlighted = feature;
                            }
                        },

                        'select': function() {
                            if (feature !== dataDraw.selected) {
                                if (dataDraw.selected) {
                                    options.wiki.animate({
                                        height:0,
                                    },400).promise().done(function(){options.wiki.empty()})
                                    dataDraw.Select.removeFeature(dataDraw.selected);
                                    options.loader.hide();
                                }
                                if (feature) {
                                    if(mode != 'select'){
                                        dataDraw.Select.addFeature(feature);
                                        options.loader.show();
                                        var url = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=' + feature.get('info').name.common + '&callback=?';
                                        var resolver = setInterval(function() {
                                            if (cache.get(url) && cache.get(url) !== '@error@') {
                                                if (feature == dataDraw.selected) {
                                                    clearInterval(resolver)
                                                    var datap = JSON.parse(cache.get(url))
                                                    var blurb = $('<div></div>').html(datap.parse.text['*']);
                                                    blurb.find('a').each(function() {
                                                        $(this).replaceWith($(this).html());
                                                    });
                                                    blurb.find('sup').remove();
                                                    blurb.find('.mw-ext-cite-error').remove();
                                                    blurb.find('#coordinates').parent().parent().remove()
                                                    blurb.find('.nowrap').remove()

                                                    options.loader.hide();
                                                    options.wiki.animate({
                                                        height:400,
                                                    },400)
                                                    $(options.wiki).append($(blurb).find('p'));
                                                    $(options.wiki).append('<p>Source: <a href=https://en.wikipedia.org/wiki/' + encodeURI(feature.get('info').name.common) + '>Wikipedia</a></p>').scrollTop(0);
                                                }
                                            }else if(cache.get(url) == '@error@'){
                                                    clearInterval(resolver);
                                                    options.loader.hide();
                                                    $(options.wiki).append('<p>Error while loading data.</p>');
                                            }
                                        }, 500);
                                    }else{
                                        dataDraw.Visa(feature.getId());
                                        $("#selecter").select2("val", feature.getId());
                                    }

                                }
                                dataDraw.selected = feature;
                            }
                        }
                    }[a]()
                }

            }

        cache.get(options.data.info, function(data){
            $.each(data, function(key, val) {
                options.choser.append('<option value=\'' + val.cca2 + '\'>' + val.name.official + '</option>');
                struct[val.cca2] = val;
            })
            dataDraw.Fill();
        })
      

        // dataDraw.Fill()
        $(document).keyup(function(e) {
            if (e.keyCode == 27 & mode != 'select') {
                $("#selecter").select2("val", "");
                dataDraw.Fill()
            }
        })
        map.on('click', function(evt) {//Feature select handler
            dataDraw.Info(evt.pixel, 'select');
        });

        $(map.getViewport()).on('mousemove', function(evt) {//Feature highlight handler
            dataDraw.Info(map.getEventPixel(evt.originalEvent), 'highlight');
        });

        options.choser.change(function() { //Country select handler
            var str = '';
            $('option:selected', options.choser).each(function() {
                str += $(this).attr('value');
            });
            // console.log(str)
            str == 'undefined' ? dataDraw.Fill() : dataDraw.Visa(str);
        });
        options.zoomin.click(function(){
            map.getView().setZoom(map.getView().getZoom() + 1)
        })
        options.zoomout.click(function(){
            map.getView().setZoom(map.getView().getZoom() - 1)
        })
        options.refresh.click(function(){ //Refresh cace handler
            confirm('Are you sure you want to refresh you cache?') ? (function() {
                localStorage.clear();
                var resolver = setInterval(function() {
                    if (cache.get(options.data.info)) {
                        clearInterval(resolver);
                        message('Cache have been successfully refreshed.','i')
                    }
                }, 300)
            })() : ''
        })
    };
}(jQuery));