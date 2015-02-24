// JavaScript Document
var urlService = "http://54.94.159.232:8080/nutri-rest-patient/rest/";
var globalIndex = null;
var networkStatus = true;
var storeParameters = {
	index : null,
	inicio: null,
	feed: null,
	feedSize: 0,
	weekends: 0,
	refresh: true
}
// Create the XHR object.
$(document).on('pagebeforeshow', '#home', function(){
	var user = JSON.parse(window.localStorage.getItem("user"));
	if (user == null && networkStatus == true){
		$.mobile.changePage($('#login'));	
	}
	else{
		$('#feed-data').empty();
		var context = null;
		if (networkStatus == false){
			console.log("Changing to offline mode!");
			context = offlineHomeContext();
		}
		else{
			$('#loading').show();
			var hoje = Date.today().add(1).days();
			if(storeParameters.inicio == null){
				storeParameters.inicio = Date.parse("last sunday");	
			}
			console.log("Weekend guardado na memória = " + storeParameters.inicio)
			context = homeContext(storeParameters.inicio, hoje);
			$('#loading').hide();
		}
		var homePage = Handlebars.compile($("#home-tpl").html());;
		$('#feed-data').html(homePage(context));
		$('#feed-data').listview('refresh');
		
		$(document).on("click",'#change-page-button', function (event) {
			
			//console.log("data test = " + $(this).data('parm') + " attr test = " + $(this).attr("data-parm"));
		   var parm = $(this).data('parm');
		   storeParameters["index"] = parm;
		   //console.log("EVENT TRIGGER! INDEX SALVO = " + storeParameters["index"]);
		   $.mobile.changePage($('#detalhes'), {transition: 'none'});
		});
	}
		
	
});


$(document).on('pagebeforeshow', '#detalhes', function(){
	$('#details-data').empty(); 
	var index = storeParameters["index"];
	console.log("Carregando detalhes de = " + index);
	var imagensLib = JSON.parse(window.localStorage.getItem("imageLib"));
	var image = null;
	var hoje = Date.today().add(1).days();
	var inicio = storeParameters.inicio;
	var imagensData = recuperaImagemData(inicio.getTime(), hoje.getTime());
	image = imagensData[index];
	console.log("IMAGE = " + JSON.stringify(image));
	var comentarios = recuperaComentarios(image);
	var newDate = Date.parse(image.data);
	var dia = newDate.toString("dd/MM");
	var hora = newDate.toString("HH:mm");
	var context = {
				"index": index,
				"id": image.idImagem,
				"base64": imagensLib[image.idImagem],
				"photo_label": image.nome,
				"rating": image.rating,
				"title": image.nome,
				"description": image.descricao,
				"date": dia + " às " + hora,
				"comments": comentarios,
				"stars": [],
				"starsEmpty": []
				};
	for(var i=1; i<= 5; i++){
		if(i <= image.rating) context["stars"].push(1);
		else context["starsEmpty"].push(1);
	}
	var img = new Image();
	img.onload = function(){
		if(img.width > img.height){
			context["class"] = "landscapeImage";
		}
		else{
			context["class"] = "portraitImage";
		}
		var detailsPage = Handlebars.compile($("#detail-tpl").html());;
		console.log("Img class = " + context["class"]);
		$('#details-data').html(detailsPage(context));
		$('#details-data').listview('refresh');
	}
	img.src = 'data:image/png;base64,' + context["base64"];
	//console.log("Contexto = " + JSON.stringify(context)); 
	
	
	event.stopPropagation();
    event.preventDefault();
});

$(document).on('pagebeforechange', '#detalhes', function(){
	$(this).remove();
	event.stopPropagation();
    event.preventDefault();
});

