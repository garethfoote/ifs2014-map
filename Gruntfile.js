module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-sprite-packer');
    grunt.loadNpmTasks('grunt-contrib-clean');


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
            }
        },
        spritepacker: {
            all: {
                options: {
                    template: './css/sprite.scss.hbs',
                    destCss: './css/sprite.scss',
                    evenPixels: true,
                    padding: 2
                },
                files: {
                    './img/sprite.png': ['./img/src/*.png']
                }
            }
        },
        clean : {
            build : ['./img/sprite.png', './css/sprite.scss' ]
        },
        ngmin: {
            files: {

            }
        },
        connect: {
            main : {
                options: {
                    port : 8000,
                    hostname : 'localhost'
                }

            }
        }
    });

    grunt.registerTask('default', ['connect', 'watch']);
    grunt.registerTask('sprites', ['clean', 'spritepacker']);

};
