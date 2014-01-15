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
        numbercontent = 0,
        attribution = 'Map data &copy; '
                +' <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors',

        init = function(){

            var options = {
                zoomControl : false,
                maxZoom : 25, 
                minZoom : 2
            };

            map = L.mapbox.map('map', 'danielc-s.gn7b251h', options)
                   .setView([25, -4], 3);

            L.control.zoom({ position : "topright" }).addTo(map);

            $(".fullscreen").on("click", function(){
                togglefullscreen(document.getElementById("app"));
            });

        },

        togglefullscreen = function(elem){

            if (!window.screenTop && !window.screenY) {
                cancelfullscreen(elem);
            } else {
                requestfullscreen(elem);
            }

        },

        cancelfullscreen = function(el) {

            var element = document;
            // Supports most browsers and their versions.
            var requestMethod = element.exitFullScreen || element.cancelFullScreen || element.webkitCancelFullScreen || element.mozCancelFullScreen || element.msExitFullScreen;
            console.log(requestMethod);

            if (requestMethod) {
                requestMethod.call(element);
            }
        },

        requestfullscreen = function(element, requestMethod) {
            // Supports most browsers and their versions.
            var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

            if (requestMethod) { // Native full screen.
                requestMethod.call(element);
            } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
                var wscript = new ActiveXObject("WScript.Shell");
                if (wscript !== null) {
                    wscript.SendKeys("{F11}");
                }
            }
        },

        filterCountry = function( countryfilter ){

            var i = 0,
                togglingOff = ( currentcountryfilter === countryfilter ),
                bounds = [], activeType = false, loc = {};

            numbercontent = 0;

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

            if( currenttype === "studio" ){
                // scale to fit all markers.
                if( togglingOff === true ){
                    map.fitWorld();
                } else {
                    map.fitBounds(bounds, { maxZoom : 17 });
                }
            }

            contentview.layout();

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

            contentview.layout();

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

            /*
            models.on("change:inviewport", calcamountcontent, this);
            models.on("change:isfiltered-country", calcamountcontent, this);
            models.on("change:isfiltered-type", calcamountcontent, this);
            */

        },

        calcamountcontent = function(item){

            if( item.get("inviewport") === true
                    && item.get("isfiltered-country") === false
                    && item.get("isfiltered-type") === false ){
                        numbercontent++;
                    }

            console.log(numbercontent);

        },

        renderPins = function(){

            var pins = { showcase: [], studio: [] },
                pin = {};

            models.each(function(item){

                var type = "",
                    customtags = item.get("custom_tags"),
                    removeindex = -1;

                if( _.contains(customtags, "showcase") ){
                    item.set("type", "showcase");
                } else {
                    item.set("type", "studio");
                }

                type = item.get("type");
                removeindex = (customtags)?customtags.indexOf(type):-1;
                if( removeindex >= 0 ){
                    customtags.splice(removeindex, 1);
                    item.set("custom_tags", customtags);
                }

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

            contentview.layout();

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

    // xhr.open("GET", "http://mysterious-crag-7636.herokuapp.com/output.json", false);
    xhr.open("GET", "http://localhost:5000/output.json", false);
    // xhr.open("GET", "data/output001.json", false);
    xhr.send();

};
