var s3_path = getDOM('s3_path').value;
var club_id = getDOM('club_id').value;

if ($('#page_js_status').prop('checked') == false) {
  $('#page_js_status').prop('checked',true);
  $(document).ready(function(){
    const desc_page = (data) => {
      let cl_obj = data.data;
      let ev_obj = data.event;
      let usr_obj = data.user;

      const desc_information = () => {
        let name = cl_obj.club_name || "";
        let short_name = cl_obj.club_short_name || "";
        let description = (cl_obj.club_description || "").replace(/ß/g,"\n").escape_str();
        let club_email = cl_obj.club_email;
        let club_link = cl_obj.club_link;
        let district_name = cl_obj.district_name;
        let establish = cl_obj.establish || "";

        $('#cl_name').text(name);
        $('#cl_shortname').text(short_name);
        $('#cl_desc').text(description);
        $('#cl_district').text(district_name);
        $('#cl_email').html(`<a href="mailto:${club_email}">${club_email}</a>`);
        $('#cl_link').html(`<a href="${club_link}" target="blank_">${club_link}</a>`);
        $('#cl_esta').html(establish.str_date(`/`));
      }
      const desc_users = () => {
        let objs = usr_obj;
        $('#usr_indi').html(`${objs.length}人`);
        let ap = ``;

        objs.forEach((obj) => {
          let user_id = obj.user_id || 0;
          let user_name = obj.user_name || "";

          ap +=
          `
          <div class="cl inline">
            <a href="/user_page?user_id=${user_id}">
              <div class="bgi">
                <img src="${s3_path}/users/icon/user_icon_${user_id}.jpeg" alt="">
              </div>
              <div class="cnsl _nm">${user_name}</div>
            </a>
          </div>
          `;
        });

        $('#hrs_user').html(ap);
      }
      const desc_events = () => {
        let objs = ev_obj;
        $('#ev_indi').html(`${objs.length}件`);
        let ap = ``;

        objs.forEach((obj) => {
          let event_id = Number(obj.event_id || 0);
          let event_title = obj.event_title || "";
          let sdate = obj.sdate;
          let week = new Date(sdate.split('-')).getDay();

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
      }

      desc_information();
      desc_users();
      desc_events();
    }
    const desc_init = async () => {
      const sender_data = {
        club_id:club_id
      }

      let result = await ajax_api_function("club_page_ajax",sender_data);
      if (result.dataExists) {
        desc_page(result.data);
      } else {
        alert(`データ通信エラー:${result.reason}`);
      }
    }
    desc_init();
  });
}
