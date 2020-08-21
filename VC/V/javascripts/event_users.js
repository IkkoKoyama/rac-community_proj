var s3_path = getDOM('s3_path').value;
var event_id = getDOM('event_id').value;
var current_user_id = getDOM('current_user_id').value;

if ($('#page_js_status').prop('checked') == false) {
  $('#page_js_status').prop('checked',true);
  $(document).ready(function(){
    const desc_page = (data) => {
      let ev_obj = data.data;
      let user_obj = data.user;

      const desc_information = () => {
        let title = ev_obj.event_title.unveil_str();
        let sub_title = ev_obj.sub_title.unveil_str();
        $('#profile_contents').html(
          `
          <div class="ttl">イベント : ${title}</div>
          <div class="sttl">${sub_title}</div>
          ユーザー一覧
          `
        );
      };
      const desc_users = () => {
        let ap = ``;
        let objs = user_obj;
        let count = objs.length;

        objs.forEach((cell) => {
          let user_id = Number(cell.user_id | 0);
          let user_name = (cell.user_name || "").unveil_str();
          ap +=
          `
          <div class="cl inline">
            <a href="/user_page?user_id=${user_id}">
              <div class="bgi">
                <img src="${s3_path}/users/icon/user_icon_${user_id}.jpeg" alt="">
              </div>
              <div class="cnsl _nm">${user_name} ${user_id == current_user_id ? `(あなた)`:``}</div>
            </a>
          </div>
          `;
        });
        $('#user_table_cell').html(`<div class="ttl">${count}人のユーザーが参加予定</div>${ap}`);
      };
      desc_information();
      desc_users();
    };
    const desc_init = async () => {
      let event_id = getDOM('event_id').value;
      const sender_data = {
        event_id:Number(event_id)
      };
      let result = await ajax_api_function("event_users_ajax",sender_data);
      if (result.dataExists) {
        desc_page(result.data);
      } else {
        alert(`データ通信エラー:${result.reason}`);
      };
    };
    desc_init();
  });
};
