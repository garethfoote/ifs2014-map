define([
        "app/common",
        "app/view/countryfilter"
       ],
function( common, CountryFilterView ) {

    var FilterPanelView = Backbone.View.extend({

        el : $(".filters-panel"),
        $infocountry : $(".controls__filter-info--country"),
        $infozoom : $(".controls__filter-info--zoom"),
        events : {
            "click .filter__type"    : "toggleType",
            "click .filter__country" : "filterCountry"
        },

        addone : function( country ){

            var num = this.$(".filter__country-inner").length;

            var view = new CountryFilterView( {model:country} );
            this.$(".js-filters-panel-countries")
                .append( view.render( (num%2==0)).$el );

        },

        filterCountry : function( e ){

            var $el = $(e.currentTarget);

            e.preventDefault();

            if( $el.hasClass("is-selected") ){
                // Deslect active one.
                $el.removeClass("is-selected");
                this.$infocountry.removeClass("has-filter");
            } else {
                // Deselect all classes.
                this.$(".filter__country").removeClass("is-selected");
                // Add new one.
                $el.addClass("is-selected");
                $(".controls__filter-info__country", this.$info).html($el.data("country"));
                this.$infocountry.addClass("has-filter");
            }

            common.trigger("filtercountry", $el.data("country"));

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

            common.trigger("filtertype", $el.data("type"));

        },

        toggleoffcountry : function(){

            this.$(".is-selected").removeClass("is-selected");
            this.$infocountry.removeClass("has-filter");
        },

        togglepanel : function(){

            var $app = $("#app"), $ctrl = $(".controls__filters");
            $app.toggleClass("has-hidden-filters");
            $ctrl.toggleClass("is-open");

        }

    });

    return FilterPanelView;

});
