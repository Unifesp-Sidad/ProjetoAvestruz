// JavaScript Document
var urlService = "http://54.94.159.232:8080/nutri-rest-patient/rest/";
var globalIndex = null;
var storeParameters = {
	index : null,
	dias: 7,
	feed: null
}
// Create the XHR object.
$(document).on('pagebeforeshow', '#home', function(){
	var user = JSON.parse(window.localStorage.getItem("user"));
	if (user == null){
		$.mobile.changePage($('#login'));
	}
	$('#feed-data').empty(); 
	var context = homeContext();
	var homePage = Handlebars.compile($("#home-tpl").html());;
	$('#feed-data').html(homePage(context));
	$('#feed-data').listview('refresh');
	$(document).on("click",'#change-page-button', function (event) {
		
		//console.log("data test = " + $(this).data('parm') + " attr test = " + $(this).attr("data-parm"));
	   var parm = $(this).data('parm');
	   storeParameters["index"] = parm;
	   //console.log("EVENT TRIGGER! INDEX SALVO = " + storeParameters["index"]);
	   $.mobile.changePage($('#detalhes'));
	});
});

$(document).on('pagebeforeshow', '#detalhes', function(){
	$('#details-data').empty(); 
	var imagensLib = JSON.parse(window.localStorage.getItem("imageLib"));
	var index = storeParameters["index"];
	console.log("Carregando detalhes de = " + index);
	var imagensLib = JSON.parse(window.localStorage.getItem("imageLib"));
	var image = null;
	var d = new Date();
	var n = d.getTime(); //retorna a data de hoje em millesegundos
	//console.log("n de getTime = " + n);
	var dias = 86400000; //1 dias em milleseconds
	var imagensData = recuperaImagemData(n-(dias*15), n+dias);
	image = imagensData[index];
	console.log("IMAGE = " + JSON.stringify(image));
	var comentarios = recuperaComentarios(image);
	var context = {
				"index": index,
				"id": image.idImagem,
				"base64": imagensLib[image.idImagem],
				"photo_label": image.nome,
				"rating": image.rating,
				"title": image.nome,
				"description": image.descricao,
				"data": image.date,
				"comments": comentarios,
				"stars": [],
				"starsEmpty": []
				};
	for(var i=1; i<= 5; i++){
		if(i <= image.rating) context["stars"].push(1);
		else context["starsEmpty"].push(1);
	}
	//console.log("Contexto = " + JSON.stringify(context)); 
	var detailsPage = Handlebars.compile($("#detail-tpl").html());;
	$('#details-data').html(detailsPage(context));
	$('#details-data').listview('refresh');
});

$(document).on('pageinit', '#profile', function(){
	$('#perfil-data').empty(); 
	var user = JSON.parse(window.localStorage.getItem("user"));
	console.log("PERFIL USER DATA: " + JSON.stringify(user));
	var context = {
	  "nome" : user.nomeUsuario,
	  "email" : user.email,
	  "id" : user.idUsuario,
	  "token" : user.token,
	  "dataExp" : user.dataExpiracao
	}
	var perfilPage = Handlebars.compile($("#perfil-tpl").html());;
	$('#perfil-data').html(perfilPage(context));
	$('#perfil-data').listview('refresh');
});


function criaUsuario(){
		var username= $("#rusername").val();
        var mail= $("#rmail").val();
        var password= $("#rpassword").val();
		var password2= $("#rpassword2").val(); 
		var data = { email: mail, senha:password, nome: username};
		//makeCorsRequest(data, "auth/criaUsuario");
		if(password == password2){
			$.ajax( {
				type: "POST",
				url: urlService + "auth/criaUsuario",
				data: data,
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				async: false,
				success: function(data){
					console.log("criaUser Retorno: " + data);
					if(data){
						var ic = document.getElementById('result');
						ic.innerHTML = 'Cadastro realizado com sucesso. Preenche o form de login para entrar.';
					}
				},
				error: function (e) {
					console.log("criaUser Retorno: ERROR!" + JSON.stringify(e));
				}
			});
		}
		else{
			var ic = document.getElementById('result');
			ic.innerHTML = 'Senhas diferem... tente novamente';
		}
}

function login(){
        var mail= $("#mail").val();
        var password= $("#password").val(); 
		var dataE = { "email": mail, "senha":password};
		$.ajax( {
			type: "POST",
			url: urlService + "auth/loginUsuario",
			data: dataE,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			async: false,
			success: function(data){
				//console.log("login retrun: " + data);
				data.email = dataE.email;	
				window.localStorage.setItem("user", JSON.stringify(data));
				$.mobile.changePage("#home");
			},
			error: function (e) {
				console.log("Login Retorno: ERROR!");
				window.localStorage.removeItem("user");
				$.mobile.changePage("#login");
			}
		});  
}

