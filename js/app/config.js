require.config({
    deps : ["app/main"],
    baseUrl: "js",
    paths : {
        "app" : "app",
        "text" : "vendor/require/text",
        "data" : "../data",
        "mapbox" : "vendor/mapbox/mapbox",
        "packery" : "vendor/packery/packery.pkgd.min",
        "jquery" : "vendor/jquery/jquery-1.10.2.min",
        "lodash" : "vendor/lodash/lodash.min",
        "backbone" : "vendor/backbone/backbone-min"
    },
    shim : {
        "app/main" : {
            "deps" : [ "mapbox", "backbone", "app/polyfills" ]
        },
        "mapbox" : {
            "exports" : "L"
        },
        "backbone" : {
            "deps" : ["lodash", "jquery"],
            "exports" : "Backbone"
        },
        "lodash" : {
            "exports" : "_"
        }
    }
});
