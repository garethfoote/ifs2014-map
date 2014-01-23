define(function() {

    var CountryFilterView = Backbone.View.extend({

        template: _.template( $('#ifstpl__filter-country').html() ),
        tagName: "a",
        className: "filter filter__country",

        render : function( even ){

            var sc = this.model.get("shortcode");
            this.$el.html( this.template({ country : sc }));
            this.$el.addClass((!even)?" is-even":" is-odd");
            this.$el.data("country", this.model.get("country") );
            this.$el.attr( "href", "#" );
            if( sc.length > 3 ){
                this.$el.addClass("is-long");
            }

            return this;
        }
    });

    return CountryFilterView;

});
