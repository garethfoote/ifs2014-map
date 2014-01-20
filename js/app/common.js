define(["mapbox", "packery"], function(L, Packery) {

    var Common = function(){

        this.pckry = {};

        var self = this,

            initPackery = function( el, options ){

                self.pckry = new Packery( el, options );

                return self.pckry;

            };

        return {
            initPackery : initPackery
        };
    };

    return _.extend(new Common(), Backbone.Events);

});
