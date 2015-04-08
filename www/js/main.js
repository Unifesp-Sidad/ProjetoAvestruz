// JavaScript Document
var urlService = "http://200.144.93.244/nutri-rest-patient/rest/";
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
var user = null;
var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();
var databaseDeferred = $.Deferred();

document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("mobileinit", onJQMReady, false);
//Painel lateral template:
var panel = '<div data-role="panel" id="myPanel" data-position="left" data-display="push" data-theme="a"><ul data-role="listview"><li><a href="#profile">Perfil</a></li><li><a href="#sobre">Sobre</a></li><li><a onClick="logout();">Logout</a></li><li><a href="#" data-rel="close" data-role="button" data-icon="delete" data-iconpos="right" data-inline="true">Fechar</a></li></ul><br><img src="img/logonu3.png" class="painel-img"/><p class="painel-message">Seu aplicativo de acompanhamento nutricional.</p><div class="ui-footer ui-bar-a"><h4 class="ui-title">Visite:</h4><a href="http://nu3.strikingly.com/" rel="external" target="_blank">nu3.strikingly.com</a></div></div>';
//Antes de criar as paginas, será colocado o painel lateral

function onJQMReady(){
	 console.log("JQM inicializado.")
 	 //$.mobile.autoInitializePage = false;	
  	jqmReadyDeferred.resolve();
}

$.when(deviceReadyDeferred, databaseDeferred).then(initAplication);

function onDeviceReady() {
	console.log("Cordova inicializado.")
    document.addEventListener("offline", turnOffline, false);
    document.addEventListener("online", turnOnline, false);
    var outputPromise = initDatabase().then(function (r){
    	console.log("Database loaded");
    	databaseDeferred.resolve()});
    deviceReadyDeferred.resolve();
	
    // Native loading spinner
    if (window.spinnerplugin) {
        $.extend($.mobile, {
            loading: function() {
                // Show/hide spinner
                var arg = arguments ? arguments[0] : '';
                if (arg == 'show') spinnerplugin.show({'overlay':true});
                else if (arg == 'hide') spinnerplugin.hide();           

                // Compatibility with jQM 1.4
                return { loader: function() { } }
            }
        });
    }
}

function initAplication(){
	console.log("Recursos carregados com sucesso. Inicializando aplicação...");
	app.loadUser().then(
		function onFulfilled(result){
			user = result;
			console.log("Dados do usuário carregado: " + JSON.stringify(user));
		//var initial = '#login';
		    if(user != null) {
		      console.log("Usuário carregado");
		      goHome();
		      //initial = '#home';

		    }
		    else{
		    	console.log("Usuário nulo");
		    	$.mobile.changePage($('#login'));
		    }

		},
		function onBroken(error){
			console.error("Couldn't get user: " + error);
		}

	);
	
    //set the page hash to start page
    //window.location.hash = initial;
    //initialise jQM
    console.log("Aplicação pronta, carregando pagina inicial");
    //$.mobile.initializePage();	
}

$(document).on('pagebeforeshow', '#home', function(){	
	$('#feed-data').empty();
	if (networkStatus == false){ //Carregar o contexto do modo offline
		console.log("Changing to offline mode!");
		var context = offlineHomeContext();
		loadHomeFeed(context);
	}
	else{ //carregar o contexto do modo online
		var hoje = Date.today().add(1).days();
		if(storeParameters.inicio == null){
			storeParameters.inicio = Date.parse("last sunday");	//pega a data do ultimo final de semana
		}
		//console.log("Weekend guardado na memória = " + storeParameters.inicio)
		console.log("Criando promessa de contexto...");
		var contextPromise = homeContext(storeParameters.inicio, hoje);
		contextPromise.then(
			function onFulfilled(context){
				//promessa do contexto foi cumprida
				console.log("Context Promise Fulfilled!");
				loadHomeFeed(context);
			},
			function onRejected(reason){
				//promessa não cumprida TODO: criar log da reason...
				console.log("Context Promise Rejected!");
			   erro = {
				  "error" : "Ops...",
				  "link" : "#login",
				  "btn-text": "Login",
				  "msg" : "Houve um erro ao tentar carregar as fotos do servidor. Verifique sua conexão.",
				  "offline" : true
				}
				networkStatus = false;
				changeToErrorPage(erro);
			}
		);
		console.log("Esperando promessa ser cumprida...");
	}
	
	
	$(document).on("click",'#change-page-button', function (event) {
		
		//console.log("data test = " + $(this).data('parm') + " attr test = " + $(this).attr("data-parm"));
	   var parm = $(this).data('parm');
	   storeParameters["index"] = parm;
	   //console.log("EVENT TRIGGER! INDEX SALVO = " + storeParameters["index"]);
	   $.mobile.changePage($('#detalhes'), {transition: 'none'});
	});
});

