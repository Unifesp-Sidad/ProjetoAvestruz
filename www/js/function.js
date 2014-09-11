var storage = window.sessionStorage;

function userLogin(){
	spinnerplugin.show();
	var pass = $("#password").val();
	var user = $("#username").val();
	pass = SHA1(pass).toString();
	var ajaxRequest = $.ajax({
		url: "http://kay.unifesp.br/nutri/rest/loginUser",
		type: "POST",
		dataType:"json",
		data:{login:user, password: pass}
	});
	ajaxRequest.done(function( data ) {
		var logedUser = {username: $("#username").val()};
		storage.setItem("user", logedUser);
		storage.setItem("userData", data);
		$("#logedUsername").text("Username: "+logedUser.username);
		$("#perfil_name"),val(data.name);
		$("#perfil_email"),val(data.email);
		$("#password").val("");
		$("#username").val("");
		spinnerplugin.hide();
		window.location = "#pag-inicial";
		receivePhotos();
	});
	ajaxRequest.fail(function( jqXHR, textStatus ) {
		spinnerplugin.hide();
		statusError(jqXHR);
		window.location = "#pag-inicial";
		receivePhotos();

	});

}

function logout(){
	storage.clear();
	window.location ="#home";
}

function cancelPhoto(){
	storage.removeItem("photoToSend");
}

function cadastrar(){
	spinnerplugin.show();
	var ajaxRequest = $.ajax({
		url:"http://kay.unifesp.br/nutri/rest/createPatient",
		type: "POST",
		dataType:"text",
		data:{name:$("#user_name").val(),
		username:$("#user_name").val(),
		email:$("#user_email").val(),
		password: $("#user_password").val()}
	});
	ajaxRequest.done(function( data ) {
		$("#password").val("");
		$("#username").val("");
		spinnerplugin.hide();
		navigator.notification.alert("Cadastrado");
		window.location = "#home";
	});
	ajaxRequest.fail(function( jqXHR, textStatus ) {
		spinnerplugin.hide();
		statusError(jqXHR);
	});
	return false;
}

function statusError(jqXHR){
	switch(jqXHR.status){
		case 0:
		navigator.notification.alert("Server out of access");
		break;
		case 400:
		navigator.notification.alert("User already exists");
		break;
		case 403:
		navigator.notification.alert("Incorrect username/password");
		break;
		case 404:
		navigator.notification.alert("Page not found or server is down");
		break;
		case 500:
		navigator.notification.alert("Server internal error");
		break;
		default:
		navigator.notification.alert( "Request failed: " + jqXHR.responseText+"\nStatus: "+jqXHR.status );
		break;
	}
}
function onBodyLoad() {
	spinnerplugin.show();
	document.addEventListener("deviceready", onDeviceReady, false);
}

function uploadPhoto(){
	spinnerplugin.show();
	var ajaxRequest = $.ajax({
		url:"http://kay.unifesp.br/nutri/rest/newPhoto",
		type: "POST",
		dataType:"text",
		data:{photo:storage.getItem("photoToSend"),
		id:storage.getItem("userData").id
		}
	});
	ajaxRequest.done(function( data ) {
		storage.removeItem("photoToSend");
		spinnerplugin.hide();
		navigator.notification.alert("Foto enviada");
		window.location = "#pag-inicial";
	});
	ajaxRequest.fail(function( jqXHR, textStatus ) {
		spinnerplugin.hide();
		statusError(jqXHR);
	});
}

function receivePhotos(){
	spinnerplugin.show();
	var ajaxRequest = $.ajax({
		url: "http://kay.unifesp.br/nutri/rest/getAllPhotosUser",
		type: "POST",
		dataType:"text",
		data:{login:"user", password: "pass"}
	});
	ajaxRequest.done(function( data ) {
		storage.setItem("photos", data);
		for (var i in data) {
			var innerHTML = $("#photoList").html();
			innerHTML+='<li class="arrow" onclick="getPhotoDetails('+i+');" >';
			innerHTML+='<div class="thumb">';
			innerHTML+=' <img src="img/lanche.jpg" alt="lanche"> ';
			innerHTML+='</div><div>';
			innerHTML+='  <h2>Lorem Ipstum</h2>';
			innerHTML+=' <p class="comment truncate">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas iaculis mattis sem in venenatis. </p>';
			innerHTML+='<div class="estrelas-home">';
			innerHTML+='<img src="img/star_full.png" alt="star">';
			innerHTML+='<img src="img/star_full.png" alt="star">';
			innerHTML+='<img src="img/star_full.png" alt="star">';
			innerHTML+='<img src="img/star_half.png" alt="star">';
			innerHTML+='<img src="img/star_empty.png" alt="star">';
			innerHTML+='</div>';			
			innerHTML+='  </div></li>	';
			$("#photoList").html(innerHTML);
		}
		spinnerplugin.hide();
	});
ajaxRequest.fail(function( jqXHR, textStatus ) {
	for (var i = 0; i < 2; i++) {
			var innerHTML = $("#photoList").html();
			innerHTML+='<li class="arrow" onclick="getPhotoDetails('+i+');" >';
			innerHTML+='<div class="thumb">';
			innerHTML+=' <img src="img/lanche.jpg" alt="lanche"> ';
			innerHTML+='</div><div>';
			innerHTML+='  <h2>Lorem Ipstum</h2>';
			innerHTML+=' <p class="comment truncate">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas iaculis mattis sem in venenatis. </p>';
			innerHTML+='<div class="estrelas-home">';
			innerHTML+='<img src="img/star_full.png" alt="star">';
			innerHTML+='<img src="img/star_full.png" alt="star">';
			innerHTML+='<img src="img/star_full.png" alt="star">';
			innerHTML+='<img src="img/star_half.png" alt="star">';
			innerHTML+='<img src="img/star_empty.png" alt="star">';
			innerHTML+='</div>';			
			innerHTML+='  </div></li>	';
			$("#photoList").html(innerHTML);
		}
	spinnerplugin.hide();
	statusError(jqXHR);
});
}

