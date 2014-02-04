define(["app/common", "app/view/contentitem" ], function(common, ItemView) {

    var ContentView = Backbone.View.extend({

        el : $("#content"),
        $contentcontainer : {},
        $contentitems : {},
        children : {},
        timekeys : [],
        timemap  : {},
        pckry : {},

        initialize : function(){

            this.collection.on("change:inviewport", this.filteredHandler, this);
            this.collection.on("change:isfiltered-country", this.filteredHandler, this);
            this.collection.on("change:isfiltered-type", this.filteredHandler, this);

            this.$contentcontainer = this.$(".content__items");
            this.$contentitems = this.$(".content-item");

            this.pckry = common.initPackery( this.$contentcontainer.get(0), {
                itemSelector: '.content-item',
                transitionDuration: "0s"
            });

        },

        // Called whenever content items have finished being laid out.
        layout : function( numitems ){

            var self = this,
                areallcomplete = true;

            if( this.$contentitems.length === 0 ){
                $("#app").addClass("is-empty");
            } else {

                // Must show first otherwise no image loading.
                $("#app").removeClass("is-empty");

                // Layout chronolgically listed items.
                this.pckry.reloadItems();
                this.pckry.layout();

                $("img", this.$contentitems).each(function(index, el){
                    if( el.complete===false || el.height === 0 ){
                        areallcomplete = false;
                        // Give it a second in case this has
                        // already rendered and gets called immediately 
                        // causeing infinte loopage.
                        setTimeout(function(){
                            $(el).load(self.layout.call(self));
                        }, 100);
                        // Break out of each function.
                        return false;
                    }
                });

            }

        },

        filteredHandler : function(item){

           if( item.get("inviewport") === true
                && item.get("isfiltered-country") === false
                && item.get("isfiltered-type") === false ){
                this.addone( item );
                if( item.get("focus") === true ){
                    this.$contentcontainer.addClass("is-focussed");
                }
            } else {
                this.removeone( item );
            }

        },

        getPosition : function( created ){

            this.timekeys.push( created );
            this.timekeys.sort();
            this.timekeys.reverse();

            return this.timekeys.indexOf( created );

        },

        addone : function( contentitem ){

            var id = contentitem.get("id"),
                created = contentitem.get("created_time"),
                domindex;

            if( !(id in this.children) && contentitem.get("removed") === false ){

                domindex = this.getPosition( created );

                // Add.
                // console.log("Add", id);

                var view = new ItemView({ model: contentitem });
                if( domindex === 0 ){
                    this.$contentcontainer.prepend(view.render().$el);
                } else {
                    this.$contentitems.eq(domindex-1).after(view.render().$el);
                }

                // Cache for removal
                this.children[id] = view;

            } else if( contentitem.get("removed") === true ){

                domindex = this.getPosition( created );

                // Re-add.
                if( domindex === 0 ){
                    this.$contentcontainer.prepend(this.children[id].$el);
                } else {
                    this.$contentitems.eq(domindex-1).after(this.children[id].$el);
                }
                // console.log("Re-add", id);
                this.children[id].delegateEvents();

            } else {
                // console.log("Already added", id);
            }

            // Recache jquery object content-items.
            this.$contentitems = this.$(".content-item");

        },

        removeone : function( contentitem ){

            var id = contentitem.get("id"),
                created = contentitem.get("created_time");

            if( id in this.children ){

                this.pckry.remove(this.children[id].$el.get(0));
                this.children[id].remove();
                contentitem.set("removed", true);

                // Remove for sorting.
                this.timekeys.splice( this.timekeys.indexOf(created), 1 );
                // Recache content-items.
                this.$contentitems = this.$(".content-item");

            }

        }

    });


    return ContentView;

});