function loadHomeFeed(context){
	context.user = user;
	var printTokenDate = user.dataExpiracao.slice(0,user.dataExpiracao.length - 12);
	$('#tokenDate').html(printTokenDate);
	var homePage = Handlebars.compile($("#home-tpl").html());;
	$('#feed-data').html(homePage(context));
	$('#feed-data').listview('refresh');
}

$(document).one('pagebeforecreate', function () {
	    $.mobile.pageContainer.prepend(panel);
	    $("#myPanel").panel().enhanceWithin();
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
		if(image == null){
			context = {
			  "error" : "Erro de conexão",
			  "link" : "#login",
			  "btn-text": "Login",
			  "msg" : "Houve um erro ao tentar carregar a foto do servidor. Verifique sua conexão.",
			  "offline" : true
			}
			networkStatus = false;
			changeToErrorPage(context);

		}
		else{
			console.log("IMAGE = " + JSON.stringify(image));
			var comentarios = recuperaComentarios(image);
			console.log("Tentando fazer parse de: " + image.data);
			var newDate = Date.parse(image.data);
			console.log("Resultado: " + newDate);
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

		}
		
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
		if(networkStatus){
			console.log("PERFIL USER DATA: " + JSON.stringify(user));
			var context = {
			  "nome" : user.nomeUsuario,
			  "email" : user.email,
			  "id" : user.idUsuario,
			  "token" : user.token,
			  "dataExp" : user.dataExpiracao
			}
		}
		else{
			var context = {
				"offline" : true
			}
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
						ic.innerHTML = 'Cadastro realizado com sucesso. Retorne e faça o login.';
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
		$('#loading').toggle();
		console.log("Logando: " + mail + "pass: " + password);
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
				console.log("User data: " + JSON.stringify(data));
				app.addUser(data.nomeUsuario, mail, data.token, data.dataExpiracao);
				user = {
					"nomeUsuario": data.nomeUsuario,
					"mail": mail,
					"token": data.token,
					"dataExpiracao": data.dataExpiracao 
				}
				//window.localStorage.setItem("user", JSON.stringify(data));
				var offlineLib = JSON.parse(window.localStorage.getItem("offlineLib"));
				networkStatus = true;
				if(offlineLib && offlineLib["size"] > 0){

					synchronize();
				}
				else{
					goHome();
				}
			},
			error: function (e) {
				console.log("Login Retorno: ERROR! = " + JSON.stringify(e));
				$('#loading').toggle();
				$("#password").val(""); 
				var context = { };
				if(e.responseJSON && e.responseJSON.msg == "Erro de login"){
					console.log("Message do error = " + e.responseJSON.msg);
					context = {
					  "error" : e.responseJSON.msg,
					  "link" : "#login",
					  "btn-text": "Login",
					  "msg" : "Usuário ou Senha inválidos. Tente entrar novamente.",
					}
				}
				else{
					console.log("Message do error = " + e.statusText);
					context = {
					  "error" : "Erro de conexão",
					  "link" : "#login",
					  "btn-text": "Login",
					  "msg" : "Verifique se seu dispositivo está conectado à internet e tente entrar novamente. Se o problema persistir, aguarde que nossos servidores retornarão em breve.",
					  "offline" : true
					}
					networkStatus = false;
				}
				changeToErrorPage(context);
			}
		});  
}

