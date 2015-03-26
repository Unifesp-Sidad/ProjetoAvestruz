var app = {};
app.db = null;

app.openDb = function() {
	   if (window.navigator.simulator === true) {
	        // For debugin in simulator fallback to native SQL Lite
	        console.log("Use built in SQL Lite");
	        app.db = window.openDatabase("nu3app", "1.0", "Cordova Demo", 200000);
	    }
	    else {
	        app.db = window.sqlitePlugin.openDatabase({name: "nu3app", androidLockWorkaround: 1});
	   }
}

function initDatabase() {
    //navigator.splashscreen.hide();
	app.openDb();
	app.createTable();
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
		tx.executeSql("CREATE TABLE IF NOT EXISTS imagensLib (ID INTEGER PRIMARY KEY ASC, title TEXT, base64 TEXT, data DATETIME, rating INTEGER, added_on DATETIME)", []);
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
	 db.transaction(function(transaction) {
	   transaction.executeSql('SELECT * FROM users;', [],
	     function(transaction, result) {
	     	 console.log("DB USER SELECTED: " + JSON.stringify(result));
	     	 if (result != null && result.rows != null) {
	     	 	console.log("Loading user info...");
	     	 	var row = result.rows.item(0);
	     	 	var user = {
	     	 		"nomeUsuario": row.username , 
	     	 		"mail": row.email,
	     	 		"token": row.token, 
	     	 		"dataExpiracao": row.token_date
	     	 	};

	     	 	return user;
	      	}
	      	else{
	      		return null;
	      	}
	     },app.onError);
	 },app.onError);
}

app.removeUser = function(){
	var db = app.db;
	db.transaction(function(transaction) {
	   transaction.executeSql('DELETE FROM users WHERE id=1;', [],
	     function(transaction, result) {
	     	console.log("Succecc: " + result.message); 
	     },app.onError);
	 },app.onError);
}

app.addPhoto = function(id, title, base64, data, rating) {
	var db = app.db;
	db.transaction(function(tx) {
		var addedOn = new Date();
		tx.executeSql("INSERT INTO imagensLib(id, title, base64, data, rating, added_on) VALUES (?,?,?,?,?,?)",
					  [id, title, base64, data, rating, addedOn],
					  app.onSuccess,
					  app.onError);
	});
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