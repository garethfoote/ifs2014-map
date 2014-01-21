define(["mapbox", "packery"], function(L, Packery) {

    var Common = function(){

        this.pckry = {};

        var self = this,
            config = {
                contentzoomthreshold : 5
            },

            initPackery = function( el, options ){

                self.pckry = new Packery( el, options );

                return self.pckry;

            };

        return {
            initPackery : initPackery,
            getConfig : function(name){
                return config[name];
            }
        };
    };

    return _.extend(new Common(), Backbone.Events);

});
