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
		tx.executeSql("CREATE TABLE IF NOT EXISTS photos (ID TEXT PRIMARY KEY, title TEXT, base64 TEXT, data DATETIME, rating INTEGER, added_on DATETIME)", []);
		tx.executeSql("CREATE TABLE IF NOT EXISTS offlineLib (ID INTEGER PRIMARY KEY ASC AUTOINCREMENT, title TEXT, base64 TEXT, synch INTEGER, added_on DATETIME)", []);
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

app.addPhoto = function(id, base64) {
	console.log("DB: Adding photo with id " + id);
	var db = app.db;
	var deferred = Q.defer();
	db.transaction(function(tx) {
		tx.executeSql("INSERT INTO photos(ID, base64) VALUES (?,?)",
					  [id, base64],
					  function success(tx, r){
					  		console.log("Succecc: " + JSON.stringify(r));
					  		console.log("Base inserida: " + base64);
					  		deferred.resolve(r);
					  },
					  app.onError);
	});
	return deferred.promise;
}

app.loadPhoto = function(json){
	var id = json.idImagem;
	console.log("DB: Searching for photo with id " + id);
	var db = app.db;
	var deferred = Q.defer();
	db.transaction(
		function(tx){
			tx.executeSql(
				"SELECT base64 FROM photos WHERE ID=?", 
				[id], 
				function(tx, result){
					var len = result.rows.length;
					
					if(len>0){
						var row = result.rows.item(0);
						console.log("DB: Photo with id " + id + " loaded.");
						//console.log("ROW: " + JSON.stringify(row));
						var base = row["base64"];
						json["base64"] = base;
						//deferred.resolve(result.rows.item(0)['base64']);
						deferred.resolve(json);
					}
					else{
						json[base64] = null;
						deferred.reject(json);
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

app.addOfflinePhoto = function(title, base64) {
	var db = app.db;
	db.transaction(function(tx) {
		var addedOn = new Date();
		tx.executeSql("INSERT INTO offlineLib(title, base64, synch, added_on) VALUES (?,?,?,?)",
					  [title, base64, 0, addedOn],
					  app.onSuccess,
					  app.onError);
	});
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