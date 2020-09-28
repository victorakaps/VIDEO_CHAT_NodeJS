String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});
let myVideoStream;
const myVideo = document.createElement("video");
let username = prompt("Please Enter Your Name: ");
username = username.capitalize();
console.log(username);
myVideo.muted = true;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
    let text = $("input");
    $("html").keydown(function (e) {
      if (e.which == 13 && text.val().length !== 0) {
        socket.emit("message", username + "@" + text.val());
        text.val("");
      }
    });
    socket.on("createMessage", (message) => {
      let sender = message.split("@")[0].capitalize();
      let text = message.split("@")[1];
      $("ul").append(`<li class="message"><b>${sender}</b><br/>${text}</li>`);
      scrollToBottom();
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

const scrollToBottom = () => {
  var d = $(".main__chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

let flag = true;

const muteUnmute = () => {
  myVideoStream.getAudioTracks()[0].enabled = !myVideoStream.getAudioTracks()[0]
    .enabled;
  $("#mic-on").toggleClass("none");
  $("#mic-off").toggleClass("none");
};

const playStop = () => {
  myVideoStream.getVideoTracks()[0].enabled = !myVideoStream.getVideoTracks()[0]
    .enabled;
  $("#cam-on").toggleClass("none");
  $("#cam-off").toggleClass("none");
};

function leave() {
  myVideoStream.getAudioTracks()[0].enabled = false;
  myVideoStream.getVideoTracks()[0].enabled = false;
  window.location.replace("/leave.html");
}

let url = document.location.href;

new Clipboard(".btn", {
  text: function () {
    return url;
  },
});

$("#copy-btn").click(function () {
  alert("Link copied to clipboard, share it with other Atendee(s)");
  $("#copy-btn").toggleClass("copy-btn");
});