function logout(){
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
				},
				error: function (e) {
					console.log("Login Retorno: ERROR!");
				}
			});	
	}
	//clearCache();
	$.mobile.changePage("#login");  
}

function clearCache(){
	window.localStorage.removeItem("imageLib");
	window.localStorage.removeItem("user");
}

function prepareImagem(){
	var nome = $("#photoTitle").val();
	var node = document.getElementById('hiddenBase64');
	var base = node.innerHTML;
	if(nome.length > 0){
		criaImagem(nome, base);
	}
	else{
		$("#warning").toggle();
	}
}

function criaImagem(nome, base64)
{	var nome = $("#photoTitle").val();
	//var text = $("#photoDesciption").val();
	console.log("Base64 recuperado: " + base64);
	var currentDate = new Date();
	var day = currentDate.toString("dd/MM");
	var hour = currentDate.toString("HH:mm");
	console.log("Current Date = " + currentDate + " timestamp: " + currentDate.getTime());
	//console.log("Base retirado do HTML = " + base64);
	console.log("Criar foto modo online? " + networkStatus );
		if(networkStatus == true){
			var token = user.token;
			var date =  new Date();
			var dataE = {"token" : token, "nomeFoto" : nome , "descricao" : currentDate.getTime() , "base64code" : base64};
			$.ajax( {
				type: "POST",
				url: urlService + "image/criaImagem",
				data: dataE,
				contentType: "application/json; charset=utf-8",
				dataType: "text",
				async: false,
				success: function (data){
					console.log("IMAGEM CRIADA COM SUCESSO, ID = " + data);
					app.addPhoto(data, base64).then(
						function(){
							storeParameters.refresh = true;
							clearPhotoEntries();
							$.mobile.changePage("#home");
						}
					);
					
				},
				error: function (e) {
					if(e.responseJSON && e.responseJSON.msg == "Token invalido"){
						console.log("Message do error = " + e.responseJSON.msg);
						context = {
						  "error" : "Falha ao enviar imagem - " + e.responseJSON.msg,
						  "link" : "#login",
						  "btn-text": "Login",
						  "msg" : "Sua sessão expirou ou você acessou sua conta através de outro dispositivo. Por favor, entre novamente."
						}
					}
					else{
						context = {
						  "error" : "Falha ao enviar imagem - Erro de conexão",
						  "link" : "#login",
						  "btn-text": "Login",
						  "msg" : "Verifique se seu dispositivo está conectado à internet e tente entrar novamente. Se o problema persistir, aguarde que nossos servidores retornarão em breve."
						}
					}
					changeToErrorPage(context);
				}
			});
		}
		else{
			
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
			clearPhotoEntries();
			$.mobile.changePage("#home");
		}
}

function clearPhotoEntries(){
	$("#photoTitle").val("");
	$("#photoDesciption").val("");
	document.getElementById('hiddenBase64').innerHTML = "";
	var ic = document.getElementById('imageContainer');
	ic.innerHTML = "";

}


function manipulaImagem(){
	var base64 = "code...";
	ic = document.getElementById('imageContainer');
	ic.innerHTML = '<img src="data:image/png;base64,' + base64  + '" width="100%" />';
	var node = document.getElementById('hiddenBase64');
	node.innerHTML = base64;
	
}

function recuperaImagem(idFoto, token){
	return Q.fcall(function () {
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
	});
	
}

function criaComentario(){
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
					  "msg" : "Sua sessão expirou ou você acessou sua conta através de outro dispositivo. Por favor, entre novamente."
					}
				}
				else{
					context = {
					  "error" : "Erro de conexão",
					  "link" : "#login",
					  "btn-text": "Login",
					  "msg" : "Verifique se seu dispositivo está conectado à internet, e tente entrar novamente. Se o problema persistir, aguarde que nossos servidores retornarão em breve.",
					  "offline" : true
					}
				}
				changeToErrorPage(context);
			}
				
		});
	}
	return retorno;
	
}

