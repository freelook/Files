var express = require('express'),
	app = express(),
	fs = require('fs'),
	util = require('util');

// global list of users

var users = [];
var senders = {};
var loaders = {};
var port = process.env.NODE_ENV === 'production' ? process.env.PORT : 4000;


// configure web server
app.configure(function() {
	app.use(express.bodyParser({
		keepExtensions: true,
		//uploadDir: __dirname + '/tmp',
		limit: '500mb'
	}));
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.methodOverride());
	app.use(app.router)
		.use(express.static(__dirname + '/public'))
		.use(express.static(__dirname + '/tmp'));
});


// start the web server
var server = require('http').createServer(app)
	, io = require('socket.io').listen(server);
server.listen(port);


// routes
app.get('/', function(req, res) {
	res.sendfile(__dirname + '/index.html');
});

app.get('/file', function(req, res) {
// get link
	var id = req.query.data;
	if (!id) {
		res.end('Файл недоступен');
	}
	loaders[id] = res;
	if (senders[id]) {
		senders[id].emit('sendFile');
	} else {
		res.statusCode = 500;
		res.end('File not found');
	}

	res.on('close', function(){
		delete loaders[id];
	});

});


app.post('/attach', function(req, resData) {
	//file upload
	var id = req.query.data;
	var body;

	function sendFile(file, res) {

		file.pipe(res);

		file.on('error', function(err) {
			res.statusCode = 500;
			res.end("Server Error");
			console.error(err);
		});

		file
			.on('open', function() {
				console.log("open");
			})
			.on('close', function() {
				console.log("close");
			})
			.on('end', function() {
				console.log("end");
				resData.statusCode = 200;
				resData.send('Файл успешно отправлен');
			});

		res.on('close', function() {
			file.destroy();
			delete loaders[id];
		});

	}

	var is = fs.createReadStream(req.files.attachment.path);
	sendFile(is, loaders[id]);
	console.log('uploaded ' + req);
});


// sockets server
io.sockets.on('connection', function(socket) {

	senders[socket.id] = socket;

	// new user joined
	socket.on('join', function(user) {
		console.log(user.name + ' connected');

		// store the user object with this socket
		socket.set('user', user);
		socket.emit('id', socket.id);
		socket.emit('message', { user: '', text: 'Привет ' + user.name + '!' });

		if (users.length == 0)
			socket.emit('message', { user: '', text: 'Рад тебя видеть.. Делись ссылкой с друзьями!' });

		// send the list of users to the new person
		users.push(user);
		socket.emit('users', users);

		// notify all users about the new person in the room
		socket.broadcast.emit('new-user', user);
		return socket.id;
	});

	// broadcast chat messages
	socket.on('message', function(msg) {
		socket.broadcast.emit('message', msg);
	});

	socket.on('disconnect', function() {

		// remove sender
		delete senders[socket.id];

		socket.get('user', function(err, user) {
			if (user != null) {
				console.log(user.name + ' disconnected');
				// remove the user from the list
				var index = users.indexOf(user);
				users.splice(index, 1);
				socket.broadcast.emit('disconnect', user);

			}
		});
	});
});
