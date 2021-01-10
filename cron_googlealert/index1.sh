#!/bin/sh

export GOOGLE_ALERT_RSS_URL="【GoogleアラートのRSSフィードのURL】"
export GOOGLE_ALERT_SEARCH_KEYWORD="【Googleアラートに指定したキーワード】"
cd /home/XXXX/projects/node/cron_googlealert
/home/XXXX/.nvm/versions/node/v12.19.0/bin/node index.js
