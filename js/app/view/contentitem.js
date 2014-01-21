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

            // If no custom caption. Avoids error in templating.
            if(!_.has(this.model.attributes, "custom_caption")){
                this.model.set("custom_caption", "");
            }

            // If no custom tags. Avoids error in templating.
            if(!_.has(this.model.attributes, "custom_tags") || _.isNull(this.model.get("custom_tags"))) {
                this.model.set("custom_tags", []);
            }

            // Render template.
            this.$el.html(this.template(this.model.attributes));
            // Add data for ordering and selection.
            this.$el.data("created_time", this.model.get("created_time"));
            this.$el.data("id", this.model.get("id"));

            this.focusHandler();

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