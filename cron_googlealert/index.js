'use strict';

const GOOGLE_ALERT_RSS_URL = process.env.GOOGLE_ALERT_RSS_URL || '【GoogleアラートのRSSフィードのURL】';
const GOOGLE_ALERT_SEARCH_KEYWORD = process.env.GOOGLE_ALERT_SEARCH_KEYWORD || '【Googleアラートに指定したキーワード】';

const base_url = "【Node.jsサーバのURL】";

const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');
const Headers = fetch.Headers;

const Parser = require('rss-parser');
const parser = new Parser();

(async () =>{
  var feed = await parser.parseURL(GOOGLE_ALERT_RSS_URL);  
  if( feed.items.length <= 0 )
    return;

  feed.items.forEach(item =>{
    console.log(item.title);
  });

  try{
    var created_at = new Date().getTime();
    for( var i = 0 ; i < feed.items.length ; i++ ){
      var item = feed.items[i];
      console.log(item);
      var param = {
        keyword: GOOGLE_ALERT_SEARCH_KEYWORD,
        title: item.title,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
        id: item.id,
        link: item.link,
        created_at: created_at
      };
      await do_post(base_url + '/linebot-googlealert-push', param );
    }
  }catch(error){
    console.error(error);
  }
})();

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