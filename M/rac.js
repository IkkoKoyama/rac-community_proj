/*


sudo systemctl stop nginx.service
kill -9 `cat /var/www/racco/tmp/pids/unicorn.pid`
rake assets:clobber assets:precompile
find app/assets/ -type f -exec touch {} \;
rake assets:clobber assets:precompile
RAILS_ENV=production rake assets:precompile
bundle exec unicorn_rails -E production -c config/unicorn.rb -D
sudo systemctl start nginx.service


users.user_level = [
  {
    level:1,
    name:"system manager"
  },{
    level:2,
    name:"district officer"
  },{
    level:3,
    name:"club officer"
  },{
    level:4,
    name:"general member"
  },{
    level:5,
    name:"stock holder(rotarian)"
  },{
    level:6,
    name:"OB・OG"
  },{
    level:7,
    name:"visitor"
  }
];
※
user_level = 1 ...like rwx
user_level in (2,3) ... like rw-
user_level in (4,5) ...like r--
※

events.read_level = [
  {
    level:1,
    name:"all user"
  },{
    level:2,
    name:"limit in same districter"
  },{
    level:3,
    name:"limit in same cluber"
  }
];
events.category_id = [
  {
    id:1,
    name:"regular meetings"
  },{
    id:2,
    name:"outside Activities"
  },{
    id:3,
    name:"volunteers"
  },{
    id:4,
    name:"chilling out"
  }
];


*/

let bcrypt = require('bcrypt');
const saltRounds = 10;

let post = process.env.PORT || 8000;
let fs = require('fs');
let express = require('express');
let mysql = require('mysql');
let bodyparser = require('body-parser');

let app = express();
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

