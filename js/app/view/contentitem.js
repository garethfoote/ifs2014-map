define(["app/common"], function(common) {

    var ItemView = Backbone.View.extend({

        template: _.template( $('#ifstpl__content-item').html() ),
        tagName: "div",
        className: "content-item",
        events : {

        },

        initialize : function(){

            this.model.on("change:focus", this.focusHandler, this );

        },

        focusHandler : function(){

            if( this.model.get("focus") === true ){
                this.$el.parent().addClass("is-focussed");
                this.$el.addClass("is-focussed");
            } else {
                this.$el.parent().removeClass("is-focussed");
                this.$el.removeClass("is-focussed");
            }

        },

        render : function(){

            // Render template.
            this.$el.html(this.template(this.model.attributes));
            // Add data for ordering and selection.
            this.$el.data("created_time", this.model.get("created_time"));
            this.$el.data("id", this.model.get("id"));

            if( this.model.get('focus') === true ){
                this.focusHandler();
            }


            return this;
        },

        focus : function(){

            this.model.set("focus", true);

        },

        unfocus : function(){

            this.model.set("focus", false);
        }

    });

    return ItemView;

});
