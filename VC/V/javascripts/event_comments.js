var s3_path = getDOM('s3_path').value;
var event_id = getDOM('event_id').value;
var current_user_id = getDOM('current_user_id').value;

var comment_forms = async () => {
  $('form[name="comment_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="comment_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let $value = (document.forms['comment_form'].elements['text'].value || "").escape_str().replace(/\r?\n/g," ");

  const sender_data = {text:$value,event_id:Number(event_id)}
  let result = await ajax_api_function("create_comment_ajax",sender_data);
  if (result.dataExists) {
    window.location.reload();
  } else {
    alert(`データ通信エラー:${result.reason}`);
    $('form[name="comment_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="comment_form"] button[type="submit"]').html('投稿する');
  }
}

if ($('#page_js_status').prop('checked') == false) {
  $('#page_js_status').prop('checked',true);
  $(document).ready(function(){
    const desc_page = (data) => {
      let ev_obj = data.data;
      let comment_obj = data.comment;

      const desc_information = () => {
        let title = ev_obj.event_title.unveil_str();
        let sub_title = ev_obj.sub_title.unveil_str();
        $('#profile_contents').html(
          `
          <div class="ttl">イベント : ${title}</div>
          <div class="sttl">${sub_title}</div>
          コメント一覧
          `
        );
      }
      const desc_comments = () => {
        let ap = ``;

        let objs = comment_obj;
        let count = objs.length;

        objs.forEach((obj) => {
          let user_id = obj.user_id || 0;
          let user_name = obj.user_name || "";
          let date = obj.date || "";
          let time = obj.time || "";
          let description = (obj.description || "").replace(/ß/g,"\n").unveil_str();

          ap +=
          `
          <div class="cl">
            <div class="prnt">
              <div class="icn">
                <img src="${s3_path}/users/icon/user_icon_${user_id}.jpeg" alt="">
              </div>
              <div class="txtb">
                <div class="txt text_overflow">${user_name}</div>
                <div class="sub text_overflow">${date.str_date(`/`)} ${time}</div>
              </div>
            </div>
            <div class="txt_cntr">${description}</div>
          </div>
          `;
        });
        $('#comment_table').html(`<div class="ttl">${count}件のコメント</div>${ap}`);
      }

      desc_information();
      desc_comments();
    }
    const desc_init = async () => {
      let event_id = getDOM('event_id').value;
      const sender_data = {
        event_id:Number(event_id)
      }

      let result = await ajax_api_function("read_comment_ajax",sender_data);
      if (result.dataExists) {
        desc_page(result.data);
      } else {
        alert(`データ通信エラー:${result.reason}`);
      }
    }
    desc_init();
  });
}
