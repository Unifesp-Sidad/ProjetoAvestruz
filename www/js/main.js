// JavaScript Document

function onBodyLoad() {
	console.log("Estanciando");
	document.addEventListener("deviceready", onDeviceReady, false);
	loadHome();
}

function loadHome() {
	var user = JSON.parse(window.localStorage.getItem("user"));
	if (user == null){
		var loginPage = loginTemplate();
		$('body').html(loginPage);
	}
	else{
		var context = {
			title: "Teste",
			feed: [
				{
				id: 1,
				photo_uri: "img/ref2.jpg",
				photo_label: "lanche",
				title: "Cuscuz",
				description: "Dessa vez resolvi pegar um salgado mais leve, parei com coxinha!",
				data: "29/08/2014",
				comments: [{
					id: "11",
					author: "Dr. Avestruz",
					comment: "Está melhorando bastante, poderia acrescentar mais soja da próxima vez.",
					data: "29/08/2014"
					},{
					id: "12",
					author: "Eu",
					comment: "Vou fazer um esforço extra, odeio soja! Grr",
					data: "30/08/2014"
					}]
				},{
				id: 2,
				photo_uri: "img/ref3.jpg",
				photo_label: "lanche",
				title: "Big Mac",
				description: "Exagerei este fim de semana!",
				data: "31/08/2014",
				comments: [{
					id: "21",
					author: "Dr. Avestruz",
					comment: "Totalmente fora da dieta. Um pouco mais de foco.",
					data: "31/08/2014"
					},{
					id: "22",
					author: "Eu",
					comment: "Ok!",
					data: "31/08/2014"
					}]
				}]
		};
		var homePage = homeTemplate(context);
		$('body').html(homePage);
	}
	
}

function showDetails(id){
	console.log(id);
	//procura pelo id da photo o contexto, por enquanto vou por estático:
	var context;
	if(id == 1){
		context = {
				id: 1,
				photo_uri: "img/ref2.jpg",
				photo_label: "lanche",
				title: "Cuscuz",
				description: "Dessa vez resolvi pegar um salgado mais leve, parei com coxinha!",
				data: "29/08/2014",
				comments: [{
					author: "Dr. Avestruz",
					comment: "Está melhorando bastante, poderia acrescentar mais soja da próxima vez.",
					data: "29/08/2014"
					},{
					author: "Eu",
					comment: "Vou fazer um esforço extra, odeio soja! Grr",
					data: "30/08/2014"
					}]
				};
	}
	else{
		context = {
				id: 2,
				photo_uri: "img/ref3.jpg",
				photo_label: "lanche",
				title: "Big Mac",
				description: "Exagerei este fim de semana!",
				data: "31/08/2014",
				comments: [{
					author: "Dr. Avestruz",
					comment: "Totalmente fora da dieta. Um pouco mais de foco.",
					data: "31/08/2014"
					},{
					author: "Eu",
					comment: "Ok!",
					data: "31/08/2014"
					},
					{
					author: "Eu",
					comment: "Mas tava tão bom!!!",
					data: "31/08/2014"
					}]
				};
	}
	var detailPage = detailTemplate(context);
	$('body').html(detailPage);
}

function loadPhotoPage(){
	var photoPage = photoTemplate();
	$('body').html(photoPage);
}

function loadPerfilPage(){
	var perfilPage = perfilTemplate();
	$('body').html(perfilPage);
}


function login(){
	console.log("TESTE");
	var email = document.getElementById('username').value;
	var pass = document.getElementById('password').value;
	var token =  null; //loginWebserviceFunction(email, pass); //TODO
	var user = {
		"nome": "TODO",
		"email": email,
		"token": token
	}
	//por enquanto ta assim para deixar passar para a home mesmo sem um login...
	window.localStorage.setItem("user", JSON.stringify(user));
	loadHome();
}

function logout(){
	window.localStorage.removeItem("user");
	//logoutWebserviceFunction();  //TODO
	loadHome();	
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

function onCameraSuccess(imageURL) {
	var title = document.getElementById('photoTitle');
	var text = document.getElementById('photoDesciption');
	var photo = {
		"title": title,
		"text": text,
		"src": imageURL,
		"timestamp" : "TODO",
	}
	var imageID = null; //sendImageWebService(token, title, text, imageData); TODO!
	updateStorageData(imageID, photo, "photo"); //coloca essa nova coleta na storage
	var ic = document.getElementById('imageContainer');
	ic.innerHTML = '<img src="' + imageURL + '" width="100%" />';
}

function onCameraError(e) {
	console.log(e);
	navigator.notification.alert("onCameraError: " + e + "(" + e.code + ")");
}

function updateStorageData(id, json, type){
	var data = JSON.parse(window.localStorage.getItem("data"));
	if (data == null){ //cria um nova data
		if (type == "comment"){
			//ERRO TODO
		}
		data = {
			id: [
				json,
				{"comments": null} //não tem comments ainda
			]
		}
	}
	else{
		if (type == "photo"){
			data.push({
				id: [
					json, 
					{"comments": null}
					]
			});
		}
		else{
			data.id.comments.push(json);
		}
	}
	window.localStorage.setItem("data", JSON.stringify(data)); //atualiza o stoorage
}

var loginTemplate = Handlebars.compile($("#login-tpl").html());
var homeTemplate = Handlebars.compile($("#home-tpl").html());
var detailTemplate = Handlebars.compile($("#detail-tpl").html());
var photoTemplate = Handlebars.compile($("#photo-tpl").html());
var perfilTemplate = Handlebars.compile($("#perfil-tpl").html());