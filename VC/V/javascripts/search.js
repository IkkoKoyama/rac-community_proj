var s3_path = getDOM('s3_path').value;
var data_section_objs = [
  {dataExists:false,data:[]},
  {dataExists:false,data:[]},
  {dataExists:false,data:[]},
  {dataExists:false,data:[]},
  {dataExists:false,data:[]}
];

var init_skull = (length) => {
  $('#event_table_cell').html(``);
  for (let i = 0;i < length;i++) {
    $('#event_table_cell').append(`<div class="cl inline"></div>`);
  };
  $('#event_table_cell .cl').html(
    `
    <div class="skulls">
      <div class="cnsle _prnt">
        <div class="pr_grid">
          <div class="icon skull">
          </div>
          <div class="title_grid">
            <div class="skull"></div>
            <div class="skull"></div>
          </div>
        </div>
      </div>

      <div class="cnsle _eval">
        <div class="box _like inline">
          <div class="icon inline">
            <i class="fas fa-circle"></i>
          </div>
          <span class="inline skull"></span>
        </div>
        <div class="box _users inline">
          <div class="icon inline">
            <i class="fas fa-circle"></i>
          </div>
          <span class="inline skull"></span>
        </div>
      </div>

      <div class="cnsle _dtls">
        <div class="box">
          <div class="icon"><i class="fas fa-circle"></i></div>
          <div class="text skull"></div>
        </div>
        <div class="box">
          <div class="icon"><i class="fas fa-circle"></i></div>
          <div class="text skull"></div>
        </div>
        <div class="box">
          <div class="icon"><i class="fas fa-circle"></i></div>
          <div class="text skull"></div>
        </div>
        <div class="box">
          <div class="icon"><i class="fas fa-circle"></i></div>
          <div class="text skull"></div>
        </div>
      </div>

      <div class="cnsle _link">
        <div class="btn skull"></div>
      </div>
    </div>
    <div class="contents">
    </div>
    `
  );
  $('.hrs .cl').addClass('play_motion');
};
var desc_obj_page = () => {
  $('#oti_0').prop('checked',true);
  let bt = Number($('input[name="sti"]:checked').prop('id').split('_')[1]);
  let data = data_section_objs[bt].data;

  const desc_events = (st) => {
    let today = (new Date()).dD();
    if (data.length == 0) {
      $('#event_table_cell').html(`<div class="emttl">イベントはありません</div>`);
      return;
    };

    let objs =
    st == 0
    ? data.sort_asc(`sdate`)
    : st == 1
      ? data.sort_desc(`total_count`)
      : data.filter(({my_register}) => my_register == 0);

    if (objs.length == 0) {
      $('#event_table_cell').html(`<div class="emttl">イベントはありません</div>`);
      return;
    };
    init_skull(objs.length);
    objs.forEach((obj,i) => {
    let event_id = obj.event_id;
    let club_id = obj.club_id;
    let club_name = obj.club_name.unveil_str();
    let title = obj.event_title.unveil_str();
    let sub_title = obj.sub_title.unveil_str();
    let event_description = obj.event_description.replace(/ß/g,"\n").unveil_str();
    let event_like = obj.event_like;
    let event_register = obj.event_register;
    let event_category_id = obj.event_category_id;
    let sdate = obj.sdate;
    let year = sdate.split('-')[0];
    let month = sdate.split('-')[1] - 1;
    let day = sdate.split('-')[2];
    let week = new Date(year,month,day).getDay();
    let stime = obj.stime;
    let deadline = obj.deadline;
    let my_register = obj.my_register;
    today > deadline ? my_register = 2 : console.log('n');

    $(`#event_table_cell .cl:eq(${i}) .contents`).html(
      `
      <div class="bgi">
        <img src="${s3_path}/events/event_${event_id}/event_image.jpeg" alt="">
      </div>
      <div class="cnsl _mystts">
        <div class="btn ${myregiia[my_register]}">${myregina[my_register]}</div>
      </div>

      <div class="cnsl _prnt">
        <div class="pr_grid">
          <div class="icon">
            <img src="${s3_path}/clubs/header/club_header_${club_id}.jpeg" alt="">
          </div>
          <div class="title_grid">
            <div class="ettl text_overflow">${title}</div>
            <div class="sttl text_overflow">${sub_title}</div>
          </div>
        </div>
        <div class="dscpt">
          <div><i class="fas fa-comment-lines"></i></div>
          <div>${event_description}</div>
        </div>
      </div>

      <div class="cnsl _eval">
        <div class="box _like inline">
          <div class="icon inline">
            <i class="fas fa-heart"></i>
          </div>
          <span class="inline">${Number(event_like)}</span>
        </div>
        <div class="box _users inline">
          <div class="icon inline">
            <i class="fas fa-users"></i>
          </div>
          <span class="inline">${Number(event_register)}</span>
        </div>
      </div>

      <div class="cnsl _dtls">
        <div class="box">
          <div class="icon"><i class="fas fa-club"></i></div>
          <div class="text text_overflow">${club_name}</div>
        </div>
        <div class="box">
          <div class="icon"><i class="fas fa-layer-group"></i></div>
          <div class="text text_overflow">${catena[event_category_id]}</div>
        </div>
        <div class="box">
          <div class="icon"><i class="fas fa-calendar-alt"></i></div>
          <div class="text text_overflow">${sdate.str_date(`.`)} (${wna[week]})</div>
        </div>
        <div class="box">
          <div class="icon"><i class="fas fa-clock"></i></div>
          <div class="text text_overflow">${stime} ~</div>
        </div>
      </div>

      <div class="cnsl _link">
        <a href="/event_page?event_id=${event_id}">
          <div class="btn">詳しく見る</div>
        </a>
      </div>
      `
    );
  });
    setTimeout(() => {
      $('.play_motion').addClass('stop_motion');
    },1000);
  };

  $(document).off('input','input[name="oti"]').on('input','input[name="oti"]',function() {
    let index = $('input[name="oti"]').index(this);
    desc_events(index);
  });
  desc_events(0);
};
var desc_obj_query = () => {
  let bt = Number($('input[name="sti"]:checked').prop('id').split('_')[1]);
  let today = new Date();
  let ps = today.dD();
  let pe = today.aD(`${bt === 0 ?30:90}`).dD();
  const sender_data = {bt:bt,ps:ps,pe:pe};
  init_skull(3);
  $('.input_base input').prop('disabled',true);
  setTimeout(async () => {
    if (data_section_objs[bt].dataExists) $('.input_base input').prop('disabled',false);desc_obj_page();
    let result = await ajax_api_function("search_ajax",sender_data);$('.input_base input').prop('disabled',false);
    if (result.dataExists) {
      data_section_objs[bt] = result;
      desc_obj_page();
    } else {
      alert(`データ通信エラー:${result.reason}`);
    }
  },1000);
};

if ($('#page_js_status').prop('checked') == false) {
  $('#page_js_status').prop('checked',true);
  $(document).ready(function(){
    $(document).off('input','input[name="sti"]').on('input','input[name="sti"]',function() {
      desc_obj_query();
    });
    desc_obj_query();
  });
};
