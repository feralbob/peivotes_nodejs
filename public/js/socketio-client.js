var socket = io.connect('http://localhost');
var active_type;
var active_id;

$(document).ready(function() {
  attach_click_handlers();
});

function attach_click_handlers() {
  $('a.poll-link').click(function () {
    set_active('poll', $(this).attr('id'));
    return false;
  });
  
  $('a.district-link').click(function () {
    set_active('district', $(this).attr('id'));
    return false;
  });
}

function set_active(type, id) {
  active_type = type;
  active_id = id;
  var id = id.split('-');
  if (type == 'poll') {
    socket.emit('get_poll', JSON.stringify({district: id[1], poll: id[2]})); 
    console.log('Sent request for district ID ' + id[1] + ' poll ID ' + id[2]);
  }
  else {
    socket.emit('get_district', id[1]);
    console.log('Sent request for district ID ' + id[1]);    
  }
}

socket.on('poll', function(html) { 
  $('#ajax-container').html(html);
  attach_click_handlers();
});

socket.on('district', function(html) { 
  $('#ajax-container').html(html);
  attach_click_handlers();
});

socket.on('updated', function(html) {
  if (active_type) {
    console.log('Update triggered from server. Updating...');
    set_active(active_type, active_id);
  }
  else {
    console.log('Update triggered from server. Not updating.');
  }
  
  // Update something else?
});