function homeContext(inicio, fim) {
	console.log("REFRESH???? = " + storeParameters.refresh);
	var deferred = Q.defer();
	var context = {
		title: "Teste",
		feed: [],
	}
	if(storeParameters.refresh == true){
		var imagensData = recuperaImagemData(inicio.getTime(), fim.getTime());
		if(imagensData && imagensData.length > 0){
			var previousWeekend = null;
			var imagePromises = []; //Array de promeças para cada imagem carregada no loop

			for (var i = imagensData.length - 1; i>=0; i--){
				console.log("Getting index " + i + " data...");
				var json = imagensData[i]; //idImagem , nome, data, rating, descricao, ultimoComentario (idComentario, nomeUsuario, texto, dataEnvio)
				//precisa fazer uma promisse para carregar o base64 do SQLite
				json["index"] = i;
				var base64Promise = app.loadPhoto(json);
				base64Promise.then(
					function onFulfilled(json){
						console.log("Base64 já existente no banco de dados");
						return json;

					},
					function onRejected(json){
						console.log("Base64 não presente no banco de dados");
						//pede para o webservice a base64 e então adiciona no banco de dados
						recuperaImagem(json.idImagem, user.token).then(
							function (base){
								if (base != null){
									json["base64"] = base;
									app.addPhoto(json.idImagem, base);
									return json;
								}
								else{
									context = {
									  "error" : "Erro de conexão",
									  "link" : "#login",
									  "btn-text": "Login",
									  "msg" : "Verifique se seu dispositivo está conectado à internet, e tente entrar novamente. Se o problema persistir, aguarde que nossos servidores retornarão em breve.",
									  "offline" : true
									}
									changeToErrorPage(context);
								}

							}
							
						);

					}
				).then(function(json){
					console.log("Achou a foto? Finally!!!");
					console.log("Base: " + json["base64"].slice(0,10) + "......");
					var newDate = Date.parse(json.data);
					console.log("Data: " + JSON.stringify(newDate));
					json["stars"] = [];
					json["starsEmpty"] = [];
					for(var j=1; j<= 5; j++){
						if(j <= json.rating) json["stars"].push(1);
						else json["starsEmpty"].push(1);
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
							json["firstPhotoOfTheWeek"] = dia +"/"+ mes;
							previousWeekend = weekend.clone();  
						}
					}
					if(json.hasOwnProperty('ultimoComentario')){
						json["ultimoComentario"] = json["ultimoComentario"].texto; //tira do dicionario somente a parte importante
					}
					console.log("Imagem " + json["index"] + " colocada no feed");
					context.feed.push(json);
				});
				imagePromises.push(base64Promise); //adiciona no array de promeças, a promeça que eventualmente essa foto sera carregada.
				
			}//End -> for
			Q.all(imagePromises).then(function(){
				console.log("Todas as promessas do feed foram cumpridas...");
				console.log("Contexto criado: " + JSON.stringify(context));
				//Todas promessas foram compridas, então resolva a promessa do conjunto todo:
				storeParameters.feed = context.feed;
				deferred.resolve(context);
			});

		}
		else{ //semana vazia, ou seja, sem feed algum
			var week = {
				"emptyWeek": true,
				"date": ("0" + inicio.getDate()).slice(-2) + "/" + ("0" + (inicio.getMonth() + 1)).slice(-2)  
			}
			context.feed.push(week);
			storeParameters.feed = context.feed;
			deferred.resolve(context);
		}	
	}
	else{
		context.feed = storeParameters.feed;
		deferred.resolve(context); 
	}
	console.log("Retornando uma promessa....");
	return deferred.promise; //retorna a promessa de que o contexto ficara pronto eventualmente.
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
		quality : 85,
		destinationType : Camera.DestinationType.IMAGE_URI,
		allowEdit : true,
		targetWidth: 640,
		targetHeight: 640,
		encodingType : Camera.EncodingType.JPEG,
		sourceType: Camera.PictureSourceType.CAMERA,
		correctOrientation: true,
		saveToPhotoAlbum:false
	});
}

