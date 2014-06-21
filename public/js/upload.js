$(function() {
	var formData;
	var showInfo = function(message) {
		$('div.progress').hide();
		$('strong.message').text(message);
		$('div.alert').show();
	};

	$('input[type="submit"]').on('click', function(evt) {
		evt.preventDefault();
		$('div.progress').show();
		formData = new FormData();
		var file = document.getElementById('attachment').files[0];
		if(file){
		formData.append('attachment', file);
		var path = 'http://localhost:4000/file?data=' + socket.id;
		sendMessage('Ссылка на <a href="' + path + '" target="_blank">файл</a>');
		} else {
			sendMessage($('#msg').val());
			$('#msg').val('');
		}

	});


	socket.on('sendFile', function() {
		var xhr = new XMLHttpRequest();
		xhr.open('post', '/attach?data=' + socket.id, true);

		xhr.upload.onprogress = function(e) {
			if (e.lengthComputable) {
				var percentage = (e.loaded / e.total) * 100;
				$('div.progress div.bar').css('width', percentage + '%');
			}
		};

		xhr.onerror = function(e) {
			showInfo('Ошибка :(');
		};

		xhr.onload = function() {
			showInfo(this.statusText);
		};

		xhr.send(formData);

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = xhr.responseText;
				console.info(data);
				// msg the upload
				var msg = { user: user.name, text: data };
				addMessage(msg);
			}
		}
	});

});

