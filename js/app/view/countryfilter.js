define(function() {

    var CountryFilterView = Backbone.View.extend({

        template: _.template( $('#ifstpl__filter-country').html() ),
        tagName: "a",
        className: "filter filter__country",

        render : function( even ){

            this.$el.html( this.template({ country : this.model.get("shortcode") }));
            this.$el.addClass((!even)?" is-even":" is-odd");
            this.$el.data("country", this.model.get("country") );
            this.$el.attr( "href", "#" );

            return this;
        }
    });

    return CountryFilterView;

});
