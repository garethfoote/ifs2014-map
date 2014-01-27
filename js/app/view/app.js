define(["app/common",
        "text!data/countrymap.json",
        "app/view/content",
        "app/view/filterpanel",
        "app/view/pin"],
function( common, countrymapdata, ContentView, FilterPanelView, PinView ) {

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
            "click .js-toggle-filters" : "togglefilterpanel"
        },

        initialize : function( options ){

            var tileurl = 'http://{s}.tile.cloudmade.com/EF97C7CAB8924037BEFDF16FB9EE9BFD/119481/256/{z}/{x}/{y}.png',
                mapoptions = {
                    zoomControl : false,
                    attributionControl: false
                },
                tileoptions = {
                    maxZoom : 25,
                    minZoom : 2,
                    noWrap : true,
                    attribution: "<a href='http:\/\/mapbox.com\/about\/maps' target='_blank'>Terms & Feedback<\/a>"
                };

            this.map = L.map('map', mapoptions).setView(common.getConfig("startpos"), common.getConfig("startscale"));
            // L.mapbox.tileLayer('danielc-s.h0hhc1fe', tileoptions).addTo(this.map);
            // L.mapbox.tileLayer('garethfoote.gp6gm5ln', tileoptions).addTo(this.map);
            L.tileLayer(tileurl, tileoptions).addTo(this.map);
            L.control.zoom({ position : "topright" }).addTo(this.map);

            common.on("pinclick", this.pinclickhandler, this);

            $(".js-fullscreen").on("click", function(e){
                e.preventDefault();
                togglefullscreen(document.getElementById("app"));
            });

            options.countries.on("add", this.renderFilter, this);

        },

        resetworld : function(){

            this.map.setView(common.getConfig("startpos"), common.getConfig("startscale"));

        },

        pinclickhandler : function(loc){

            var zoomthreshold = common.getConfig("contentzoomthreshold");
            if( this.map.getZoom() < zoomthreshold ){
                this.map.setView(L.latLng(loc.latitude, loc.longitude), zoomthreshold);
            }

        },

        render : function(){

            // Init main content Backbone views.
            this.contentview = new ContentView({ collection: this.collection });
            this.filterview = new FilterPanelView();

            renderPins(this.map, this.collection);

        },

        renderFilter : function( country ){

            this.filterview.addone( country );

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
