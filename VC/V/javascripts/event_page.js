var s3_path = getDOM('s3_path').value;
var like_count = 0;
var event_id = getDOM('event_id').value;
var current_user_id = getDOM('current_user_id').value;
var register_query_modal = async() => {
  $('.register_modal').show();
};
var register_query = async() => {
  $('#register_btn').prop('disabled', true);
  $('#register_btn').html('<i class="fas fa-redo fa-spin"></i>');
  let pt = $('input[name="pti_"]:checked').prop('id').split('_')[1] | 0;
  let at = $('input[name="ati_"]:checked').prop('id').split('_')[1] | 0;
  const sender_data = {
    event_id: Number(event_id),
    pt: pt,
    at: at
  };
  let result = await ajax_api_function("event_register_ajax", sender_data);
  if (result.dataExists) {
    window.location.reload();
  } else {
    alert(`データ通信エラー:${result.reason}`);
    $('#register_btn').prop('disabled', false);
    $('#register_btn').html('参加する');
  };
};
var send_like = async() => {
  const sender_data = {
    event_id: Number(event_id)
  };
  let result = await ajax_api_function("event_like_ajax", sender_data);
  if (result.dataExists) {
    like_count += 1;
    $('#like_count').html(like_count);
  } else {
    alert(`データ通信エラー:${result.reason}`);
  };
};
if ($('#page_js_status').prop('checked') == false) {
  $('#page_js_status').prop('checked', true);
  $(document).ready(function () {
    (() => {
      $('.hrs .cl').addClass('play_motion');
      $('.vrs .cl').addClass('play_motion');
      $('._hrs .cl').html(`<div class="skulls _skulls"><div class="cnsle _dtlis"><div class="icon"><i class="fas fa-user"></i></div></div><div class="cnsle _dtlns"><div class="box"><div class="icon"><i class="fas fa-circle"></i></div><div class="text skull"></div></div></div></div><div class="contents"></div>`);
      $('.vrs .cl').html(`<div class="skulls"><div class="cnsle _prnt"><div class="pr_grid"><div class="icon skull"></div><div class="title_grid"><div class="skull"></div><div class="skull"></div></div></div><div class="text skull"></div><div class="text skull"></div><div class="text skull"></div></div></div><div class="contents"></div>`);
    })();
    const desc_page = (data) => {
      let ev_obj = data.data;
      let user_obj = data.user;
      let comment_obj = data.comment;
      const desc_information = () => {
        let rl_heart = ev_obj.event_like_rl;
        let ab_heart = ev_obj.event_like_ab;
        like_count = rl_heart;
        let title = ev_obj.event_title.unveil_str();
        let sub_title = ev_obj.sub_title.unveil_str();
        let description = (ev_obj.event_description || "説明はありません").replace(/ß/g, "\n").unveil_str();
        let club_id = ev_obj.club_id;
        let club_name = ev_obj.club_name.unveil_str();
        let category_id = ev_obj.event_category_id;
        let deadline = ev_obj.deadline;
        let sdate = ev_obj.sdate;
        let year = sdate.split('-')[0];
        let month = sdate.split('-')[1] - 1;
        let day = sdate.split('-')[2];
        let week = new Date(year, month, day).getDay();
        let week_d = new Date(deadline.split('-')[0], deadline.split('-')[1] - 1, deadline.split('-')[2]).getDay();
        let stime = ev_obj.stime;
        let etime = ev_obj.etime;
        let addr = ev_obj.addr;
        let price = ev_obj.price;
        let status = ev_obj.ev_status;
        let today = new Date().dD();
        let time = new Date().dT();
        let perti_type = ev_obj.perti_type | 0;
        let after_chil = ev_obj.after_chil | 0;
        (() => {
          if (status == 1 && deadline >= today) {
            let my_register = ev_obj.my_register;
            if (my_register == 1) {
              $('#ev_status').html(`<div class="inline orange">登録済</div>`);
              $('#register_btn').html(`登録済み`);
              $('#register_btn').addClass('did');
            } else {
              $('#ev_status').html(`<div class="inline blue">登録可</div>`);
            };
          } else {
            $('#ev_status').html(`<div class="inline gray">受付終了</div>`);
            $('#register_btn').html(`受付は終了しました`);
            $('#register_btn').addClass('ended');
          };
        })();
        (() => {
          let ev_attachment = ev_obj.ev_attachment;
          if (ev_attachment == 1) {
            const S3_name = "raccommunityimageobjs";
            const S3_reagion = "ap-northeast-1";
            const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";
            AWS.config.region = S3_reagion;
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
              IdentityPoolId: IdentityPoolId,
            });
            AWS.config.credentials.get(function () {
              let accessKeyId = AWS.config.credentials.accessKeyId;
              let secretAccessKey = AWS.config.credentials.secretAccessKey;
              let sessionToken = AWS.config.credentials.sessionToken;
            });
            (() => {
              let folder_params = {
                Bucket: `${S3_name}`,
                Prefix: `events/event_${event_id}/attachment/`
              };
              let s3 = new AWS.S3;
              s3.listObjectsV2(folder_params).promise().then(function (data) {
                let file_name = data.Contents[0].Key.split('/')[3];
                $('#ev_attachment').html(`<a class="attachment_link" href="${s3_path}/${data.Contents[0].Key}" download="${file_name}"><div class="file_box inline">${file_name}</div></a>`);
              }).catch(function (err) {
                alert(err);
              });
            })();
          } else {
            $('#ev_attachment').html(`なし`);
          };
        })();
        $('#like_btn_count').html(`<span id="like_count">${rl_heart.toLocaleString()}</span>(${ab_heart.toLocaleString()})`);
        $('#ev_ttl').text(title);
        $('#ev_sub_ttl').text(sub_title);
        $('#ev_desc').text(description);
        $('#ev_club_name').html(`<a href="/club_page?club_id=${club_id}">${club_name}</a>`);
        $('#ev_category').text(catena[category_id]);
        $('#ev_deadline').text(`${deadline.str_date(`.`)} (${wna[week_d]})`);
        $('#ev_sdate').text(`${sdate.str_date(`.`)} (${wna[week]})`);
        $('#ev_time').text(`${stime} - ${etime}`);
        $('#ev_addr').text(addr);
        $('#ev_perti').text(perti_type_na[perti_type]);
        $('#ev_after').text(["", "なし", "あり"][after_chil]);
        $('#ev_price').text(`¥${price.toLocaleString()}`);
        const desc_map = () => {
          let obj = ev_obj;
          if (!obj.lat || !obj.lng) {
            return;
          };
          let map;
          let bounds = new google.maps.LatLngBounds();
          let mapLatLng = new google.maps.LatLng({
            lat: obj.lat,
            lng: obj.lng
          });
          map = new google.maps.Map(document.getElementById('canvas_map'), {
            center: mapLatLng,
            zoom: 14,
            mapTypeControl: false,
            styles: [{
              featureType: 'poi',
              stylers: [{
                visibility: 'off'
              }]
            }, {
              featureType: 'administrative',
              stylers: [{
                visibility: 'off'
              }]
            }, {
              featureType: 'road.highway.controlled_access',
              stylers: [{
                visibility: 'off'
              }]
            }, ],
            streetViewControl: false,
          });
          markerLatLng = new google.maps.LatLng({
            lat: obj.lat,
            lng: obj.lng
          });
          let point = new google.maps.Marker({
            position: markerLatLng,
            map: map
          });
          bounds.extend(point.position);
          $('#map').show();
        };
        desc_map();
        (() => {
          if (perti_type == 2) {
            $(`#pti_2 + label`).remove();
            $(`#pti_2`).remove();
          } else if (perti_type == 3) {
            $(`#pti_1 + label`).remove();
            $(`#pti_1`).remove();
          }
          $('input[name="pti_"]:eq(0)').prop('checked', true);
          if (after_chil == 1) {
            $(`#ati_2 + label`).remove();
            $(`#ati_2`).remove();
          }
          $('input[name="ati_"]:eq(0)').prop('checked', true);
        })();
      };
      const desc_users = () => {
        (() => {
          let count = ev_obj.event_register;
          let capacity = ev_obj.capacity;
          capacity = capacity == 0 ? `<i class="far fa-infinity"></i>` : capacity;
          $('#usr_indi').html(`${count} <span class="span_chld">/ ${capacity}</span>`);
        })();
        (() => {
          let objs = user_obj;
          if (objs.length == 0) {
            $('#hrs_user').html(`<div class="emttl">参加予定のユーザーはいません</div>`);
            return;
          }
          for (let i = 0; i < 10; i++) {
            if (i < objs.length) {
              let obj = objs[i];
              let user_id = obj.user_id || 0;
              let user_name = obj.user_name || "";
              $(`#hrs_user .cl:eq(${i}) .contents`).html(`<a href="/user_page?user_id=${user_id}"><div class="bgi"><img src="${s3_path}/users/icon/user_icon_${user_id}.jpeg" alt=""></div><div class="cnsl _nm">${user_name} ${user_id == current_user_id?`(あなた)`:``}</div></a>`);
            } else {
              $(`#hrs_user .cl:eq(${objs.length})`).remove();
            };
          };
        })();
        (() => {
          let count = ev_obj.event_register;
          if (count < 10) {
            $('#user_all_btn').remove();
          } else {
            $('#user_all_btn_a').html(`<i class="fas fa-users"></i><br>${count - 10}+`);
          };
        })();
      };
      const desc_comments = () => {
        (() => {
          let count = ev_obj.event_comment;
          $('#cmnt_indi').html(`${count}件`);
        })();
        (() => {
          let objs = comment_obj;
          if (objs.length == 0) {
            $('#hrs_comment').html(`<div class="emttl">コメントはまだありません</div><div class="link_bs"><a href="/event_comments?event_id=${event_id}"><div class="link"><i class="fas fa-comment"></i> 質問する ></div></a></div>`);
            return;
          };
          for (let i = 0; i < 5; i++) {
            if (i < objs.length) {
              let obj = objs[i];
              let user_id = obj.user_id || 0;
              let user_name = (obj.user_name || "").unveil_str();
              let date = obj.date || "";
              let time = obj.time || "";
              let description = (obj.description || "").replace(/ß/g, "\n").unveil_str();
              $(`#hrs_comment .cl:eq(${i}) .contents`).html(`<div class="prnt"><div class="icn"><img src="${s3_path}/users/icon/user_icon_${user_id}.jpeg" alt=""></div><div class="txtb"><div class="txt text_overflow">${user_name}</div><div class="sub text_overflow">${date.str_date(`/`)} ${time}</div></div></div><div class="txt_cntr">${description}</div>`);
            } else {
              $(`#hrs_comment .cl:eq(${objs.length})`).remove();
            };
          };
        })();
      };
      const desc_attach = () => {
        const getUTC = function (date_str) {
          let date = new Date(date_str);
          return date.getUTCFullYear() + zerofill(date.getUTCMonth() + 1) + zerofill(date.getUTCDate()) + 'T' + zerofill(date.getUTCHours()) + zerofill(date.getUTCMinutes()) + zerofill(date.getUTCSeconds()) + 'Z';
        };
        const zerofill = function (num) {
          return ('0' + num).slice(-2);
        };
        let ps = `${ev_obj.sdate}T${ev_obj.stime}+09:00`;
        let pe = `${ev_obj.sdate}T${ev_obj.etime}+09:00`;
        let link = `http://www.google.com/calendar/event?action=TEMPLATE&text=${encodeURIComponent(ev_obj.event_title)}&details=${`${encodeURIComponent(ev_obj.club_name).unveil_str()} ${encodeURIComponent(ev_obj.event_description.replace(/ß/g,"\n").unveil_str())}`}&location=${encodeURIComponent(ev_obj.addr)}&dates=${getUTC(ps)}/${getUTC(pe)}&trp=false`;
        $('#gglcl_register_btn').attr('href', link);
      };
      desc_information();
      desc_users();
      desc_comments();
      desc_attach();
      setTimeout(() => {
        $('.play_motion').addClass('stop_motion');
      }, 2500);
    };
    const desc_init = async() => {
      let event_id = getDOM('event_id').value;
      const sender_data = {
        event_id: Number(event_id)
      };
      let result = await ajax_api_function("event_page_ajax", sender_data);
      if (result.dataExists) {
        desc_page(result.data);
      } else {
        alert(`データ通信エラー:${result.reason}`);
      };
    };
    desc_init();
  });
};
