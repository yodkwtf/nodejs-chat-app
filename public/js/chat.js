const socket = io();

// Elements
const $msgSubmitBtn = document.getElementById('msg-submit');
const $msgInput = document.getElementById('msg-input');
const $sendLocationBtn = document.getElementById('send-location');
const $messages = document.getElementById('messages');
const $sidebar = document.getElementById('sidebar');

// Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

//* Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//* Autoscroll function
const autoscroll = () => {
  // new msg element
  const $newMessage = $messages.lastElementChild;

  // height of new msg
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = $messages.offsetHeight;

  // height of messages container
  const containerHeight = $messages.scrollHeight;

  // how far have we scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (
    Math.floor(containerHeight - newMessageHeight) <= Math.floor(scrollOffset)
  ) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// todo--- RECEIVING MESSAGES FROM SERVER
socket.on('message', (message) => {
  // render message template and pass data from `message` object to the template
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });

  // insert template content in messages container
  $messages.insertAdjacentHTML('beforeend', html);

  // autoscroll to bottom
  autoscroll();
});

// todo--- RECEIVING LOCATION FROM SERVER
socket.on('locationMessage', (locationMessage) => {
  // render location template and pass the `url` data to the template
  const html = Mustache.render(locationTemplate, {
    username: locationMessage.username,
    locationUrl: locationMessage.url,
    createdAt: moment(locationMessage.createdAt).format('h:mm a'),
  });

  // insert location to messages template
  $messages.insertAdjacentHTML('beforeend', html);

  // autoscroll to bottom
  autoscroll();
});

// todo--- RECEIVING ROOM DATA FROM SERVER
socket.on('roomData', ({ room, users }) => {
  // render sidebar template and pass the room data to the template
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  // insert template content in sidebar container
  $sidebar.innerHTML = html;
});

// todo---  SENDING A MESSAGE TO SERVER
$msgSubmitBtn.addEventListener('click', (e) => {
  e.preventDefault();

  // get the input from user
  const message = $msgInput.value;

  // if input field is empty
  if (message === '') {
    return;
  }

  // disable send btn
  $msgSubmitBtn.setAttribute('disabled', 'disabled');

  // emit an event to send msg to the server
  socket.emit('sendMessage', message, (error) => {
    // enable send btn
    $msgSubmitBtn.removeAttribute('disabled');

    // clear input and focus back
    $msgInput.value = '';
    $msgInput.focus();

    // check for profanity msg
    if (error) {
      return console.log(error);
    }

    // acknowledge msg after its sent to all users
    console.log('Message Delivered!');
  });
});

// todo--- SENDING LOCATION TO SERVER
$sendLocationBtn.addEventListener('click', () => {
  // check for browser support
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.');
  }

  // disable the location button
  $sendLocationBtn.setAttribute('disabled', 'disabled');

  // get location
  navigator.geolocation.getCurrentPosition((position) => {
    // destructure required endpoints
    const { latitude, longitude } = position.coords;

    // emit to the server with required data
    socket.emit('sendLocation', { latitude, longitude }, () => {
      // enable location button
      $sendLocationBtn.removeAttribute('disabled');

      // acknowledge location after its sent to all users
      console.log('Location Shared');
    });
  });
});

// todo--- SEDNING USERNAME AND ROOM TO SERVER
socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
