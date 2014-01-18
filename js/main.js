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

            map = L.mapbox.map('map', 'danielc-s.h0hhc1fe', options)
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

        handleVenueData = function( data ){


            map.markerLayer.on('layeradd', function(e) {
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
            L.mapbox.featureLayer(data.features).addTo(map);

            // L.geoJson( data.features ).addTo(map);

        },

        handleData = function( contentdata, countrymap ){


            // Loop all items.
            for (var i = 0; i < contentdata.length; i++) {
                contentdata[i].shortcode = ( _.has(countrymap, contentdata[i].country))
                        ? countrymap[contentdata[i].country].shortcode : "";
                models.add(contentdata[i]);
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

            var countries = {};
            models.each(function(item){
                var c = item.get("country");
                if( !(c in countries) ){
                    countries[c] = item;
                }
            });

            for (var c in countries) {
                filterview.addone( countries[c] );
            }

        },

        pinsWithinBounds = function(){

            var currbounds = map.getBounds(),
                currzoom = map.getZoom(),
                i = 0, isWithinBounds = false,
                zoomLevelThreshold = 5;

            models.each(function(item){

                var loc = item.getlocation();

                isWithinBounds = currbounds.contains(L.latLng(loc.latitude, loc.longitude));
                if( currzoom >= zoomLevelThreshold && isWithinBounds ){
                    item.set("inviewport", true);
                } else {
                    item.set("inviewport", false);
                }

            });

            contentview.layout();

        };

    return {

        init : init,
        handleData : handleData,
        handleVenueData : handleVenueData

    };

})();



window.onload = function(){

    // Set underscore templateing to handlebar style.
    app.init();

    var venuesdataurl = "data/venuemarkers.json",
        dataurl = "http://mysterious-crag-7636.herokuapp.com/output.json",
        // dataurl = "http://localhost:5000/output.json",
        countrydataurl = "data/countrymap.json",
        iscountrydataloaded = false, iscontentdataloaded = false,
        loadeddata = { content : {}, countries : {} };

    $.getJSON( dataurl, function( data ) {
        iscontentdataloaded = true;
        loadeddata.content = data;
        if( iscountrydataloaded === true ){
            app.handleData( loadeddata.content, loadeddata.countries );
        }
    });

    $.getJSON( countrydataurl, function( data ) {
        iscountrydataloaded = true;
        loadeddata.countries = data;
        if( iscontentdataloaded === true ){
            app.handleData( loadeddata.content, loadeddata.countries );
        }
    });

    $.getJSON( venuesdataurl, function( data ) {
        app.handleVenueData( data );
    }).error(function(e) { console.log("error", e); });

    // xhr.open("GET", "http://mysterious-crag-7636.herokuapp.com/output.json", false);
    // xhr.open("GET", "http://localhost:5000/output.json", false);
    // xhr.open("GET", "data/output001.json", false);
};
