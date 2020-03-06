audioRecorder = new WebAudioRecorder(mixer, {
  workerDir: "js/",
  onEncoderLoading: function(recorder, encoding) {
    $modalLoading
      .find(".modal-title")
      .html("Loading " + encoding.toUpperCase() + " encoder ...");
    $modalLoading.modal("show");
  }
});

audioRecorder.onEncoderLoaded = function() {
  $modalLoading.modal("hide");
};

minSecStr = function(n) {
  return (n < 10 ? "0" : "") + n;
};

updateDateTime = function() {
  var sec;
  $dateTime.html(new Date().toString());
  sec = audioRecorder.recordingTime() | 0;
  $timeDisplay.html("" + minSecStr((sec / 60) | 0) + ":" + minSecStr(sec % 60));
};

window.setInterval(updateDateTime, 200);
