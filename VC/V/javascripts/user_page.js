var s3_path = getDOM('s3_path').value;
var user_id = getDOM('user_id').value;

if ($('#page_js_status').prop('checked') == false) {
  $('#page_js_status').prop('checked',true);
  $(document).ready(function(){
    const desc_page = (data) => {
      let usr_obj = data.data;
      let ev_obj = data.event;

      const desc_information = () => {
        let name = usr_obj.user_name || "";
        let kana = usr_obj.user_kana || "";
        let description = (usr_obj.user_description || "").replace(/ß/g,"\n").unveil_str();
        let user_email = usr_obj.user_email;
        let user_level = usr_obj.user_level;
        let user_position = (usr_obj.user_position || "").unveil_str();
        // let user_age = usr_obj.age | 0;
        // let user_birth = usr_obj.birth_day || "";
        // let user_job = (usr_obj.job || "").escape_str();
        let user_join_year = usr_obj.join_year || "--";

        let club_id = usr_obj.club_id;
        let club_name = usr_obj.club_name;

        $('#usr_name').text(name);
        $('#usr_kana').text(kana);
        $('#usr_email').text(user_email);
        $('#usr_desc').text(description);
        $('#usr_level').text(lvlna[user_level]);
        $('#usr_position').text(user_position);

        let join_year_end = String(Number(user_join_year | 0) + 1).slice(2) || "--";
        $('#usr_join_year').text(`${user_join_year}-${join_year_end}年度`);

        /*if (user_birth != "00-00" && user_birth) {
          $('#usr_age').text(`${user_age}歳`);
          $('#usr_birth_day').text(`${Number(user_birth.split('-')[0])}月${Number(user_birth.split('-')[1])}日`);
        } else {
          $('#usr_age').text(`非公開`);
          $('#usr_birth_day').text(`非公開`);
        };
        user_job
        ? $('#usr_job').text(user_job)
        : $('#usr_job').text(`非公開`);
        */

        $('#usr_club_name').html(`<a href="/club_page?club_id=${club_id}">${club_name}</a>`);
      };
      const desc_events = () => {
        let objs = ev_obj;
        $('#ev_indi').html(`${objs.length}件`);
        let ap = ``;

        objs.forEach((obj) => {
          let event_id = Number(obj.event_id || 0);
          let event_title = obj.event_title || "";
          let sdate = obj.sdate;
          let year = sdate.split('-')[0];
          let month = sdate.split('-')[1] - 1;
          let day = sdate.split('-')[2];
          let week = new Date(year,month,day).getDay();

          ap +=
          `
          <div class="cl inline">
            <a href="/event_page?event_id=${event_id}">
              <div class="bgi">
                <img src="${s3_path}/events/event_${event_id}/event_image.jpeg" alt="">
              </div>
              <div class="cnsl _nm">${event_title}</div>
              <div class="cnsl _date">${sdate.str_date(`.`)} (${wna[week]})</div>
            </a>
          </div>
          `;
        });
        $('#event_table_cell').html(ap);
      };
      desc_information();
      desc_events();
    };
    const desc_init = async () => {
      const sender_data = {
        user_id:user_id
      };
      let result = await ajax_api_function("user_page_ajax",sender_data);
      if (result.dataExists) {
        desc_page(result.data);
      } else {
        alert(`データ通信エラー:${result.reason}`);
      };
    };
    desc_init();
  });
};
