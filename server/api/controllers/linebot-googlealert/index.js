'use strict';

const DB_HOST = '【MySQLサーバのホスト名】';
const DB_USER = '【MySQLサーバのユーザ名】';
const DB_PASSWORD = "【MySQLサーバのパスワード】";
const DB_PORT = 3306;
const DB_DATABASE = "googlealert";

const config = {
  channelAccessToken: '【LINEボットのチャネルアクセストークン(長期)】',
  channelSecret: '【LINEボットのチャネルシークレット】',
};
const LIFF_ID = "【LINEのLIFF-ID】";

const HELPER_BASE = process.env.HELPER_BASE || '../../helpers/';
const Response = require(HELPER_BASE + 'response');
const LineUtils = require(HELPER_BASE + 'line-utils');
const line = require('@line/bot-sdk');
const app = new LineUtils(line, config);

var dbconn;
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE
})
.then(ret =>{
  dbconn = ret;
})
.catch(error =>{
  console.error(error);
});

app.message(async (event, client) =>{
  var message = app.createSimpleResponse("LIFFアプリはこちら\n https://liff.line.me/" + LIFF_ID);
  return client.replyMessage(event.replyToken, message);
});

app.follow(async (event, client) =>{
  var memberId = (event.source.type == 'user') ? event.source.userId : event.source.groupId;
  var sql_insert = `INSERT INTO members (memberId, type) VALUES ('${memberId}', '${event.source.type}')`;
  await dbconn.query(sql_insert);
});

app.unfollow(async (event, client) =>{
  var memberId = event.source.type == 'user' ? event.source.userId : event.source.groupId;
  var sql_delete = `DELETE FROM members WHERE memberId = '${memberId}' AND type = '${event.source.type}'`;
  await dbconn.query(sql_delete);
});

exports.fulfillment = app.lambda();

exports.handler = async (event, context, callback) => {
  if( event.path == '/linebot-googlealert-push' ){
    var body = JSON.parse(event.body);

    var sql_query = `SELECT id FROM items WHERE id = '${body.id}'`;
    const [rows] = await dbconn.query(sql_query);

    var index = rows.findIndex(rows_item => body.id == rows_item.id );
    if( index < 0 ){
      var sql_insert = `INSERT INTO items (id, keyword, content, pubDate, created_at) VALUES ('${body.id}', '${body.keyword}', '${JSON.stringify(body)}', '${new Date(body.pubDate).getTime()}', ${body.created_at})`;
      await dbconn.query(sql_insert);
    
      var sql_select = `SELECT memberId FROM members`;
      const [rows] = await dbconn.query(sql_select);

      var message = app.createSimpleCard(body.title, 'キーワード: ' + body.keyword, body.contentSnippet, 'ブラウザで開く', { type: 'uri', uri: body.link } );
      rows.forEach( row =>{
        app.client.pushMessage(row.memberId, message);
      });
    }

    return new Response({});
  }else
  if( event.path == '/linebot-googlealert-list' ){
    var body = JSON.parse(event.body);

    var startTime;
    var endTime;
    if( !body.year || !body.month ){
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      startTime = today.getTime();
      var tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      endTime = tomorrow.getTime();
    }else
    if( body.year && body.month == 0 ){
      var thisYear = new Date();
      thisMonth.setFullYear(body.year);
      thisMonth.setMonth(0);
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      startTime = thisYear.getTime();
      var nextYear = new Date(thisYear);
      nextMonth.setFullYear(thisYear.getFullYear() + 1);
      endTime = nextYear.getTime();
    }else{
      var thisMonth = new Date();
      thisMonth.setFullYear(body.year);
      thisMonth.setMonth(body.month - 1);
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      startTime = thisMonth.getTime();
      var nextMonth = new Date(thisMonth);
      nextYear.setMonth(thisMonth.getMonth() + 1);
      endTime = nextMonth.getTime();
    }

    var sql_select = `SELECT * FROM items WHERE pubDate >= ${startTime} AND pubDate < ${endTime} ORDER BY pubDate DESC`;
    const [rows] = await dbconn.query(sql_select);

    return new Response(rows);
  }else
  if( event.path == '/linebot-googlealert-likes' ){
    var body = JSON.parse(event.body);

    var sql_update = `UPDATE items SET likes = ${body.likes} WHERE id = '${body.id}'`;
    await dbconn.query(sql_update);

    return new Response({});
  }
};
