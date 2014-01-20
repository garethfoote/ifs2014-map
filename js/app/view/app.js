define(["app/common",
        "app/view/content",
        "app/view/filterpanel",
        "app/view/pin"],
function( common, ContentView, FilterPanelView, PinView ) {

    // Private functions.
    var renderPins = function(map, models){

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

    renderFilters = function(view, models){

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
            view.addone( countries[c] );
        }

    },

    togglefullscreen = function(elem){

        if (!window.screenTop && !window.screenY) {
            cancelfullscreen(elem);
        } else {
            requestfullscreen(elem);
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

    cancelfullscreen = function(el) {

        var element = document;
        // Supports most browsers and their versions.
        var requestMethod = element.exitFullScreen || element.cancelFullScreen || element.webkitCancelFullScreen || element.mozCancelFullScreen || element.msExitFullScreen;
        console.log(requestMethod);

        if (requestMethod) {
            requestMethod.call(element);
        }
    };

    var AppView = Backbone.View.extend({

        el : $("#app"),
        map : {},
        contentview : {},
        filterview : {},
        events : {
            "click .controls__filters" : "togglefilterpanel"
        },

        initialize : function(){

            var options = {
                zoomControl : false,
            };

            var tileoptions = {
                maxZoom : 25,
                minZoom : 2,
                noWrap : true
            };

            this.map = L.map('map', options).setView([25, -4], 3);            
            L.mapbox.tileLayer('danielc-s.h0hhc1fe', tileoptions).addTo(this.map);

            L.control.zoom({ position : "topright" }).addTo(this.map);

            $(".fullscreen").on("click", function(){
                togglefullscreen(document.getElementById("app"));
            });

        },

        render : function(){

            // Init main content Backbone views.
            this.contentview = new ContentView({ collection: this.collection });
            this.filterview = new FilterPanelView();

            renderPins(this.map, this.collection);
            renderFilters(this.filterview, this.collection);

        },

        toggleoffcountryfilter : function(){

            this.filterview.toggleoffcountry();

        },

        togglefilterpanel : function( e ){

            e.preventDefault();
            this.filterview.togglepanel();

        },

        layout : function(){

            this.contentview.layout();
        }

    });


    return AppView;

});
