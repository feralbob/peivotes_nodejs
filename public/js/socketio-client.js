var socket = io.connect('http://localhost');

$(document).ready(function() {
  $('a.poll-link').click(function () {
    var id = $(this).attr('id').split('-');
    console.log(id);
    socket.emit('get_poll', id[1]);
    console.log('Sent request for poll ID ' + id[1]);
    return false;
  });  
});

// Create a handler for when a message arrives from the server.
socket.on('poll', function(html) { 
  // When a message arrives, replace the body of the document with the message.
  console.log(html);
  $('#ajax-container').html(html);
});

socket.on('district', function(html) { 
  // When a message arrives, replace the body of the document with the message.
  console.log(html);
  $('#ajax-container').html(html);
});