$('#detalhes').on('pagehide', function (event, ui) { 
    var page = jQuery(event.target);
   // if (page.attr(‘data-cache’) == ‘never’) { 
    page.remove(); 
   // }; 
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

//Força a não carregar páginas pelo cache
jQuery('div').on('pagehide', function(event, ui){
  var page = jQuery(event.target);

  if(page.attr('data-cache') == 'never'){
    page.remove();
  };
});
//Função para interceptar o evento do click do botão físico BACK
/*$(document).bind('keydown', function(event) {
  if (event.keyCode == 27) {
    // Prevent default (disable the back button behavior)
    event.preventDefault();
	console.log("Backbutton Prevent Method Triggered!");
	$.mobile.changepage($('#home'));
    // Your code to show another page or whatever...
  }
});*/

$(window).on("navigate", function (event, data) {
  console.log("Navigate Event Triggered!");
  var direction = data.state.direction;
  event.preventDefault();
  if (direction == 'back') {
    console.log("Navigate Event Triggered! BACK");
	 if ( $('.ui-page-active').attr('id') == 'home' || $('.ui-page-active').attr('id') == 'login') {
		 		console.log("Estou na HOME, então irei fechar a aplicação");
                navigator.app.exitApp();
     } else {
		 if ( $('.ui-page-active').attr('id') == 'error' || $('.ui-page-active').attr('id') == 'cadastro') {
                	$("body").pagecontainer("change", "#login");	
		  }
		  else{
				
					$("body").pagecontainer("change", "#home");
					event.stopPropagation();
    				event.preventDefault();
		}
     }
  }
  if (direction == 'forward') {
    console.log("Navigate Event Triggered! FORWARD");
	event.preventDefault();
  }
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
		//$('#loading').show();
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
				var offlineLib = JSON.parse(window.localStorage.getItem("offlineLib"));
				if(offlineLib && offlineLib["size"] > 0){

					synchronize();
				}
				networkStatus = true;
				
				
				$.mobile.changePage("#home");
			},
			error: function (e) {
				console.log("Login Retorno: ERROR! = " + JSON.stringify(e));
				$('#loading').hide();
				$("#password").val(""); 
				var context = { };
				if(e.responseJSON && e.responseJSON.msg == "Erro de login"){
					console.log("Message do error = " + e.responseJSON.msg);
					context = {
					  "error" : e.responseJSON.msg,
					  "link" : "#login",
					  "btn-text": "Login",
					  "msg" : "Usuário ou Senha inválidos, por favor tente logar-se novamente...",
					}
				}
				else{
					context = {
					  "error" : "Erro de conexão",
					  "link" : "#login",
					  "btn-text": "Login",
					  "msg" : "Verifique se seu dispositivo está conectado na internet, e tente logar-se novamente. Se o problema persistir, provavelmente nosso servidor está fora do ar e irá retornar em breve.",
					  "offline" : true
					}
					networkStatus = false;
				}
				window.localStorage.removeItem("user");
				$.mobile.changePage("#error");
				var errorPage = Handlebars.compile($("#error-tpl").html());;
				$('#error-data').html(errorPage(context));
				$('#error-data').listview('refresh');
			}
		});  
}

