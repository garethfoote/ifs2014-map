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
            "focus"               : false,
            "removed"             : false,
            "inviewport"          : false,
            "isfiltered-type"     : false,
            "isfiltered-country"  : false
        },
        primarylocation : null,

        getlocation : function(){

            var fallback = ( this.get("type") === "showcase" )
                            ? this.get("venue") : this.get("home");

            if( this.primarylocation ) {
                return this.primarylocation
            }

            // Get location. Either content or home.
            this.primarylocation= (!_.has(this.attributes, "location") || _.isNull(this.get("location")))
                            ? fallback : this.get("location");

            return this.primarylocation
        }

    });

    var Items = Backbone.Collection.extend({
        model: ContentItem
    });

    var Country = Backbone.Model.extend({
        defaults: {
            "name"                : "",
            "shortcode"           : "",
            "exhibition"          : ""
        }
    });

    var Countries = Backbone.Collection.extend({
        model: Country
    });

    var app = (function(){

        var self = this,

            models = new Items(),
            countries = new Countries(),
            appview = {},
            currenttype = "showcase";
            currentcountryfilter = "",
            lastzoom = -1,

            fillmissingdata = function(data){

                // If no images. Avoids error in templating.
                if(!_.has(data, "images")){
                    data.images = false;
                }

                // If no custom caption. 
                if(!_.has(data, "custom_caption")){
                    data.custom_caption = "";
                }

                // If no custom tags. 
                if(!_.has(data, "custom_tags") || _.isNull(data.custom_tags)) {
                    data.custom_tags = [];
                }

                // If no country.
                if(!_.has(data, "country")){
                    this.country = null;
                }

                if( _.isNull(data.location)
                        && !_.has(data, "venue")
                        && !_.has(data, "home") ){
                            console.log("No geo: ", data);
                            return false;
                        }

                return data;

            },

            handleData = function( contentdata, countrymap ){

                var filleddata = {};
                // Loop all items.
                for (var i = 0; i < contentdata.length; i++) {
                    contentdata[i].shortcode = ( _.has(countrymap, contentdata[i].country))
                            ? countrymap[contentdata[i].country].shortcode : "";

                    contentdata[i].exhibition = ( _.has(countrymap, contentdata[i].country))
                            ? countrymap[contentdata[i].country].exhibition : "";

                    filleddata = fillmissingdata(contentdata[i]);
                    if( filleddata ){
                        models.add( filleddata );
                    }
                }

                appview = new AppView({collection: models, countries : countries});
                appview.render();


                // Create country models.
                for( var c in countrymap ){
                    countrymap[c].country = c;
                    countries.add( countrymap[c] );
                }

                // Event listeners.
                common.on("filtercountry", function(country){
                    filterCountry( country, true );
                });
                common.on("filtertype", setType );
                common.on("filtertypereset", function(){
                    if( currenttype === "showcase" ){
                        return;
                    }
                    if( currentcountryfilter !== "" ){
                        filterCountry( currentcountryfilter );
                        appview.toggleoffcountryfilter();
                    }
                    appview.resetworld();
                });

                // Filter content after all movements and scaling.
                appview.map.on("moveend", pinsWithinBounds);

                // Cache first zoom.
                lastzoom = appview.map.getZoom();

                // Init view.
                filterType();

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
                        appview.resetworld();
                    } else if ( bounds.length > 0 ){
                        appview.map.fitBounds(bounds, { maxZoom : 12 });
                    }
                }

                appview.layout();

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
                    loc, $el = $(".js-filter-type[data-type='"+currenttype+"']");

                $el.addClass("is-selected");

                models.each(function(item){
                    loc = item.getlocation();

                    if( item.get("type") !== currenttype ){
                        item.set("isfiltered-type", true);
                    } else {
                        item.set("isfiltered-type", false);
                        bounds.push([loc.latitude, loc.longitude]);
                    }

                });


                // TODO - Do we want to do anything with bounds here.
                if( currenttype === "showcase" ){
                    // Set to central London.
                    appview.map.setView(common.getConfig("centrallondon"), 12 );
                } else {
                    // Reset to world.
                    appview.resetworld();
                }

                appview.layout();

            },

            pinsWithinBounds = function(){

                var currbounds = appview.map.getBounds(),
                    currzoom = appview.map.getZoom(),
                    i = 0, isWithinBounds = false,
                    zoomthreshold = common.getConfig("contentzoomthreshold");


                /* Disbling this feature for the time being. Causing comlications.
                // If zooming out and ... and ...
                if( currzoom < lastzoom
                        && currentcountryfilter !== ""
                        && zoomthreshold > currzoom ){

                    // ...turn off country filter if its on.
                    filterCountry( currentcountryfilter );
                    appview.toggleoffcountryfilter();
                }
                */

                // Zooming out.
                if( currzoom < lastzoom ){
                    appview.map.closePopup();

                }

                lastzoom = currzoom;

                models.each(function(item){

                    var loc = item.getlocation();

                    isWithinBounds = currbounds.contains(L.latLng(loc.latitude, loc.longitude));
                    if( currzoom >= zoomthreshold && isWithinBounds ){
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
