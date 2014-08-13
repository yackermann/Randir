(function($) {

    $.fn.cigto = function(params) {
        var struct = {},
            options = $.extend({
                zoom: 2,
                center: [0, 0]
            }, params),
            message = function(msg, status){
                $(".msg").html('<span class="' + status + '"></span> ' + msg);
                $(".msg").animate({bottom:0},500).delay(3000).animate({bottom:-200},500);
            },
            cache = {
                get: function(url) {
                    if (localStorage.getItem(url) == null) {

                        $.ajax({
                                url: url,
                                dataType: 'json',
                                async: false
                            })
                            .done(function(data) {
                                localStorage[url] = JSON.stringify(data);
                                return localStorage[url];
                            })
                            .fail(function() {
                                return "@error@"
                            })
                    } else return localStorage[url];
                }
            },
            map = new ol.Map({
                controls: ol.control.defaults().extend([
                    new ol.control.FullScreen()
                ]),
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
                /*@Adds features to the map@*/
                Visa: function(from) {
                    dataDraw.Clear();
                    var overlayer = function(k, v) {
                        var x = vectorSource.getFeatureById(k);
                        if (x != null) {
                            x.set("info", struct[k]);
                            x.set("type", v);
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
                                                    "a": "rgba(255, 255, 0, 0.2)",
                                                    "r": "rgba(255, 0, 0, 0.2)",
                                                    "d": "rgba(0, 0, 0, 0.4)",
                                                    "u": "rgba(0, 0, 255, 0.2)",
                                                    "f": "rgba(0, 255, 0, 0.2)",
                                                    "self": "rgba(0, 0, 255, 0.4)",
                                                }[v] || "rgba(255, 165, 0, 0.1)"
                                            })()
                                        })
                                    }),
                                    features: [x]
                                })
                            );
                        } else console.log(val.type);
                    };
                    $.getJSON("data/visa/" + from + ".visa.json", function(data) {
                        overlayer(from, "self")
                        $.each(data.requirements, function(key, val) {
                            overlayer(key, val.type)
                        })
                    }).fail(function() {
                        message("Sorry, visa information for "+ vectorSource.getFeatureById(from).get('name') + " is not available yet.", "a")
                        console.log("Блеять! 404 епта!")
                    })
                },

                /*@Adds features to the map@*/
                Fill: function() {
                    dataDraw.Clear();
                    $.getJSON(options.data.info, function(data) {
                        $.each(data, function(key, val) {
                            var x = vectorSource.getFeatureById(val.cca2);
                            if (x != null) {
                                x.set("info", val);
                                x.set("type", "");
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
                                                        "Asia": "rgba(255, 255, 0, 0.2)",
                                                        "Europe": "rgba(255, 0, 0, 0.2)",
                                                        "Africa": "rgba(255, 165, 0, 0.2)",
                                                        "Oceania": "rgba(0, 0, 255, 0.2)",
                                                        "Americas": "rgba(0, 255, 0, 0.2)"
                                                    }[val.region] || "rgba(0, 0, 0, 0.4)"
                                                })()
                                            })
                                        }),
                                        features: [x]
                                    })
                                );
                            } else console.log(val.cca2);
                        })
                    })

                },

                /*@Removes all features from map@*/
                Clear: function() {
                    while (map.getOverlays().getArray().length > 0) {
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

                    var visadec = function(t) {
                        return {
                            "self": feature.get('name'),
                            "a": "Visa on arrival.",
                            "r": "Visa required.",
                            "d": "Visa refused.",
                            "u": "Customs union.",
                            "f": "Visa not required"
                        }[t] || ""
                    }
                    if(feature){
                        if(feature.get('type') && feature){
                            options.info.html('<h3>' + feature.get('name') + '<span class="circle ' + feature.get('type') + '"></span> ' + visadec(feature.get('type')) + '</h3>')
                        }else{
                            options.info.html('<h3>' + feature.get('name') + '</h3>');
                        }
                        
                    }else{options.info.html('');}

                    var action = {
                        "highlight": function() {
                            if (feature !== dataDraw.highlighted) {
                                if (dataDraw.highlighted) dataDraw.Highlight.removeFeature(dataDraw.highlighted);
                                if (feature) dataDraw.Highlight.addFeature(feature);
                                dataDraw.highlighted = feature;
                            }
                        },

                        "select": function() {
                            if (feature !== dataDraw.selected) {
                                if (dataDraw.selected) {
                                    options.wiki.animate({
                                        height:0,
                                    },400).promise().done(function(){options.wiki.empty()})
                                    dataDraw.Select.removeFeature(dataDraw.selected);
                                    options.loader.hide();
                                }
                                if (feature) {
                                    dataDraw.Select.addFeature(feature);
                                    options.loader.show();
                                    var url = "https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=" + feature.get("info").name + "&callback=?";
                                    var resolver = setInterval(function() {
                                        if (cache.get(url) && cache.get(url) !== "@error@") {
                                            if (feature == dataDraw.selected) {
                                                clearInterval(resolver)
                                                var datap = JSON.parse(cache.get(url))
                                                var blurb = $('<div></div>').html(datap.parse.text["*"]);
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
                                                $(options.wiki).append('<p>Source: <a href=https://en.wikipedia.org/wiki/' + feature.get("info").name + '>Wikipedia</a></p>').scrollTop(0);
                                            }
                                        }else if(cache.get(url) == "@error@"){
                                                clearInterval(resolver);
                                                options.loader.hide();
                                                $(options.wiki).append("<p>Error while loading data.</p>");
                                        }
                                    }, 500);

                                }
                                dataDraw.selected = feature;
                            }
                        }
                    }[a]()
                }

            }

        var resolver = setInterval(function() {
            if (cache.get("data/countries.json")) {
                clearInterval(resolver);
                var data = JSON.parse(cache.get("data/countries.json"));
                $.each(data, function(key, val) {
                    options.choser.append('<option value="' + val.cca2 + '">' + val.name + '</option>')
                    struct[val.cca2] = val
                })
                dataDraw.Fill()
            }
        }, 300);

        // dataDraw.Fill()
        // $(document).keyup(function(e) {
        //     if (e.keyCode == 27) {
        //         alert("esc")
        //     }
        // })
        map.on('click', function(evt) {
            dataDraw.Info(evt.pixel, "select");
        });

        $(map.getViewport()).on('mousemove', function(evt) {
            dataDraw.Info(map.getEventPixel(evt.originalEvent), "highlight");
        });

        options.choser.change(function() {
            var str = "";
            $("option:selected", options.choser).each(function() {
                str += $(this).attr("value");
            });
            console.log(str)
            str == "undefined" ? dataDraw.Fill() : dataDraw.Visa(str);
        });
        options.refresh.click(function(){
            confirm('Are you sure you want to refresh you cache?') ? (function() {
                localStorage.clear();
                var resolver = setInterval(function() {
                    if (cache.get("data/countries.json")) {
                        clearInterval(resolver);
                        message("Cache have been successfully refreshed.","i")
                    }
                }, 300)
            })() : ''
        })
    };
}(jQuery));