function logout(){
	var user = JSON.parse(window.localStorage.getItem("user"));
	if(user != null){ //comunicar o server do logout
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
	else{
		$.mobile.changePage("#login");
	}
	  
}

function clearCache(){
	window.localStorage.removeItem("imageLib");
	window.localStorage.removeItem("user");
}

function criaImagem(){
	var nome = $("#photoTitle").val();
	//var text = $("#photoDesciption").val();
	var node = document.getElementById('hiddenBase64');
	var base64 = node.innerHTML;
	//console.log("Base retirado do HTML = " + base64);
	console.log("Criar foto modo online? " + networkStatus );
	if(nome.length > 0){
		if(networkStatus == true){
			var user = JSON.parse(window.localStorage.getItem("user"));
			var token = user.token;
			var date =  new Date();
			var dataE = {"token" : token, "nomeFoto" : nome , "descricao" : "" , "base64code" : base64};
			$.ajax( {
				type: "POST",
				url: urlService + "image/criaImagem",
				data: dataE,
				contentType: "application/json; charset=utf-8",
				dataType: "text",
				async: false,
				success: function (data){
					console.log("IMAGEM CRIADA COM SUCESSO, ID = " + data);
					$("#photoTitle").val("");
					$("#photoDesciption").val("");
					node.innerHTML = "";
					var ic = document.getElementById('imageContainer');
					ic.innerHTML = "";
					storeParameters.refresh = true;
					$.mobile.changePage("#home");
				},
				error: function (e) {
					if(e.responseJSON && e.responseJSON.msg == "Token invalido"){
						console.log("Message do error = " + e.responseJSON.msg);
						context = {
						  "error" : "Falha ao enviar imagem - " + e.responseJSON.msg,
						  "link" : "#login",
						  "btn-text": "Login",
						  "msg" : "Sua sessão expirou ou você acessou sua conta através de outro dispositivo. Por favor realize o login novamente."
						}
					}
					else{
						context = {
						  "error" : "Falha ao enviar imagem - Erro de conexão",
						  "link" : "#login",
						  "btn-text": "Login",
						  "msg" : "Verifique se seu dispositivo está conectado na internet, e tente logar-se novamente. Se o problema persistir, provavelmente nosso servidor está fora do ar e irá retornar em breve."
						}
					}
					window.localStorage.removeItem("user");
					$.mobile.changePage("#error");
					var errorPage = Handlebars.compile($("#error-tpl").html());;
					$('#error-data').html(errorPage(context));
				}
			});
		}
		else{
			var currentDate = Date.parse("now");
			var day = currentDate.toString("dd/MM");
			var hour = currentDate.toString("HH:mm");
			var image = {
				"currentDate": currentDate,
				"millis": currentDate.getTime(),
				"data_print": day + " - " + hour,
				"photo_label" : nome,
				"base64": base64,
				"sincronizada": false
			}
			var offlineImagensLib = JSON.parse(window.localStorage.getItem("offlineLib"));
			if (offlineImagensLib){
				offlineImagensLib["gallery"].push(image);
				offlineImagensLib["size"] += 1; 
				
			}
			else{
				offlineImagensLib = { 
					"size" : 1,
					"gallery" : [image]
				};
			}
			console.log("Offline lib = " + JSON.stringify(offlineImagensLib));
			window.localStorage.setItem("offlineLib", JSON.stringify(offlineImagensLib));
			$("#photoTitle").val("");
			$("#photoDesciption").val("");
			node.innerHTML = "";
			var ic = document.getElementById('imageContainer');
			ic.innerHTML = "";
			$.mobile.changePage("#home");
		}
	}
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
	comentarioText = comentarioText.trim();
	if (comentarioText != ""){
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
					$("#comentarioText").val("");
					/*var cc = document.getElementById('commentContainer');	
					var newComment = "<p><small>'Enviado '</small><span class='author' id=''><strong>"+ user.nomeUsuario +" :  </strong></span>  " + comentarioText + "</p>";
					var htmlContent = cc.innerHTML;
					cc.innerHTML = newComment + htmlContent;*/
					$.mobile.changePage($('#detalhes'), {
						allowSamePageTransition: true,
						transition: 'none',
						reloadPage: true 
					 });
				},
				error: function (e) {
					idComentario = null;
					console.log("criaComentario Retorno: ERROR!" + JSON.stringify(e));
				}
		});
	}
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
	console.log("Recupera Imagem Data de " + dataInicio + " até " + dataFim);
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
				var context = { };
				if(e.responseJSON && e.responseJSON.msg == "Token invalido"){
					console.log("Message do error = " + e.responseJSON.msg);
					context = {
					  "error" : e.responseJSON.msg,
					  "link" : "#login",
					  "btn-text": "Login",
					  "msg" : "Sua sessão expirou ou você acessou sua conta através de outro dispositivo. Por favor realize o login novamente."
					}
				}
				else{
					context = {
					  "error" : "Erro de conexão",
					  "link" : "#login",
					  "btn-text": "Login",
					  "msg" : "Verifique se seu dispositivo está conectado na internet, e tente logar-se novamente. Se o problema persistir, provavelmente nosso servidor está fora do ar e irá retornar em breve.",
					  "offline" : true
					}
				}
				window.localStorage.removeItem("user");
				$.mobile.changePage("#error");
				var errorPage = Handlebars.compile($("#error-tpl").html());;
				$('#error-data').html(errorPage(context));
				
			}
				
		});
	}
	return retorno;
	
}

