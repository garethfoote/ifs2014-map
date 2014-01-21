define(["app/common"], function(common) {

    var PinView = Backbone.View.extend({

        layer : {},
        map : {},

        initialize : function(){

            this.model.on("change:isfiltered-country", this.filter, this);
            this.model.on("change:isfiltered-type", this.filter, this);

        },

        render : function( map ){

            var icon, ratioPin = 161/100, ratioShadow = 116/156,
                widthPin = 50, widthShadow = 78;

            this.map = map;

            icon = L.icon({
                    iconUrl: 'img/marker_red.png',
                    iconRetinaUrl: 'img/marker_red@2x.png',
                    shadowUrl: 'img/marker_shadow.png',
                    shadowRetinaUrl: 'img/marker_shadow@2x.png',

                    iconSize:     [25, 40],
                    shadowSize:   [25, 19],
                    iconAnchor:   [12, 34],
                    shadowAnchor: [12, 10],
                    popupAnchor:  [0, -25]
            });

            // Get location. Either content or home.
            var loc = _.isNull(this.model.get("location"))
                            ? this.model.get("home") : this.model.get("location"),
                tplhtml = _.template($("#ifstpl__popup").html(), this.model.attributes);

            this.layer = L.marker([loc.latitude, loc.longitude], { icon : icon });
            // Popup.
            this.layer.bindPopup(tplhtml).openPopup();
            this.layer.on("popupopen", this.popupopenhandler, this);
            this.layer.on("popupclose", this.popupclosehandler, this);

            // Contains mutliple models associated with this view.
            // All models contain same data as far as this view is concerned
            // e.g. lat long, country, type
            this.extramodels = [];

            return this;

        },

        addmodel : function( model ){

            this.extramodels.push( model );

        },

        getExtraModels : function(){

            return this.extramodels;

        },

        filter : function(){

            if( this.model.get("isfiltered-country") === false
                && this.model.get("isfiltered-type") === false ){
                // console.log("Add", this);
                this.map.addLayer( this.layer );
            } else {
                // console.log("Remove", this);
                this.map.removeLayer( this.layer );
            }

        },

        popupclosehandler : function( e ){

            this.unfocus();

        },

        popupopenhandler : function( e ){

            this.focus();

        },

        focus : function(){

            var i = this.extramodels.length;

            this.model.set("focus", true);
            while( i-- ){
                this.extramodels[i].set("focus", true);
            }

        },

        unfocus : function(){

            var i = this.extramodels.length;

            this.model.set("focus", false);
            while( i-- ){
                this.extramodels[i].set("focus", false);
            }

        }

    });

    return PinView;

});