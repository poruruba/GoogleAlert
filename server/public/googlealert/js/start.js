'use strict';

//var vConsole = new VConsole();

const base_url = "ÅyNode.jsÉTÅ[ÉoÇÃURLÅz";


var vue_options = {
    el: "#top",
    data: {
        progress_title: '', // for progress-dialog

        item_list_today: [],
        item_list: [],
        target_month: 0,
        target_year: 0,
        target_year_list: [],
        has_likes: 0
    },
    computed: {
    },
    methods: {
        list_update_default: async function(){
            this.target_month = this.now.getMonth() + 1;
            this.target_year = this.now.getFullYear();
            return this.list_update();
        },
        list_update_today: async function(today){
            var param = {};
            var list = await do_post(base_url + "/linebot-googlealert-list", param );
            for( var i = 0 ; i < list.length ; i++ )
                list[i].content = JSON.parse(list[i].content);
            this.item_list_today = list;
        },
        list_update: async function(){
            var param = {
                year: this.target_year,
                month: this.target_month,
            };
            var list = await do_post(base_url + "/linebot-googlealert-list", param );
            for( var i = 0 ; i < list.length ; i++ )
                list[i].content = JSON.parse(list[i].content);
            this.item_list = list;
        },
        change_likes: async function(target, increment){
            console.log(target);
            var target_likes = ( increment ) ? (target.likes + 1) : (target.likes - 1);
            if( target_likes < 0 ) target_likes = 0;
            var param = {
                id: target.id,
                likes: target_likes
            };
            await do_post(base_url + "/linebot-googlealert-likes", param );
            var t1 = this.item_list.find(item => item.id == target.id );
            if( t1 )
                this.$set(t1, "likes", target_likes);
            var t2 = this.item_list_today.find(item => item.id == target.id );
            if( t2 )
                this.$set(t2, "likes", target_likes);
        },
    },
    created: function(){
    },
    mounted: async function(){
        proc_load();

        this.now = new Date();
        for( var i = 0 ; i < 5 ; i++ )
            this.target_year_list.push(this.now.getFullYear() - i );
        this.target_month = this.now.getMonth() + 1;
        this.target_year = this.now.getFullYear();

        this.list_update_today();
        this.list_update();
    }
};
vue_add_methods(vue_options, methods_bootstrap);
vue_add_components(vue_options, components_bootstrap);
var vue = new Vue( vue_options );

function do_post(url, body) {
    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  
    return fetch(new URL(url).toString(), {
        method: 'POST',
        body: JSON.stringify(body),
        headers: headers
      })
      .then((response) => {
        if (!response.ok)
          throw 'status is not 200';
        return response.json();
      });
  }