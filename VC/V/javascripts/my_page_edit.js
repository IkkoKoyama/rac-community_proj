var s3_path = getDOM('s3_path').value;
var current_user_id = getDOM('current_user_id').value;

var job_qeury = async () => {
  $('form[name="job_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="job_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['job_form'];
  let job = form.elements[`job`].value.escape_str().trim();
  const sender_data = {value:job};

  let result = await ajax_api_function("user_job_ajax",sender_data);
  if (result.dataExists) {
    window.location.reload();
  } else {
    $('form[name="job_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="job_form"] button[type="submit"]').html('変更');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var birth_qeury = async () => {
  $('form[name="birth_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="birth_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['birth_form'];
  let birth = form.elements[`birth`].value.escape_str().trim();
  const sender_data = {value:birth};

  let result = await ajax_api_function("user_birth_ajax",sender_data);
  if (result.dataExists) {
    window.location.reload();
  } else {
    $('form[name="birth_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="birth_form"] button[type="submit"]').html('変更');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var join_year_qeury = async () => {
  $('form[name="join_year_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="join_year_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['join_year_form'];
  let join_year = form.elements[`join_year`].value.escape_str().trim();
  const sender_data = {value:join_year};

  let result = await ajax_api_function("user_join_year_ajax",sender_data);
  if (result.dataExists) {
    window.location.reload();
  } else {
    $('form[name="join_year_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="join_year_form"] button[type="submit"]').html('変更');
    alert(`データ通信エラー:${result.reason}`);
  };
};
var description_qeury = async () => {
  $('form[name="description_form"] button[type="submit"]').prop('disabled',true);
  $('form[name="description_form"] button[type="submit"]').html('<i class="fas fa-redo fa-spin"></i>');

  let form = document.forms['description_form'];
  let description = form.elements[`textarea`].value.escape_str().trim();
  if (description.indexOf("ß") != -1) {
    alert('無効な特殊文字が含まれています。');
    return;
  };

  let $value = description.replace(/\r?\n/g,"ß");

  const sender_data = {value:$value};

  let result = await ajax_api_function("user_description_ajax",sender_data);
  if (result.dataExists) {
    window.location.reload();
  } else {
    $('form[name="description_form"] button[type="submit"]').prop('disabled',false);
    $('form[name="description_form"] button[type="submit"]').html('変更');
    alert(`データ通信エラー:${result.reason}`);
  };
};

if ($('#page_js_status').prop('checked') == false) {
  $('#page_js_status').prop('checked',true);
  $(document).ready(function(){
    let cropper = null;
    let canvas = $('#event_header');
    let ctx = canvas.get(0).getContext('2d');

    const desc_page = (data) => {
      let usr_obj = data.data;

      let name = (usr_obj.user_name || "").unveil_str();
      let description = (usr_obj.user_description || "").replace(/ß/g,"\n").unveil_str();
      let job = (usr_obj.job || "").unveil_str();
      let birth = usr_obj.birth;
      let join_year = usr_obj.join_year || "--";

      $('#usr_name').text(name);
      $('#usr_job').text(job);
      let join_year_end = String(Number(join_year | 0) + 1).slice(2) || "--";
      $('#usr_join_year').text(`${join_year}-${join_year_end}年度`);

      if (birth != "0000-00-00" && birth) {
        $('#usr_birth').text(birth.str_date(`.`));
        $('#edit_birth').prop('value',birth);
      } else {
        $('#usr_birth').text(`未設定`);
      };
      $('#usr_desc').text(description);
      $('#edit_job').prop('value',job);
      $('#edit_join_year').prop('value',join_year);
      $('#edit_textarea').text(description);

      $(document).off('input','input[name="edit_input_"]').on('input','input[name="edit_input_"]',function() {
        let index = $('input[name="edit_input_"]').index(this);
        $(`#setting_modal_${index}`).show();
      });
      $(document).off('click','.edit_cancel_btn').on('click','.edit_cancel_btn',function() {
        $('.setting_modal_bs').hide();
      });
      $(document).off('change','#image_input').on('change','#image_input',function() {
        if (!this.files[0] || this.files.length != 1) {
          alert('正しくファイルが選択されていません,ファイルは1つのみ選択してください');
          return;
        };
        if (!this.files[0].type.match(/^image\//) ) {
          alert("画像ファイルを選択してください。");
          return;
        };

        $('#setting_modal_image').show();
        let reader = new FileReader();
        let img = new Image();
        canvas.cropper('destroy');
        let file = this.files[0];

        var maxSide = 1200;
        var maxCapacity = 50000;

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
            let cropper = canvas.cropper({aspectRatio: 1 / 1});

            $(document).off('click','#icon_query_btn').on('click','#icon_query_btn',function() {
              $(this).prop('disabled',true);
              $(this).html('<i class="fas fa-redo fa-spin"></i>');

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
              let file_name = `user_icon_${current_user_id}.jpeg`;
              let folder_path = `users/icon/`;

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
                function(data) {window.location.reload(true);},
                function(err) {
                  $(this).prop('disabled',false);
                  $(this).html('アップロード');
                  return alert(err.message);
                }
              );

              $('.setting_modal_bs').hide();
            });
            $(document).off('click','#icon_reset_btn').on('click','#icon_reset_btn',function() {
              $('#image_input').val('');
              canvas.cropper('reset');
              $('#event_header').html(``);
              $('.setting_modal_bs').hide();
            });
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      });
    };
    const desc_init = async () => {
      let result = await ajax_api_function("my_page_edit_ajax","");
      if (result.dataExists) {
        desc_page(result.data);
      } else {
        alert(`データ通信エラー:${result.reason}`);
      };
    };
    desc_init();
  });
};
