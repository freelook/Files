var socket = io.connect(window.location.origin);
var user;

// chat message received
socket.on('message', function(msg) {
	addMessage(msg);
});

// user list
socket.on('users', function(users) {
	for (var i = 0; i < users.length; i++)
		addUser(users[i]);
});

// get id
socket.on('id', function(id) {
	socket.id = id;
});

// new user joined
socket.on('new-user', function(user) {
	$('#chat-log').append('<li>' + user.name + ' присоединился</li>');
	addUser(user);
});

// disconnect
socket.on('disconnect', function(user) {
	if (user != null) {
		$('#chat-log').append('<li>' + user.name + ' вышел</li>');
		$('#user-' + user.name).fadeOut('fast');
	}
});


$(function() {
	$('.modal').modal('show');

	// join the chat
	$('#connect').click(function() {
		join();
	});

	$('#name').keypress(function(event) {
		if (event.which == 13) {
			join();
			return false;
		}
	});

	// send a message
	$('#msg').keypress(function(event) {
		if (event.which == 13) {
			sendMessage($(this).val());
			$('#msg').val('');
			return false;
		}
	});
});

function join() {
	if ($('#name').val()) {
		user = { name: $('#name').val() };
		socket.emit('join', user);
		$('.modal').modal('hide');
	}
}

function addUser(user) {
	$('#users').append('<li id="user-' + user.name + '">' + user.name + '</li>');
}

function sendMessage(text) {
	var msg = { user: user.name, text: text };
	socket.emit('message', msg);
	addMessage(msg);
}

function addMessage(msg) {
	console.log(msg);

	//msg.text = urlToLink(msg.text);

	$('#chat-log').append('<li>' + msg.user + ': ' + msg.text + '</li>');
}

function urlToLink(text) {
	var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	return text.replace(exp, '<a target="_blank" href="$1">$1</a>');
}