function onCameraSuccess(imageData) {
    $.mobile.changePage($('#camera'));
	//Caso a camera trabalhe com base64 use esse trecho de codigo:
	/*
	var imgData = 'data:image/png;base64,' + imageData;
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
		console.log("Imagem Class = " + imgClass);
		var ic = document.getElementById('imageContainer');
		ic.innerHTML = '<img class="' + imgClass + '" src="data:image/png;base64,' + imageData + '"/>';
		node.innerHTML = imageData;
	}
	img.src = imgData;
	*/
	//Caso trabalhe com FILE_URI, utilize o seguinte trecho de codigo:
	console.log("Tentando encode para base64");
	getBase64FromImageUrl(imageData);
}

function onCameraError(e) {
	console.log(e);
	event.preventDefault();
	event.stopPropagation();
	$.mobile.changePage($('#home'));
	navigator.notification.alert("onCameraError: " + e + "(" + e.code + ")");
}

encodeImageUri = function(imageUri, callback) {
    var c = document.createElement('canvas');
    var ctx = c.getContext("2d");
    var img = new Image();
    img.onload = function() {
        c.width = this.width;
        c.height = this.height;
        ctx.drawImage(img, 0, 0);

        if(typeof callback === 'function'){
            var dataURL = c.toDataURL("image/png");
            //console.log("DataURL original: " + dataURL);
            callback(dataURL.slice(22, dataURL.length));
        }
    };
    img.src = imageUri;
}

function getBase64FromImageUrl(URL) {
	encodeImageUri(URL, function(base64){
		 console.log("Callback Return: " + base64);
		 var ic = document.getElementById('imageContainer');
		 ic.innerHTML = '<img src="data:image/png;base64,' + base64 + '" class="squareImage"/>';
		 var node = document.getElementById('hiddenBase64');
		 node.innerHTML = base64;
	});
    /*var img = new Image();
    img.onload = function () {
	    var canvas = document.createElement("canvas");
	    canvas.width =this.width;
	    canvas.height =this.height;
	    var ctx = canvas.getContext("2d");
	    ctx.drawImage(this, 0, 0);
	    var dataURL = canvas.toDataURL("image/png");
	    console.log(  dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
	    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    }
    img.src = URL;*/
}

function synchronize(){
	
	var offlineImagensLib = JSON.parse(window.localStorage.getItem("offlineLib"));
	var token = user.token;
	console.log("Sincronizando " + offlineImagensLib["size"] + " imagens");
	$.mobile.changePage($('#sincronizar'));
	var qtdImg = offlineImagensLib["gallery"].length;
	var cont = qtdImg;
	$('#qtdImagens').html(qtdImg);
	$('#progressImage').toggle();
	$('#feedList').listview('refresh');
	for (var i = 0; i < qtdImg; i++){
		var image = offlineImagensLib["gallery"][i];
		$('#feedList').append("<li><img class='position-left syncPreview' src='data:image/png;base64,"+image.base64+"'/><label class='pull-left paddingFive'><h2><strong>"+image.photo_label+"</strong></h2><span id='photo-"+i+"'></span></label></li><br clear='all'>");
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
					cont--;
					console.log("IMAGEM " + i + " " + image.photo_label + " sincronizada com sucesso");
					$('#photo-'+ i).html("<label class='syncSuccess'> Sucesso </label>");
					offlineImagensLib["gallery"][i].sincronizada = true;
					if(cont == 0){
						afterSynchronization(offlineImagensLib);
					}
				},
				error: function (e) {
					cont--;
					var erroText = '';
					if(e.responseJSON && e.responseJSON.msg == "Token invalido"){
						erroText = 'Token inválido';
					}
					else{
						erroText = 'Sem conexão';
					}
					$('#photo-'+ i).html("<label class='syncError'> Erro: "+ erroText +" </label>");
					if(cont == 0){
						afterSynchronization(offlineImagensLib);
					}
				}
			});
		}
	}
}

