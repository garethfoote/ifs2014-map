define(["mapbox", "packery", "app/polyfills"], function(L, Packery) {

    var Common = function(){

        this.pckry = {};

        var self = this,
            config = {
                contentzoomthreshold : 5,
                centrallondon : [51.51301590715673, -0.20290374755859375],
                startpos : [25, -4],
                startscale : 3
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