function homeContext(inicio, fim) {
		console.log("REFRESH???? = " + storeParameters.refresh);
		//console.log("ImagemData  = " + JSON.stringify(imagensData));
		var imagensLib = JSON.parse(window.localStorage.getItem("imageLib"));
		if(imagensLib == null){
			console.log("BIBLIOTECA NULA, CRIANDO UMA!");
			imagensLib = { };
		}
		var user = JSON.parse(window.localStorage.getItem("user"));
		//console.log("ImageLIB = " + imagensLib);
		var context = {
			title: "Teste",
			feed: [],
		}
		if(storeParameters.refresh == true){
			var imagensData = recuperaImagemData(inicio.getTime(), fim.getTime());
			if(imagensData && imagensData.length > 0){
				var previousWeekend = null;
				for (var i = imagensData.length - 1; i>=0; i--){
					//console.log(i +" =>" +  imagensLib.images[i].nome);
					var json = imagensData[i]; //idImagem , nome, data, rating, descricao, ultimoComentario (idComentario, nomeUsuario, texto, dataEnvio)
					var newDate = Date.parse(json.data);
					var image = {
						"index": i,
						"data": newDate,
						"id": json.idImagem,
						"photo_label" : json.nome,
						"title": json.nome,
						"description": json.descricao,
						"rating": json.rating,
						"stars": [],
						"starsEmpty": []
					}
					for(var j=1; j<= 5; j++){
						if(j <= image.rating) image["stars"].push(1);
						else image["starsEmpty"].push(1);
					}
					//logica para dividir o feed semanalmente:
					if(newDate != null){
						var weekend = newDate.last().sunday();
						weekend.setHours(0,0,0,0);
						//console.log("Weekend da foto " + image["index"] + "-> " + weekend);
						if (previousWeekend == null || weekend.compareTo(previousWeekend) == -1){
							//console.log("First foto do weekend: " + image["firstPhotoOfTheWeek"] + " >>> " + image["title"]);
							var dia = ("0" + weekend.getDate()).slice(-2);
							var mes = ("0" + (weekend.getMonth() + 1)).slice(-2);
							image["firstPhotoOfTheWeek"] = dia +"/"+ mes;
							previousWeekend = weekend.clone();  
						}
					}
					if(imagensLib.hasOwnProperty(json.idImagem)){
							image["base64"] = imagensLib[json.idImagem];
					}
					else{ //não tem base64 no armazenamento do celular, pedir ao servidor...
						var base = recuperaImagem(json.idImagem, user.token);
						image["base64"] = base;
						imagensLib[json.idImagem] = base; //salva na storage do dispositivo
					}
					if(json.hasOwnProperty('ultimoComentario')){
						image["ultimoComentario"] = json["ultimoComentario"].texto;
					}
					
					context.feed.push(image);
				}
				
				
			}
			else{ //semana vazia, ou seja, sem feed algum
				var week = {
					"emptyWeek": true,
					"date": ("0" + inicio.getDate()).slice(-2) + "/" + ("0" + (inicio.getMonth() + 1)).slice(-2)  
				}
				context.feed.push(week);
			}
			storeParameters.feed = context.feed;
			//storeParameters.refresh = false;

		}
		else{
			context.feed = storeParameters.feed;
		}	
		window.localStorage.setItem("imageLib", JSON.stringify(imagensLib)); //atualiza o banco de imagens do dispositivo.
		return context;
	
}

function offlineHomeContext() {
		
		//window.localStorage.removeItem("offlineLib");
		var offlineImagensLib = JSON.parse(window.localStorage.getItem("offlineLib"));
		console.log("CONTEXTO OFFLINE = " + JSON.stringify(offlineImagensLib))
		var context = {
			title: "Modo Offline",
			offline: true,
			feed: []
		}
		if(offlineImagensLib && offlineImagensLib["gallery"]){
			context.hasFeed = true;
			context.qtd = offlineImagensLib["size"];
			console.log("Gallery = " + offlineImagensLib["gallery"]);
			console.log("Gallery Size = " + offlineImagensLib["gallery"].length);
			for (var i = offlineImagensLib["gallery"].length - 1; i>=0; i--){
				console.log(i +" =>" +  offlineImagensLib["gallery"][i].photo_label);
				var json = offlineImagensLib['gallery'][i]; //idImagem , nome, data, rating, descricao, ultimoComentario (idComentario, nomeUsuario, texto, dataEnvio)
				console.log("Data string = " + json.currentDate.toString("d-MMM-yyyy"));
				console.log("Data type = " + json.currentDate);
				var image = {
					"index": i,
					"data": json.data_print,
					"title" : json.photo_label,
					"base64": json.base64
				}
				context.feed.push(image);
			}
		}
		storeParameters.feed = context.feed;
		return context;
}

