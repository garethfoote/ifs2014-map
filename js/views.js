var PinView = Backbone.View.extend({

    layer : {},
    map : {},

    initialize : function(){

        // this.model.on("change:inviewport", this.filter, this);
        this.model.on("change:isfiltered-country", this.filter, this);
        this.model.on("change:isfiltered-type", this.filter, this);

    },

    render : function( map ){

        var marker;

        this.map = map;

        if( this.model.get("type") == "showcase" ){
            marker = { icon : L.divIcon({className: 'showcase-marker'}) };
        } else {
            // marker = { icon : L.Icon.Default };
        }

        // Get location. Either content or home.
        var loc = _.isNull(this.model.get("location"))
                        ? this.model.get("home") : this.model.get("location"),
            tplhtml = _.template($("#ifstpl__popup").html(), this.model.attributes);

        this.layer = L.marker([loc.latitude, loc.longitude], marker);
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
    $contentitems : {},
    children : {},

    initialize : function(){

        this.collection.on("change:inviewport", this.filteredHandler, this);
        this.collection.on("change:isfiltered-country", this.filteredHandler, this);
        this.collection.on("change:isfiltered-type", this.filteredHandler, this);

        this.$contentitems = this.$(".content__items");

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

    updateSortMap : function(){




    },

    addone : function( contentitem ){

        var id = contentitem.get("id");

        if( !(id in this.children) && contentitem.get("removed") === false ){

            // Add.
            console.log("Add", id);

            var view = new ItemView({ model: contentitem });
            // TODO - Add in order.
            this.$contentitems.append( view.render().$el );

            // Cache for removal
            this.children[id] = view;

        } else if( contentitem.get("removed") === true ){

            // Re-add.
            this.$(".content__items").append( this.children[id].$el );
            console.log("Re-add", id);
            this.children[id].delegateEvents();

        } else {
            console.log("Already added", id);
        }

    },

    removeone : function( contentitem ){

        var id = contentitem.get("id");

        if( id in this.children ){

            this.children[id].remove();
            contentitem.set("removed", true);

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

        if( this.$el.hasClass("is-open") ){
            this.$el.removeClass("is-open");
            this.$el.css("left", "-100%");
        } else {
            this.$el.addClass("is-open");
            this.$el.css("left", "0");
        }

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
