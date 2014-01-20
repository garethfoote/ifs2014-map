module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-sprite-packer');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');


    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            dev: {
                options: {
                    lineNumbers: 'true'
                },
                files: {
                    './css/main.css': './css/main.scss'
                }
            },
            dist: {
                options: {
                    style: 'compressed'
                },
                files: {
                    './dist/css/main.css': './css/main.scss'
                }
            }
        },
        watch: {
            sass: {
                files: './css/**/*.scss',
                tasks: ['sass:dev']
            },
             js : {
                 files: ['./js/**/*.js', '!./js/dist.js'],
                 tasks: ['requirejs:dist'],
                 options: {
                     livereload: 35729
                 }
             }
        },
        connect: {
            main : {
                options: {
                    port : 8000,
                    hostname : 'localhost'
                }

            }
        },
         requirejs: {
             dist: {
                 options: {
                       baseUrl: 'js',
                       paths : {
                            "mapbox" : "empty:"
                       },
                       // Include the main configuration file.
                       mainConfigFile: "js/app/config.js",
                       // Output file.
                       out: 'js/dist.js',
                       // Root application module.
                       name: "app/config",
                       inlineText : false,
                       optimize: "uglify"
                 }
             }
         }
    });

    grunt.registerTask('default', ['connect', 'watch']);
    grunt.registerTask('sprites', ['clean', 'spritepacker']);
    grunt.registerTask('build', ['requirejs']);

};
