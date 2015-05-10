var startTime = Number($('#time').data('time'));

setTimeout(function tick() {
  var tm = (Date.now() - startTime) / 1000.0;
  $('#time').html(Math.floor(600 - tm));
  if (600 - tm > 0) {
    setTimeout(tick, 1000);
  }
});
