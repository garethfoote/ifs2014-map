define(["app/common",
        "text!data/venuemarkers.json",
        "text!data/countrymap.json",
        "app/view/app",
        "app/view/content",
        "app/view/filterpanel",
        "app/view/filterpanel",
        "app/view/pin"],
function( common, venuedata, countrymapdata,
    AppView, ContentView, FilterPanelView, PinView ) {

    var ContentItem = Backbone.Model.extend({
        defaults: {
            "removed"             : false,
            "inviewport"          : false,
            "isfiltered-type"     : false,
            "isfiltered-country"  : false
        },
        primarylocation : null,

        getlocation : function(){

            if( this.primarylocation ) {
                return this.primarylocation
            }

            // Get location. Either content or home.
            this.primarylocation= _.isNull(this.get("location"))
                            ? this.get("home") : this.get("location");

            return this.primarylocation
        }

    });

    var Items = Backbone.Collection.extend({
        model: ContentItem,
    });

    var app = (function(){

        var self = this,

            models = new Items(),
            appview = {},
            currenttype = "studio";
            currentcountryfilter = "",

            handleData = function( contentdata, countrymap ){

                // Loop all items.
                for (var i = 0; i < contentdata.length; i++) {
                    contentdata[i].shortcode = ( _.has(countrymap, contentdata[i].country))
                            ? countrymap[contentdata[i].country].shortcode : "";
                    models.add(contentdata[i]);
                }

                appview = new AppView({collection: models});
                appview.render();

                // Event listeners.
                common.on("filtercountry", function(country){
                    filterCountry( country, true );
                });
                common.on("filtertype", setType );

                appview.map.on("moveend", pinsWithinBounds);

            },

            handleVenueData = function( data ){

                var fl = L.mapbox.featureLayer().addTo(appview.map);
                fl.on('layeradd', function(e) {
                        var marker = e.layer,
                            feature = marker.feature;

                    // Create custom popup content
                    var desc = feature.properties.description || "",
                        popupContent =  "<div>"+desc+"</div>";

                    // http://leafletjs.com/reference.html#popup
                    marker.bindPopup(popupContent,{
                        closeButton: false,
                        minWidth: 320
                    });
                });
                fl.setGeoJSON(data.features);

            },

            filterCountry = function( countryfilter, changeScale ){

                var i = 0,
                    togglingOff = ( currentcountryfilter === countryfilter ),
                    bounds = [], activeType = false, loc = {};

                // Set current or remove current.
                currentcountryfilter = togglingOff === true ? "" : countryfilter;

                // console.log("Filter", countryfilter);

                models.each(function(item){
                    loc = item.getlocation();

                    if( togglingOff === true ){
                        item.set("isfiltered-country", false);
                    } else {
                        if(item.get("country") != countryfilter){
                            item.set("isfiltered-country", true);
                        } else {
                            item.set("isfiltered-country", false);
                            if( item.get("isfiltered-type") === false ){
                                bounds.push([loc.latitude, loc.longitude]);
                            }
                        }
                    }
                });

                if( currenttype === "studio" && changeScale === true ){
                    // scale to fit all markers.
                    if( togglingOff === true ){
                        appview.map.fitWorld();
                    } else {
                        appview.map.fitBounds(bounds, { maxZoom : 12 });
                    }
                }

                appview.layout();

            },

            fitWorld = function(){


            },

            setType = function( type ){

                // Current type state maintained in main.js.
                if( type == currenttype ){
                    return;
                }

                currenttype = type;
                filterType();

            },

            filterType = function(){

                var bounds = [],
                    loc;

                models.each(function(item){
                    loc = item.getlocation();

                    if( item.get("type") !== currenttype ){
                        item.set("isfiltered-type", true);
                    } else {
                        item.set("isfiltered-type", false);
                        bounds.push([loc.latitude, loc.longitude]);
                    }

                });

                if( bounds.length > 0 ){
                    if( currenttype === "showcase" ){
                        appview.map.fitBounds(bounds, { maxzoom : 12 });
                    } else {
                        // TODO - Determine whether we want to do this 
                        // for studio. Speak to X,F & D.
                        // map.fitbounds(bounds, { maxzoom : 17 });
                    }
                }

                appview.layout();

            },

            pinsWithinBounds = function(){

                var currbounds = appview.map.getBounds(),
                    currzoom = appview.map.getZoom(),
                    i = 0, isWithinBounds = false,
                    zoomLevelThreshold = 5;


                if( currentcountryfilter !== ""
                        && zoomLevelThreshold > currzoom ){

                    // Turn off country filter if its on.
                    filterCountry( currentcountryfilter );
                    appview.toggleoffcountryfilter();

                }

                models.each(function(item){

                    var loc = item.getlocation();

                    isWithinBounds = currbounds.contains(L.latLng(loc.latitude, loc.longitude));
                    if( currzoom >= zoomLevelThreshold && isWithinBounds ){
                        item.set("inviewport", true);
                    } else {
                        item.set("inviewport", false);
                    }

                });

                appview.layout();

            };

        return {

            handleData : handleData,
            handleVenueData : handleVenueData

        };

    })();

    $(function(){

        var dataurl = "http://mysterious-crag-7636.herokuapp.com/output.json";
        // var dataurl = "http://localhost:5000/output.json";

        $.getJSON( dataurl, function( data ) {
            app.handleData( data, JSON.parse(countrymapdata) );
            app.handleVenueData( JSON.parse(venuedata) );
        });

    });

});