function logout(){
	var user = JSON.parse(window.localStorage.getItem("user"));
	var data = { token: user.token};
	$.ajax( {
			type: "POST",
			url: urlService + "auth/logoutUsuario",
			data: data,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			async: false,
			success: function(data){
				console.log("Deslogado com sucesso!");	
				clearCache();
				$.mobile.changePage("#login");
			},
			error: function (e) {
				console.log("Login Retorno: ERROR!");
				clearCache();
				$.mobile.changePage("#login");
			}
		});  
}

function clearCache(){
	window.localStorage.removeItem("imageLib");
	window.localStorage.removeItem("user");
}

function criaImagem(){
	var nome = $("#photoTitle").val();
	var text = $("#photoDesciption").val();
	var node = document.getElementById('hiddenBase64');
	var base64 = node.innerHTML;
	//console.log("Base retirado do HTML = " + base64);
	var user = JSON.parse(window.localStorage.getItem("user"));
	var token = user.token;
	var date =  new Date();
	var dataE = {"token" : token, "nomeFoto" : nome , "descricao" : text , "base64code" : base64};
	$.ajax( {
			type: "POST",
			url: urlService + "image/criaImagem",
			data: dataE,
			contentType: "application/json; charset=utf-8",
			dataType: "text",
			async: false,
			success: function (data){
				console.log("IMAGEM CRIADA COM SUCESSO, ID = " + data);
				$.mobile.changePage("#home");
			},
			error: function (e) {
				console.log("criaImagem Retorno: ERROR!:" + JSON.stringify(e));
				return null;
			}
		});  
}


function manipulaImagem(){
	var base64 = "code...";
	ic = document.getElementById('imageContainer');
	ic.innerHTML = '<img src="data:image/png;base64,' + base64  + '" width="100%" />';
	var node = document.getElementById('hiddenBase64');
	node.innerHTML = base64;
	
}

function recuperaImagem(idFoto, token){
	var dataE = {"token" : token, "idImagem" : idFoto};
	var base64;
	$.ajax( {
			type: "POST",
			url: urlService + "image/obtemImagem",
			data: dataE,
			contentType: "application/json; charset=utf-8",
			dataType: "text",
			async: false,
			success: function(data){
				base64 = data;
				console.log("Foto recuperada com sucesso!");	
			},
			error: function (e) {
				base64 = null;
				console.log("recuperaImagem Retorno: ERROR!" + JSON.stringify(e));
			}
	}); 
	return base64; 
}

function criaComentario(){
	var user = JSON.parse(window.localStorage.getItem("user"));
	var id = document.getElementById('hiddenID').innerHTML;
	console.log("IMAGE ID COMENTARIO = " + id);
	var comentarioText = $("#comentarioText").val();
	var data = {"token" : user.token, "idImagem" : id, "comentarioText" : comentarioText };
	$.ajax( {
			type: "POST",
			url: urlService + "comment/criaComentario",
			data: data,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			async: false,
			success: function(data){
				console.log("Comentario criado com sucesso! = " + data);
				console.log("USER? = " + JSON.stringify(user));
				var cc = document.getElementById('commentContainer');	
				var newComment = "<p><small>'Enviado:'</small><span class='author' id=''><strong>"+ user.nomeUsuario +" >>  </strong></span>  " + comentarioText + "</p>";
				var htmlContent = cc.innerHTML;
				cc.innerHTML = newComment + htmlContent;
			},
			error: function (e) {
				idComentario = null;
				console.log("criaComentario Retorno: ERROR!" + JSON.stringify(e));
			}
	});
}

function recuperaComentarios(image){
	var user = JSON.parse(window.localStorage.getItem("user"));
	var data = {"token" : user.token, "idImagem" : image.idImagem};
	var comentarios = null;
	$.ajax( {
			type: "POST",
			url: urlService + "comment/obtemComentarios",
			data: data,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			async: false,
			success: function(data){
				console.log("recuperaComentarios Sucesso! = " + JSON.stringify(data));
				comentarios = data; 
			},
			error: function (e) {
				console.log("recuperaComentarios Retorno: ERROR!" + JSON.stringify(e));
			}
	});
	return comentarios;
}

