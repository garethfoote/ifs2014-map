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

        if( this.model.get("type") == "showcase" ){
            icon = L.icon({
                    iconUrl: 'img/marker_grey.png',
                    shadowUrl: 'img/marker_shadow.png',

                    iconSize:     [50, 81],
                    shadowSize:   [78, 58],
                    iconAnchor:   [25, 66],
                    shadowAnchor: [39, 29],
                    popupAnchor:  [0, -50]
           });
        } else {
            icon = L.icon({
                    iconUrl: 'img/marker_red.png',
                    shadowUrl: 'img/marker_shadow.png',

                    //iconSize:     [widthPin, widthPin*ratioPin],
                    // shadowSize:   [widthShadow, widthShadow*ratioShadow],
                    iconSize:     [50, 81],
                    shadowSize:   [78, 58],
                    iconAnchor:   [25, 66],
                    shadowAnchor: [39, 29],
                    popupAnchor:  [0, -50]
            });
        }

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

var ContentView = Backbone.View.extend({

    el : $("#content"),
    $contentcontainer : {},
    $contentitems : {},
    children : {},
    timekeys : [],
    timemap  : {},
    packery : {},

    initialize : function(){

        this.collection.on("change:inviewport", this.filteredHandler, this);
        this.collection.on("change:isfiltered-country", this.filteredHandler, this);
        this.collection.on("change:isfiltered-type", this.filteredHandler, this);

        this.$contentcontainer = this.$(".content__items");
        this.$contentitems = this.$(".content-item");

        this.packery = new Packery( this.$contentcontainer.get(0), {
                itemSelector: '.content-item',
                transitionDuration: "0s"
        });

    },

    layout : function( numitems ){

        var self = this;

        this.packery.reloadItems();
        this.packery.layout();

        if( this.$contentitems.length > 0 ){
            $(".overlay--content").removeClass("is-empty");
        } else {
            $(".overlay--content").addClass("is-empty");
        }

    },

    filteredHandler : function(item){

       if( item.get("inviewport") === true
            && item.get("isfiltered-country") === false
            && item.get("isfiltered-type") === false ){
            this.addone( item );
        } else {
            this.removeone( item );
        }

    },

    getPosition : function( created ){

        this.timekeys.push( created );
        this.timekeys.sort();
        this.timekeys.reverse();

        return this.timekeys.indexOf( created );

    },

    addone : function( contentitem ){

        var id = contentitem.get("id"),
            created = contentitem.get("created_time"),
            domindex;

        if( !(id in this.children) && contentitem.get("removed") === false ){

            domindex = this.getPosition( created );

            // Add.
            // console.log("Add", id);

            var view = new ItemView({ model: contentitem });
            if( domindex === 0 ){
                this.$contentcontainer.prepend(view.render().$el);
            } else {
                this.$contentitems.eq(domindex-1).after(view.render().$el);
            }

            // Cache for removal
            this.children[id] = view;

            // this.packery.addItems(view.$el.get(0));

        } else if( contentitem.get("removed") === true ){

            domindex = this.getPosition( created );

            // Re-add.
            if( domindex === 0 ){
                this.$contentcontainer.prepend(this.children[id].$el);
            } else {
                this.$contentitems.eq(domindex-1).after(this.children[id].$el);
            }
            // console.log("Re-add", id);
            this.children[id].delegateEvents();

            // this.packery.addItems(this.children[id].$el.get(0));

        } else {
            // console.log("Already added", id);
        }

        // Recache content-items.
        this.$contentitems = this.$(".content-item");

    },

    removeone : function( contentitem ){

        var id = contentitem.get("id"),
            created = contentitem.get("created_time");

        if( id in this.children ){

            this.packery.remove(this.children[id].$el.get(0));
            this.children[id].remove();
            contentitem.set("removed", true);

            // Remove for sorting.
            this.timekeys.splice( this.timekeys.indexOf(created), 1 );
            // Recache content-items.
            this.$contentitems = this.$(".content-item");

        }

    }

});

var ItemView = Backbone.View.extend({

    template: _.template( $('#ifstpl__content-item').html() ),
    tagName: "div",
    className: "content-item",
    events : {


    },

    initialize : function(){

        this.model.on("change:focus", this.focusHandler, this );

    },

    focusHandler : function(){

        if( this.model.get("focus") === true ){
            this.$el.addClass("is-focussed");
        } else {
            this.$el.removeClass("is-focussed");
        }

    },

    render : function(){

        // If no custom caption. Avoids error in templating.
        if(!_.has(this.model.attributes, "custom_caption")){
            this.model.set("custom_caption", "No caption.");
        }

        // If no custom tags. Avoids error in templating.
        if(!_.has(this.model.attributes, "custom_tags") || _.isNull(this.model.get("custom_tags"))) {
            this.model.set("custom_tags", []);
        }

        // Render template.
        this.$el.html(this.template(this.model.attributes));
        // Add data for ordering and selection.
        this.$el.data("created_time", this.model.get("created_time"));
        this.$el.data("id", this.model.get("id"));

        this.focusHandler();

        return this;
    },

    focus : function(){

        this.model.set("focus", true);

    },

    unfocus : function(){

        this.model.set("focus", false);
    }

});

var FilterPanelView = Backbone.View.extend({

    el : $(".filters-panel"),
    events : {
        "click .filter__type"    : "toggleType",
        "click .filter__country" : "filterCountry"
    },

    addone : function( country ){

        var num = this.$(".filter__country-inner").length;

        var view = new CountryFilterView( country );
        this.$(".js-filters-panel-countries")
            .append( view.render( country, (num%2==0)).$el );

    },

    filterCountry : function( e ){

        var $el = $(e.currentTarget);

        if( $el.hasClass("is-selected") ){
            // Deslect active one.
            $el.removeClass("is-selected");
        } else {
            // Deselect all classes.
            this.$(".filter__country").removeClass("is-selected");
            // Add new one.
            $el.addClass("is-selected");
        }

        this.trigger("filtercountry", $el.data("country"));

    },

    toggleType : function( e ){

        var $el = $(e.currentTarget);

        e.preventDefault();

        if( $el.hasClass("is-selected") ){
            return;
        } else {
            this.$(".filter__type").removeClass("is-selected");
            $el.addClass("is-selected");
        }

        this.trigger("filtertype", $el.data("type"));

    },

    togglepanel : function(){

        var $app = $("#app"), $ctrl = $(".controls__filters");
        $app.toggleClass("has-hidden-filters");
        $ctrl.toggleClass("is-open");

    }

});

var CountryFilterView = Backbone.View.extend({


    template: _.template( $('#ifstpl__filter-country').html() ),
    tagName: "a",
    className: "filter filter__country",

    render : function( country, even ){

        // TODO - Map country full names to country codes.
        this.$el.html( this.template({ country : country.substr(0,3) }));
        this.$el.addClass((!even)?" is-even":" is-odd");
        this.$el.data("country", country );

        return this;
    }
});