function loadMoreFeed(){
	var context = {
		title: "Teste",
		feed: [],
	}
	storeParameters.refresh = true;
	var previousFeed = storeParameters.feed;
	$('#loading').show();
	$('#feed-data').listview('refresh');
	var storeDate = storeParameters.inicio;
	var newDate = storeDate.clone().addWeeks(-1);
	console.log("Adicionado mais uma semana para feed: " + storeDate + " PARA ===> " + newDate);
	var newWeek = homeContext(newDate, storeDate);
	context.feed = previousFeed.concat(newWeek.feed);
	storeParameters.feed = context.feed;
	storeParameters.inicio = newDate.clone();
	var homePage = Handlebars.compile($("#home-tpl").html());
	$('#loading').hide();
	$('#feed-data').html(homePage(context));
	$('#feed-data').listview('refresh');
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
	$.mobile.changePage($('#camera'));
	var imgData = 'data:image/png;base64,' + imageURL;
	var img = new Image();
	
	img.onload = function(){
		var imgClass = "";
		console.log("Dimensoes da imagem: " + img.width + " width X " + img.height + " height");
		if(img.width > img.height){
			imgClass = "landscapePreview";
		}
		else{
			imgClass = "portraitPreview";
		}
		var ic = document.getElementById('imageContainer');
		console.log("Imagem Class = " + imgClass);
		ic.innerHTML = '<img class="' + imgClass + '" src="data:image/png;base64,' + imageURL + '"/>';
	}
	img.src = imgData;
	var node = document.getElementById('hiddenBase64');
	node.innerHTML = imageURL;
	//console.log("Base64 salvado na div invisivel: " + document.getElementById('hiddenBase64').innerHTML);
}

function onCameraError(e) {
	console.log(e);
	event.preventDefault();
	event.stopPropagation();
	$.mobile.changePage($('#home'));
	navigator.notification.alert("onCameraError: " + e + "(" + e.code + ")");
}

function synchronize(){
	$('#sincronizando').show();
	var offlineImagensLib = JSON.parse(window.localStorage.getItem("offlineLib"));
	var user = JSON.parse(window.localStorage.getItem("user"));
	var token = user.token;
	console.log("Sincronizando " + offlineImagensLib["size"] + " imagens");
	for (var i = 0; i < offlineImagensLib["gallery"].length; i++){
		var image = offlineImagensLib["gallery"][i];
		if(image.sincronizada == false){
			var dataE = {"token" : token, "nomeFoto" : image.photo_label , "descricao" : image.millis , "base64code" : image.base64};
			$.ajax( {
				type: "POST",
				url: urlService + "image/criaImagem",
				data: dataE,
				contentType: "application/json; charset=utf-8",
				dataType: "text",
				async: false,
				success: function (data){
					console.log("IMAGEM " + i + " " + image.photo_label + " sincronizada com sucesso");
					offlineImagensLib["gallery"][i].sincronizada = true;
				},
				error: function (e) {
					if(e.responseJSON && e.responseJSON.msg == "Token invalido"){
						console.log("Message do error = " + e.responseJSON.msg);
						context = {
						  "error" : "Falha ao sincronizar - " + e.responseJSON.msg,
						  "link" : "#login",
						  "btn-text": "Login",
						  "msg" : "Sua sessão expirou ou você acessou sua conta através de outro dispositivo. Por favor realize o login novamente."
						}
					}
					else{
						context = {
						  "error" : "Falha ao sincronizar - Erro de conexão",
						  "link" : "#login",
						  "btn-text": "Login",
						  "msg" : "Verifique se seu dispositivo está conectado na internet, e tente logar-se novamente. Se o problema persistir, provavelmente nosso servidor está fora do ar e irá retornar em breve."
						}
					}
					window.localStorage.removeItem("user");
					$.mobile.changePage("#error");
					var errorPage = Handlebars.compile($("#error-tpl").html());;
					$('#error-data').html(errorPage(context));
				}
			});
		}
	}
	window.localStorage.removeItem("offlineLib");
}



var loginTemplate = Handlebars.compile($("#login-tpl").html());
var homeTemplate = Handlebars.compile($("#home-tpl").html());
var homeBlankTemplate = Handlebars.compile($("#homeBlank-tpl").html());
var detailTemplate = Handlebars.compile($("#detail-tpl").html());
var photoTemplate = Handlebars.compile($("#photo-tpl").html());
var perfilTemplate = Handlebars.compile($("#perfil-tpl").html());