String.prototype.escape_str = function() {
  let string = this;
  string = string.replace(/&/g, '&amp;');
  string = string.replace(/</g, '&lt;');
  string = string.replace(/>/g, '&gt;');
  string = string.replace(/"/g, '&quot;');
  string = string.replace(/'/g, '&#39;');
  return string;
}

const connect_db_query = (db,sql,values) => {
  return new Promise((resolve,reject) => {
    try {
      let DB_obj = mysql.createConnection(db);
      DB_obj.query(sql,values,function(err,rows,fields) {
        if (err) {
          reject({dataExists:false,reson:err});
        } else {
          resolve({dataExists:true,data:rows});
        }
      });
      DB_obj.end();
    } catch(err) {
      reject({dataExists:false,reson:err});
    }
  });
}
const init_db_info = (sender) => {
  let return_obj = {
    host:'localhost',
    database:"racco",
    user:"root",
    password:"root",
    user_level:sender.user_level,
    user_id:sender.id,
    club_id:sender.club_id,
    district_id:sender.district_id
  }
  return return_obj;
}

/* login API */
app.post('/login',async function(req,res) {
  let email = req.body.email;
  let password = req.body.password;
  let sql =
  `
  select
    user.id as "user_id",
    user.name as "user_name",
    user.email as "user_email",
    user.user_level as "user_level",
    user.password as "user_password",
    club.id as "club_id",
    club.district_id as "district_id"
  from
    users user
  left join
    clubs club on club.id = user.club_id
  where
    user.email = ?
  `;
  let db = {host:'localhost',user:'root',password:'root',database:'racco'}
  let resData = ``;
  let result = await connect_db_query(db,sql,[email]);
  if (result.dataExists && result.data.length == 1) {
    let data = result.data[0];
    let passComBool = bcrypt.compareSync(password,data.user_password);
    if (passComBool) {
      let obj = JSON.stringify({
        db_i_dataExists:passComBool,
        user_id:`${data.user_id}`,
        user_name:`${data.user_name}`,
        user_level:`${data.user_level}`,
        club_id:`${data.club_id}`,
        district_id:`${data.district_id}`
      });
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(obj);
    } else {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('{\"userExists\":false}');
    }
  } else {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('{\"userExists\":false}');
  }
});

/* read "/home" API */
/* and only this API section is written with general annotations */
app.post('/home_ajax',async function(req,res) {
  /* API init processor */
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  /* session some db infomations  */
  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  /* ps ...query starts date,pe ...query end date */
  let ps = req_data.ps;
  let pe = req_data.pe;

  /* type => when you'd make limit which event's category is */
  const trend_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      ev.sub_title as "sub_title",
      ev.description as "event_description",
      ev.category_id as "event_category_id",
      ifnull(DATE_FORMAT(ev.deadline, "%Y-%m-%d"),"2100-01-01") as "deadline",
      DATE_FORMAT(ev.date, "%Y-%m-%d") as "sdate",
      stime as "stime",
      cl.id as "club_id",
      cl.short_name as "club_name",
      ifnull(el.count,0) + ifnull(erg.count,0) as "total_count",
      ifnull(el.count,0) as "event_like",
      ifnull(erg.count,0) as "event_register",
      ifnull(erg.my_count,0) as "my_register"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    left join (
      select
        event_id,
        count(*) as "count"
      from
        event_likes
      group by
        event_id
    ) el on el.event_id = ev.id
    left join (
      select
        event_id,
        count(distinct user_id) as "count",
        count(distinct case when user_id = ? then user_id else null end) as "my_count"
      from
        registers
      group by
        event_id
    ) erg on erg.event_id = ev.id
    where
      ev.date >= ? and
      ev.date <= ? and
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      )
    group by
      ev.updated_at
    order by
      total_count desc
    limit 10
    `;
    return sql;
  }
  const dist_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      ev.sub_title as "sub_title",
      ev.description as "event_description",
      ev.category_id as "event_category_id",
      ifnull(DATE_FORMAT(ev.deadline, "%Y-%m-%d"),"2100-01-01") as "deadline",
      DATE_FORMAT(ev.date, "%Y-%m-%d") as "sdate",
      stime as "stime",
      cl.id as "club_id",
      cl.short_name as "club_name",
      ifnull(el.count,0) + ifnull(erg.count,0) as "total_count",
      ifnull(el.count,0) as "event_like",
      ifnull(erg.count,0) as "event_register",
      ifnull(erg.my_count,0) as "my_register"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    left join (
      select
        event_id,
        count(*) as "count"
      from
        event_likes
      group by
        event_id
    ) el on el.event_id = ev.id
    left join (
      select
        event_id,
        count(distinct user_id) as "count",
        count(distinct case when user_id = ? then user_id else null end) as "my_count"
      from
        registers
      group by
        event_id
    ) erg on erg.event_id = ev.id
    where
      ev.date >= ? and
      ev.club_id in (29) and
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      )
    group by
      ev.updated_at
    order by
      total_count desc
    limit 20
    `;
    return sql;
  }
  const eventN_sql = (type) => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      ev.sub_title as "sub_title",
      DATE_FORMAT(ev.date, "%Y-%m-%d") as "sdate",
      ifnull(DATE_FORMAT(ev.deadline, "%Y-%m-%d"),"2100-01-01") as "deadline",
      stime as "stime",
      ifnull(el.count,0) as "event_like",
      ifnull(erg.count,0) as "event_register",
      ifnull(erg.my_count,0) as "my_register"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    left join (
      select
        event_id,
        count(*) as "count"
      from
        event_likes
      group by
        event_id
    ) el on el.event_id = ev.id
    left join (
      select
        event_id,
        count(distinct user_id) as "count",
        count(distinct case when user_id = ? then user_id else null end) as "my_count"
      from
        registers
      group by
        event_id
    ) erg on erg.event_id = ev.id
    where
      ev.category_id = ${type} and
      ev.date >= ? and
      ev.date <= ? and
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      )
    group by
      event_id
    order by
      sdate asc
    limit 5
    `;
    return sql;
  }

  let result_trend = await connect_db_query(db,trend_sql(),[user_id,ps,pe,user_district_id,user_club_id]);
  let result_dist = await connect_db_query(db,dist_sql(),[user_id,ps,user_district_id,user_club_id]);
  let result_cate1 = await connect_db_query(db,eventN_sql(1),[user_id,ps,pe,user_district_id,user_club_id]);
  let result_cate2 = await connect_db_query(db,eventN_sql(2),[user_id,ps,pe,user_district_id,user_club_id]);
  let result_cate3 = await connect_db_query(db,eventN_sql(3),[user_id,ps,pe,user_district_id,user_club_id]);
  let result_cate4 = await connect_db_query(db,eventN_sql(4),[user_id,ps,pe,user_district_id,user_club_id]);

  /* returning queried datas to RoR server */
  let resData = ``;
  if (result_trend.dataExists) {
    let data = {
      trend:result_trend.data,
      dist:result_dist.data,
      cate1:result_cate1.data,
      cate2:result_cate2.data,
      cate3:result_cate3.data,
      cate4:result_cate4.data
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* read "/event_page" API */
app.post('/event_page_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  let event_id = Number(req_data.event_id);

  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      ev.sub_title as "sub_title",
      ev.description as "event_description",
      ev.category_id as "event_category_id",
      ifnull(DATE_FORMAT(ev.deadline, "%Y-%m-%d"),"2100-01-01") as "deadline",
      DATE_FORMAT(ev.date, "%Y-%m-%d") as "sdate",
      ev.stime as "stime",
      ev.etime as "etime",
      ev.addr as "addr",
      ev.lat as "lat",
      ev.lng as "lng",
      ev.price as "price",
      ev.status as "ev_status",
      ev.perti_type as "perti_type",
      ev.after_chil as "after_chil",
      ev.attachment as "ev_attachment",
      ifnull(ev.capacity,0) as "capacity",
      cl.id as "club_id",
      cl.name as "club_name",
      ifnull(el.rl_count,0) as "event_like_rl",
      ifnull(el.ab_count,0) as "event_like_ab",
      ifnull(erg.count,0) as "event_register",
      ifnull(erg.my_count,0) as "my_register",
      ifnull(ec.count,0) as "event_comment"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    left join (
      select
        event_id,
        count(*) as "rl_count",
        count(distinct user_id) as "ab_count"
      from
        event_likes
      where
        event_id = ?
    ) el on el.event_id = ev.id
    left join (
      select
        event_id,
        count(distinct user_id) as "count",
        count(distinct case when user_id = ? then user_id else null end) as "my_count"
      from
        registers
      where
        event_id = ?
    ) erg on erg.event_id = ev.id
    left join (
      select
        event_id,
        count(*) as "count"
      from
        event_comments
      where
        event_id = ?
    ) ec on ec.event_id = ev.id
    where
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      ) and
      ev.id = ?
    `;
    return sql;
  }
  const user_sql = () => {
    let sql =
    `
    select
      usr.id as "user_id",
      usr.name as "user_name"
    from
      registers regi
    left join
      users usr on usr.id = regi.user_id
    where
      regi.event_id = ?
    group by
      regi.user_id
    order by
      regi.created_at asc
    limit 10
    `;
    return sql;
  }
  const comment_sql = () => {
    let sql =
    `
    select
      DATE_FORMAT(post.created_at,"%Y-%m-%d") as "date",
      DATE_FORMAT(post.created_at,"%H:%i") as "time",
      usr.id as "user_id",
      usr.name as "user_name",
      post.description as "description"
    from
      event_comments post
    left join
      users usr on usr.id = post.user_id
    where
      event_id = ?
    group by
      post.id
    order by
      post.created_at desc
    limit 5
    `;
    return sql;
  }

  let result = await connect_db_query(db,event_sql(),[event_id,user_id,event_id,event_id,user_district_id,user_club_id,event_id]);
  let result_user = await connect_db_query(db,user_sql(),[event_id]);
  let result_comment = await connect_db_query(db,comment_sql(),[event_id]);

  let resData = ``;
  if (result.dataExists && result.data.length == 1) {
    let data = {
      data:result.data[0],
      user:result_user.data,
      comment:result_comment.data
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* read "/search" API */
app.post('/search_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  let bt = Number(req_data.bt);
  let ps = req_data.ps;
  let pe = req_data.pe;
  let category_id = bt == 0 ? `1,2,3,4`: bt;
  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      ev.sub_title as "sub_title",
      ev.description as "event_description",
      ev.category_id as "event_category_id",
      DATE_FORMAT(ev.date, "%Y-%m-%d") as "sdate",
      ifnull(DATE_FORMAT(ev.deadline, "%Y-%m-%d"),"2100-01-01") as "deadline",
      stime as "stime",
      cl.id as "club_id",
      cl.short_name as "club_name",
      ifnull(el.count,0) + ifnull(erg.count,0) as "total_count",
      ifnull(el.count,0) as "event_like",
      ifnull(erg.count,0) as "event_register",
      ifnull(erg.my_count,0) as "my_register"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    left join (
      select
        event_id,
        count(*) as "count"
      from
        event_likes
      group by
        event_id
    ) el on el.event_id = ev.id
    left join (
      select
        event_id,
        count(*) as "count",
        count(case when user_id = ? then id else null end) as "my_count"
      from
        registers
      group by
        event_id
    ) erg on erg.event_id = ev.id
    where
      ev.category_id in (${category_id}) and
      ev.date >= ? and
      ev.date <= ? and
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      )
    group by
      event_id
    order by
      sdate asc
    limit 100
    `;
    return sql;
  }

  let result = await connect_db_query(db,event_sql(),[user_id,ps,pe,user_district_id,user_club_id]);

  let resData = ``;
  if (result.dataExists) {
    let data = result.data;
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* read "/club_page" API */
app.post('/club_page_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  let club_id = Number(req_data.club_id | 0);

  const club_sql = () => {
    let sql =
    `
    select
      cl.name as "club_name",
      cl.short_name as "club_short_name",
      cl.email as "club_email",
      cl.link as "club_link",
      cl.description as "club_description",
      DATE_FORMAT(cl.establish_date,"%Y-%m-%d") as "establish",
      dst.name as "district_name"
    from
      clubs cl
    left join
      districts dst on dst.id = cl.district_id
    where
      cl.id = ?
    `;
    return sql;
  }
  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      DATE_FORMAT(ev.date, "%Y-%m-%d") as "sdate"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    where
      ev.club_id = ? and
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      )
    order by
      sdate desc
    `;
    return sql;
  }
  const user_sql = () => {
    let sql =
    `
    select
      usr.id as "user_id",
      usr.name as "user_name"
    from
      users usr
    left join
      clubs cl on cl.id = usr.club_id
    where
      usr.club_id = ?
    `;
    return sql;
  }

  let result = await connect_db_query(db,club_sql(),[club_id]);
  let result_event = await connect_db_query(db,event_sql(),[club_id,user_club_id,user_district_id]);
  let result_user = await connect_db_query(db,user_sql(),[club_id]);

  let resData = ``;
  if (result.dataExists && result.data.length == 1) {
    let data = {
      data:result.data[0],
      event:result_event.data,
      user:result_user.data
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* read "/user_page" API */
app.post('/user_page_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  let user_id = Number(req_data.user_id | 0);

  const user_sql = () => {
    let sql =
    `
    select
      usr.name as "user_name",
      usr.kana as "user_kana",
      usr.description as "user_description",
      usr.user_level as "user_level",
      DATE_FORMAT(usr.birth,"%m-%d") as "birth_day",
      TIMESTAMPDIFF(YEAR,birth,CURDATE()) as "age",
      usr.job as "job",
      usr.join_year as "join_year",
      usr.position as "user_position",
      usr.email as "user_email",
      cl.id as "club_id",
      cl.name as "club_name"
    from
      users usr
    left join
      clubs cl on cl.id = usr.club_id
    where
      usr.id = ?
    `;
    return sql;
  }

  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      DATE_FORMAT(ev.date, "%Y-%m-%d") as "sdate"
    from
      events ev
    left join
      registers regi on regi.event_id = ev.id
    left join
      clubs cl on cl.id = ev.club_id
    where
      regi.user_id = ? and
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      )
    order by
      sdate desc
    `;
    return sql;
  }

  let result = await connect_db_query(db,user_sql(),[user_id]);
  let result_event = await connect_db_query(db,event_sql(),[user_id,user_district_id,user_club_id]);

  let resData = ``;
  if (result.dataExists && result.data.length == 1) {
    let data = {
      data:result.data[0],
      event:result_event.data
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* read "/my_page" API */
app.post('/my_page_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  const user_sql = () => {
    let sql =
    `
    select
      usr.name as "user_name",
      usr.kana as "user_kana",
      usr.description as "user_description",
      usr.user_level as "user_level",
      usr.position as "user_position",
      DATE_FORMAT(usr.birth,"%m-%d") as "birth_day",
      ifnull(TIMESTAMPDIFF(YEAR,usr.birth,CURDATE()),0) as "age",
      usr.job as "job",
      usr.join_year as "join_year",
      usr.email as "user_email",
      cl.id as "club_id",
      cl.name as "club_name"
    from
      users usr
    left join
      clubs cl on cl.id = usr.club_id
    where
      usr.id = ?
    `;
    return sql;
  }

  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      DATE_FORMAT(ev.date, "%Y-%m-%d") as "sdate"
    from
      events ev
    left join
      registers regi on regi.event_id = ev.id
    where
      regi.user_id = ?
    order by
      sdate desc
    `;
    return sql;
  }

  let result = await connect_db_query(db,user_sql(),[user_id]);
  let result_event = await connect_db_query(db,event_sql(),[user_id]);

  let resData = ``;
  if (result.dataExists && result.data.length == 1) {
    let data = {
      data:result.data[0],
      event:result_event.data
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* read "/my_page_edit_ajax" API */
app.post('/my_page_edit_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  const user_sql = () => {
    let sql =
    `
    select
      usr.name as "user_name",
      usr.description as "user_description",
      usr.job as "job",
      usr.join_year as "join_year",
      DATE_FORMAT(usr.birth,"%Y-%m-%d") as "birth"
    from
      users usr
    where
      usr.id = ?
    `;
    return sql;
  }

  let result = await connect_db_query(db,user_sql(),[user_id]);

  let resData = ``;
  if (result.dataExists && result.data.length == 1) {
    let data = {
      data:result.data[0]
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* post "user_description_ajax" */
app.post('/user_description_ajax',async function(req,res) {
  /* my_page_edit_ajax.user_description_ajax .... edit post description */
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);

  let value = req_data.value.escape_str();

  let sql = `update users set description = ? where id = ?`;

  let result = await connect_db_query(db,sql,[value,user_id]);

  let resData = ``;
  if (result.dataExists) {
    let data = result.data;
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* post "user_job_ajax" */
app.post('/user_job_ajax',async function(req,res) {
  /* my_page_edit_ajax.user_job_ajax .... edit post job */
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let value = req_data.value.escape_str();

  let sql = `update users set job = ? where id = ?`;

  let result = await connect_db_query(db,sql,[value,user_id]);

  let resData = ``;
  if (result.dataExists) {
    let data = result.data;
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* post "user_birth_ajax" */
app.post('/user_birth_ajax',async function(req,res) {
  /* my_page_edit_ajax.user_birth_ajax .... edit post birthday */
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let value = req_data.value.escape_str();

  let sql = `update users set birth = ? where id = ?`;

  let result = await connect_db_query(db,sql,[value,user_id]);

  let resData = ``;
  if (result.dataExists) {
    let data = result.data;
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* post "user_join_year_ajax" */
app.post('/user_join_year_ajax',async function(req,res) {
  /* my_page_edit_ajax.user_join_year_ajax .... edit post join_year */
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let value = req_data.value.escape_str();

  let sql = `update users set join_year = ? where id = ?`;

  let result = await connect_db_query(db,sql,[value,user_id]);

  let resData = ``;
  if (result.dataExists) {
    let data = result.data;
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* post "user_password_ajax" */
app.post('/user_password_ajax',async function(req,res) {
  /* my_page_edit_ajax.user_password_ajax .... edit post password */

  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);
  let user_id = Number(db.user_id | 0);

  let p0 = req.body.pass_0;
  let p1 = req.body.pass_1;
  let p2 = req.body.pass_2;

  if (p1 == p2) {
    let user_sql = `select password from users where id = ? limit 1`;
    let result = await connect_db_query(db,user_sql,[user_id]);
    let data = result.data[0].password;
    let passComBool = bcrypt.compareSync(p0,data);
    if (passComBool) {
      let pass2_hash = bcrypt.hashSync(p2, saltRounds);

      let update_sql = `update users set password = ? where id = ?`;
      let results = await connect_db_query(db,update_sql,[pass2_hash,user_id]);

      if (results.dataExists) {
        resData = `{\"dataExists\":1}`;
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      } else {
        console.log(result.reason);
        resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      }
    } else {
      resData = '{\"dataExists\":2}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  } else {
    resData = '{\"dataExists\":3}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});

/* create "いいね！ record" API */
app.post('/event_like_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let event_id = Number(req_data.event_id | 0);

  const event_sql = () => {
    let sql = `insert into event_likes (event_id,user_id) values(?,?)`;
    return sql;
  }

  let result = await connect_db_query(db,event_sql(),[event_id,user_id]);

  let resData = ``;
  if (result.dataExists) {
    let data = {
      data:result.data
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* create "register record" API */
app.post('/event_register_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  let event_id = Number(req_data.event_id);

  const authrize_sql = () => {
    let sql =
    `
    select
      count(*) as "count"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    where
      status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      ) and
      ev.id = ?
    `;
    return sql;
  }
  let result = await connect_db_query(db,authrize_sql(),[user_district_id,user_club_id,event_id]);

  let resData = ``;
  if (result.dataExists && result.data.length == 1) {
    let at = req_data.at | 0;
    let pt = req_data.pt | 0;

    const event_sql = () => {
      let sql = `insert into registers (event_id,user_id,at,pt) values(?,?,?,?)`;
      return sql;
    }

    let result_event = await connect_db_query(db,event_sql(),[event_id,user_id,at,pt]);
    if (result_event.dataExists) {
      let data = {data:result.data};
      resData = `{
        \"dataExists\":true,
        \"data\":${JSON.stringify(data)}
      }`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* read "/event_users" API */
app.post('/event_users_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  let event_id = Number(req_data.event_id);

  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      ev.sub_title as "sub_title"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    where
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      ) and
      ev.id = ?
    `;
    return sql;
  }
  const user_sql = () => {
    let sql =
    `
    select
      usr.id as "user_id",
      usr.name as "user_name"
    from
      registers regi
    left join
      users usr on usr.id = regi.user_id
    where
      regi.event_id = ?
    group by
      regi.user_id
    order by
      regi.created_at asc
    `;
    return sql;
  }

  let result = await connect_db_query(db,event_sql(),[user_district_id,user_club_id,event_id]);
  let result_user = await connect_db_query(db,user_sql(),[event_id]);

  let resData = ``;
  if (result.dataExists && result.data.length == 1) {
    let data = {
      data:result.data[0],
      user:result_user.data
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* create "comment record" API */
app.post('/create_comment_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  let event_id = Number(req_data.event_id);
  let text = (req_data.text || "").escape_str();

  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      ev.sub_title as "sub_title"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    where
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      ) and
      ev.id = ?
    `;
    return sql;
  }
  const comment_sql = () => {
    let sql =
    `
    insert event_comments (user_id,event_id,description) values(?,?,?)
    `;
    return sql;
  }

  let result = await connect_db_query(db,event_sql(),[user_district_id,user_club_id,event_id]);
  let result_comment = await connect_db_query(db,comment_sql(),[user_id,event_id,text]);

  let resData = ``;
  if (result.dataExists && result.data.length == 1) {
    let data = {
      data:result.data[0],
      comment:result_comment.data
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});
/* read "/event_comment" API */
app.post('/read_comment_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);

  let event_id = Number(req_data.event_id);

  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "event_id",
      ev.title as "event_title",
      ev.sub_title as "sub_title"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    where
      ev.status = 1 and
      (
        ev.read_level = 1 or
        (ev.read_level = 2 and cl.district_id = ?) or
        (ev.read_level = 3 and cl.id = ?)
      ) and
      ev.id = ?
    `;
    return sql;
  }
  const comment_sql = () => {
    let sql =
    `
    select
      DATE_FORMAT(post.created_at,"%Y-%m-%d") as "date",
      DATE_FORMAT(post.created_at,"%H:%i") as "time",
      usr.id as "user_id",
      usr.name as "user_name",
      post.description as "description"
    from
      event_comments post
    left join
      users usr on usr.id = post.user_id
    where
      event_id = ?
    group by
      post.id
    order by
      post.created_at desc
    `;
    return sql;
  }

  let result = await connect_db_query(db,event_sql(),[user_district_id,user_club_id,event_id]);
  let result_comment = await connect_db_query(db,comment_sql(),[event_id]);

  let resData = ``;
  if (result.dataExists && result.data.length == 1) {
    let data = {
      data:result.data[0],
      comment:result_comment.data
    };
    resData = `{
      \"dataExists\":true,
      \"data\":${JSON.stringify(data)}
    }`;
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  }
});


/* read "/manager_home.events_list_ajax" API */
app.post('/events_list_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let limiter = ``;
  switch (user_level) {
    case 1:
      limiter = ``;
      break;
    case 2:
      // limiter = `where cl.id = ${user_club_id}`;
      limiter = `where cl.district_id = ${user_district_id}`
      break;
    case 3:
      limiter = `where cl.id = ${user_club_id}`;
      break;
    default:
  }

  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "obj_id",
      ev.title as "obj_name",

      DATE_FORMAT(ev.date,"%Y-%m-%d") as "data_0",
      ifnull(DATE_FORMAT(ev.deadline,"%Y-%m-%d"),"0000-00-00") as "data_1",
      ev.category_id as "data_2",
      ev.status as "data_3",
      cl.name as "data_4",
      ev.read_level as "data_5",
      count(distinct regi.user_id) as "data_6",
      count(distinct el.id) as "data_7"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    left join
      registers regi on regi.event_id = ev.id
    left join
      event_likes el on el.event_id = ev.id
    ${limiter}
    group by
      obj_id
    limit
      1000
    `;
    return sql;
  }

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let result = await connect_db_query(db,event_sql(),[]);
    if (result.dataExists) {
      let data = result.data;
      resData = `{
        \"dataExists\":true,
        \"data\":${JSON.stringify(data)}
      }`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.users_list_ajax" API */
app.post('/users_list_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let limiter = ``;
  switch (user_level) {
    case 1:
      limiter = ``;
      break;
    case 2:
      limiter = `where cl.district_id = ${user_district_id}`;
      break;
    case 3:
      limiter = `where cl.id = ${user_club_id}`;
      break;
    default:
  }

  const user_sql = () => {
    let sql =
    `
    select
      usr.id as "obj_id",
      usr.name as "obj_name",
      usr.kana as "obj_kana",
      cl.name as "data_0",
      usr.email as "data_1",
      usr.user_level as "data_2",
      usr.position as "data_3",
      usr.job as "data_4",

      ifnull(DATE_FORMAT(usr.birth,"%Y-%m-%d"),"未設定") as "data_5",
      ifnull(TIMESTAMPDIFF(YEAR,usr.birth,CURDATE()),"未設定") as "data_6"
    from
      users usr
    left join
      clubs cl on cl.id = usr.club_id
    ${limiter}
    group by
      obj_id
    limit
      1000
    `;
    return sql;
  }

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let result = await connect_db_query(db,user_sql(),[]);
    if (result.dataExists) {
      let data = result.data;
      resData = `{
        \"dataExists\":true,
        \"data\":${JSON.stringify(data)}
      }`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.clubs_list_ajax" API */
app.post('/clubs_list_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let limiter = ``;
  switch (user_level) {
    case 1:
      limiter = ``;
      break;
    case 2:
      limiter = `where cl.district_id = ${user_district_id}`;
      break;
    case 3:
      limiter = `where cl.id = ${user_club_id}`;
      break;
    default:
  }

  const club_sql = () => {
    let sql =
    `
    select
      cl.id as "obj_id",
      cl.name as "obj_name",
      cl.email as "data_0",
      cl.link as "data_1",
      dst.name as "data_2",
      count(distinct usr.id) as "data_3"
    from
      clubs cl
    left join
      users usr on usr.club_id = cl.id
    left join
      districts dst on dst.id = cl.district_id
    ${limiter}
    group by
      obj_id
    limit
      1000
    `;
    return sql;
  }

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let result = await connect_db_query(db,club_sql(),[]);
    if (result.dataExists) {
      let data = result.data;
      resData = `{
        \"dataExists\":true,
        \"data\":${JSON.stringify(data)}
      }`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.districts_list_ajax" API */
app.post('/districts_list_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let limiter = ``;
  switch (user_level) {
    case 1:
      limiter = ``;
      break;
    case 2:
      limiter = `where dst.id = ${user_district_id}`;
      break;
    default:
  }

  const district_sql = () => {
    let sql =
    `
    select
      dst.id as "obj_id",
      dst.name as "obj_name",
      count(distinct cl.id) as "data_0",
      count(distinct usr.id) as "data_1"
    from
      districts dst
    left join
      clubs cl on cl.district_id = dst.id
    left join
      users usr on usr.club_id = cl.id
    ${limiter}
    group by
      obj_id
    limit
      1000
    `;
    return sql;
  }

  let resData = ``;
  if (user_level > 2) {
    resData = '{\"dataExists\":false,\"reason\":\"your acount is not authrized to access\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let result = await connect_db_query(db,district_sql(),[]);

    if (result.dataExists) {
      let data = result.data;
      resData = `{
        \"dataExists\":true,
        \"data\":${JSON.stringify(data)}
      }`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});

/* read "/manager_home.obj_ajax" API */
app.post('/obj_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  const obj_0_sql = () => {
    let sql =
    `
    select
      obj.id as "obj_id",
      obj.title as "obj_name"
    from
      events obj
    left join
      clubs cl on cl.id = obj.club_id
    ${user_level == 2
      ? `where cl.district_id = ${user_district_id}`
      : user_level == 3
        ? `where cl.id = ${user_club_id}`
        :``}
    group by
      obj_id
    order by
      obj.date desc
    `;
    return sql;
  }
  const obj_1_sql = () => {
    let sql =
    `
    select
      obj.id as "obj_id",
      obj.name as "obj_name"
    from
      users obj
    left join
      clubs cl on cl.id = obj.club_id
    ${user_level == 2
      ? `where cl.district_id = ${user_district_id}`
      : user_level == 3
        ? `where cl.id = ${user_club_id}`
        :``}
    group by
      obj_id
    `;
    return sql;
  }
  const obj_2_sql = () => {
    let sql =
    `
    select
      obj.id as "obj_id",
      obj.name as "obj_name"
    from
      clubs obj
    ${user_level == 2
      ? `where obj.district_id = ${user_district_id}`
      : user_level == 3
        ? `where obj.id = ${user_club_id}`
        :``}
    group by
      obj_id
    `;
    return sql;
  }
  const obj_3_sql = () => {
    let sql =
    `
    select
      obj.id as "obj_id",
      obj.name as "obj_name"
    from
      districts obj
    ${user_level == 2
      ? `where obj.id = ${user_district_id}`
      : ``}
    group by
      obj_id
    `;
    return sql;
  }

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let result_0 = await connect_db_query(db,obj_0_sql(),[]);
    let result_1 = await connect_db_query(db,obj_1_sql(),[]);
    let result_2 = user_level <= 3 ? await connect_db_query(db,obj_2_sql(),[]) : {dataExists:true,data:[]};
    let result_3 = user_level <= 2 ? await connect_db_query(db,obj_3_sql(),[]) : {dataExists:true,data:[]};

    if (result_0.dataExists) {
      let data = {
        data_0:result_0.data,
        data_1:result_1.data,
        data_2:result_2.data,
        data_3:result_3.data
      }

      resData = `{
        \"dataExists\":true,
        \"data\":${JSON.stringify(data)}
      }`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});

/* read "/manager_home.create_event_ajax" API */
app.post('/create_event_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let title = (req_data.title || "").escape_str();
    let sub_title = (req_data.sub_title || "").escape_str();
    let club_id = req_data.club_id | 0;
    let cate_id = req_data.cate_id | 0;
    let read_level = req_data.read_level | 0;
    let deadline = req_data.deadline || "";
    let date = req_data.date || "";
    let stime = req_data.stime || "";
    let etime = req_data.etime || "";
    let addr = (req_data.addr || "").escape_str();
    let desc = (req_data.desc || "").escape_str();
    let price = req_data.price | 0;
    let capa = req_data.capa | 0;
    let lat = req_data.lat;
    let lng = req_data.lng;
    let perti_type = req_data.perti_type | 0;
    let after_chil = req_data.after_chil | 0;
    let attach = req_data.attachment_type | 0;


    const create_sql = () => {
      let sql =
      `
      insert into
        events(
          title,
          sub_title,
          club_id,
          category_id,
          read_level,
          date,
          stime,
          etime,
          addr,
          lat,
          lng,
          description,
          price,
          capacity,
          attachment,
          perti_type,
          after_chil,
          deadline,
          status
        )
        values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1);
      `;
      return sql;
    }

    let result = await connect_db_query(db,create_sql(),[title,sub_title,club_id,cate_id,read_level,date,stime,etime,addr,lat,lng,desc,price,capa,attach,perti_type,after_chil,deadline]);

    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.update_event_ajax" API */
app.post('/update_event_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let obj_id = req_data.obj_id | 0;

    let title = (req_data.title || "").escape_str();
    let sub_title = (req_data.sub_title || "").escape_str();
    let cate_id = req_data.cate_id | 0;
    let read_level = req_data.read_level | 0;
    let date = req_data.date || "";
    let stime = req_data.stime || "";
    let etime = req_data.etime || "";
    let addr = (req_data.addr || "").escape_str();
    let deadline = req_data.deadline || "";

    let status = req_data.status | 0;
    let desc = (req_data.desc || "").escape_str();
    let price = req_data.price | 0;
    let capa = req_data.capa | 0;
    let lat = req_data.lat;
    let lng = req_data.lng;
    let perti_type = req_data.perti_type | 0;
    let after_chil = req_data.after_chil | 0;
    const update_sql = () => {
      let sql = `update events set title = ?,sub_title = ?,category_id = ?,read_level = ?,date = ?,stime = ?,etime = ?,addr = ?,status = ?,description = ?,price = ?,capacity = ?,lat = ?,lng = ?,perti_type = ?,after_chil = ?,deadline = ? where id = ?`;
      return sql;
    }

    let result = await connect_db_query(db,update_sql(),[title,sub_title,cate_id,read_level,date,stime,etime,addr,status,desc,price,capa,lat,lng,perti_type,after_chil,deadline,obj_id]);

    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.delete_club_ajax" API */
app.post('/delete_event_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let obj_id = req_data.obj_id | 0;

    const delete_sql = () => {
      let sql = `delete from events where id = ?`;
      return sql;
    }

    let result = await connect_db_query(db,delete_sql(),[obj_id]);
    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.change_ev_attach_status_ajax" API */
app.post('/change_ev_attach_status',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let obj_id = req_data.obj_id | 0;

    const update_sql = () => {
      let sql = `update events set attachment = 1 where id = ?`;
      return sql;
    }

    let result = await connect_db_query(db,update_sql(),[obj_id]);
    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});

/* read "/manager_home.create_user_ajax" API */
app.post('/create_user_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let name = (req_data.name || "").escape_str();
    let kana = (req_data.kana || "").escape_str();
    let cl_id = req_data.cl_id | 0;
    let email = (req_data.email || "").escape_str();
    let user_level = req_data.user_level | 0;
    let position = (req_data.position || "").escape_str();
    let birth = req_data.birth || "";
    let job = (req_data.job || "").escape_str();
    let join_year = req_data.join_year || "";

    let password = req_data.pass || "";
    password = bcrypt.hashSync(`${password}`, saltRounds);

    const check_sql = `select id from users where email = ?`;
    let checker = await connect_db_query(db,check_sql,[email]);
    if (checker.dataExists && checker.data.length == 0) {
      const create_sql = () => {
        let sql = `insert into users(name,kana,email,password,user_level,club_id,position,birth,job,join_year) values(?,?,?,?,?,?,?,?,?,?)`;
        return sql;
      }

      let result = await connect_db_query(db,create_sql(),[name,kana,email,password,user_level,cl_id,position,birth,job,join_year]);

      if (result.dataExists) {
        resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      } else {
        resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      }
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"そのメールアドレスはすでに使用されています\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.update_user_ajax" API */
app.post('/update_user_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let obj_id = req_data.obj_id | 0;

    let name = (req_data.name || "").escape_str();
    let kana = (req_data.kana || "").escape_str();
    let user_level = req_data.user_level | 0;
    let position = (req_data.position || "").escape_str();
    let club_id = req_data.club_id | 0;
    let birth = req_data.birth || "";
    let job = (req_data.job || "").escape_str();
    let join_year = req_data.join_year || "";

    const update_sql = () => {
      let sql = `update users set name = ?,kana = ?,user_level = ?,position = ?,club_id = ?,birth = ?,job = ?,join_year = ? where id = ?`;
      return sql;
    }

    let result = await connect_db_query(db,update_sql(),[name,kana,user_level,position,club_id,birth,job,join_year,obj_id]);

    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.delete_club_ajax" API */
app.post('/delete_user_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let obj_id = req_data.obj_id | 0;

    const delete_sql = () => {
      let sql = `delete from users where id = ?`;
      return sql;
    }

    let result = await connect_db_query(db,delete_sql(),[obj_id]);
    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.reset_user_ajax" API */
app.post('/reset_user_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let obj_id = req_data.user_id | 0;
    let password = req_data.pass || "";
    password = bcrypt.hashSync(`${password}`, saltRounds);

    const reset_sql = () => {
      let sql = `update users set password = ? where id = ?`;
      return sql;
    }

    let result = await connect_db_query(db,reset_sql(),[password,obj_id]);

    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});

/* read "/manager_home.create_club_ajax" API */
app.post('/create_club_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 2) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let name = (req_data.name || "").escape_str();
    let short_name = (req_data.short_name || "").escape_str();
    let dst_id = req_data.dst_id | 0;
    let email = (req_data.email || "").escape_str();
    let link = (req_data.link || "").escape_str();
    let desc = (req_data.desc || "").escape_str();
    let establish = req_data.establish || "";

    const create_sql = () => {
      let sql = `insert into clubs(name,short_name,district_id,email,link,description,establish_date) values(?,?,?,?,?,?,?)`;
      return sql;
    }

    let result = await connect_db_query(db,create_sql(),[name,short_name,dst_id,email,link,desc,establish]);

    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.update_club_ajax" API */
app.post('/update_club_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 2) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let obj_id = req_data.obj_id | 0;

    let name = (req_data.name || "").escape_str();
    let short_name = (req_data.short_name || "").escape_str();
    let email = (req_data.email || "").escape_str();
    let link = (req_data.link || "").escape_str();
    let desc = (req_data.desc || "").escape_str();
    let establish = req_data.establish || "";
    const update_sql = () => {
      let sql = `update clubs set name = ?,short_name = ?,email = ?,link = ?,description = ?,establish_date = ? where id = ?`;
      return sql;
    }

    let result = await connect_db_query(db,update_sql(),[name,short_name,email,link,desc,establish,obj_id]);

    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.delete_club_ajax" API */
app.post('/delete_club_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level != 1) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let obj_id = req_data.obj_id | 0;

    const delete_sql = () => {
      let sql = `delete from clubs where id = ?`;
      return sql;
    }

    let result = await connect_db_query(db,delete_sql(),[obj_id]);
    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});

/* read "/manager_home.create_district_ajax" API */
app.post('/create_district_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 1) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let name = (req_data.name || "").escape_str();

    const create_sql = () => {
      let sql = `insert into districts(name) values(?)`;
      return sql;
    }

    let result = await connect_db_query(db,create_sql(),[name]);

    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.update_district_ajax" API */
app.post('/update_district_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;
  if (user_level > 1) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let name = (req_data.name || "").escape_str();
    let obj_id = req_data.obj_id | 0;
    let update_sql = `update districts set name = ? where id = ?`;
    let result = await connect_db_query(db,update_sql,[name,obj_id]);

    if (result.dataExists) {
      resData = `{\"dataExists\":true,\"data\":${JSON.stringify(result.data)}}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});

/* read "/manager_home.obj_edit_ajax" API */
app.post('/obj_edit_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let ot = req_data.obj_type | 0;
  let oid = req_data.obj_id | 0;

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    if (ot == 0) {
      const obj_sql = () => {
        let sql =
        `
        select
          obj.id as "obj_id",
          obj.title as "title",
          obj.sub_title as "sub_title",
          obj.status as "status",
          obj.description as "description",
          obj.category_id as "category_id",
          obj.attachment as "attachment",
          obj.addr as "addr",
          DATE_FORMAT(obj.deadline,"%Y-%m-%d") as "deadline",
          obj.price as "price",
          obj.capacity as "capacity",
          obj.lat as "lat",
          obj.lng as "lng",
          obj.read_level as "read_level",
          obj.perti_type as "perti_type",
          obj.after_chil as "after_chil",
          DATE_FORMAT(obj.date,"%Y-%m-%d") as "date",
          obj.stime as "stime",
          obj.etime as "etime",
          count(distinct el.id) as "like_rl",
          count(distinct el.user_id) as "like_ab",

          cl.id as "club_id",
          cl.name as "club_name"
        from
          events obj
        left join
          clubs cl on cl.id = obj.club_id
        left join
          event_likes el on el.event_id = obj.id
        where
          obj.id = ?
        `;
        return sql;
      }
      const users_sql = () => {
        let sql =
        `
        select
          regi.id as "regi_id",
          regi.at as "at",
          regi.pt as "pt",
          usr.id as "user_id",
          usr.name as "user_name",
          usr.kana as "user_kana",
          usr.email as "user_email",
          usr.user_level as "user_level",
          usr.position as "user_position",
          cl.name as "club_name"
        from
          registers regi
        left join
          users usr on usr.id = regi.user_id
        left join
          clubs cl on cl.id = usr.club_id
        where
          regi.event_id = ?
        group by
          regi.user_id
        order by
          cl.establish_date asc,usr.user_level desc
        `;
        return sql;
      }
      const comments_sql = () => {
        let sql =
        `
        select
          ec.id as "obj_id",
          ec.description as "description",
          DATE_FORMAT(ec.created_at,"%Y-%m-%d") as "date",
          DATE_FORMAT(ec.created_at,"%H:%i") as "time",
          usr.id as "user_id",
          usr.name as "user_name"
        from
          event_comments ec
        left join
          users usr on usr.id = ec.user_id
        where
          ec.event_id = ?
        group by
          ec.id
        order by
          ec.created_at desc
        `;
        return sql;
      }

      let result = await connect_db_query(db,obj_sql(),[oid]);
      let result_users = await connect_db_query(db,users_sql(),[oid]);
      let result_comments = await connect_db_query(db,comments_sql(),[oid]);

      if (result.dataExists) {
        let data = {
          data:result.data[0],
          users:result_users.data,
          comments:result_comments.data
        }
        resData = `{
          \"dataExists\":true,
          \"data\":${JSON.stringify(data)}
        }`;
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      } else {
        resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      }
    } else if (ot == 1) {
      const obj_sql = () => {
        let sql =
        `
        select
          obj.id as "obj_id",
          obj.name as "obj_name",
          obj.kana as "kana",
          obj.user_level as "user_level",
          obj.position as "position",
          obj.email as "email",
          obj.description as "description",
          DATE_FORMAT(obj.birth,"%Y-%m-%d") as "birth",
          obj.job as "job",
          obj.join_year as "join_year",
          cl.id as "cl_id",
          cl.name as "cl_name"
        from
          users obj
        left join
          clubs cl on cl.id = obj.club_id
        where
          obj.id = ?
        `;
        return sql;
      }
      let result = await connect_db_query(db,obj_sql(),[oid]);

      if (result.dataExists) {
        let data = {data:result.data[0]}
        resData = `{
          \"dataExists\":true,
          \"data\":${JSON.stringify(data)}
        }`;
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      } else {
        resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      }
    } else if (ot == 2) {
      const obj_sql = () => {
        let sql =
        `
        select
          obj.id as "obj_id",
          obj.name as "obj_name",
          obj.short_name as "short_name",
          obj.email as "email",
          obj.link as "link",
          obj.description as "description",
          DATE_FORMAT(obj.establish_date,"%Y-%m-%d") as "establish",
          dst.name as "dst_name"
        from
          clubs obj
        left join
          districts dst on dst.id = obj.district_id
        where
          obj.id = ?
        `;
        return sql;
      }
      if (user_level <= 2 || (user_level == 3 && oid == user_club_id)) {
        let result = await connect_db_query(db,obj_sql(),[oid]);

        if (result.dataExists) {
          let data = {data:result.data[0]}
          resData = `{
            \"dataExists\":true,
            \"data\":${JSON.stringify(data)}
          }`;
          res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
          res.end(resData);
        } else {
          resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
          res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
          res.end(resData);
        }
      } else {
        resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      }
    } else if (ot == 3) {
      const obj_sql = () => {
        let sql =
        `
        select
          obj.id as "obj_id",
          obj.name as "obj_name"
        from
          districts obj
        where
          obj.id = ?
        `;
        return sql;
      }

      if (user_level == 1 || (user_level == 2 && oid == user_district_id)) {
        let result = await connect_db_query(db,obj_sql(),[oid]);

        if (result.dataExists) {
          let data = {data:result.data[0]}
          resData = `{
            \"dataExists\":true,
            \"data\":${JSON.stringify(data)}
          }`;
          res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
          res.end(resData);
        } else {
          resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
          res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
          res.end(resData);
        }
      } else {
        resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      }
    }
  }
});


/* create "create_user_console_ajax" API */
app.post('/create_user_console_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let resData = ``;

  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let event_id = Number(req_data.event_id);
    let user_id = Number(req_data.oid);
    let check_sql = `select * from registers where event_id = ? and user_id = ?`;
    let sql = `insert into registers(event_id,user_id) values(?,?)`;

    let result_check = await connect_db_query(db,check_sql,[event_id,user_id]);
    if (result_check.dataExists && result_check.data.length == 0) {
      let result = await connect_db_query(db,sql,[event_id,user_id]);
      if (result.dataExists) {
        resData = `{\"dataExists\":true}`;
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      } else {
        resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
        res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        res.end(resData);
      }
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"このユーザーはすでに登録されています\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* delete "delete_register_ajax" API */
app.post('/delete_register_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let rgi = req_data.rgi | 0;
  let sql = `delete from registers where id = ?`;
  let result = await connect_db_query(db,sql,[rgi]);

  let resData = ``;

  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    if (result.dataExists) {
      resData = `{\"dataExists\":true}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* delete "delete_comment_ajax" API */
app.post('/delete_comment_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let eci = req_data.eci | 0;
  let sql = `delete from event_comments where id = ?`;
  let result = await connect_db_query(db,sql,[eci]);

  let resData = ``;

  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"アクセス権がありません\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    if (result.dataExists) {
      resData = `{\"dataExists\":true}`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});



/* read "/manager_home.ev_analytics_ajax" API */
app.post('/ev_analytics_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let limiter = ``;
  switch (user_level) {
    case 1:
      limiter = ``;
      break;
    case 2:
      limiter = `where cl.district_id = ${user_district_id}`;
      break;
    case 3:
      limiter = `where cl.id = ${user_club_id}`;
      break;
    default:
  }

  const event_sql = () => {
    let sql =
    `
    select
      ev.id as "obj_id",
      ev.title as "obj_name",

      DATE_FORMAT(ev.date,"%Y-%m-%d") as "data_0",
      ev.price * count(distinct regi.user_id) as "data_1",
      count(distinct regi.user_id) as "data_2",
      count(distinct case when usr.user_level = 1 or usr.user_level = 2 or usr.user_level = 3 or usr.user_level = 4 then usr.id else null end) as "data_3",
      count(distinct case when usr.user_level = 5 then usr.id else null end) as "data_4",
      count(distinct case when usr.user_level = 6 then usr.id else null end) as "data_5",
      count(distinct el.id) as "data_6",
      count(distinct concat(el.user_id)) as "data_7"
    from
      events ev
    left join
      clubs cl on cl.id = ev.club_id
    left join
      registers regi on regi.event_id = ev.id
    left join
      users usr on usr.id = regi.user_id
    left join
      event_likes el on el.event_id = ev.id
    ${limiter}
    group by
      obj_id
    limit
      1000
    `;
    return sql;
  }

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let result = await connect_db_query(db,event_sql(),[]);
    if (result.dataExists) {
      let data = result.data;
      resData = `{
        \"dataExists\":true,
        \"data\":${JSON.stringify(data)}
      }`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.usr_analytics_ajax" API */
app.post('/usr_analytics_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let limiter = ``;
  switch (user_level) {
    case 1:
      limiter = ``;
      break;
    case 2:
      limiter = `where cl.district_id = ${user_district_id}`;
      break;
    case 3:
      limiter = `where cl.id = ${user_club_id}`;
      break;
    default:
  }

  let cl_ev_sql = `select count(*) as "count" from events where club_id = ${user_club_id}`;
  let result_clev = await connect_db_query(db,cl_ev_sql,[]);
  let event_count = result_clev.data[0].count;

  const user_sql = () => {
    let sql =
    `
    select
      usr.id as "obj_id",
      usr.name as "obj_name",
      cl.name as "data_0",

      count(distinct regi.id) as "data_1",
      count(distinct case when ev.club_id = ${user_club_id} then ev.id else null end) as "data_2",
      count(distinct case when ev.club_id = ${user_club_id} then ev.id else null end) / ${event_count} as "data_3",
      count(distinct case when ev.club_id != ${user_club_id} then ev.id else null end) as "data_4",
      count(distinct el.id) as "data_5",
      count(distinct el.event_id) as "data_6"

    from
      users usr
    left join
      clubs cl on cl.id = usr.club_id
    left join
      registers regi on regi.user_id = usr.id
    left join
      events ev on ev.id = regi.event_id
    left join
      event_likes el on el.user_id = usr.id
    left join
      event_comments ec on ec.user_id = usr.id
    ${limiter}
    group by
      obj_id
    limit
      1000
    `;
    return sql;
  }

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let result = await connect_db_query(db,user_sql(),[]);
    if (result.dataExists) {
      let data = result.data;
      resData = `{
        \"dataExists\":true,
        \"data\":${JSON.stringify(data)}
      }`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});
/* read "/manager_home.cl_analytics_ajax" API */
app.post('/cl_analytics_ajax',async function(req,res) {
  let req_data = JSON.parse(req.body.sender);
  let db_raw = JSON.parse(req.body.db);
  let db = init_db_info(db_raw);

  let user_id = Number(db.user_id | 0);
  let user_club_id = Number(db.club_id | 0);
  let user_district_id = Number(db.district_id | 0);
  let user_level = Number(db.user_level | 0);

  let limiter = ``;
  switch (user_level) {
    case 1:
      limiter = ``;
      break;
    case 2:
      limiter = `where cl.district_id = ${user_district_id}`;
      break;
    case 3:
      limiter = `where cl.id = ${user_club_id}`;
      break;
    default:
  }

  const club_sql = () => {
    let sql =
    `
    select
      cl.id as "obj_id",
      cl.name as "obj_name",
      count(distinct ev.id) as "data_0",
      count(distinct regi.id) as "data_1",
      count(distinct regi.user_id) as "data_2",
      count(distinct el.id) as "data_3",
      count(distinct concat(el.event_id,el.user_id)) as "data_4"
    from
      clubs cl
    left join
      events ev on ev.club_id = cl.id
    left join
      registers regi on regi.event_id = ev.id
    left join
      event_likes el on el.event_id = ev.id
    ${limiter}
    group by
      obj_id
    limit
      1000
    `;
    return sql;
  }

  let resData = ``;
  if (user_level > 3) {
    resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    res.end(resData);
  } else {
    let result = await connect_db_query(db,club_sql(),[]);
    if (result.dataExists) {
      let data = result.data;
      resData = `{
        \"dataExists\":true,
        \"data\":${JSON.stringify(data)}
      }`;
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    } else {
      resData = '{\"dataExists\":false,\"reason\":\"mysql sentence error\"}';
      res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
      res.end(resData);
    }
  }
});

app.listen(post,function() {
  console.log("‡‡============================================================‡‡");
  console.log("|| Node Server is Listening on tcp://${root_API}:8000/${PATH} ||");
  console.log("||                                         Use Ctrl-C to stop ||");
  console.log("‡‡============================================================‡‡");
});
