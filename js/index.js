/*(function() {
  'use strict';
  document.body.ondragover = function() { document.body.className = 'hover'; };
  document.body.ondragend  = function() { document.body.className = ''; };

  var _file = undefined;

  function setFile(file) {
    console.log('changing file...');
    $('#err_filesize').hide();
    $('#err_empty').hide();
    if (file.size > 1048576) {
      $('#err_filesize').show();
    }
    _file = file;
  }

  function getFile() {
    console.log('retrieving file...');
    return _file;
  }

  function progressCb(e) {
    if (e.lengthComputable) {
      console.log('new progress', e);
      $('.progress').attr({value: e.loaded, max: e.total});
    }
  }

  document.body.ondrop = function(evt) {
    document.body.className = '';
    evt.preventDefault();
    evt.stopPropagation();

    console.log('file dropped', evt.dataTransfer.files[0]);

    setFile(evt.dataTransfer.files[0]);
  };

  $('#uploadFile').on('change', function() {
    if (this.files && this.files[0]) {

      console.log('form changed', this.files[0]);

      setFile(this.files[0]);
    }
  });

  $('#uploadSubmit').click(function(evt) {
    evt.preventDefault();
    var f = getFile();

    console.log('fetched file', f);

    var formData = new FormData(f);

    console.log('prepared formdata', formData);

    if (!f) {
      console.log('file empty!');
      $('#err_empty').show();
      return;
    }

    console.log('sending AJAX upload...');
    $('.progress').show();

    $.ajax({
      type: 'POST',
      url: '/upload',
      xhr: function() {
        var myXhr = $.ajaxSettings.xhr();
        if (myXhr.upload) {
          myXhr.upload.addEventListener('progress', progressCb);
        }
      },
      data: formData,
      cache: false
    }).error(function(err, status, jqXHR) {
      console.log('xhr error', err, status, jqXHR);
    }).done(function(data) {
      console.log('xhr done', data);
    });
  });

})();
*/