function getPhotoDetails(photoNumber){
	if(storage==null){
		navigator.notification.alert("Session lost");
		window.location="#home";
		return;
	}
	if(storage.getItem("photos")[photoNumber]==null || storage.getItem("photos")[photoNumber] == undefined){
		navigator.notification.alert("Incorrect position");
	}
	else{
		window.location= "#foto_aumentada";
	}
	
}

function alterarSenha(){
	if(storage.getItem("data")==null){
		alert("Session lost");
		window.location="#";
		return;
	}
	if($("#perfil_password_old")!=storage.getItem("data").password){
		alert("Wrong old password");
	}
	else{
		alert("Senha alterada");
	}
	
}

function onDeviceReady() {
	navigator.splashscreen.show();
	window.setTimeout(function() {
		navigator.splashscreen.hide();
	},5000);
	document.addEventListener("online", isOnline, false);
	document.addEventListener("offline", isOffline, false);
	spinnerplugin.hide();
}

function isOnline(){
	navigator.notification.alert("Device online");
		//$("#loginButton").prop('disabled', false);
	}

	function isOffline(){
		//$("#loginButton").prop('disabled', true);
		navigator.notification.alert("Device offline");
	}

	function takePhoto() {
		navigator.camera.getPicture(onCameraSuccess, onCameraError, {
			quality : 100,
			destinationType : Camera.DestinationType.FILE_URI,
			allowEdit : false,
			encodingType : Camera.EncodingType.JPEG,
			sourceType: Camera.PictureSourceType.CAMERA,
			saveToPhotoAlbum:true
		});
	}

	function importPhoto(){
		navigator.camera.getPicture(onCameraSuccess, onCameraError, {
			destinationType : Camera.DestinationType.FILE_URI,
			allowEdit : false,
			encodingType : Camera.EncodingType.JPEG,
			sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
			savePhotoToAlbum:true
		});
	}

	function onCameraSuccess(imageURL) {
		storage.setItem("photoToSend", imageURL);
		ic = document.getElementById('imageContainer');
		ic.innerHTML = '<img src="' + imageURL + '" width="100%" />';
	}

	function onCameraError(e) {
		console.log(e);
		navigator.notification.alert("onCameraError: " + e + "(" + e.code + ")");
	}

	function SHA1 (msg) {

		function rotate_left(n,s) {
			var t4 = ( n<<s ) | (n>>>(32-s));
			return t4;
		};

		function lsb_hex(val) {
			var str="";
			var i;
			var vh;
			var vl;

			for( i=0; i<=6; i+=2 ) {
				vh = (val>>>(i*4+4))&0x0f;
				vl = (val>>>(i*4))&0x0f;
				str += vh.toString(16) + vl.toString(16);
			}
			return str;
		};

		function cvt_hex(val) {
			var str="";
			var i;
			var v;

			for( i=7; i>=0; i-- ) {
				v = (val>>>(i*4))&0x0f;
				str += v.toString(16);
			}
			return str;
		};


		function Utf8Encode(string) {
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {

				var c = string.charCodeAt(n);

				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}

			}

			return utftext;
		};

		var blockstart;
		var i, j;
		var W = new Array(80);
		var H0 = 0x67452301;
		var H1 = 0xEFCDAB89;
		var H2 = 0x98BADCFE;
		var H3 = 0x10325476;
		var H4 = 0xC3D2E1F0;
		var A, B, C, D, E;
		var temp;

		msg = Utf8Encode(msg);

		var msg_len = msg.length;

		var word_array = new Array();
		for( i=0; i<msg_len-3; i+=4 ) {
			j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
			msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
			word_array.push( j );
		}

		switch( msg_len % 4 ) {
			case 0:
			i = 0x080000000;
			break;
			case 1:
			i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
			break;

			case 2:
			i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
			break;

			case 3:
			i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8    | 0x80;
			break;
		}

		word_array.push( i );

		while( (word_array.length % 16) != 14 ) word_array.push( 0 );

		word_array.push( msg_len>>>29 );
		word_array.push( (msg_len<<3)&0x0ffffffff );


		for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {

			for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
				for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);

					A = H0;
				B = H1;
				C = H2;
				D = H3;
				E = H4;

				for( i= 0; i<=19; i++ ) {
					temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
					E = D;
					D = C;
					C = rotate_left(B,30);
					B = A;
					A = temp;
				}

				for( i=20; i<=39; i++ ) {
					temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
					E = D;
					D = C;
					C = rotate_left(B,30);
					B = A;
					A = temp;
				}

				for( i=40; i<=59; i++ ) {
					temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
					E = D;
					D = C;
					C = rotate_left(B,30);
					B = A;
					A = temp;
				}

				for( i=60; i<=79; i++ ) {
					temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
					E = D;
					D = C;
					C = rotate_left(B,30);
					B = A;
					A = temp;
				}

				H0 = (H0 + A) & 0x0ffffffff;
				H1 = (H1 + B) & 0x0ffffffff;
				H2 = (H2 + C) & 0x0ffffffff;
				H3 = (H3 + D) & 0x0ffffffff;
				H4 = (H4 + E) & 0x0ffffffff;

			}

			var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

			return temp.toLowerCase();

		}
