var ContentView = Backbone.View.extend({
    el : $("#content"),
    children : {},

    initialize : function(){

        this.collection.on("change:inviewport", this.filteredHandler, this);
        this.collection.on("change:isfiltered-country", this.filteredHandler, this);
        this.collection.on("change:isfiltered-type", this.filteredHandler, this);

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

    addone : function( contentitem ){

        var id = contentitem.get("id");

        if( !(id in this.children) && contentitem.get("removed") === false ){

            // Add.
            console.log("Add", id);

            var view = new ItemView({ model: contentitem });
            // TODO - Add in order.
            this.$(".content__items").append( view.render().$el );

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

    render : function(){

        // Render template.
        this.$el.html(this.template(this.model.attributes));
        // Add data for ordering and selection.
        this.$el.data("created_time", this.model.get("created_time"));
        this.$el.data("id", this.model.get("id"));

        return this;
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
