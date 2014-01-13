var Pin = Backbone.Model.extend({
    defaults: {
        removed             : false,
        "isfiltered-type"     : false,
        "isfiltered-country"  : false
    }
});

var Pins = Backbone.Collection.extend({
    model: Pin
});

var ContentItem = Backbone.Model.extend({
    defaults: {
        removed             : false,
        inviewport          : false,
        "isfiltered-type"     : false,
        "isfiltered-country"  : false
    }
});

var Items = Backbone.Collection.extend({
    model: ContentItem
});

var app = (function(){

    var self = this,

        models = new Items(),
        map = {}, 
        countrygroups = {}, designergroups = {},
        typegroups = { "studio" : L.layerGroup(), "showcase" : L.layerGroup() },
        contentview = {};
        currenttype = "studio";
        filterview = {};
        currentcountryfilter = "",
        attribution = 'Map data &copy; '
                +' <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors',

        init = function(){

            map = L.map('map', { zoomControl : false })
                   .setView([25, -4], 3);

            // L.tileLayer("http://api.tiles.mapbox.com/v3/danielc-s.gn7b251h.json", {
            L.tileLayer("http://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                            attribution: attribution,
                            maxZoom: 25, minZoom: 2
                        }).addTo(map);

            L.control.zoom({ position : "topright" }).addTo(map);

        },

        filterCountry = function( countryfilter ){

            var i = 0,
                togglingOff = ( currentcountryfilter === countryfilter ),
                bounds = [], activeType = false;


            // Set current or remove current.
            currentcountryfilter = togglingOff === true ? "" : countryfilter;

            for(var c in countrygroups){
                if( ! togglingOff && c != countryfilter ){
                    // All countries not clicked on. i.e. isfiltered==true
                    map.removeLayer( countrygroups[c] );
                    countrygroups[c].eachLayer(function(countrygroup){
                        countrygroup.eachLayer(function(layer){
                            i = layer.models.length;
                            while( i-- ){
                                layer.models[i].set("isfiltered-country", true);
                            }
                        });
                    });
                } else {
                    // Country clicked on. i.e. isfiltered==false
                    map.addLayer( countrygroups[c] );
                    countrygroups[c].eachLayer(function(countrygroup){
                        countrygroup.eachLayer(function(layer){
                            i = layer.models.length;
                            while( i-- ){
                                layer.models[i].set("isfiltered-country", false);
                            }
                            bounds.push(layer.getLatLng());
                        });
                    });
                }
            }

            // Scale to fit all markers.
            if( togglingOff === false ){
                map.fitBounds(bounds);
            } else {
                map.fitWorld();
            }


        },

        setType = function( type ){

            if( type == currenttype ){
                return;
            }

            currenttype = type;
            filterType();

        },


        filterType = function(){

            console.log( "Type", currenttype );

            for(var t in typegroups){
                if( t != currenttype ){
                    typegroups[t].eachLayer(function(layer){
                        map.removeLayer( layer );
                        _.each(layer.models, function(model){
                            model.set("isfiltered-type", true);
                        });
                    });
                } else {
                    typegroups[t].eachLayer(function(layer){
                        map.addLayer( layer );
                        _.each(layer.models, function(model){
                            model.set("isfiltered-type", false);
                        });
                    });
                }
            }

        },

        handleData = function( data ){
            // Loop all items.
            for (var i = 0; i < data.length; i++) {
                models.add(data[i]);
            }

            // Init main content Backbone views.
            contentview = new ContentView({ collection: models });
            filterview = new FilterPanelView();

            renderPins();
            renderFilters();

            // Event listeners.
            filterview.on("filtercountry", filterCountry );
            filterview.on("filtertype", setType );

            $(".controls__filters").on("click", function(e){

                e.preventDefault();
                filterview.togglepanel();

            });

            map.on("moveend", pinsWithinBounds);

        },

        renderPins = function(){

            var pins = { showcase: [], studio: [] };
            models.each(function(item){

                var userid = item.get("user_id"),
                    country = item.get("country"),
                    pin, lGroup = {},
                    marker, type = "studio",
                    isnewcountry = (country in countrygroups) ? false : true,
                    currcountrygroups = {};

                if( _.contains(item.get("custom_tags"), "showcase") ){
                    type = "showcase";
                    marker = { icon : L.divIcon({className: 'showcase-marker'}) };
                } else {
                    type = "studio";
                    // marker = { icon : L.Icon.Default };
                }

                // Organise into country and user hierarchy.
                // Each user has a layer group.
                countrygroups[country] = countrygroups[country] || L.layerGroup();
                designergroups[userid] = L.layerGroup();
                countrygroups[country].addLayer( designergroups[userid] );
                if( isnewcountry ){
                    typegroups[type].addLayer( countrygroups[country] );
                }

                // Get location. Either content or home.
                var loc = _.isNull(item.get("location"))
                                ? item.get("home") : item.get("location");

                // If other pin exists here then just append model.
                if( loc.latitude+""+loc.longitude in pins[type] ){
                    // Add model to same pin.
                    pins[type][loc.latitude+""+loc.longitude].models.push( item );
                } else {
                    // else make pin.
                    pin = L.marker([loc.latitude, loc.longitude], marker);
                    pins[type][loc.latitude+""+loc.longitude] = pin;
                    // Add first model to pin. There may be more
                    // particularly if they are at the users home location.
                    pin.models = [item];
                    // Add pin to layer group.
                    lGroup = designergroups[userid];
                    lGroup.addLayer(pin);
                    // Add to either studio or showcase group.
                }

            });

            // Finally add the groups.
            for(var t in typegroups){
                map.addLayer( typegroups[t] );
            }

            // this.filterType();
        },

        renderFilters = function(){

            /*
            ["AUS", "AUT", "BOL", "BHR", "CHN", "DEN",
            "EST", "JPN", "KOR", "LON", "LUX", "MAL",
            "POR", "ROM", "RUS", "SVG", "SER", "SLO",
            "SRI", "SWI", "TRI", "SWE", "UKR", "VIE"].forEach(function(item){
                countrygroups[item] = {};
            });
            */

            for(var country in countrygroups){
                filterview.addone( country );
            }

        },

        pinsWithinBounds = function(){

            var currbounds = map.getBounds(),
                currzoom = map.getZoom(),
                i = 0, isWithinBounds = false;

            for(var c in countrygroups){
                // Nested leaflet layerGroups.
                countrygroups[c].eachLayer(function (countrygroup) {
                    countrygroup.eachLayer(function(layer){
                        isWithinBounds = currbounds.contains(layer.getLatLng());
                        i = layer.models.length;
                        while( i-- ){
                            if( currzoom >= 7 && isWithinBounds ){
                                console.log("Add - Country: ", c);
                                layer.models[i].set("inviewport", true);
                            } else {
                                layer.models[i].set("inviewport", false);
                            }
                        }
                    });
                });
            }
        };

    return {

        init : init,
        handleData : handleData

    };

})();



window.onload = function(){

    // Set underscore templateing to handlebar style.
    _.templateSettings = {
          'interpolate': /{{([\s\S]+?)}}/g
    };

    app.init();

    var xhr=new XMLHttpRequest();
    xhr.onload = function(){
        app.handleData(JSON.parse(this.responseText));
    };
    // xhr.open("GET", "http://mysterious-crag-7636.herokuapp.com/output.json", false);
    xhr.open("GET", "http://localhost:5000/output.json", false);
    // xhr.open("GET", "data/output001.json", false);
    xhr.send();

};
