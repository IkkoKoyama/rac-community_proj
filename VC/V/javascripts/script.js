Number.prototype.str_num = function() {
  if (this <= 9) {
    return `0${this}`;
  };
  return String(this);
};
Number.prototype.to_perate = function(base) {
  if (this == 0 || base == 0) return 0;
  else return Math.round((this / base * 10000)) / 100;
};
String.prototype.str_date = function(sender) {
  let lists = this.split('-');
  let string = ``;
  for (let i = 0;i < lists.length;i++) {
    string += `${lists[i]}`;
    if (i != lists.length - 1) string += sender;
  };
  return string;
};
String.prototype.escape_str = function() {
  let string = this;
  string = string
    .replace(/&/g, '!ucha!r_0')
    .replace(/</g, '!ucha!r_1')
    .replace(/>/g, '!ucha!r_2')
    .replace(/"/g, '!ucha!r_3')
    .replace(/'/g, '!ucha!r_4')
    .replace(/#/g, '!ucha!r_5')
    .replace(/%/g, '!ucha!r_6');
  return string;
};
String.prototype.unveil_str = function() {
  let string = this;
  string = string
    .replace(/!ucha!r_0/g, '&')
    .replace(/!ucha!r_1/g, '<')
    .replace(/!ucha!r_2/g, '>')
    .replace(/!ucha!r_3/g, '"')
    .replace(/!ucha!r_4/g, `'`)
    .replace(/!ucha!r_5/g, '#')
    .replace(/!ucha!r_6/g, '%');
  return string;
};

String.prototype.escaped_url = function() {
  return encodeURIComponent(this);
};
String.prototype.bool = function(sender) {
  return this.toLowerCase() === 'true';
};
Date.prototype.dT = function() {
  return `${this.getHours().str_num()}:${this.getMinutes().str_num()}`;
};
Date.prototype.dD = function() {
  return `${this.getFullYear()}-${Number(this.getMonth() + 1).str_num()}-${Number(this.getDate()).str_num()}`;
};
Date.prototype.dM = function() {
  return `${this.getFullYear()}-${Number(this.getMonth() + 1).str_num()}`;
};
Date.prototype.dMS = function() {
  let date = (new Date(this.getFullYear(),this.getMonth(),1));
  return date;
};
Date.prototype.dME = function() {
  let date = (new Date(this.getFullYear(),this.getMonth() + 1,0));
  return date;
};
Date.prototype.dMET = function() {
  let end = new Date(this.getFullYear(),this.getMonth() + 1,0);
  let today_end = new Date().getDate();
  let date =
  end >= today_end
    ? new Date(this.getFullYear(),this.getMonth(),today_end)
    : new Date(this.getFullYear(),this.getMonth() + 1,0);
  return date;
};
Date.prototype.aD = function(days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + Number(days));
  return date;
};

Array.prototype.sort_asc = function(ct) {
  let arr = this.sort((a,b) => {
    if (a[ct] > b[ct]) {
      return 1;
    };
    return -1;
  });
  return arr;
};
Array.prototype.sort_desc = function(ct) {
  let arr = this.sort((a,b) => {
    if (a[ct] < b[ct]) {
      return 1;
    };
    return -1;
  });
  return arr;
};

let ajax_api_progress = false;
const ajax_api_function = (sender1,sender2) => {
  if (!ajax_api_progress) {
    ajax_api_progress = true;
    sender2 = JSON.stringify(sender2);
    return new Promise((resolve,reject) => {
      try {
        console.time(`DB querying in `);
        $.ajax({
          url: '/ajax/ajax_api',
          type: 'GET',
          data: ('sender1=' + sender1 + '&sender2=' + sender2),
          processData: false,
          contentType: false,
          dataType: 'json',
          timeout:120000,
          error: () => {
            ajax_api_progress = false;
            console.timeEnd(`DB querying in `);
            resolve({"dataExists":false,"reason":"NetWork Timeout"});
          }
        })
        .done(function(data) {
          ajax_api_progress = false;
          console.timeEnd(`DB querying in `);
          resolve(data.results)
        });
      } catch(err) {
        ajax_api_progress = false;
        reject('{\"dataExists\":false,\"reason\":\"DB server connection error\"}');
      };
    });
  };
};
const return_LatLng = (sender,geocoder) => {
  return new Promise((resolve,reject) => {
    try {
      setTimeout(() => {
        geocoder.geocode({'address': sender}, function(results, status){
          let latlng = {lat:0,lng:0};
          if(status == google.maps.GeocoderStatus.OK) {
            latlng.lat = results[0].geometry.location.lat();
            latlng.lng = results[0].geometry.location.lng();
          } else {
            console.log(status)
          };
          resolve({dataExists:true,data:latlng});
        });
      },1);
    } catch(err) {
      reject({dataExists:false,reson:err});
    };
  });
};

const base64ToBlob = (base64) => {
  var base64Data = base64.split(',')[1],
    data = window.atob(base64Data),
    buff = new ArrayBuffer(data.length),
    arr = new Uint8Array(buff),
    length = data.length
  ;
  for (var i = 0;i < length;i++) {
    arr[i] = data.charCodeAt(i);
  }
  return new Blob([arr],{type: 'image/jpeg'});
};
const getDOM = (sender) => {
  let obj = document.getElementById(sender);
  return obj;
};

const wna = ["日","月","火","水","木","金","土"];
const catena = ["-","通常例会","屋外例会","社会奉仕","飲み会・交流"];
const lvlna = ["-","マスター管理者","地区役員","クラブ役員","一般メンバー","ロータリアン","ビジター","OB・OG"];
const perti_type_na = ["-","現地参加 + オンライン参加","現地参加のみ","オンライン参加のみ"];
const myregina = ["登録可能","登録済","受付終了"];
const regiatna = ["-","懇親会: ×","懇親会: ○"];
const regiptna = ["-","現地","オンライン"];
const myregiia = ["regi","regied","ended"];
const statusna = ["非公開","公開中"];
const limitna = ["-","全てのユーザ","同地区内","同クラブ内"];

window.addEventListener('turbolinks:load',async function(e) {

});

$(document).ready(function() {
  const s3_path = getDOM('s3_path').value;

  (() => {
    image_index = 1;
    const change_pv_bgi = () => {
      const callback_ = () => {
        if (image_index == 5) image_index = 0;
        setTimeout(() => {
          $('#pv_img').fadeOut(1000,callback__);
        },8000);
      };
      const callback__ = () => {
        $('#pv_img').prop('src',`${s3_path}/statics/top_${image_index}.jpeg`);
        callback___();
      };
      const callback___ = () => {
        image_index += 1;
        $('#pv_img').fadeIn(1000,callback_);
      };
      callback_();
    };

    let active = $('#pv_img').attr('data_active');
    if (Number(active) == 0) {
      $('#pv_img').attr('data_active',1);
      change_pv_bgi();
    };
  })();
});
