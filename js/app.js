//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var recorder; //WebAudioRecorder object
var input; //MediaStreamAudioSourceNode  we'll be recording
var encodingType; //holds selected encoding for resulting audio (file)
var encodeAfterRecord = true; // when to encode
var recordingName;

//custom global variables
var url;
var au;
var li;
var link;
var buttonLink;
var fileName;
var encodingThing;

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //new audio context to help us record

var encodingTypeSelect = document.getElementById("encodingTypeSelect");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");

// variables for prompt
var overlay = document.getElementById("overlay");
var prompt = document.getElementById("saveRecording");
var nameButton = document.getElementById("saveRecording_button");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
nameButton.addEventListener("click", namingButtonClick);

function startRecording() {
  console.log("startRecording() called");

  /*
		Simple constraints object, for more advanced features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

  var constraints = { audio: true, video: false };

  /*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function(stream) {
      __log(
        "getUserMedia() success, stream created, initializing WebAudioRecorder..."
      );

      /*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
      audioContext = new AudioContext();

      //update the format
      document.getElementById("formats").innerHTML =
        "Format: 2 channel " +
        encodingTypeSelect.options[encodingTypeSelect.selectedIndex].value +
        " @ " +
        audioContext.sampleRate / 1000 +
        "kHz";

      //assign to gumStream for later use
      gumStream = stream;

      /* use the stream */
      input = audioContext.createMediaStreamSource(stream);

      //stop the input from playing back through the speakers
      //input.connect(audioContext.destination)

      //get the encoding
      encodingType =
        encodingTypeSelect.options[encodingTypeSelect.selectedIndex].value;

      //disable the encoding selector
      encodingTypeSelect.disabled = true;

      recorder = new WebAudioRecorder(input, {
        workerDir: "js/", // must end with slash
        encoding: encodingType,
        numChannels: 2, //2 is the default, mp3 encoding supports only 2
        onEncoderLoading: function(recorder, encoding) {
          // show "loading encoder..." display
          __log("Loading " + encoding + " encoder...");
        },
        onEncoderLoaded: function(recorder, encoding) {
          // hide "loading encoder..." display
          __log(encoding + " encoder loaded");
        }
      });

      /*********************/
      /**** ON COMPLETE ****/
      /*********************/

      recorder.onComplete = function(recorder, blob) {
        __log("Encoding complete");
        document.getElementById("savingRecording_encoding").innerHTML =
          "." + recorder.encoding;
        overlay.style = "display: block";
        prompt.style = "display: block";

        createDownloadLink(blob, recorder.encoding);
        encodingTypeSelect.disabled = false;
      };

      recorder.setOptions({
        timeLimit: 120,
        encodeAfterRecord: encodeAfterRecord,
        ogg: { quality: 0.5 },
        mp3: { bitRate: 160 }
      });

      //start the recording process
      recorder.startRecording();

      __log("Recording started");
    })
    .catch(function(err) {
      //enable the record button if getUSerMedia() fails
      recordButton.disabled = false;
      stopButton.disabled = true;
    });

  //disable the record button
  recordButton.disabled = true;
  stopButton.disabled = false;
}

function stopRecording() {
  console.log("stopRecording() called");

  //stop microphone access
  gumStream.getAudioTracks()[0].stop();

  //disable the stop button
  stopButton.disabled = true;
  recordButton.disabled = false;

  //tell the recorder to finish the recording (stop recording + encode the recorded audio)
  recorder.finishRecording();

  __log("Recording stopped");
}

function createDownloadLink(blob, encoding) {
  //bring up translucent overlay in the background
  url = URL.createObjectURL(blob);
  au = document.createElement("audio");
  li = document.createElement("li");
  link = document.createElement("a");

  //added download button
  buttonLink = document.createElement("a");
  fileName = document.createElement("p");

  //add controls to the <audio> element
  au.controls = true;
  au.src = url;

  encodingThing = "." + encoding;

  //link the a element to the blob
  link.href = url;
  // link.download = recordingName + "." + encoding;
  link.innerHTML = link.download;

  buttonLink.className = "btn btn-default";
  buttonLink.href = url;
  // buttonLink.download = recordingName + "." + encoding;
  buttonLink.innerHTML = "Download";
}

function namingButtonClick() {
  recordingName = document.getElementById("saveRecording_field").value;
  // console.log(recordingName);

  link.download = recordingName + encodingThing;
  buttonLink.download = recordingName + encodingThing;
  fileName.innerHTML = recordingName + encodingThing;

  li.appendChild(au);
  // li.appendChild(link);
  li.appendChild(fileName);
  li.appendChild(buttonLink);

  //add the li element to the ordered list
  recordingsList.appendChild(li);

  overlay.style = "display: none";
  prompt.style = "display: none";
}

//helper function
function __log(e, data) {
  log.innerHTML += "\n" + e + " " + (data || "");
}