function recuperaImagemData(dataInicio, dataFim){
	var user = JSON.parse(window.localStorage.getItem("user"));
	console.log("Recupera Imagem Data");
	var retorno = null;
	if(user){
		var dataE = {"token" : user.token, "millisDataInicio" : dataInicio, "millisDataFim" : dataFim};
		$.ajax( {
			type: "POST",
			url: urlService + "image/obtemResumoImagens",
			data: dataE,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			async: false,
			success: function(data){
				console.log("recuperaImagemData Sucesso!");
				retorno = data;
			},
			error: function (e) {
				console.log("recuperaImagemData Retorno: ERROR!" + JSON.stringify(e));
			}
		});
	}
	return retorno;
	
}

function homeContext() {
		var d = new Date();
		var n = d.getTime(); //retorna a data de hoje em millesegundos
		//console.log("n de getTime = " + n);
		var dias = 86400000; //1 dias em milleseconds
		var imagensData = recuperaImagemData(n-(dias*15), n+dias);
		console.log("ImagemData  = " + JSON.stringify(imagensData));
		var imagensLib = JSON.parse(window.localStorage.getItem("imageLib"));
		if(imagensLib == null){
			console.log("BIBLIOTECA NULA, CRIANDO UMA!");
			imagensLib = { };
		}
		var user = JSON.parse(window.localStorage.getItem("user"));
		//console.log("ImageLIB = " + imagensLib);
		
			var context = {
				title: "Teste",
				feed: []
			}
			if(imagensData){
				context.hasFeed = true;
				for (var i = imagensData.length - 1; i>=0; i--){
					//console.log(i +" =>" +  imagensLib.images[i].nome);
					var json = imagensData[i]; //idImagem , nome, data, rating, descricao, ultimoComentario (idComentario, nomeUsuario, texto, dataEnvio)
					var image = {
						"index": i,
						"data": json.data,
						"id": json.idImagem,
						"photo_label" : json.nome,
						"title": json.nome,
						"description": json.descricao,
						"rating": json.rating
					}
					if(imagensLib.hasOwnProperty(json.idImagem)){
						
							image["base64"] = imagensLib[json.idImagem];
							if(i == imagensData.length - 1){
								console.log("IMAGEM QUE ACABEI DE CRIAR TEM NA BIBLIOTECA!");
							}
							console.log("TEM A IMAGEM NA BIBLIOTECA!");
					}
					else{ //não tem base64 no armazenamento do celular, pedir ao servidor...
						var base = recuperaImagem(json.idImagem, user.token);
						if(i == imagensData.length - 1){
							 console.log("NÃO TEM A IMAGEM NA BIBLIOTECA!");
						}
						image["base64"] = base;
						imagensLib[json.idImagem] = base; //salva na storage do dispositivo
					}
					if(json.hasOwnProperty('ultimoComentario')){
						image["ultimoComentario"] = json["ultimoComentario"].texto;
					}
					context.feed.push(image);
				}
			}
			storeParameters.feed = context.feed;
			window.localStorage.setItem("imageLib", JSON.stringify(imagensLib)); //atualiza o banco de imagens do dispositivo.
			return context;
	
}


function takePhoto() {
	navigator.camera.getPicture(onCameraSuccess, onCameraError, {
		quality : 50,
		destinationType : Camera.DestinationType.DATA_URL,
		allowEdit : false,
		targetWidth: 640,
		encodingType : Camera.EncodingType.JPEG,
		sourceType: Camera.PictureSourceType.CAMERA,
		correctOrientation: true,
		saveToPhotoAlbum:true
	});
}

function onCameraSuccess(imageURL) {
	var ic = document.getElementById('imageContainer');
	ic.innerHTML = '<img src="data:image/png;base64,' + imageURL + '" width="100%" />';
	var node = document.getElementById('hiddenBase64');
	node.innerHTML = imageURL;
	//console.log("Base64 salvado na div invisivel: " + document.getElementById('hiddenBase64').innerHTML);
}

function onCameraError(e) {
	console.log(e);
	navigator.notification.alert("onCameraError: " + e + "(" + e.code + ")");
}

var loginTemplate = Handlebars.compile($("#login-tpl").html());
var homeTemplate = Handlebars.compile($("#home-tpl").html());
var homeBlankTemplate = Handlebars.compile($("#homeBlank-tpl").html());
var detailTemplate = Handlebars.compile($("#detail-tpl").html());
var photoTemplate = Handlebars.compile($("#photo-tpl").html());
var perfilTemplate = Handlebars.compile($("#perfil-tpl").html());