function afterSynchronization(lib){
	$('#progressImage').toggle();
	var failedSynch = {
		"gallery" : []
	}
	var hasErrors = false;
	for (var i = 0; i < lib["gallery"].length; i++){
		if(lib["gallery"][i].sincronizada == false){
			hasErrors = true;
			failedSynch["gallery"].push(lib["gallery"][i]);
		}
	}
	if(hasErrors){
		$('#errorBtns').toggle();
		window.localStorage.setItem("offlineLib", JSON.stringify(failedSynch));	
	}
	else{
		$('#homeHiddenBtn').toggle();
		window.localStorage.removeItem("offlineLib");
	}
	

}


function checkConnection() {
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';

    alert('Connection type: ' + states[networkState]);
}

function turnOffline(){
	var today = Date.today().getTime();
	//if (user != null) console.log("Token expirado? " + today + " >>> " + user.tokenTimeStamp);
	if (user == null || today > Date.parse(user.dataExpiracao).getTime()){
		console.log("Usuario nulo ou token expirado: " + JSON.stringify(user));
		context = {
				  "error" : "Não é possivel entrar em modo offline:",
				  "link" : "#login",
				  "btn-text": "Login",
				  "msg" : "Sua sessão expirou ou você ainda não entrou com esse dispositivo. Faça login novamente.",
				  "offline" : false
		}
		changeToErrorPage(context);
	}
	else{
		//if(networkStatus == true){
			networkStatus = false;
			console.log("Modo offline triggered!!!");
			if ( $('.ui-page-active').attr('id') == 'error' || $('.ui-page-active').attr('id') == 'login') {
				console.log("indo para home no modo offline");
				goHome();
			}
			else{
				context = {
					  "error" : "Perda de conexão",
					  "link" : "#login",
					  "btn-text": "Login",
					  "msg" : "Verifique se seu dispositivo está conectado à internet e tente entrar novamente. Se o problema persistir, aguarde que nossos servidores retornarão em breve. Você pode utilizar o Modo Offline para tirar suas fotos e poderá enviá-las mais tarde, quando tiver conexão.",
					  "offline" : true
				}
				changeToErrorPage(context);
			}
		//}
	}
}

function turnOnline(){
	if (networkStatus == false){
		networkStatus = true;
		console.log("Modo online triggered!!!");
		if (user == null){
			$.mobile.changePage($('#login'));
		}
		else{
			var offlineImagensLib = JSON.parse(window.localStorage.getItem("offlineLib"));
			if(offlineImagensLib){
				synchronize();	
			}
			else{
				goHome();	
			}
		}
	}
}

function goHome(){
	if ($('.ui-page-active').attr('id') == 'home'){
		window.location.reload();
	}
	else $.mobile.changePage($('#home'));
}

function changeToErrorPage(context){
	$.mobile.changePage("#error");
	var errorPage = Handlebars.compile($("#error-tpl").html());
	$('#error-data').html(errorPage(context));
	//$('#error-data').listview('refresh');
}



var loginTemplate = Handlebars.compile($("#login-tpl").html());
var homeTemplate = Handlebars.compile($("#home-tpl").html());
var homeBlankTemplate = Handlebars.compile($("#homeBlank-tpl").html());
var detailTemplate = Handlebars.compile($("#detail-tpl").html());
var photoTemplate = Handlebars.compile($("#photo-tpl").html());
var perfilTemplate = Handlebars.compile($("#perfil-tpl").html());
var sincronizarTemplate = Handlebars.compile($("#sincronizar-tpl").html());