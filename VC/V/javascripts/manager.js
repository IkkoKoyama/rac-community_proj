//= require l_cd_ns/DataTable_.js
//= require l_cd_ns/DataTable_jp.js
//= require l_cd_ns/Excel_.js
//= require l_cd_ns/FileSaver_.js
//= require l_cd_ns/ChartJS_.js
//= require l_cd_ns/ChartJS_boxplot.js
//= require l_cd_ns/ChartJS_chartbox.js

var s3_path = getDOM('s3_path').value;
var permission = getDOM(`permission`).value;
var user_level = getDOM(`user_level`).value;
var s_select = (getDOM(`s_select`).value).bool();
var o_select = (getDOM(`o_select`).value).bool();
var image_canvas_set = false;

var comment_forms = async () => {
  $('form[name="comment_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="comment_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['comment_form'];
  let $value = (form.elements['text'].value || "").escape_str().replace(/\r?\n/g," ");
  let event_id = form.elements['event_id'].value | 0;
  const sender_data = {text:$value,event_id:Number(event_id)};
  let result = await ajax_api_function("create_comment_ajax",sender_data);
  if (result.dataExists) {
    window.location.href = `/manager_home?pt=0&ss=true&st=1&os=true&oi=${event_id}`;
  } else {
    $('form[name="comment_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="comment_form"] button[type="submit"]').html('投稿');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var addUser_forms = async () => {
  $('form[name="addUser_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="addUser_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['comment_form'];
  let oid = $('#event_addUser_select option:selected').prop('value') | 0;
  let event_id = form.elements['event_id'].value | 0;
  const sender_data = {oid:oid,event_id:Number(event_id)};
  let result = await ajax_api_function("create_user_console_ajax",sender_data);
  if (result.dataExists) {
    window.location.href = `/manager_home?pt=0&ss=true&st=1&os=true&oi=${event_id}`;
  } else {
    $('form[name="addUser_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="addUser_form"] button[type="submit"]').html('投稿');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var delete_register = async (rgi) => {
  if (confirm('削除しますか？')) {
    const sender_data = {rgi:Number(rgi)};
    let result = await ajax_api_function("delete_register_ajax",sender_data);
    if (result.dataExists) window.location.reload();
    else alert(`データ通信エラー:${result.reason}`);
  };
};
var delete_comment = async (eci) => {
  if (confirm('削除しますか？')) {
    const sender_data = {eci:Number(eci)};
    let result = await ajax_api_function("delete_comment_ajax",sender_data);
    if (result.dataExists) window.location.reload();
    else alert(`データ通信エラー:${result.reason}`);
  };
};
var download_excel = (type,objs) => {
  if (objs.length >= 1) {
    (() => {
      $('#download_table_base').html(``);
      let ap = ``;

      objs.forEach((obj) => {
        let usr_name = (obj.user_name || "").escape_str();
        let usr_kana = (obj.user_kana || "").escape_str();
        let usr_email = (obj.user_email || "").escape_str();
        let usr_level = obj.user_level | 0;
        let usr_position = (obj.user_position || "").escape_str();
        let cl_name = (obj.club_name || "").escape_str();
        let at = obj.at | 0;
        let pt = obj.pt | 0;

        ap +=
        `
        <tr>
          <th>${usr_name}</th>
          <th>${usr_kana}</th>
          <th>${usr_email}</th>
          <th>${lvlna[usr_level]}</th>
          <th>${usr_position}</th>
          <th>${cl_name}</th>
          <th>${regiptna[pt]}</th>
          <th>${regiatna[at]}</th>
        </tr>
        `;
      });
      $('#download_table_base').append(
        `
        <tr>
          <th>名前</th>
          <th>かな</th>
          <th>email</th>
          <th>役職①</th>
          <th>役職②</th>
          <th>所属クラブ</th>
          <th>参加方法</th>
          <th>懇親会出席</th>
        </tr>
        ${ap}
        `
      );
    })();
    (() => {
      let en = $('#obj_select option:selected').html();
      let wopts = {
        bookType: 'xlsx',
        bookSST: false,
        type: 'binary'
      };
      let workbook = {
        SheetNames: [],
        Sheets: {}
      };
      document.querySelectorAll('#download_table_base').forEach(function (currentValue, index) {
        let n = currentValue.getAttribute('data-sheet-name');
        if (!n) {n = 'Sheet' + index;}
        workbook.SheetNames.push(n);
        workbook.Sheets[n] = XLSX.utils.table_to_sheet(currentValue, wopts);
      });
      let wbout = XLSX.write(workbook, wopts);
      function s2ab(s) {
        let buf = new ArrayBuffer(s.length);
        let view = new Uint8Array(buf);
        for (var i = 0; i != s.length; ++i) {
          view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
      };
      saveAs(new Blob([s2ab(wbout)], {
        type: 'application/octet-stream'
      }), `イベント${en}_参加者一覧.xlsx`);
    })();
  } else {
    alert('該当するデータがなかったのでエクセル出力を停止しました。');
  }
};

var event_create = async () => {
  $('form[name="event_create_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="event_create_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['event_create_form'];

  let title = (form.elements[`title`].value || "").escape_str();
  let sub_title = (form.elements[`sub_title`].value || "").escape_str();
  let club_id = $('#ev_create_club_id_select option:selected').prop('value') | 0;
  let category_id = $('#ev_create_cate_id_select option:selected').prop('value') | 0;
  let limiter = $('#ev_create_limiter_select option:selected').prop('value') | 0;

  let date = form.elements[`date`].value || "";
  let stime = form.elements[`stime`].value || "";
  let etime = form.elements[`etime`].value || "";
  let addr = (form.elements[`addr`].value || "").escape_str();
  let deadline = form.elements[`deadline`].value;

  let desc = ($('#ev_create_desciprtion').val() || "").trim().escape_str().replace(/\r?\n/g,"ß");
  let price = form.elements[`price`].value | 0;
  let capa = form.elements[`capacity`].value | 0;
  let perti_type = $('#ev_create_perti_type_select option:selected').prop('value') | 0;
  let after_chil = $('#ev_create_after_chil_select option:selected').prop('value') | 0;

  let attachments = getDOM('ev_create_attach').files;
  let attachment_type = attachments.length >= 1 ? 1 : 0;

  let lat,lng;
  let geocoder = new google.maps.Geocoder();
  let LatLng = await return_LatLng(addr,geocoder);

  if (LatLng.dataExists) {
    lat = LatLng.data.lat;
    lng = LatLng.data.lng;
  };

  const sender_data = {
    title:title,
    sub_title:sub_title,
    club_id:club_id,
    cate_id:category_id,
    read_level:limiter,

    date:date,
    deadline:deadline,
    stime:stime,
    etime:etime,
    addr:addr,

    desc:desc,
    price:price,
    capa:capa,
    lat:lat,
    lng:lng,
    perti_type:perti_type,
    after_chil:after_chil,
    attachment_type:attachment_type
  };

  const desc_s3_transit = (obj_id) => {
    const S3_name = "raccommunityimageobjs";
    const S3_reagion = "ap-northeast-1";
    const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";

    AWS.config.region = S3_reagion;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: IdentityPoolId,
    });
    AWS.config.credentials.get(function(){
      let accessKeyId = AWS.config.credentials.accessKeyId;
      let secretAccessKey = AWS.config.credentials.secretAccessKey;
      let sessionToken = AWS.config.credentials.sessionToken;
    });

    const upload_attach = () => {
      let file_name = attachments.length >= 1 ? attachments[0].name : "no-name";
      let files = [attachments[0]];
      let file = files[0];
      let folder_path = `events/event_${obj_id}/attachment/`;

      let ab_path = folder_path + file_name;
      let upload = new AWS.S3.ManagedUpload({
        params: {
          Bucket: S3_name,
          Key: ab_path,
          Body:file,
          ACL: "public-read"
        }
      });

      let promise = upload.promise();
      promise.then(
        function(data) {window.location.href = `/manager_home?pt=0&ss=true&st=1&os=true&oi=${obj_id}`;},
        function(err) {
          $('form[name="event_create_form"] button[type="submit"]').prop('disabled',false);
          $('form[name="event_create_form"] button[type="submit"]').html('作成する');
          alert('エラー発生')
        }
      );
    };
    const upload_bgi = () => {
      var maxCapacity = 100000;

      let image = $('#image_canvas').cropper('getCroppedCanvas').toDataURL("image/jpeg");
      var originalBlob = base64ToBlob(image);
      var uploadBlob = originalBlob;

      if (maxCapacity <= originalBlob["size"]) {
        var capacityRatio = maxCapacity / originalBlob["size"];
        var processedBinary = $('#image_canvas').cropper('getCroppedCanvas').toDataURL("image/jpeg",capacityRatio);
        uploadBlob = base64ToBlob(processedBinary);
      };

      let files = [uploadBlob];
      let file = files[0];
      let file_name = `event_image.jpeg`;
      let folder_path = `events/event_${obj_id}/`;

      let ab_path = folder_path + file_name;
      let upload = new AWS.S3.ManagedUpload({
        params: {
          Bucket: S3_name,
          Key: ab_path,
          Body:file,
          ContentType: 'text/plain',
          ACL: "public-read"
        }
      });

      let promise = upload.promise();
      promise.then(
        function(data) {
          if (attachments.length >= 1) upload_attach(obj_id);
          else window.location.href = `/manager_home?pt=0&ss=true&st=1&os=true&oi=${obj_i}`;
        },
        function(err) {
          $('form[name="event_create_form"] button[type="submit"]').prop('disabled',false);
          $('form[name="event_create_form"] button[type="submit"]').html('作成する');
          alert('エラー発生');
        }
      );
    };
    const upload_copy = () => {
      let icon_params = {
        CopySource:`${S3_name}/statics/event_header_static.jpeg`,
        Bucket: `${S3_name}`,
        Key:`events/event_${obj_id}/event_image.jpeg`,
        ACL: "public-read"
      };
      let s3 = new AWS.S3;
      s3.copyObject(icon_params,function(err, data) {
        if (err) {
          $('form[name="event_create_form"] button[type="submit"]').prop('disabled',false);
          $('form[name="event_create_form"] button[type="submit"]').html('作成する');
          alert('エラー発生');
        } else {
          if (attachments.length >= 1) upload_attach();
          else window.location.href = `/manager_home?pt=0&ss=true&st=1&os=true&oi=${obj_id}`;
        }
      });
    };

    if (image_canvas_set) upload_bgi();
    else upload_copy();
  };

  let result = await ajax_api_function("create_event_ajax",sender_data);
  if (result.dataExists) {
    let event_id = result.data.insertId;
    desc_s3_transit(event_id);
  } else {
    $('form[name="event_create_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="event_create_form"] button[type="submit"]').html('作成する');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var event_update = async () => {
  $('form[name="event_update_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="event_update_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['event_update_form'];
  let obj_id = form.elements[`obj_id`].value | 0;

  let title = (form.elements[`title`].value || "").escape_str();
  let sub_title = (form.elements[`sub_title`].value || "").escape_str();
  let category_id = $('#ev_update_cate_id_select option:selected').prop('value') | 0;
  let limiter = $('#ev_update_read_level_select option:selected').prop('value') | 0;
  let status = $('#ev_update_status_select option:selected').prop('value') | 0;
  let deadline = form.elements[`deadline`].value;
  let date = form.elements[`date`].value || "";
  let stime = form.elements[`stime`].value || "";
  let etime = form.elements[`etime`].value || "";
  let addr = (form.elements[`addr`].value || "").escape_str();

  let desc = ($('#ev_update_desciprtion').val() || "").trim().escape_str().replace(/\r?\n/g,"ß");
  let price = form.elements[`price`].value | 0;
  let capa = form.elements[`capacity`].value | 0;
  let perti_type = $('#ev_update_perti_type_select option:selected').prop('value') | 0;
  let after_chil = $('#ev_create_after_chil_select option:selected').prop('value') | 0;

  let lat,lng;
  let geocoder = new google.maps.Geocoder();
  let LatLng = await return_LatLng(addr,geocoder);

  if (LatLng.dataExists) {
    lat = LatLng.data.lat;
    lng = LatLng.data.lng;
  };

  const sender_data = {
    obj_id:obj_id,
    title:title,
    sub_title:sub_title,
    cate_id:category_id,
    read_level:limiter,

    date:date,
    stime:stime,
    etime:etime,
    addr:addr,
    deadline:deadline,

    status:status,
    desc:desc,
    price:price,
    capa:capa,
    lat:lat,
    lng:lng,
    perti_type:perti_type,
    after_chil:after_chil
  };

  let result = await ajax_api_function("update_event_ajax",sender_data);
  if (result.dataExists) {
    window.location.href = `/manager_home?pt=0&ss=true&st=1&os=true&oi=${obj_id}`;
  } else {
    $('form[name="event_update_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="event_update_form"] button[type="submit"]').html('更新する');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var event_delete = async (oid) => {
  if (confirm('本当に削除しますか？関連する参加者情報,コメント、いいねのデータが全て削除されます。')) {
    $('#event_delete_btn').prop('disabled',true);
    $('#event_delete_btn').html('<i class="fas fa-redo fa-spin"></i>');

    const sender_data = {obj_id:oid};
    let result = await ajax_api_function("delete_event_ajax",sender_data);
    window.location.href = `/manager_home?pt=0`;

    /*
    const delete_s3_icon = () => {
      const S3_name = "raccommunityimageobjs";
      const S3_reagion = "ap-northeast-1";
      const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";

      AWS.config.region = S3_reagion;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IdentityPoolId,
      });
      AWS.config.credentials.get(function(){
        let accessKeyId = AWS.config.credentials.accessKeyId;
        let secretAccessKey = AWS.config.credentials.secretAccessKey;
        let sessionToken = AWS.config.credentials.sessionToken;
      });

      const delete_events_folder = () => {
        let folder_params = {
          Bucket: `${S3_name}`,
          Prefix:`events/event_${oid}`
        };
        危険!!!
        let s3 = new AWS.S3;
        s3.listObjectsV2(folder_params).promise().then(
          function(data) {
            let deleteList = [];
            for (var i = 0; i < data.Contents.length; i++) {
              let deleteSite = {
                Key: data.Contents[i].Key
              };
              deleteList.push(deleteSite);
            };
            let delete_params = {
              Bucket: `${S3_name}`,
              Delete: {
                Objects: deleteList
              }
            };
            return s3.deleteObjects(delete_params).promise()
          }
        ).then(
          function(data){
            window.location.href = `/manager_home?pt=0`;
          }
        ).catch (
          function(err){
            $('#event_delete_btn').prop('disabled',false);
            $('#event_delete_btn').html('削除');
            alert(err);
          }
        );
      };
      delete_events_folder();
    };
    delete_s3_icon();*/
  };
};

var user_create = async () => {
  $('form[name="user_create_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="user_create_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['user_create_form'];

  let name = (form.elements[`name`].value || "").escape_str();
  let kana = (form.elements[`kana`].value || "").escape_str();
  let cl_id = $('#usr_create_cl_id_select option:selected').prop('value') | 0;
  let email = (form.elements[`email`].value || "").escape_str();
  let user_level = $('#usr_create_user_level_select option:selected').prop('value') | 0;
  let position = (form.elements[`position`].value || "").escape_str();
  let birth = form.elements[`birth`].value;
  let job = (form.elements[`job`].value || "").escape_str();
  let join_year = form.elements[`join_year`].value;

  let random_id = Math.floor( Math.random() * 999999) + 100000;
  let password = `racco_${random_id}`;
  const sender_data = {
    name:name,
    kana:kana,
    pass:password,
    cl_id:cl_id,
    email:email,
    user_level:user_level,
    position:position,
    birth:birth,
    job:job,
    join_year:join_year
  };

  const desc_s3_transit = (obj_id) => {
    const S3_name = "raccommunityimageobjs";
    const S3_reagion = "ap-northeast-1";
    const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";

    AWS.config.region = S3_reagion;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: IdentityPoolId,
    });
    AWS.config.credentials.get(function(){
      let accessKeyId = AWS.config.credentials.accessKeyId;
      let secretAccessKey = AWS.config.credentials.secretAccessKey;
      let sessionToken = AWS.config.credentials.sessionToken;
    });

    const upload_copy = () => {
      let icon_params = {
        CopySource:`${S3_name}/statics/user_icon_static.jpeg`,
        Bucket: `${S3_name}`,
        Key:`users/icon/user_icon_${obj_id}.jpeg`,
        ACL: "public-read"
      };
      let s3 = new AWS.S3;
      s3.copyObject(icon_params,function(err, data) {
        if (err) {
          $('form[name="user_create_form"] button[type="submit"]').prop('disabled',false);
          $('form[name="user_create_form"] button[type="submit"]').html('作成する');
          alert('エラー発生');
        } else {
          emailjs.init('user_zZWvC1kxitxKyxMtW0Pcq');
          const mail_templete = {
            from:`team RAC2580`,
            to:`${email}`,
            password:`${password}`,
            to_name: `${name}`,
            from_name:`RAC Community`,
            message_html: 'https://www.rac-community.xyz'
          };
          emailjs.send(
            'rac_community',
            'template_1gn2NI7i',
            mail_templete
          ).then(function(response) {
            window.location.href = `/manager_home?pt=1&ss=true&st=1&os=true&oi=${obj_id}`;
          }, function(error) {
            alert(`該当のメールアドレスに送信できませんでした、メールアドレスが間違っている可能性があります。現在作成された${name}さんのログインパスワード: ${password} は大切に保存しておいてください。`);
            window.location.href = `/manager_home?pt=1&ss=true&st=1&os=true&oi=${obj_id}`;
          });
        };
      });
    };
    upload_copy();
  };
  let result = await ajax_api_function("create_user_ajax",sender_data);
  if (result.dataExists) {
    let user_id = result.data.insertId;
    desc_s3_transit(user_id);
  } else {
    $('form[name="user_create_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="user_create_form"] button[type="submit"]').html('作成する');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var user_update = async () => {
  $('form[name="user_update_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="user_update_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['user_update_form'];
  let obj_id = form.elements[`obj_id`].value | 0;
  let name = (form.elements[`name`].value || "").escape_str();
  let kana = (form.elements[`kana`].value || "").escape_str();
  let user_level = $('#usr_update_user_level_select option:selected').prop('value') | 0;
  let position = (form.elements[`position`].value || "").escape_str();
  let club_id = $('#usr_update_club_id_select option:selected').prop('value') | 0;
  let birth = form.elements[`birth`].value;
  let job = (form.elements[`job`].value || "").escape_str();
  let join_year = form.elements[`join_year`].value;

  const sender_data = {
    obj_id:obj_id,
    name:name,
    kana:kana,
    user_level:user_level,
    position:position,
    club_id:club_id,
    birth:birth,
    job:job,
    join_year:join_year
  };
  let result = await ajax_api_function("update_user_ajax",sender_data);
  if (result.dataExists) {
    window.location.href = `/manager_home?pt=1&ss=true&st=1&os=true&oi=${obj_id}`;
  } else {
    $('form[name="user_update_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="user_update_form"] button[type="submit"]').html('編集する');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var user_reset = async (oid,email) => {
  let obj_id = oid;
  if (confirm('本当にパスワードをリセットしますか？')) {
    let random_id = Math.floor( Math.random() * 999999) + 100000;
    let password = `racco_${random_id}`;

    const sender_data = {user_id:obj_id,pass:password};
    let result = await ajax_api_function("reset_user_ajax",sender_data);

    if (result.dataExists) {
      emailjs.init('user_zZWvC1kxitxKyxMtW0Pcq');
      const mail_templete = {
        from:`team RAC2580`,
        to:`${email}`,
        password:`${password}`,
        to_name: `${name}`,
        from_name:`RAC Community`,
        message_html: 'https://www.rac/-community.xyz'
      };
      emailjs.send(
        'rac_community',
        'racco_change_password',
        mail_templete
      ).then(function(response) {
        window.location.href = `/manager_home?pt=1`;
      }, function(error) {
        alert(`該当のメールアドレスに送信できませんでした。リセットされたのログインパスワードracco_${password}は大切に保存しておいてください。`);
      });
    } else {
      alert(`データ通信エラー:${result.reason}`);
    };
  };
};
var user_delete = async (oid) => {
  if (confirm('本当に削除しますか？関連する参加イベント,コメント、いいねのデータが全て削除されます。')) {
    $('#user_delete_btn').prop('disabled',true);
    $('#user_delete_btn').html('<i class="fas fa-redo fa-spin"></i>');

    const sender_data = {obj_id:oid};
    let result = await ajax_api_function("delete_user_ajax",sender_data);
    window.location.href = `/manager_home?pt=1`;

    /*
    const delete_s3_icon = () => {
      const S3_name = "raccommunityimageobjs";
      const S3_reagion = "ap-northeast-1";
      const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";

      AWS.config.region = S3_reagion;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IdentityPoolId,
      });
      AWS.config.credentials.get(function(){
        let accessKeyId = AWS.config.credentials.accessKeyId;
        let secretAccessKey = AWS.config.credentials.secretAccessKey;
        let sessionToken = AWS.config.credentials.sessionToken;
      });

      window.location.href = `/manager_home?pt=1`;
      const delete_icon = () => {
        let icon_params = {
          Bucket: `${S3_name}`,
          Key:`users/icon/user_icon${oid}.jpeg`
        };

        let s3 = new AWS.S3;
        s3.deleteObject(icon_params, function(err, data) {
          if (err) {
            alert(err);
          } else {
            $('#user_delete_btn').prop('disabled',false);
            $('#user_delete_btn').html('削除');
            window.location.href = `/manager_home?pt=1`;
          }
        });
      };
      delete_icon();
    };
    delete_s3_icon();
    */
  };
};

var club_create = async () => {
  $('form[name="club_create_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="club_create_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['club_create_form'];

  let name = (form.elements[`name`].value || "").escape_str();
  let short_name = (form.elements[`short_name`].value || "").escape_str();
  let dst_id = $('#cl_create_dst_id_select option:selected').prop('value') | 0;
  let email = (form.elements[`email`].value || "").escape_str();
  let link = encodeURIComponent((form.elements[`link`].value || "").escape_str());
  let desc = ($('#cl_create_desciprtion').val() || "").trim().escape_str().replace(/\r?\n/g,"ß");
  let establish = form.elements[`establish`].value;

  const sender_data = {
    name:name,
    short_name:short_name,
    dst_id:dst_id,
    email:email,
    link:link,
    desc:desc,
    establish:establish
  };
  const desc_s3_transit = (obj_id) => {
    const S3_name = "raccommunityimageobjs";
    const S3_reagion = "ap-northeast-1";
    const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";

    AWS.config.region = S3_reagion;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: IdentityPoolId,
    });
    AWS.config.credentials.get(function(){
      let accessKeyId = AWS.config.credentials.accessKeyId;
      let secretAccessKey = AWS.config.credentials.secretAccessKey;
      let sessionToken = AWS.config.credentials.sessionToken;
    });

    const upload_bgi = () => {
      var maxCapacity = 100000;

      let image = $('#image_canvas').cropper('getCroppedCanvas').toDataURL("image/jpeg");
      var originalBlob = base64ToBlob(image);
      var uploadBlob = originalBlob;

      if (maxCapacity <= originalBlob["size"]) {
        var capacityRatio = maxCapacity / originalBlob["size"];
        var processedBinary = $('#image_canvas').cropper('getCroppedCanvas').toDataURL("image/jpeg",capacityRatio);
        uploadBlob = base64ToBlob(processedBinary);
      };

      let files = [uploadBlob];
      let file = files[0];
      let file_name = `club_header_${obj_id}.jpeg`;
      let folder_path = `clubs/header/`;

      let ab_path = folder_path + file_name;
      let upload = new AWS.S3.ManagedUpload({
        params: {
          Bucket: S3_name,
          Key: ab_path,
          Body:file,
          ContentType: 'text/plain',
          ACL: "public-read"
        }
      });

      let promise = upload.promise();
      promise.then(
        function(data) {
          window.location.href = `/manager_home?pt=2&ss=true&st=1&os=true&oi=${obj_id}`;
        },
        function(err) {
          $('form[name="club_create_form"] button[type="submit"]').prop('disabled',false);
          $('form[name="club_create_form"] button[type="submit"]').html('作成する');
          alert('エラー発生');
        }
      );
    };
    const upload_copy = () => {
      let icon_params = {
        CopySource:`${S3_name}/statics/club_header_static.jpeg`,
        Bucket: `${S3_name}`,
        Key:`clubs/header/club_header_${obj_id}.jpeg`,
        ACL: "public-read"
      };
      let s3 = new AWS.S3;
      s3.copyObject(icon_params,function(err, data) {
        if (err) {
          $('form[name="club_create_form"] button[type="submit"]').prop('disabled',false);
          $('form[name="club_create_form"] button[type="submit"]').html('作成する');
          alert('エラー発生');
        } else {
          window.location.href = `/manager_home?pt=2&ss=true&st=1&os=true&oi=${obj_id}`;
        }
      });
    };

    if (image_canvas_set) upload_bgi();
    else upload_copy();
  };
  let result = await ajax_api_function("create_club_ajax",sender_data);
  if (result.dataExists) {
    let club_id = result.data.insertId;
    desc_s3_transit(club_id);
  } else {
    $('form[name="club_create_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="club_create_form"] button[type="submit"]').html('作成する');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var club_update = async () => {
  $('form[name="club_update_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="club_update_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['club_update_form'];
  let obj_id = form.elements[`obj_id`].value | 0;
  let name = (form.elements[`name`].value || "").escape_str();
  let short_name = (form.elements[`short_name`].value || "").escape_str();
  let email = (form.elements[`email`].value || "").escape_str();
  let link = encodeURIComponent((form.elements[`link`].value || "").escape_str());
  let desc = ($('#cl_update_desciprtion').val() || "").trim().escape_str().replace(/\r?\n/g,"ß");
  let establish = form.elements[`establish`].value;

  const sender_data = {
    obj_id:obj_id,
    name:name,
    short_name:short_name,
    email:email,
    link:link,
    desc:desc,
    establish:establish
  };
  let result = await ajax_api_function("update_club_ajax",sender_data);
  if (result.dataExists) {
    window.location.href = `/manager_home?pt=2&ss=true&st=1&os=true&oi=${obj_id}`;
  } else {
    $('form[name="club_update_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="club_update_form"] button[type="submit"]').html('編集する');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var club_delete = async (oid) => {
  if (confirm('本当に削除しますか？関連するユーザー、イベント、コメント、いいねのデータが全て削除されます。')) {
    $('#club_delete_btn').prop('disabled',true);
    $('#club_delete_btn').html('<i class="fas fa-redo fa-spin"></i>');

    const sender_data = {obj_id:oid};
    let result = await ajax_api_function("delete_club_ajax",sender_data);
    window.location.href = `/manager_home?pt=2`;

    /*const delete_s3_icon = () => {
      const S3_name = "raccommunityimageobjs";
      const S3_reagion = "ap-northeast-1";
      const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";

      AWS.config.region = S3_reagion;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IdentityPoolId,
      });
      AWS.config.credentials.get(function(){
        let accessKeyId = AWS.config.credentials.accessKeyId;
        let secretAccessKey = AWS.config.credentials.secretAccessKey;
        let sessionToken = AWS.config.credentials.sessionToken;
      });

      const delete_icon = () => {
        let icon_params = {
          Bucket: `${S3_name}`,
          Key:`clubs/header/club_header_${oid}.jpeg`
        };

        let s3 = new AWS.S3;
        s3.deleteObject(icon_params, function(err, data) {
          if (err) {
            alert(err);
          } else {
            $('#club_delete_btn').prop('disabled',false);
            $('#club_delete_btn').html('削除');
            window.location.href = `/manager_home?pt=2`;
          }
        });
      };
      delete_icon();
    };
    delete_s3_icon();*/
  };
};

var district_create = async () => {
  $('form[name="district_create_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="district_create_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['district_create_form'];
  let name = (form.elements[`name`].value || "").escape_str();
  const sender_data = {name:name};
  let result = await ajax_api_function("create_district_ajax",sender_data);
  if (result.dataExists) window.location.href = `/manager_home?pt=3&ss=true&st=1&os=true&oi=${result.data.insertId}`;
  else alert(`データ通信エラー:${result.reason}`);
};
var district_update = async () => {
  $('form[name="district_update_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="district_update_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['district_update_form'];
  let obj_id = form.elements[`obj_id`].value | 0;
  let name = (form.elements[`name`].value || "").escape_str();
  const sender_data = {obj_id:obj_id,name:name};
  let result = await ajax_api_function("update_district_ajax",sender_data);
  if (result.dataExists) {
    window.location.href = `/manager_home?pt=3&ss=true&st=1&os=true&oi=${obj_id}`;
  } else {
    $('form[name="district_update_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="district_update_form"] button[type="submit"]').html('編集する');
    alert(`データ通信エラー:${result.reason}`);
  };
};

var select_option_arr = ["","","",""];

if ($('#page_js_status').prop('checked') == false) {
  $('#page_js_status').prop('checked',true);
  $(document).ready(async function(){
    jQuery(function($) {
      $.extend( $.fn.dataTable.defaults, {
        language: {
          url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Japanese.json"
        }
      });
    });

    let cropper = null;
    let canvas = $('#image_canvas');
    let ctx = canvas.get(0).getContext('2d');

    let result = await ajax_api_function("obj_ajax","");
    if (result.dataExists) {
      for (let i = 0;i < 4;i++) {
        let objs = result.data[`data_${i}`];
        let app = ``;
        objs.forEach((obj) => {
          app += `<option value="${obj.obj_id}">${obj.obj_name}</option>`;
        });
        select_option_arr[i] = app;
      };
    };

    (() => {
      $(document).off('change','#event_image_input').on('change','#event_image_input',function() {
        if (!this.files[0] || this.files.length != 1) {alert('正しくファイルが選択されていません,ファイルは1つのみ選択してください');return;}
        if (!this.files[0].type.match(/^image\//) ) {alert("画像ファイルを選択してください。");return;}

        $('#setting_modal_image').show();

        let reader = new FileReader();
        let img = new Image();
        canvas.cropper('destroy');
        let file = this.files[0];

        var maxSide = 1200;

        reader.onload = function(evt) {
          img.onload = function() {
            let imgw = img.width;
            let imgh = img.height;

            var h,w;
            if (imgw > maxSide) {
              w = maxSide;
              h = maxSide * (imgh / imgw);
            } else if (imgh > maxSide) {
              h = maxSide;
              w = maxSide * (imgw / imgh);
            } else {
              w = imgw;
              h = imgh;
            };

            canvas.attr('width', w).attr('height', h);
            ctx.drawImage(img,0,0,w,h);
            let cropper = canvas.cropper({aspectRatio: 19 / 10});

            $(document).off('click','#image_query_btn').on('click','#image_query_btn',function() {
              image_canvas_set = true;
              $('.setting_modal_bs').hide();
            });
            $(document).off('click','#image_reset_btn').on('click','#image_reset_btn',function() {
              $('input[name="file"]').val('');
              canvas.cropper('reset');
              $('#image_canvas').html(``);
              $('.setting_modal_bs').hide();
            });
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      });
      $(document).off('change','#club_image_input').on('change','#club_image_input',function() {
        if (!this.files[0] || this.files.length != 1) {alert('正しくファイルが選択されていません,ファイルは1つのみ選択してください');return;};
        if (!this.files[0].type.match(/^image\//) ) {alert("画像ファイルを選択してください。");return;};

        $('#setting_modal_image').show();

        let reader = new FileReader();
        let img = new Image();
        canvas.cropper('destroy');
        let file = this.files[0];

        var maxSide = 1200;

        reader.onload = function(evt) {
          img.onload = function() {
            let imgw = img.width;
            let imgh = img.height;

            var h,w;
            if (imgw > maxSide) {
              w = maxSide;
              h = maxSide * (imgh / imgw);
            } else if (imgh > maxSide) {
              h = maxSide;
              w = maxSide * (imgw / imgh);
            } else {
              w = imgw;
              h = imgh;
            };

            canvas.attr('width', w).attr('height', h);
            ctx.drawImage(img,0,0,w,h);
            let cropper = canvas.cropper({aspectRatio: 19 / 10});

            $(document).off('click','#image_query_btn').on('click','#image_query_btn',function() {
              image_canvas_set = true;
              $('.setting_modal_bs').hide();
            });
            $(document).off('click','#image_reset_btn').on('click','#image_reset_btn',function() {
              $('input[name="file"]').val('');
              canvas.cropper('reset');
              $('#image_canvas').html(``);
              $('.setting_modal_bs').hide();
            });
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      });
      $(document).off('change','#cl_update_image_input').on('change','#cl_update_image_input',function() {
        if (!this.files[0] || this.files.length != 1) {alert('正しくファイルが選択されていません,ファイルは1つのみ選択してください');return;};
        if (!this.files[0].type.match(/^image\//) ) {alert("画像ファイルを選択してください。");return;};

        $('#setting_modal_image').show();

        let reader = new FileReader();
        let img = new Image();
        canvas.cropper('destroy');
        let file = this.files[0];

        var maxSide = 1200;
        var maxCapacity = 100000;

        reader.onload = function(evt) {
          img.onload = function() {
            let imgw = img.width;
            let imgh = img.height;

            var h,w;
            if (imgw > maxSide) {
              w = maxSide;
              h = maxSide * (imgh / imgw);
            } else if (imgh > maxSide) {
              h = maxSide;
              w = maxSide * (imgw / imgh);
            } else {
              w = imgw;
              h = imgh;
            };

            canvas.attr('width', w).attr('height', h);

            ctx.drawImage(img,0,0,w,h);
            let cropper = canvas.cropper({aspectRatio: 19 / 10});

            $(document).off('click','#image_query_btn').on('click','#image_query_btn',function() {
              let oid = $('#cl_update_image_input').attr('data-id');

              let image = canvas.cropper('getCroppedCanvas').toDataURL("image/jpeg");
              var originalBlob = base64ToBlob(image);
              var uploadBlob = originalBlob;

              if (maxCapacity <= originalBlob["size"]) {
                var capacityRatio = maxCapacity / originalBlob["size"];
                var processedBinary = canvas.cropper('getCroppedCanvas').toDataURL("image/jpeg",capacityRatio);
                uploadBlob = base64ToBlob(processedBinary);
                console.log(capacityRatio);
                console.log(uploadBlob);
              };

              const S3_name = "raccommunityimageobjs";
              const S3_reagion = "ap-northeast-1";
              const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";

              AWS.config.region = S3_reagion;
              AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: IdentityPoolId,
              });
              AWS.config.credentials.get(function(){
                let accessKeyId = AWS.config.credentials.accessKeyId;
                let secretAccessKey = AWS.config.credentials.secretAccessKey;
                let sessionToken = AWS.config.credentials.sessionToken;
              });

              let files = [uploadBlob];
              let file = files[0];
              let file_name = `club_header_${oid}.jpeg`;
              let folder_path = `clubs/header/`;

              let ab_path = folder_path + file_name;
              let upload = new AWS.S3.ManagedUpload({
                params: {
                  Bucket: S3_name,
                  Key: ab_path,
                  Body:file,
                  ContentType: 'text/plain',
                  ACL: "public-read"
                }
              });

              let promise = upload.promise();
              promise.then(
                function(data) {
                  window.location.reload(true);
                },
                function(err) {
                  return alert(err.message);
                }
              );
            });
            $(document).off('click','#image_reset_btn').on('click','#image_reset_btn',function() {
              $('input[name="file"]').val('');
              canvas.cropper('reset');
              $('#image_canvas').html(``);
              $('.setting_modal_bs').hide();
            });
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      });
      $(document).off('change','#ev_update_image_input').on('change','#ev_update_image_input',function() {
        if (!this.files[0] || this.files.length != 1) {alert('正しくファイルが選択されていません,ファイルは1つのみ選択してください');return;};
        if (!this.files[0].type.match(/^image\//) ) {alert("画像ファイルを選択してください。");return;};

        $('#setting_modal_image').show();

        let reader = new FileReader();
        let img = new Image();
        canvas.cropper('destroy');
        let file = this.files[0];

        var maxSide = 1200;
        var maxCapacity = 100000;

        reader.onload = function(evt) {
          img.onload = function() {
            let imgw = img.width;
            let imgh = img.height;

            var h,w;
            if (imgw > maxSide) {
              w = maxSide;
              h = maxSide * (imgh / imgw);
            } else if (imgh > maxSide) {
              h = maxSide;
              w = maxSide * (imgw / imgh);
            } else {
              w = imgw;
              h = imgh;
            };

            canvas.attr('width', w).attr('height', h);
            ctx.drawImage(img,0,0,w,h);
            let cropper = canvas.cropper({aspectRatio: 19 / 10});

            $(document).off('click','#image_query_btn').on('click','#image_query_btn',function() {
              let oid = $('#ev_update_image_input').attr('data-id');

              let image = canvas.cropper('getCroppedCanvas').toDataURL("image/jpeg");
              var originalBlob = base64ToBlob(image);
              var uploadBlob = originalBlob;

              if (maxCapacity <= originalBlob["size"]) {
                var capacityRatio = maxCapacity / originalBlob["size"];
                var processedBinary = canvas.cropper('getCroppedCanvas').toDataURL("image/jpeg",capacityRatio);
                uploadBlob = base64ToBlob(processedBinary);
              };

              const S3_name = "raccommunityimageobjs";
              const S3_reagion = "ap-northeast-1";
              const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";

              AWS.config.region = S3_reagion;
              AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: IdentityPoolId,
              });
              AWS.config.credentials.get(function(){
                let accessKeyId = AWS.config.credentials.accessKeyId;
                let secretAccessKey = AWS.config.credentials.secretAccessKey;
                let sessionToken = AWS.config.credentials.sessionToken;
              });

              let files = [uploadBlob];
              let file = files[0];
              let file_name = `event_image.jpeg`;
              let folder_path = `events/event_${oid}/`;

              let ab_path = folder_path + file_name;
              let upload = new AWS.S3.ManagedUpload({
                params: {
                  Bucket: S3_name,
                  Key: ab_path,
                  Body:file,
                  ContentType: 'text/plain',
                  ACL: "public-read"
                }
              });

              let promise = upload.promise();
              promise.then(
                function(data) {
                  window.location.reload(true);
                },
                function(err) {
                  return alert(err.message);
                }
              );
            });
            $(document).off('click','#image_reset_btn').on('click','#image_reset_btn',function() {
              $('input[name="file"]').val('');
              canvas.cropper('reset');
              $('#image_canvas').html(``);
              $('.setting_modal_bs').hide();
            });
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      });
      $(document).off('change','#ev_update_attach').on('change','#ev_update_attach',function() {
        const S3_name = "raccommunityimageobjs";
        const S3_reagion = "ap-northeast-1";
        const IdentityPoolId = "ap-northeast-1:1420929a-8c01-4bec-b264-3df3ea117389";

        AWS.config.region = S3_reagion;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: IdentityPoolId,
        });
        AWS.config.credentials.get(function(){
          let accessKeyId = AWS.config.credentials.accessKeyId;
          let secretAccessKey = AWS.config.credentials.secretAccessKey;
          let sessionToken = AWS.config.credentials.sessionToken;
        });

        let oid = $('#ev_update_attach').attr('data-id');

        let attachments = getDOM('ev_update_attach').files;
        let file_name = attachments.length >= 1 ? attachments[0].name : "no-name";
        let files = [attachments[0]];
        let file = files[0];
        let folder_path = `events/event_${oid}/attachment/`;

        let ab_path = folder_path + file_name;
        let upload = new AWS.S3.ManagedUpload({
          params: {
            Bucket: S3_name,
            Key: ab_path,
            Body:file,
            ACL: "public-read"
          }
        });

        let promise = upload.promise();
        promise.then(
          async function(data) {
            let result = await ajax_api_function("change_ev_attach_status",{obj_id:oid});
            if (result.dataExists) {
              window.location.href = `/manager_home?pt=0&ss=true&st=1&os=true&oi=${oid}`;
            } else {
              alert('エラー発生');
            };
          },
          function(err) {
            alert('エラー発生');
          }
        );
      });
    })();

    const desc_section = async () => {
      $('#content_base').html(`<div class="loading_base inline"><i class="fad fa-spinner-third fa-spin"></i></div>`);
      let pt = $('input[name="page_input_"]:checked').prop('id').split('_')[2];
      let st = $('input[name="section_input_"]:checked').prop('id').split('_')[2];

      image_canvas_set = false;

      if (pt != 4) {
        if (st == 0) {
          let result =
          pt == 0
          ? await ajax_api_function("events_list_ajax","")
          : pt == 1
            ? await ajax_api_function("users_list_ajax","")
            : pt == 2
              ? await ajax_api_function("clubs_list_ajax","")
              : pt == 3
                ? await ajax_api_function("districts_list_ajax","")
                : console.log('throw');

          if (result.dataExists) {
            let objs = result.data;
            let ap = ``;

            /* {type:1=>String,2=>Number,3=>index,4=>date} */
            let source_arr = [
              [{type:4},{type:4},{type:3,na:catena},{type:3,na:statusna},{type:1},{type:3,na:limitna},{type:2},{type:2}],
              [{type:1},{type:1},{type:3,na:lvlna},{type:1}],
              [{type:1},{type:1},{type:1},{type:2}],
              [{type:2},{type:2}]
            ];

            objs.forEach((obj) => {
              let obj_id = obj.obj_id;
              let obj_name = obj.obj_name;
              let source = source_arr[pt];

              let app = ``;
              source.forEach((s,idx) => {
                var t = s.type;
                let data =
                t == 1
                ? (obj[`data_${idx}`] || "").unveil_str()
                : t == 2
                  ? (obj[`data_${idx}`] | 0)
                  : t == 3
                    ? s.na[obj[`data_${idx}`]]
                    : t == 4
                      ? `${(obj[`data_${idx}`] || "").escape_str().str_date(`.`)} (${wna[new Date(obj[`data_${idx}`].split('-')[0],obj[`data_${idx}`].split('-')[1] - 1,obj[`data_${idx}`].split('-')[2]).getDay()]})`
                      : console.log('throw');

                app += `<td>${data}</td>`;
              });

              ap +=
              `
              <tr>
                <th>
                  <a href="/manager_home?pt=${pt}&ss=true&st=1&os=true&&oi=${obj_id}">
                    ${obj_name}
                  </a>
                </th>
                ${app}
              </tr>
              `;
            });

            $('#content_base').html(
              `
              ${pt == 1
                ?
                `
                <div class="btn_bases">
                  <button id="download_user_list">ダウンロード.elsx</button>
                </div>
                `
                :``}
              <div class="table_base">
                <table id="list_table">
                  <thead>
                    <th></th>
                    ${pt == 0
                        ? `<th>日時</th><th>登録締切</th><th>カテゴリ</th><th>ステータス</th><th>主催者</th><th>公開範囲</th><th>参加者数</th><th>いいね!数</th>`
                        : pt == 1
                          ? `<th>所属クラブ</th><th>email</th><th>役職①</th><th>役職②</th>`
                          : pt == 2
                            ? `<th>email</th><th>リンク</th><th>所属地区</th><th>会員数</th>`
                            : pt == 3
                              ? `<th>クラブ数</th><th>会員数</th>`
                              : ``}
                  </thead>
                  <tbody>${ap}</tbody>
                </table>
              </div>
              `
            );

            $(document).off('click','#download_user_list').on('click','#download_user_list',function() {
              if (objs.length >= 1) {
                (() => {
                  $('#download_table_base').html(``);
                  let ap = ``;

                  objs.forEach((obj) => {
                    let usr_name = (obj.obj_name || "").unveil_str();
                    let usr_kana = (obj.obj_kana || "").unveil_str();
                    let usr_email = (obj.data_1 || "").unveil_str();
                    let cl_name = (obj.data_0 || "").unveil_str();
                    let usr_level = obj.data_2 | 0;
                    let usr_position = (obj.data_3 || "").unveil_str();
                    let usr_job = (obj.data_4 || "").unveil_str();
                    let usr_birth = obj.data_5.str_date(`.`);
                    let usr_age = obj.data_6;

                    ap +=
                    `
                    <tr>
                      <th>${usr_name}</th>
                      <th>${usr_kana}</th>
                      <th>${usr_email}</th>
                      <th>${cl_name}</th>
                      <th>${lvlna[usr_level]}</th>
                      <th>${usr_position}</th>
                      <th>${usr_job}</th>
                      <th>${usr_birth}</th>
                      <th>${usr_age}</th>
                    </tr>
                    `;
                  });
                  $('#download_table_base').append(
                    `
                    <tr>
                      <th>名前</th>
                      <th>かな</th>
                      <th>email</th>
                      <th>所属クラブ</th>

                      <th>役職①</th>
                      <th>役職②</th>
                      <th>職業</th>
                      <th>生年月日</th>
                      <th>年齢</th>
                    </tr>
                    ${ap}
                    `
                  );
                })();
                (() => {
                  let wopts = {
                    bookType: 'xlsx',
                    bookSST: false,
                    type: 'binary'
                  };
                  let workbook = {
                    SheetNames: [],
                    Sheets: {}
                  };
                  document.querySelectorAll('#download_table_base').forEach(function (currentValue, index) {
                    let n = currentValue.getAttribute('data-sheet-name');
                    if (!n) {n = 'Sheet' + index;}
                    workbook.SheetNames.push(n);
                    workbook.Sheets[n] = XLSX.utils.table_to_sheet(currentValue, wopts);
                  });
                  let wbout = XLSX.write(workbook, wopts);
                  function s2ab(s) {
                    let buf = new ArrayBuffer(s.length);
                    let view = new Uint8Array(buf);
                    for (var i = 0; i != s.length; ++i) {
                      view[i] = s.charCodeAt(i) & 0xFF;
                    }
                    return buf;
                  };
                  saveAs(new Blob([s2ab(wbout)], {
                    type: 'application/octet-stream'
                  }), `ユーザ一覧.xlsx`);
                })();
              } else {
                alert('該当するデータがなかったのでエクセル出力を停止しました。');
              }
            });

            if (pt == 0) {
              let table = $('#list_table').DataTable({
                columnDefs:[{type:'currency',targets:[6,7]}],
                lengthMenu: [10,30,50,100],
                displayLength:30,
                lengthChange: true,
                searching: true,
                ordering: true,
                info: true,
                paging: true,
                order:[[1,"desc"]]
              });
            } else {
              let table = $('#list_table').DataTable({
                lengthMenu: [10,30,50,100],
                displayLength:30,
                lengthChange: true,
                searching: true,
                ordering: true,
                info: true,
                paging: true,
                order:[[0,"asc"]]
              });
            };
          } else {
            alert(`データ通信エラー:${result.reason}`);
          };
        } else if (st == 1) {
          const page_leveling = () => {
            let tsna = ["イベント","ユーザー","クラブ","地区"];
            $('#content_base').html(
              `
              <div class="section">
                <div class="section_ttl">${tsna[pt]}の編集</div>
                <label class="obj_select">
                  <select id="obj_select">
                    ${select_option_arr[pt]}
                  </select>
                </label>
              </div>
              <div class="obj_content_base" id="obj_content_base">
              </div>
              `
            );

            $(`#obj_select option:eq(0)`).prop('selected',true);
            if (o_select) {
              let o_id = getDOM(`o_id`).value;
              o_select = false;
              $(`#obj_select option[value="${o_id}"]`).prop('selected',true);
            };
          };
          page_leveling();

          const desc_objs_content = (objs,so) => {
            if (pt == 0) {
              let ap = ``;
              let obj = objs.data;
              let obj_id = obj.obj_id | 0;

              const desc_info = () => {
                let title = (obj.title || "").unveil_str();
                let sub_title = (obj.sub_title || "").unveil_str();
                let category_id = obj.category_id | 0;
                let status = obj.status | 0;
                let description = (obj.description || "").replace(/ß/g,"\n").unveil_str();
                let attachment = obj.attachment | 0;
                let addr = (obj.addr || "").unveil_str();
                let price = obj.price | 0;
                let capacity = obj.capacity | 0;
                let read_level = obj.read_level | 0;
                let deadline = obj.deadline || "";
                let date = obj.date || "";
                let stime = obj.stime || "";
                let etime = obj.etime || "";
                let perti_type = obj.perti_type | 0;
                let after_chil = obj.after_chil | 0;
                let club_name = (obj.club_name || "").unveil_str();

                ap +=
                `
                <form onsubmit="event_update(); return false;" name="event_update_form">
                  <input type="hidden" name="obj_id" value="${obj_id}">

                  <div class="obj_content_base" id="obj_content_base">
                    <div class="cell _33perx1">
                      <div class="box">
                        <div class="cell_ttl">概要</div>
                        <div class="content _summary">
                          <div class="row_">
                            <div class="tl">タイトル <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <input type="text" name="title" value="${title}" required>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">サブタイトル</div>
                            <div class="cntr">
                              <input type="text" name="sub_title" value="${sub_title}">
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">主催者</div>
                            <div class="cntr">${club_name}</div>
                          </div>
                          <div class="row_">
                            <div class="tl">カテゴリ</div>
                            <div class="cntr">
                              <select id="ev_update_cate_id_select">
                                <option value="1" ${category_id == 1?`selected`:``}>通常例会</option>
                                <option value="2" ${category_id == 2?`selected`:``}>屋外例会</option>
                                <option value="3" ${category_id == 3?`selected`:``}>社会奉仕</option>
                                <option value="4" ${category_id == 4?`selected`:``}>飲み会・交流</option>
                              </select>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">公開範囲 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <select id="ev_update_read_level_select">
                                <option value="1" ${read_level == 1?`selected`:``}>全てのユーザー</option>
                                <option value="2" ${read_level == 2?`selected`:``}>同地区内</option>
                                <option value="3" ${read_level == 3?`selected`:``}>同クラブ内</option>
                              </select>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">参加方法 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <select id="ev_update_perti_type_select">
                                <option value="1" ${perti_type == 1?`selected`:``}>現地参加 + オンライン参加</option>
                                <option value="2" ${perti_type == 2?`selected`:``}>現地参加のみ</option>
                                <option value="3" ${perti_type == 3?`selected`:``}>オンライン参加のみ</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="cell _33perx1">
                      <div class="box">
                        <div class="cell_ttl">日時と場所</div>
                        <div class="content _summary">
                          <div class="row_">
                            <div class="tl">日付 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <input type="date" name="date" value="${date}" required>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">登録締切日 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <input type="date" name="deadline" value="${deadline}" required>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">開始時刻 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <input type="time" name="stime" value="${stime}" required>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">終了時刻 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <input type="time" name="etime" value="${etime}" required>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">住所 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <input type="text" name="addr" value="${addr}" required>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="cell _33perx1">
                      <div class="box">
                        <div class="cell_ttl">詳細情報①</div>
                        <div class="content _summary">
                          <div class="row_">
                            <div class="tl">イベント説明</div>
                            <div class="cntr">
                              <textarea rows="5" id="ev_update_desciprtion">${description}</textarea>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">ステータス</div>
                            <div class="cntr">
                              <select id="ev_update_status_select">
                                <option value="0" ${status == 0?`selected`:``}>非公開</option>
                                <option value="1" ${status == 1?`selected`:``}>公開中</option>
                              </select>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">登録費</div>
                            <div class="cntr">
                              <input type="number" name="price" value="${price}">
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">参加数目安</div>
                            <div class="cntr">
                              <input type="number" name="capacity" value="${capacity}">
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">懇親会 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <select id="ev_create_after_chil_select">
                                <option value="1" ${after_chil==1?`selected`:``}>なし</option>
                                <option value="2" ${after_chil==2?`selected`:``}>あり</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="submit_base">
                    <button onClick="event_delete(${obj_id})" class="delete" id="event_delete_btn" type="button">削除</button>
                    <button type="submit">更新する</button>
                  </div>
                </form>


                <div class="cell _33perx1">
                  <div class="box">
                    <div class="cell_ttl">詳細情報②</div>
                    <div class="content _summary">
                      <div class="row_">
                        <div class="tl">参考資料</div>
                        <div class="cntr" id="event_edit_attach"></div>
                      </div>
                      <div class="row_">
                        <div class="tl">ヘッダー画像</div>
                        <div class="cntr">
                          <input type="file" accept="image/*" id="ev_update_image_input" data-id="${obj_id}">
                          <label for="ev_update_image_input">
                            <img src="${s3_path}/events/event_${obj_id}/event_image.jpeg" alt="">
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                `;
              };
              const desc_users = () => {
                let oa = objs.users;

                let app = ``;
                oa.forEach((obj) => {
                  let regi_id = obj.regi_id;
                  let user_id = obj.user_id | 0;
                  let user_name = (obj.user_name || "").unveil_str();

                  let at = obj.at | 0;
                  let pt = obj.pt | 0;
                  app +=
                  `
                  <div class="row">
                    <div class="icon">
                      <img src="${s3_path}/users/icon/user_icon_${user_id}.jpeg" alt="">
                    </div>
                    <div class="txt text_overflow">
                      <a href="/user_page?user_id=${user_id}" target="_blank">${user_name}</a>
                    </div>
                    <div class="txt txt_1 text_overflow">${regiptna[pt]}</div>
                    <div class="txt txt_1 text_overflow">${regiatna[at]}</div>
                    <div class="crud">
                      <button onClick="delete_register(${regi_id});">削除</button>
                    </div>
                  </div>
                  `;
                });
                ap +=
                `
                <div class="cell _33perx1">
                  <div class="box">
                    <div class="cell_ttl">
                      参加者一覧
                      <div class="btn_base inline">
                        <button id="event_users_excel_btn">
                          <i class="fas fa-file-excel"></i> 参加者一覧.xlsx
                        </button>
                      </div>
                      <div class="sum_indi">${oa.length}人</div>
                    </div>
                    <div class="content _userList">
                      ${app}
                    </div>

                    <!--<form onsubmit="addUser_forms(); return false;" name="addUser_form">
                      <label>
                        <select id="event_addUser_select">
                          ${select_option_arr[1]}
                        </select>
                        <input type="hidden" name="event_id" value="${so.obj_id}" required>
                        <button class="button create" type="submit">追加</button>
                      </label>
                    </form>-->
                  </div>
                </div>
                `;

                $(document).off('click','#event_users_excel_btn').on('click','#event_users_excel_btn',function() {
                  download_excel(1,oa);
                });
              };
              const desc_comments = () => {
                let oa = objs.comments;

                let app = ``;
                oa.forEach((obj) => {
                  let ec_id = obj.obj_id | 0;
                  let description = (obj.description || "").replace(/ß/g,"\n").unveil_str();
                  let date = obj.date || "";
                  let time = obj.time || "";
                  let user_id = obj.user_id | 0;
                  let user_name = (obj.user_name || "").unveil_str();

                  app +=
                  `
                  <div class="row">
                    <div class="top_indi">
                      <div class="icon">
                        <img src="${s3_path}/users/icon/user_icon_${user_id}.jpeg" alt="">
                      </div>
                      <div class="txt text_overflow">
                        <a href="/user_page?user_id=${user_id}" target="_blank">${user_name}</a>
                      </div>
                      <div class="date text_overflow">${date.str_date(`.`)} ${time}</div>
                      <div class="crud">
                        <button onClick="delete_comment(${ec_id});">削除</button>
                      </div>
                    </div>
                    <div class="txts">${description}</div>
                  </div>
                  `;
                });
                ap +=
                `
                <div class="cell _33perx1">
                  <div class="box">
                    <div class="cell_ttl">
                      コメント一覧
                      <div class="sum_indi">${oa.length}件</div>
                    </div>
                    <div class="content _commentList">
                      ${app}
                    </div>
                    <form onsubmit="comment_forms(); return false;" name="comment_form">
                      <label>
                        <input type="text" placeholder="質問の返信やイベント詳細を投稿しましょう" name="text" required>
                        <input type="hidden" name="event_id" value="${so.obj_id}" required>
                        <button class="button create" type="submit">投稿</button>
                      </label>
                    </form>
                  </div>
                </div>
                `;
              };

              desc_info();
              desc_users();
              desc_comments();

              $('#obj_content_base').html(ap);

              (() => {
                let attach = obj.attachment | 0;
                if (attach == 1) {
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
                      Prefix: `events/event_${obj_id}/attachment/`
                    };
                    let s3 = new AWS.S3;
                    s3.listObjectsV2(folder_params).promise().then(function (data) {
                      let file_name = data.Contents[0].Key.split('/')[3];
                      $('#event_edit_attach').html(
                        `
                        <a class="attachment_link" href="${s3_path}/${data.Contents[0].Key}" download="${file_name}"><div class="file_box inline">${file_name}</div></a>
                        <br>
                        <span style="font-size:.6rem;color:#aaa;">もしくは再アップロードする</span>
                        <input class="ev_input" type="file" id="ev_update_attach" data-id="${obj_id}">
                        `
                      );
                    }).catch(function (err) {
                      alert(err);
                    });
                  })();
                } else {
                  $('#event_edit_attach').html(
                    `
                    ファイルはありません
                    <br>
                    <span style="font-size:.6rem;color:#aaa;">もしくはアップロードする</span>
                    <input class="ev_input" type="file" id="ev_update_attach" data-id="${obj_id}">
                    `
                  );
                };
              })();
            } else if (pt == 1) {
              let ap = ``;
              let obj = objs.data;
              let obj_id = obj.obj_id | 0;
              let cl_id = obj.cl_id | 0;

              const desc_info = () => {
                let obj_name = (obj.obj_name || "").unveil_str();
                let kana = (obj.kana || "").unveil_str();
                let ul = obj.user_level | 0;
                let position = (obj.position || "").unveil_str();
                let email = (obj.email || "").unveil_str();
                let description = (obj.description || "").replace(/ß/g,"\n").unveil_str();
                let birth = obj.birth || "";
                let job = (obj.job || "").unveil_str();
                let join_year = obj.join_year || "";

                ap +=
                `
                <div class="obj_content_base" id="obj_content_base">
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">基本情報</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">ユーザー名 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="name" placeholder="ユーザー名" value="${obj_name}" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">かな <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="kana" placeholder="かな" value="${kana}" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">生年月日</div>
                          <div class="cntr">
                            <input type="date" name="birth" value="${birth}">
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">所属クラブ</div>
                          <div class="cntr">
                            <select id="usr_update_club_id_select">${select_option_arr[2]}</select>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">email</div>
                          <div class="cntr">${email}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">詳細情報①</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">入会年度</div>
                          <div class="cntr">
                            <input type="number" name="join_year" value=${join_year}>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">役職① <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <select id="usr_update_user_level_select">
                              <option value="5" ${ul == 5?`selected`:``} ${user_level!=1&&ul==1?`disabled`:``}>ロータリアン</option>
                              <option value="1" ${ul == 1?`selected`:``} ${user_level!=1?`disabled`:``}>マスター管理者</option>
                              <option value="2" ${ul == 2?`selected`:``} ${user_level!=1&&ul==1||user_level>2?`disabled`:``}>地区役員</option>
                              <option value="3" ${ul == 3?`selected`:``} ${user_level!=1&&ul==1?`disabled`:``}>クラブ役員</option>
                              <option value="4" ${ul == 4?`selected`:``} ${user_level!=1&&ul==1?`disabled`:``}>一般会員</option>
                              <option value="6" ${ul == 6?`selected`:``} ${user_level!=1&&ul==1?`disabled`:``}>OB・OG</option>
                              <option value="7" ${ul == 7?`selected`:``} ${user_level!=1&&ul==1?`disabled`:``}>ビジター</option>
                            </select>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">役職② <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="position" placeholder="役職②" value="${position}" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">職業</div>
                          <div class="cntr">
                            <input type="text" name="job" value="${job}">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">詳細情報②</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">アイコン画像</div>
                          <div class="cntr">
                            <img class="icon" src="${s3_path}/users/icon/user_icon_${obj_id}.jpeg" alt="">
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">自己紹介文</div>
                          <div class="cntr cntr_ta">${description}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="submit_base">
                  <button onClick="user_reset(${obj_id},'${email}')" class="reset" type="button">パスワードのリセット</button>
                  <button onClick="user_delete(${obj_id})" class="delete" id="user_delete_btn" type="button">削除</button>
                  <button type="submit">更新する</button>
                </div>
                `;
              };
              desc_info();

              $('#obj_content_base').html(
                `
                <form onsubmit="user_update(); return false;" name="user_update_form">
                <input type="hidden" name="obj_id" value="${obj_id}">
                ${ap}
                </form>
                `
              );
              $(`#usr_update_club_id_select option[value="${cl_id}"]`).prop('selected',true);

            } else if (pt == 2) {
              let ap = ``;
              let obj = objs.data;
              let obj_id = obj.obj_id | 0;

              const desc_info = () => {
                let obj_name = (obj.obj_name || "").unveil_str();
                let short_name = (obj.short_name || "").unveil_str();
                let email = (obj.email || "").unveil_str();
                let link = (obj.link || "").unveil_str();
                let description = (obj.description || "").replace(/ß/g,"\n").unveil_str();
                let dst_name = (obj.dst_name || "").unveil_str();
                let establish = obj.establish || "";

                ap +=
                `
                <div class="obj_content_base" id="obj_content_base">
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">基本情報</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">クラブ名 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="name" placeholder="クラブ名" value="${obj_name}" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">クラブ略名 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="short_name" placeholder="クラブ略名" value="${short_name}" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">所属地区</div>
                          <div class="cntr">${dst_name}</div>
                        </div>
                        <div class="row_">
                          <div class="tl">email</div>
                          <div class="cntr">
                            <input type="email" name="email" placeholder="email" value="${email}">
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">設立日 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="date" name="establish" value="${establish}" required>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">詳細情報</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">ヘッダー画像</div>
                          <div class="cntr">
                            <input type="file" accept="image/*" id="cl_update_image_input" data-id="${obj_id}">
                            <label for="cl_update_image_input">
                              <img src="${s3_path}/clubs/header/club_header_${obj_id}.jpeg" alt="" id="cl_update_image">
                            </label>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">クラブ説明</div>
                          <div class="cntr">
                            <textarea rows="5" id="cl_update_desciprtion" placeholder="クラブ概要説明欄">${description}</textarea>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">LINK</div>
                          <div class="cntr">
                            <input type="text" name="link" placeholder="URL・外部リンク" value="${link}">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="submit_base">
                  ${user_level == 1 ? `<button onClick="club_delete(${obj_id})" class="delete" id="club_delete_btn" type="button">削除</button>`:``}
                  <button type="submit">更新する</button>
                </div>
                `;
              };
              desc_info();

              $('#obj_content_base').html(
                `
                <form onsubmit="club_update(); return false;" name="club_update_form">
                <input type="hidden" name="obj_id" value="${obj_id}">
                ${ap}
                </form>
                `
              );
            } else if (pt == 3) {
              let ap = ``;
              let obj = objs.data;
              let obj_id = obj.obj_id | 0;

              const desc_info = () => {
                let obj_name = (obj.obj_name || "").unveil_str();

                ap +=
                `
                <div class="obj_content_base" id="obj_content_base">
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">基本情報</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">地区名 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="name" placeholder="地区名" value="${obj_name}" required>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="submit_base">
                  <button type="submit">更新する</button>
                </div>
                `;
              };
              desc_info();

              $('#obj_content_base').html(
                `
                <form onsubmit="district_update(); return false;" name="district_update_form">
                <input type="hidden" name="obj_id" value="${obj_id}">
                ${ap}
                </form>
                `
              );
            };
          };

          const desc_objs_init = async () => {
            $('#obj_content_base').html(`<div class="loading_base inline"><i class="fad fa-spinner-third fa-spin"></i></div>`);
            let o_id = $(`#obj_select option:selected`).prop('value');

            const sender_data = {obj_type:Number(pt),obj_id:Number(o_id)};
            let result = await ajax_api_function("obj_edit_ajax",sender_data);
            if (result.dataExists) {
              desc_objs_content(result.data,sender_data);
            } else {
              alert(`データ通信エラー:${result.reason}`);
            };
          };
          $(document).off('change','#obj_select').on('change','#obj_select',function() {
            desc_objs_init();
          });
          desc_objs_init();
        } else if (st == 2) {
          if (pt == 0) {
            $('#content_base').html(
              `
              <form onsubmit="event_create(); return false;" name="event_create_form">

                <div class="obj_content_base" id="obj_content_base">
                  <div class="section">
                    <div class="section_ttl">新規イベント作成</div>
                  </div>
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">概要</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">タイトル <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="title" placeholder="タイトル" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">サブタイトル</div>
                          <div class="cntr">
                            <input type="text" name="sub_title" placeholder="サブタイトル">
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">主催者 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <select id="ev_create_club_id_select">
                              ${select_option_arr[2]}
                            </select>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">カテゴリ <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <select id="ev_create_cate_id_select">
                              <option value="1">通常例会</option>
                              <option value="2">屋外例会</option>
                              <option value="3">社会奉仕</option>
                              <option value="4">飲み会・交流</option>
                            </select>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">公開範囲 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <select id="ev_create_limiter_select">
                              <option value="1">全てのユーザー</option>
                              <option value="2">同地区内</option>
                              <option value="3">同クラブ内</option>
                            </select>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">参加方法 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <select id="ev_create_perti_type_select">
                              <option value="1">現地参加 + オンライン参加</option>
                              <option value="2">現地参加のみ</option>
                              <option value="3">オンライン参加のみ</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">日時と場所</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">日付 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="date" name="date" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">登録締切日 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="date" name="deadline" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">開始時刻 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="time" name="stime" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">終了時刻 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="time" name="etime" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">住所 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="addr" placeholder="住所" required>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">詳細情報</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">イベント説明</div>
                          <div class="cntr">
                            <textarea rows="5" id="ev_create_desciprtion" placeholder="イベント概要説明欄"></textarea>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">登録費</div>
                          <div class="cntr">
                            <input type="number" name="price" value="0" min="0">
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">参加数目安</div>
                          <div class="cntr">
                            <input type="number" name="capacity" value="0" min="0">
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">懇親会 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <select id="ev_create_after_chil_select">
                              <option value="1">なし</option>
                              <option value="2">あり</option>
                            </select>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">背景画像</div>
                          <div class="cntr">
                            <input class="ev_input" type="file" name="bgi" accept="image/*" id="event_image_input">
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">参考資料</div>
                          <div class="cntr">
                            <input class="ev_input" type="file" id="ev_create_attach">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="submit_base">
                  <button type="submit">作成する</button>
                </div>

              </form>
              `
            );
          } else if (pt == 1) {
            $('#content_base').html(
              `
              <form onsubmit="user_create(); return false;" name="user_create_form">

                <div class="obj_content_base" id="obj_content_base">
                  <div class="section">
                    <div class="section_ttl">新規ユーザー作成</div>
                  </div>
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">基本情報</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">ユーザー名 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="name" placeholder="ユーザー名" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">かな <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="kana" placeholder="かな" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">生年月日</div>
                          <div class="cntr">
                            <input type="date" name="birth">
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">所属クラブ <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <select id="usr_create_cl_id_select">
                              ${select_option_arr[2]}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">詳細情報</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">email <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="email" name="email" placeholder="email" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">入会年度</div>
                          <div class="cntr">
                            <input type="number" name="join_year">
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">役職① <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <select id="usr_create_user_level_select">
                              <option value="5">ロータリアン</option>
                              ${user_level==1?`<option value="1">マスター管理者</option>`:``}
                              ${user_level<=2?`<option value="2">地区役員</option>`:``}
                              ${user_level<=3?`<option value="3">クラブ役員</option>`:``}
                              <option value="4" selected>一般会員</option>
                              <option value="6">OB・OG</option>
                              <option value="7">ビジター</option>
                            </select>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">役職② <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="position" placeholder="○○委員長など" required>
                          </div>
                        </div>
                        <div class="row_">
                          <div class="tl">職業 </div>
                          <div class="cntr">
                            <input type="text" name="job">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="submit_base">
                  <button type="submit">作成する</button>
                </div>

              </form>
              `
            );
          } else if (pt == 2) {
            if (user_level <= 2) {
              $('#content_base').html(
                `
                <form onsubmit="club_create(); return false;" name="club_create_form">

                  <div class="obj_content_base" id="obj_content_base">
                    <div class="section">
                      <div class="section_ttl">新規クラブ作成</div>
                    </div>
                    <div class="cell _33perx1">
                      <div class="box">
                        <div class="cell_ttl">基本情報</div>
                        <div class="content _summary">
                          <div class="row_">
                            <div class="tl">クラブ名 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <input type="text" name="name" placeholder="クラブ名" required>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">クラブ略名 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <input type="text" name="short_name" placeholder="クラブ略名" required>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">所属地区 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <select id="cl_create_dst_id_select">
                                ${select_option_arr[3]}
                              </select>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">email</div>
                            <div class="cntr">
                              <input type="email" name="email" placeholder="email">
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">設立日 <span class="astarisk">*</span></div>
                            <div class="cntr">
                              <input type="date" name="establish" required>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="cell _33perx1">
                      <div class="box">
                        <div class="cell_ttl">詳細情報</div>
                        <div class="content _summary">
                          <div class="row_">
                            <div class="tl">ヘッダー画像</div>
                            <div class="cntr">
                              <input class="ev_input" type="file" accept="image/*" id="club_image_input">
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">クラブ説明</div>
                            <div class="cntr">
                              <textarea rows="5" id="cl_create_desciprtion" placeholder="クラブ概要説明欄"></textarea>
                            </div>
                          </div>
                          <div class="row_">
                            <div class="tl">LINK</div>
                            <div class="cntr">
                              <input type="text" name="link" placeholder="URL・外部リンク">
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="submit_base">
                    <button type="submit">作成する</button>
                  </div>

                </form>
                `
              );
            } else {
              $('#content_base').html(`<div class="loading_base inline">アクセス権がありません</div>`);
            }
          } else if (pt == 3) {
            if (user_level == 1) {
            $('#content_base').html(
              `
              <form onsubmit="district_create(); return false;" name="district_create_form">

                <div class="obj_content_base" id="obj_content_base">
                  <div class="section">
                    <div class="section_ttl">新規地区作成</div>
                  </div>
                  <div class="cell _33perx1">
                    <div class="box">
                      <div class="cell_ttl">基本情報</div>
                      <div class="content _summary">
                        <div class="row_">
                          <div class="tl">地区名 <span class="astarisk">*</span></div>
                          <div class="cntr">
                            <input type="text" name="name" placeholder="地区名" required>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="submit_base">
                  <button type="submit">作成する</button>
                </div>

              </form>
              `
            );
            } else {
              $('#content_base').html(`<div class="loading_base inline">アクセス権がありません</div>`);
            };
          };
        };
      } else if (pt == 4) {
        if (st == 0 || st == 1 || st == 2 || st == 3) {
          let result =
          st == 0
          ? await ajax_api_function("ev_analytics_ajax","")
          : st == 1
            ? await ajax_api_function("usr_analytics_ajax","")
            : st == 2
              ? await ajax_api_function("cl_analytics_ajax","")
              : console.log('throw');

          if (result.dataExists) {
            let objs = result.data;
            let ap = ``;
            /* {type:1=>String,2=>Number,3=>index,4=>date,5=>ratio} */
            let source_arr = [
              [{type:4},{type:2},{type:2},{type:2},{type:2},{type:2},{type:2},{type:2}],
              [{type:1},{type:2},{type:2},{type:5},{type:2},{type:2},{type:2}],
              [{type:2},{type:2},{type:2},{type:2},{type:2}]
            ];

            objs.forEach((obj) => {
              let obj_id = obj.obj_id;
              let obj_name = obj.obj_name;
              let source = source_arr[st];

              let app = ``;
              source.forEach((s,idx) => {
                var t = s.type;
                let data =
                t == 1
                ? (obj[`data_${idx}`] || "").unveil_str()
                : t == 2
                  ? (obj[`data_${idx}`] | 0).toLocaleString()
                  : t == 3
                    ? s.na[obj[`data_${idx}`]]
                    : t == 4
                      ? `${(obj[`data_${idx}`] || "").escape_str().str_date(`.`)} (${wna[new Date(obj[`data_${idx}`].split('-')).getDay()]})`
                      : t == 5
                        ? `${obj[`data_${idx}`].to_perate(1)}%`
                        : console.log('throw');

                app += `<td>${st==0&&idx==1?`¥`:``}${data}</td>`;
              });

              ap +=
              `
              <tr>
                <th>${obj_name}</th>
                ${app}
              </tr>
              `;
            });

            $('#content_base').html(
              `
              <div class="table_base">
                <table id="list_table">
                  <thead>
                    <th></th>
                    ${st == 0
                        ? `<th>日時</th><th>予定収益</th><th>参加者合計</th><th>ローターアクター</th><th>ロータリアン</th><th>ビジター</th><th>いいね!数</th><th>いいね!ユーザ数</th>`
                        : st == 1
                          ? `<th>所属クラブ</th><th>例会参加数</th><th>自クラブ例会参加数</th><th>自クラブ出席率</th><th>他クラブ例会参加数</th><th>いいね!した数</th><th>いいね！した例会数</th>`
                          : st == 2
                            ? `<th>主催したイベント数</th><th>合計参加者数</th><th>純参加者数</th><th>合計いいね!数</th><th>いいね!したユーザ数</th>`
                            : ``}
                  </thead>
                  <tbody>${ap}</tbody>
                </table>
              </div>
              `
            );
            if (st == 0) {
              let table = $('#list_table').DataTable({
                columnDefs:[{type:'currency',targets:[2,3,4,5,6,7]}],
                lengthMenu: [10,30,50,100],
                displayLength:30,
                lengthChange: true,
                searching: true,
                ordering: true,
                info: true,
                paging: true,
                order:[[1,"desc"]]
              });
            } else {
              let table = $('#list_table').DataTable({
                lengthMenu: [10,30,50,100],
                displayLength:30,
                lengthChange: true,
                searching: true,
                ordering: true,
                info: true,
                paging: true,
                order:[[0,"asc"]]
              });
            };
          } else {
            alert(`データ通信エラー:${result.reason}`);
          };
        } else if (st == 4 || st == 5 || st == 6 || st == 7) {

        };
      };
    };

    const desc_page = (type) => {
      $(`#page_input_${type}`).prop('checked',true);

      let ap = ``;
      let na = type != 4
      ? [
        "一覧",
        "編集",
        "新規作成"
      ]:[
        "イベント",
        "ユーザ",
        "クラブ"
      ];
      let ia = type != 4
      ? [
        ``,
        `fad fa-edit`,
        `fas fa-plus-square`
      ]:[
        `fas fa-calendar-star`,
        `fas fa-user`,
        `fas fa-club`
      ];
      let length = type != 4 ? 3:3;
      for (let i = 0;i < length;i++) {
        if (type == 4 && i == 4) {
          ap += `<div class="border inline"></div>`;
        }
        if (type != 4 && i == 1) {
          ap += `<div class="border inline"></div>`;
        }
        ap +=
        `
        <input type="radio" name="section_input_" id="section_input_${i}">
        <label for="section_input_${i}" class="inline">
          <div class="txt inline">
            <i class="${ia[i]}"></i> ${na[i]}
          </div>
        </label>
        `;
      };
      $('#top_bar_base').html(ap);

      $(document).off('input','input[name="section_input_"]').on('input','input[name="section_input_"]',function() {
        desc_section();
      });
      if (s_select) {
        /* init paging */
        let st = getDOM('s_type').value | 0;
        s_select = false;
        $(`input[name="section_input_"]:eq(${st})`).prop('checked',true);
      } else {
        $('input[name="section_input_"]:eq(0)').prop('checked',true);
      };
      desc_section();
    };

    $(document).off('input','input[name="page_input_"]').on('input','input[name="page_input_"]',function() {
      let index = $(this).prop('id').split('_')[2];
      desc_page(index);
    });
    let pt = getDOM('p_type').value | 0;
    desc_page(pt);
  });
};
