var socket = io.connect('http://localhost');
var active_type;
var active_id;
var emit_sent;

$(document).ready(function() {
  attach_click_handlers(document);
});

function attach_click_handlers(object) {
  $('a.poll-link', object).click(function () {
    set_active('poll', $(this).attr('id'));
    return false;
  });
  
  $('a.district-link', object).click(function () {
    set_active('district', $(this).attr('id'));
    return false;
  });
}

function set_active(type, id) {
  active_type = type;
  active_id = id;
  var id = id.split('-');
  emit_sent = new Date().getTime();
  if (type == 'poll') {
    socket.emit('get_poll', JSON.stringify({district: id[1], poll: id[2]})); 
    console.log('Requesting district ID ' + id[1] + ' poll ID ' + id[2]);
  }
  else {
    socket.emit('get_district', id[1]);
    console.log('Requesting district ID ' + id[1]);    
  }
}

socket.on('poll', function(html) {
  var emit_recd = new Date().getTime();
  console.log('Poll round-trip: ' +  (emit_recd - emit_sent) + 'ms');
  var container = $('#ajax-container');
  container.html(html);
  attach_click_handlers(container);
});

socket.on('district', function(html) { 
  var round_trip = new Date().getTime() - emit_sent;
  console.log('District round-trip: ' +  round_trip + 'ms');
  var container = $('#ajax-container');
  container.html(html);
  attach_click_handlers(container);
//  $('#ajax-container').append('<div class="request-time">How fast? <strong>' +  round_trip + 'ms</strong></div>');
});

socket.on('updated', function(html) {
  console.log('Update triggered from server.');
  if (active_type) {
    console.log('Updating...');
    set_active(active_type, active_id);
  }
  else {
    console.log('Not updating.');
  }
  
  // Update something else?
});