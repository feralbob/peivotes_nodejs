var socket = io.connect('http://localhost');

$(document).ready(function() {
  attach_click_handlers();
});

function attach_click_handlers() {
  $('a.poll-link').click(function () {
    var id = $(this).attr('id').split('-');
    console.log(id);
    socket.emit('get_poll', JSON.stringify({district: id[1], poll: id[2]}));
    console.log('Sent request for district ID ' + id[1] + ' poll ID ' + id[2]);
    return false;
  });
  
  $('a.district-link').click(function () {
    var id = $(this).attr('id').split('-');
    console.log(id);
    socket.emit('get_district', id[1]);
    console.log('Sent request for district ID ' + id[1]);
    return false;
  });
}

socket.on('poll', function(html) { 
  $('#ajax-container').html(html);
  attach_click_handlers();
});

socket.on('district', function(html) { 
  $('#ajax-container').html(html);
  attach_click_handlers();
});