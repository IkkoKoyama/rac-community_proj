var s3_path = getDOM('s3_path').value;

if ($('#page_js_status').prop('checked') == false) {
  $('#page_js_status').prop('checked',true);
  $(document).ready(function(){
    (() => {
      $('.hrs .cl').addClass('play_motion');
      $('#hrs_trend .cl').html(
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
      $('._hrs .cl').html(
        `
        <div class="skulls _skulls">
          <div class="cnsle _prnt">
            <div class="title_grid">
              <div class="skull"></div>
              <div class="skull"></div>
            </div>
          </div>

          <div class="cnsle _eval">
            <div class="box _like">
              <div class="icon inline">
                <i class="fas fa-circle"></i>
              </div>
              <span class="inline skull"></span>
            </div>
            <div class="box _users">
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
          </div>
        </div>
        <div class="contents">
        </div>
        `
      );
    })();

    const desc_page = (data) => {
      let today = (new Date()).dD();
      (() => {
        let objs = data.trend;
        if (objs.length == 0) {
          $('#hrs_trend').html(`<div class="emttl">直近のイベントはありません</div>`);
          return;
        }

        for (let i = 0;i < 10;i++) {
          if (i < objs.length) {
            let obj = objs[i];
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
            let deadline = obj.deadline;

            let stime = obj.stime;
            let my_register = obj.my_register;
            today > deadline ? my_register = 2 : console.log('n');
            $(`#hrs_trend .cl:eq(${i}) .contents`).html(
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
                  <div class="text text_overflow">${sdate.str_date(`.`)}(${wna[week]})</div>
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
          } else {
            $(`#hrs_trend .cl:eq(${objs.length})`).remove();
          }
        }
      })();
      (() => {
        let objs = data.dist;
        if (objs.length == 0) {
          $(`#hrs_cate0`).html(`<div class="emttl">直近のイベントはありません</div>`);
          return;
        }
        for (let i = 0;i < 20;i++) {
          if (i < objs.length) {
            let obj = objs[i];
            let event_id = obj.event_id;
            let title = obj.event_title.unveil_str();
            let sub_title = obj.sub_title.unveil_str();
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

            $(`#hrs_cate0 .cl:eq(${i}) .contents`).html(
              `
              <a href="/event_page?event_id=${event_id}">
                <div class="bgi _bgi">
                  <img src="${s3_path}/events/event_${event_id}/event_image.jpeg" alt="">
                </div>

                <div class="cnsl _prnt __prnt">
                  <div class="btn inline ${myregiia[my_register]}">${myregina[my_register]}</div>
                  <div class="title_grid">
                    <div class="ettl text_overflow">${title}</div>
                    <div class="sttl text_overflow">${sub_title}</div>
                  </div>
                </div>

                <div class="cnsl _eval __eval">
                  <div class="box _like">
                    <div class="icon inline">
                      <i class="fas fa-heart"></i>
                    </div>
                    <span class="inline">${Number(event_like)}</span>
                  </div>
                  <div class="box _users">
                    <div class="icon inline">
                      <i class="fas fa-users"></i>
                    </div>
                    <span class="inline">${Number(event_register)}</span>
                  </div>
                </div>

                <div class="cnsl _dtls __dtls">
                  <div class="box">
                    <div class="icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="text">${sdate.str_date(`.`)}(${wna[week]})</div>
                  </div>
                  <div class="box">
                    <div class="icon"><i class="fas fa-clock"></i></div>
                    <div class="text">${stime} ~</div>
                  </div>
                </div>
              </a>
              `
            );
          } else {
            $(`#hrs_cate0 .cl:eq(${objs.length})`).remove();
          };
        };
      })();
      const desc_cate = (type) => {
        let objs = data[`cate${type}`];
        if (objs.length == 0) {
          $(`#hrs_cate${type}`).html(`<div class="emttl">直近のイベントはありません</div>`);
          return;
        }
        for (let i = 0;i < 5;i++) {
          if (i < objs.length) {
            let obj = objs[i];
            let event_id = obj.event_id;
            let title = obj.event_title.unveil_str();
            let sub_title = obj.sub_title.unveil_str();
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

            $(`#hrs_cate${type} .cl:eq(${i}) .contents`).html(
              `
              <a href="/event_page?event_id=${event_id}">
                <div class="bgi _bgi">
                  <img src="${s3_path}/events/event_${event_id}/event_image.jpeg" alt="">
                </div>

                <div class="cnsl _prnt __prnt">
                  <div class="btn inline ${myregiia[my_register]}">${myregina[my_register]}</div>
                  <div class="title_grid">
                    <div class="ettl text_overflow">${title}</div>
                    <div class="sttl text_overflow">${sub_title}</div>
                  </div>
                </div>

                <div class="cnsl _eval __eval">
                  <div class="box _like">
                    <div class="icon inline">
                      <i class="fas fa-heart"></i>
                    </div>
                    <span class="inline">${Number(event_like)}</span>
                  </div>
                  <div class="box _users">
                    <div class="icon inline">
                      <i class="fas fa-users"></i>
                    </div>
                    <span class="inline">${Number(event_register)}</span>
                  </div>
                </div>

                <div class="cnsl _dtls __dtls">
                  <div class="box">
                    <div class="icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="text">${sdate.str_date(`.`)}(${wna[week]})</div>
                  </div>
                  <div class="box">
                    <div class="icon"><i class="fas fa-clock"></i></div>
                    <div class="text">${stime} ~</div>
                  </div>
                </div>
              </a>
              `
            );
          } else {
            $(`#hrs_cate${type} .cl:eq(${objs.length})`).remove();
          };
        };
      };
      desc_cate(1);
      desc_cate(2);
      desc_cate(3);
      desc_cate(4);

      setTimeout(() => {
        $('.play_motion').addClass('stop_motion');
      },2500);
    };
    const desc_init = async () => {
      let today = new Date();
      let ps = today.dD();
      let pe = today.aD(30).dD();
      const sender_data = {ps:ps,pe:pe};
      let result = await ajax_api_function("home_ajax",sender_data);
      if (result.dataExists) {
        desc_page(result.data);
      } else {
        alert(`データ通信エラー:${result.reason}`);
      };
    };
    desc_init();
  });
};
