var app = {};
app.db = null;

app.openDb = function() {
	   if (window.navigator.simulator === true) {
	        // For debugin in simulator fallback to native SQL Lite
	        console.log("Use built in SQL Lite");
	        app.db = window.openDatabase("nu3app", "1.0", "Cordova Demo", 20000000);
	    }
	    else {
	        app.db = window.sqlitePlugin.openDatabase({name: "nu3app", androidLockWorkaround: 1});
	   }
}

function initDatabase() {
    //navigator.splashscreen.hide();
    app.openDb();
    var deferred = Q.defer();
	deferred.resolve(app.createTable());
	return deferred.promise;
	//app.refresh();
}
      
function addTodo() {
	var todo = document.getElementById("todo");
	app.addTodo(todo.value);
	todo.value = "";
}

app.createTable = function() {
	var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("CREATE TABLE IF NOT EXISTS users (ID INTEGER PRIMARY KEY, username TEXT, email TEXT, token TEXT, token_exp INTEGER, token_date DATETIME, added_on DATETIME)", []);
		tx.executeSql("CREATE TABLE IF NOT EXISTS photos (ID TEXT PRIMARY KEY, title TEXT, base64 TEXT, data DATETIME, rating INTEGER, synchronized INTEGER, added_on DATETIME)", []);
	});
}

app.addUser = function(name, email, token, tokenDate) {
	var db = app.db;
	//Como a tabela de users será somente uma linha, todo usuário terá id primaria 1.
	db.transaction(function(tx) {
		var addedOn = new Date();
		tx.executeSql("INSERT OR REPLACE INTO users(id, username, email, token, token_date, added_on) VALUES (?,?,?,?,?,?)",
					  [1, name, email, token, tokenDate, addedOn],
					  app.onSuccess,
					  app.onError);
	});
}

app.loadUser = function(){
	var db = app.db;
	var deferred = Q.defer();
	if(db != null){
		db.transaction(function(transaction) {
		   transaction.executeSql('SELECT * FROM users;', [],
		     function(transaction, result) {
		     	 console.log("DB USER SELECTED: " + JSON.stringify(result));
		     	 if (result != null && result.rows.length != 0) {
		     	 	console.log("Loading user info...");
		     	 	var row = result.rows.item(0);
		     	 	var info = {
		     	 		"nomeUsuario": row.username , 
		     	 		"mail": row.email,
		     	 		"token": row.token, 
		     	 		"dataExpiracao": row.token_date
		     	 	};
		     	 	console.log("DATABASE. Returning user info: " + JSON.stringify(info));
		     	 	deferred.resolve(info);
		      	}
		      	else{
		      		console.log("Sem usuário no banco de dados...");
		      		deferred.resolve(null);
		      	}
		     },app.onError);
		 },app.onError);
	}
	return deferred.promise;
}

app.removeUser = function(){
	var db = app.db;
	db.transaction(function(transaction) {
	   transaction.executeSql('DELETE FROM users WHERE id=1', [],
	     function(transaction, result) {
	     	console.log("Succecc: " + result.message); 
	     },app.onError);
	 },app.onError);
}

app.addPhoto = function(json, base64, mode) {
	//mode defina se a foto está sendo adicionada no modo online ou offline
	console.log("DB: Adding photo with id " + json.idImagem);
	var db = app.db;
	var deferred = Q.defer();
	db.transaction(function(tx) { //ID TEXT PRIMARY KEY, title TEXT, base64 TEXT, data DATETIME, rating INTEGER, added_on DATETIME, stars INTEGER, starsEmpty INTEGER
		tx.executeSql("INSERT INTO photos(ID, title, base64, data, rating, synchronized) VALUES (?,?,?,?,?,?)",
					  [json.idImagem, json.nome, base64, json.data, json.rating, mode],
					  function success(tx, r){
					  		console.log("Photo Succecc: " + JSON.stringify(r));
					  		deferred.resolve(base64);
					  },
					  app.onError);
	});
	return deferred.promise;
}

app.loadPhoto = function(id){
	console.log("DB: Searching for photo with id " + id);
	var db = app.db;
	var deferred = Q.defer();
	db.transaction(
		function(tx){
			tx.executeSql(
				"SELECT * FROM photos WHERE ID=?", 
				[id], 
				function(tx, result){
					
					var len = result.rows.length;
					//console.log("DB: found photo " + id + "   row lenght: " + len);
					if(len>0){
						var row = result.rows.item(0);
						console.log("DB: Photo with id " + id + " loaded.");
						//console.log("ROW: " + JSON.stringify(row));
						//deferred.resolve(result.rows.item(0)['base64']);
						deferred.resolve(row);
					}
					else{
						deferred.resolve(null);
					}
				},
				function(tx, error){
					console.log("DB PHOTO ERROR: " + error.message);
					deferred.reject(json);
				}
			);
		}, 
		function onError(tx, error){
			console.log("DB load photo error: " + error.message);
			deferred.reject(json);
		}
	);
	return deferred.promise;
}

app.loadOfflineLib = function(){
	console.log("DB: Searching for photos not synchronized");
	var db = app.db;
	var deferred = Q.defer();
	db.transaction(
		function(tx){
			tx.executeSql(
				"SELECT * FROM photos WHERE synchronized=0", 
				[], 
				function(tx, result){
					
					var len = result.rows.length;
					//console.log("DB: found photo " + id + "   row lenght: " + len);
					if(len>0){
						deferred.resolve(result.rows);
					}
					else{
						deferred.resolve(null);
					}
				},
				function(tx, error){
					console.log("DB PHOTO ERROR: " + error.message);
					deferred.reject(json);
				}
			);
		}, 
		function onError(tx, error){
			console.log("DB load photo error: " + error.message);
			deferred.reject(json);
		}
	);
	return deferred.promise;
}

app.updateRating = function(id, rating){
	var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("UPDATE photos SET rating= ? WHERE ID = ?",
					  [id, rating],
					  app.onSuccess,
					  app.onError);
	});

}

app.updateSynch = function(id, data){
	var db = app.db;
	var deferred = Q.defer();
	db.transaction(function(tx) {
		tx.executeSql("UPDATE photos SET id= ?, synchronized = 1 WHERE ID = ?",
					  [data.idImagem, id],
					  function success(result){
					  	console.log("Photo id successfully edited");
					  	deferred.resolve();
					  },
					  app.onError);
	});
	return deferred.promise
}
      
app.onError = function(tx, e) {
	console.log("Error: " + e.message);
} 
      
app.onSuccess = function(tx, r) {
	console.log("Succecc: " + JSON.stringify(r));
	//app.refresh();
}
      
app.deleteTodo = function(id) {
	var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("DELETE FROM todo WHERE ID=?", [id],
					  app.onSuccess,
					  app.onError);
	});
}

app.refresh = function() {
	var renderTodo = function (row) {
		return "<li>" + "<div class='todo-check'></div>" + row.todo + "<a class='button delete' href='javascript:void(0);'  onclick='app.deleteTodo(" + row.ID + ");'><p class='todo-delete'></p></a>" + "<div class='clear'></div>" + "</li>";
	}
    
	var render = function (tx, rs) {
		var rowOutput = "";
		var todoItems = document.getElementById("todoItems");
		for (var i = 0; i < rs.rows.length; i++) {
			rowOutput += renderTodo(rs.rows.item(i));
		}
      
		todoItems.innerHTML = rowOutput;
	}
    
	var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT * FROM todo", [], 
					  render, 
					  app.onError);
	});
}