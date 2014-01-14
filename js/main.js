var ContentItem = Backbone.Model.extend({
    defaults: {
        removed             : false,
        inviewport          : false,
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
                        bounds.push([loc.latitude, loc.longitude]);
                    }
                }

            });

            if( currenttype === "studio" ){
                // scale to fit all markers.
                if( togglingOff === true ){
                    map.fitWorld();
                } else {
                    map.fitBounds(bounds, { maxZoom : 17 });
                }
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

            if( currenttype === "showcase" ){
                map.fitBounds(bounds, { maxzoom : 12 });
            } else {
                // TODO - Determine whether we want to do this 
                // for studio. Speak to X,F & D.
                // map.fitbounds(bounds, { maxzoom : 17 });
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

            var pins = { showcase: [], studio: [] },
                pin = {};

            models.each(function(item){

                var type = "";

                if( _.contains(item.get("custom_tags"), "showcase") ){
                    item.set("type", "showcase");
                } else {
                    item.set("type", "studio");
                }

                type = item.get("type");
                loc = item.getlocation();

                // If other pin exists here then just append model.
                if( loc.latitude+""+loc.longitude in pins[type] ){
                    // Add model to same pin.
                    pins[type][loc.latitude+""+loc.longitude].addmodel( item );
                } else {
                    // else make pin.
                    pin = new PinView({model:item}).render(map);
                    map.addLayer( pin.layer );
                    pins[type][loc.latitude+""+loc.longitude] = pin;
                }
            });

            filterType();

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

            var countries = [];
            models.each(function(item){
                var c = item.get("country");
                if( countries.indexOf(c) < 0 ){
                    countries.push(c);
                }
            });

            for (var i = 0; i < countries.length; i++) {
                filterview.addone( countries[i] );
            }

        },

        pinsWithinBounds = function(){

            var currbounds = map.getBounds(),
                currzoom = map.getZoom(),
                i = 0, isWithinBounds = false;

            models.each(function(item){
                var loc = item.getlocation();

                isWithinBounds = currbounds.contains(L.latLng(loc.latitude, loc.longitude));
                if( currzoom >= 7 && isWithinBounds ){
                    item.set("inviewport", true);
                } else {
                    item.set("inviewport", false);
                }

            });

        };

    return {

        init : init,
        handleData : handleData

    };

})();



window.onload = function(){

    // Set underscore templateing to handlebar style.
    app.init();

    var xhr=new XMLHttpRequest();
    xhr.onload = function(){
        app.handleData(JSON.parse(this.responseText));
    };

    xhr.open("GET", "http://mysterious-crag-7636.herokuapp.com/output.json", false);
    // xhr.open("GET", "http://localhost:5000/output.json", false);
    // xhr.open("GET", "data/output001.json", false);
    xhr.send();

};
