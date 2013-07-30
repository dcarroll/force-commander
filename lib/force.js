#! /usr/bin/env node

var userArgs = process.argv.slice(2);
var sforce = require('./connection').sforce;
var webserver = require('./webserver').webserver;
var exec = require('child_process').exec;
var path = require('path');
var shellJs = require('shelljs');
var fs = require('fs');
var commandLineUtils = require('./commandLineUtils');
var outputColors = require('./outputColors');

var commandMap = { 
					login:0, 
					createtable:1, 
					addfield:2, 
					test:3, 
					showtables:4,
					showmetadata:5,
					listmetadata:6,
					retrieveMetadata:7,
					checkRetrieve:8,
					checkStatus:9
				 };

var _ = require("underscore")._;

var prompt = require('prompt');
var promptdefs = require("./promptdefs").promptdefs;
var prompts = promptdefs.prompts;
var CREDS = ".forcedc";
var SETTINGS = ".settings";
var config = { activeConnection:"", 
				connData: {
					activeConnection:'',
					connections:{}
				},
				creds: {} } ;

var writeFile = function(file, data) {
	var fs = require('fs');
	var err = fs.writeFileSync(file, JSON.stringify(data, null, 4))
	if(err) {
		console.log(err);
	} else {
	}	
};

var deleteFile = function(file, msg) {
	var fs = require('fs');
	fs.unlink(file, 
		function (err) {
  			if (err) throw err;
  			msg = 'Connection ' + file + ' removed.' + msg;
  			console.log(msg);
		}
	);
};

var writeKeyValue = function(file, key, value) {
	var fs = require('fs');
	if (typeof key !== 'undefined') {
		var obj = readValue(file, function(err, data) {
			if (typeof obj === 'undefined') {
				obj = {};
			}
			obj[key] = value;
			//console.log("KEYVAL: " + JSON.stringify(obj) + "\n" + key  + ':' + value);
			writeFile(file, obj);
		});
	} else {
		writeFile(file, value);
	}
};

var readValue = function(file, callback) {
	var fs = require('fs');
	try {
		var fData = fs.readFileSync(file)
		callback(null, fData);
	} catch(err) {
		console.log("Read error: " + err);
		callback(err);
	}
};

var readKeyValue = function(file, key, callback) {
	readValue(file, function(err, data) {
		if (err) {
			writeFile(SETTINGS, '');
		};// throw err;
		var obj = JSON.parse(data);
		//console.log("READKEYVALUE: " + JSON.stringify(obj));
		callback(obj[key]);
	});
};

readValue(CREDS, 
	function(err, data) {
		if (err) {
			//console.log("No connections have been added, try connection:add");
		} else {
			connData = JSON.parse(data);
			config.connData = connData;
			for (var key in connData) {
				if (key === 'connections') {
					for (var ckey in connData[key]) {
						readValue(ckey, 
							function(err, cdata) {
								var creds = JSON.parse(cdata);
								config.creds[ckey] = creds;
							}
						);
					};
				} else {
					config.connData[key] = connData[key];
				}
			}
		}
	}
);

var isNewConnection = function(connectionName) {
	return (typeof config.connData.connections[connectionName] === 'undefined');
}

var addConnectionToConfig = function(connectionName) {
	config.connData.connections[connectionName] = { name:connectionName };
}

var getConnectionInfo = function(connectionName) {
	var lr = config.creds[connectionName][connectionName];
	var result = '\tConnection name: ' + connectionName + '\n';
	result += '\tUser Id: \t ' + lr.userId + '\n';	
	result += '\tOrg Id: \t ' + lr.userInfo[0].organizationId + '\n';
	result += '\tUser name: \t ' + lr.userInfo[0].userName + '\n';
	result += '\tUser email: \t ' + lr.userInfo[0].userEmail + '\n';
	result += '\tOrg name: \t ' + lr.userInfo[0].organizationName + '\n';	
	result += '\tServer url: \t ' + lr.serverUrl;
	return result;
}

var doLogin = function(un, pw, connectionName) {

	sforce.connection.serverUrl = "https://login.salesforce.com/services/Soap/u/28.0";
	var lr = sforce.connection.login(un, pw);

	if (typeof lr[0] != 'undefined') {
		console.log(lr[0].faultstring[0]);
	} else {
		sforce.connection.init(lr.sessionId, lr.serverUrl);
	}

	lr['name'] = connectionName;

	if (isNewConnection(connectionName)) {
		// Add the connection to the connection array
		addConnectionToConfig(connectionName);
	}

	// Set the connection to be active
	config.connData.activeConnection = connectionName;
	
	// Write connection data to CREDS
	writeFile(CREDS, config.connData);

	// Write out the login result to a new file
	var conn = { activeConnection:connectionName };

	conn[connectionName] = lr;
	writeFile(connectionName, conn);
	console.log('\nConnection ' + connectionName + ' was added.\n');
	console.log(getConnectionInfo(connectionName) + '\n');
}

var loggedin = function(args, command) {
	var exec = require('child_process').exec;
	var args = args;
	var acommand = command;
	var child = exec('ls -a | grep ' + ".forcedc", function(err, stdout, stderr) {
    	if (err) {
    		console.log("Please run the login command and try again.");
    		return false;
		} else {
			var activeConn = config.connData.activeConnection;
			if (activeConn.length > 0) {
				conn = config.creds[activeConn];
				sforce.connection.init(conn[activeConn].sessionId[0],
									   conn[activeConn].serverUrl[0]);
				if (typeof acommand !== 'undefined') {
					acommand(args);
				}
			}
			return true;
		}
	});	
}

/*
	forcedotcom createtable name:MyTable autonumber:true label:"My Table" description:"This is a node.js CLI created table"
*/
var doCreateTable = function(args) {
	var config = {};
	var keys = _.keys(args);
	_.each(keys, function(key) {
		console.log("Key: " + key);
		if (args[key] != null) {
			config[key] = args[key];
		}
	});
	config.sforce = sforce;
	var metadata = require("./fdcmetadata").fdcmetadata;
	var result = metadata.createCustomObject(config);
	
	console.log("result; \n\n" + JSON.stringify(result));

	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}
	if (result[0].state[0] === "Error") {
		console.log(outputColors.red + result[0].statusCode[0] + "\n" + outputColors.yellow + result[0].message[0] + outputColors.reset);
	} else {
		console.log("Table created successfully.");
	}
	loggedin({name:args.name}, doAddTable);
}

var doDeleteTable = function(args) {
	var config = {};
	config.sforce = sforce;
	var fullName = args.name;
	if (fullName.substring(fullName.length - 3) !== "__c")  {
		fullName += "__c";
	}
	config["name"] = fullName;

	var metadata = require("./fdcmetadata").fdcmetadata;
	var result = metadata.deleteCustomObject(config);

	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}
	if (result[0].state[0] === "Error") {
		console.log(outputColors.red + result[0].statusCode[0] + "\n" + outputColors.yellow + result[0].message[0] + outputColors.reset);
	} else {
		console.log("Table deleted successfully.");
	}
};

var getFieldSpec = function() {
	var fieldConfig = {};
	prompt.message = "Add Field".red;
	prompt.start();

	var props = promptdefs.validateFieldCreate(userArgs);

	var getFieldType = function(userprops) {

		//console.log("User props: " + JSON.stringify(userprops));

		if (userprops.hasType === "false") {
			userprops.props.push(promptdefs.typePrompt);
		}
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name === "customobject" });
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name !== "type" });

		//console.log("User props 2: " + JSON.stringify(userprops));


		prompt.get(userprops.props, function(err, result) {
			if (err) { return onErr(err); }

			//console.log("Initial result: " + JSON.stringify(result, null, 2));
			if ( result["type"] === '') {
				console.log("You must specify the field type that you want to add.");
				getFieldType(userprops);
			} else {
				fieldConfig.type = result["type"];
				//console.log("Field Config: " + JSON.stringify(fieldConfig));
				if (typeof prompts[result["type"]] === 'undefined') {
					console.log("I actually don't know that field type, can you try another?");
					getFieldType(userprops);
				} else if (result["type"] == "?") {
					//console.log(promptdefs.prompts["?"][0].description);
					getFieldType(userprops);
				} else {
					getFieldAttributes(err, result, userprops);
				}
			};
		});
	};

	var getFieldAttributes = function(err, result, userprops) {
		//console.log("New Userargs: " + JSON.stringify(userArgs));
			//console.log("FieldConfig: " + JSON.stringify(fieldConfig, null, 2));
		userprops.props = promptdefs.validateFieldCreate(userArgs);
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name === "type" });
		userprops.props = _.reject(userprops.props, function(prop) { return prop.name === "table" });
		//console.log("Final props: " + JSON.stringify(userprops, null, 2));
		//prompt.get(promptdefs.prompts[result.type], function(err, result) {
		prompt.get(userprops.props[0], function(err, result) {
			//console.log("FieldConfig " + JSON.stringify(fieldConfig, null, 2));
			for (var key in result) {
				//console.log("\tKey: " + key);
				if (key != "table") fieldConfig[key] = result[key];
			}
			_.each(userArgs, function(arg) {
				var argkvp = arg.split(":");
				//console.log("\tKVO: " + argkvp);
				if (argkvp[0] !== "table") fieldConfig[argkvp[0]] = argkvp[1];
			});
			//console.log("FieldConfig: " + JSON.stringify(fieldConfig, null, 2));
			doCreateField(fieldConfig);
		});
	};

	var getTableName = function(err, result) {


		function tableCheck(err, result) {
			if (err) { return onErr(err); }

			if ( result["customobject"] === '') {
				console.log("You must specify the object the field will be part of.");
				getTableName();
			} else {
				fieldConfig.fullName = result.customobject;
				if (fieldConfig.fullName.substring(fieldConfig.fullName.length - 3) !== "__c") {
					fieldConfig.fullName += "__c";
				}
				//Should validate the object exists here
				var dsr = sforce.connection.describeSObject(fieldConfig.fullName);
				
				//console.log(JSON.stringify(dsr, null, 4));
				if (typeof dsr.length != "undefined") {
					console.log("Nope, that table does not exist, check your spelling and try again!");
					getTableName();
				} else {
					if (props.hasType == "false") {
						props.props.push(promptdefs.typePrompt);
						getFieldType(props);
					} else {
						fieldConfig["type"] = userArgs.type;
						getFieldAttributes(null, result, props);
					}
				}
			};
		};

		if(typeof result !== 'undefined') {
			tableCheck(err, result);
		} else {
			prompt.get(props.props, tableCheck);
		}
	}

  	function onErr(err) {
    	console.log(err);
    	return 1;
  	}

  	var cmdConfig = {};

	//console.log("Props: " + JSON.stringify(props));

  	if (props["hasTable"] === "false") {
  		//console.log("Props has no table");
  		props.props.push(promptdefs.tablePrompt);
		//console.log("Props: " + JSON.stringify(props));
  		getTableName();
  	} else {
  		getTableName(null, { customobject:promptdefs.arrayToObject(userArgs).table });
  	}

  	/*if (typeof props["table"] !== 'undefined') {
  		// Looks like we have a table name on the command line,
  		// check the table exists and then goto the field prompts
  		getTableName(null, { customobject:props["table"] });
  	} else {
	  	getTableName();
	}*/
};

var doCreateField = function(fieldConfig) {
	fieldConfig.sforce = sforce;
	var metadata = require("./fdcmetadata").fdcmetadata;
	var result = metadata.createCustomField(fieldConfig);
	//console.log("Create Field Result: \n" + JSON.stringify(result[0].id[0], null, 2));
	var config = {
			sforce:sforce
	};	
	while (result[0].done[0] === "false") {
		config.id = result[0].id[0];
		result = metadata.checkStatus(config);
	}
	//console.log("Final result: " + JSON.stringify(result, null, 2));
}

var doListConnections = function() {
	readValue(CREDS,
		function (err, data) {
			if (err) throw err;
  			var connection = JSON.parse(data);
  			var conns = [];
  			var msg = "\n";

  			for (var key in connection.connections) {
  				msg += key + "\n";
  				conns.push(key);
  			}
  			msg = "\n" + conns.length + ' connection(s): ' + msg;
  			console.log(msg);
		}
	);
}

var doRemoveConnection = function(args) {
	delete config.connData.connections[args.name];
	delete config.creds[args.name];
	if (config.connData.activeConnection === args.name) {
		config.connData.activeConnection = '';
		msg = "\nWARNING: " + "Active connection removed\n";
	}
	deleteFile(args.name, msg);
	writeFile(CREDS, config.connData);
};

var doUseConnection = function(args) {
	if (typeof config === 'undefined'){
		console.log("Use connection:add to add a new connection");
	} else {
		if (typeof config.creds[args.name] === 'undefined') {
			console.log("No connection with the name " + args.name + " could be found.");
		} else {
			config.connData.activeConnection = args.name;
			writeFile(CREDS, config.connData);
			doActiveConnection();
		};
	}
};

var doActiveConnection = function() {
	console.log("\nactive connection: " + config.connData.activeConnection + "\n");
	console.log(getConnectionInfo(config.connData.activeConnection) + '\n');
}

var showMetadata = function() {
	var metadata = require("./fdcmetadata").fdcmetadata;
	var dsr = metadata.showMetadata({sforce:sforce, apiVersion:"29.0"})[0];
	_.each(dsr.metadataObjects, function(mdo) {
		//console.log(mdo.xmlName);
	});

//	console.log(JSON.stringify(dsr, null, 2));
};

var retrieveMetadata = function() {
	var packageTypeMembers = new sforce.Xml("PackageTypeMembers");
	packageTypeMembers.set("name", "ConnectedApp");
	packageTypeMembers.set("members", "*");

	var package = new sforce.Xml("Package");
	package.set("types", packageTypeMembers);
	package.set("version", "29.0");
		
	var retrieveRequest = new sforce.Xml("RetrieveRequest");
	retrieveRequest.set("unpackaged", package);
	var config = {
		sforce:sforce,
		retrieveRequest:retrieveRequest
	};

	var metadata = require("./fdcmetadata").fdcmetadata;
	sforce.debug.trace = true;
	var res = metadata.retrieveMetadata(config)[0];
	config.id = res.id;
    rId = res.id;
    writeKeyValue(SETTINGS, 'rid', rId);
    //console.log("RiD: " + rId);
	//	apiVersion:"29.0",
	//	packageName: "",
	//	singlePackage: true,
	//	specificFiles: ["ConnectedApp"],
	//	unpackaged: package
	//console.log(JSON.stringify(res, null, 2));
};

var rId;

var checkRetrieveStatus = function() {
	readKeyValue(SETTINGS, 'rid', function(data) {
		var config = {
			sforce:sforce
		};
		//console.log("checkRetrieveStatus: " + JSON.stringify(data));
		var metadata = require("./fdcmetadata").fdcmetadata;
		sforce.debug.trace = true;
		config.id = data[0];
		var res = metadata.checkRetrieveStatus(config)[0];
	});
};

var checkStatus = function() {
	readKeyValue(SETTINGS, 'rid', function(data) {
		var config = {
			sforce:sforce
		};
		//console.log("checkStatus: " + JSON.stringify(data));
		var metadata = require("./fdcmetadata").fdcmetadata;
		sforce.debug.trace = true;
		config.id = data[0];
		var res = metadata.checkStatus(config)[0];
		//console.log("Check Status: \n" + JSON.stringify(res, null, 2));
	});
};

var listMetadata = function() {
	sforce.debug.trace = true;
	if (typeof userArgs[1] === 'undefined') {
		console.log("Enter a metadata type to list.");
	} else {
		var metadata = require("./fdcmetadata").fdcmetadata;
		var arg1 = userArgs[1];
		var lmq = new sforce.Xml("ListMetaDataQuery");
		lmq.set("type", arg1);
		var dsr = metadata.listMetadata({
				sforce:sforce, 
				queries:[
					lmq
				]
				, 
				asOfVersion:"29.0"
				
			})[0];
	//	_.each(dsr.metadataObjects, function(mdo) {
	//		console.log(mdo.xmlName);
	//	});

		//console.log(JSON.stringify(dsr, null, 2));
	}
};

var doAddTable = function(args) {
	var ac = config.connData.connections[config.connData.activeConnection];
	if (typeof ac.tables === 'undefined') {
		ac.tables = {};
	}
	ac.tables[args.name] = args.name;
	
	writeFile(CREDS, config.connData);
	console.log('\nTable ' + args.name + ' added to config');
};

var doRemoveTable = function(args) {
	var ac = config.connData.connections[config.connData.activeConnection];
	if (typeof ac.tables === 'undefined') {
		ac.tables = {};
	}
	delete ac.tables[args.name];
	
	writeFile(CREDS, config.connData);
	console.log('\nTable ' + args.name + ' removed from config');
};

var showTablesInProject = function(args) {
	var ac = config.connData.connections[config.connData.activeConnection];
	if (typeof ac.tables === 'undefined') {
		console.log('No tables have been added. Use tables:add to add tables to project');
	} else {
		_.each(ac.tables, function(table) {
			console.log(table);
		});
		console.log('\n');
	}
};

var showTables = function(args) {
	//console.log("showtables");
	loggedin(false);
	var dsr = sforce.connection.describeGlobal();
	//console.log(JSON.stringify(dsr["sobjects"]));
	var Table = require("cli-table");
	var table = new Table({
		head: [
			'API Name', 
			'Label', 
			//'Plural Label', 
			"Rows"
			]
	});
	//console.log(JSON.stringify(dsr["sobjects"], null, 2));

	var tableMap = {};
	_.each(dsr["sobjects"], function(objectDef) {
		if (args.all || objectDef.name[0].indexOf("__c") != -1) {
			tableMap[objectDef.name[0]] = { 
					name:objectDef.name[0], 
					label:objectDef.label[0],
					//labelPlural:objectDef.labelPlural[0], 
					rows:0 
				};
			//table.push([objectDef.name[0], objectDef.label[0], objectDef.labelPlural[0]]);
		}
	});
	//console.log("Got tables");

	for (var key in tableMap) {
		tableMap[key].rows = "na";
		table.push(
			[ 
				tableMap[key].name, 
				tableMap[key].label, 
				tableMap[key].rows 
			]);
	}
	console.log(table.toString());
}

var makeConnectedApp = function(args) {
	//console.log("\n\nArgs: " + JSON.stringify(args));

	var pkg = require("./packaging.js").packaging;
	pkg.cleanUp();
	pkg.makeConnectedApp(args, function(data) {
		sforce.debug.trace = true;

		//console.log(data);
		var config = {
				sforce:sforce
			};
		
		// Temp, just read a working zip
		//var data = fs.readFileSync(process.cwd() + "/unpackaged.zip", {encoding:"base64"});

		var metadata = require("./fdcmetadata").fdcmetadata;
		//sforce.debug.trace = true;
		config.ZipFile = data;
		var result = metadata.deployMetadata(config);	
		//console.log("Result: " + JSON.stringify(result));
		while (result[0].done[0] === "false") {
			config.id = result[0].id[0];
			result = metadata.checkStatus(config);
			//console.log("\n\nResult: " + JSON.stringify(result, null, 2));
		}
		result = metadata.checkDeployStatus(config);
		
		//console.log("Deploy Status: " + "\n" + JSON.stringify(result, null, 2));

		if (result[0].success[0] === "false") {
			console.log(outputColors.red + result[0].messages[0].problem[0] + outputColors.reset);
		} else {
			console.log("Deployment successful.");
			//pkg.cleanUp();
		}

	});

}

var runcommand = function() {
	switch (commandMap[userArgs[0]]) {
		case 1:
			doCreateTable();
			break;
		case 2:
			getFieldSpec();
			break;
		case 3:
			cliTest();
			break;
		case 4:
			showTables();
			break;
		case 5:
			showMetadata();
			break;
		case 6:
			listMetadata();
			break;
		case 7:
			retrieveMetadata();
			break;
		case 8:
			checkRetrieveStatus();
			break;
		case 9:
			checkStatus();
			break;
		default:
			console.log(userArgs[0] + " is not a command I understand.");
	}
}

var cli = require('commander');

cli.command('maketable')
  .version('0.0.1')
  .option('-p, --peppers <p>', 'Add peppers')
  .option('-P, --pineapple', 'Add pineapple')
  .option('-b, --bbq', 'Add bbq sauce')
  .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
  .action(function(env){
  	if (env.peppers) {
  		console.log("got peppers " + env.peppers);
  	} else {
  		console.log("no peppers");
  	}
  	console.log('maketable');
  });

cli.command('connection:add')
  .version('0.0.1')
  .option('-u, --username <u>', 'Username')
  .option('-p, --pwd <p>', 'Password')
  .option('-n, --name <n>', 'Connection name')
  .option('-u, --loginurl [u]', 'Salesforce login url to use' +
  														'\n\t\t\tDefaults to login.salesforce.com' +
  														'\n\t\t\tNOTE: only use host and server')
  .action(function(env){
  	if (env.username) {
  		if (env.pwd) {
  			doLogin(env.username, env.pwd, env.name || env.username);
  		} else {
	  		env.password('Password: ', '*', function(pass) {
  				if (pass.length == 0) {
  					console.log("Password argument is required (-p or --pwd)");
  				} else {
  					doLogin(env.username, pass, env.name || env.username);
  				}
  			});
	  	}
	} else {
		console.log("Username argument is required (-u or --username)");
	}
  });

cli.command('connection:tables')
	.version('0.0.1')
	.option('-a, --all <a>', 'Show all tables', false)
 	.action(function(env){
 		showTablesInProject();
		loggedin(env, showTables);  	
	});

cli.command('connection:list')
  .version('0.0.1')
  .action(function(env){
	doListConnections();  	
  });

cli.command('connection:use')
	.version('0.0.1')
	.option('-n, --name <n>', 'Connecton name to use')
	.action(function(env) {
		if (typeof env.name === 'undefined') {
			console.log('Specify the name of the connection to use (-n or --name)');
		} else {
			doUseConnection(env);
		}
	});

cli.command('connection:remove')
	.version('0.0.1')
	.option('-n, --name <n>', 'Remove connection from project.')
	.action(function(env) {

		if (typeof env.name === 'undefined') {
			console.log("Specify the name of the connection to remove (-n or --name).");
			loggedin(env, doListConnections);
		} else {
			doRemoveConnection(env);
		}
	});

cli.command('connection')
	.version('0.0.1')
	.action(function(env) {
		doActiveConnection();
	});

cli.command('tables:new')
	.option('-n, --name <n>', 'Name of the table')
	.option('-l, --label <l>', 'Label for the table')
	.option('-d, --deploymentStatus <d>', 'Deployment status (deployed or indevelopment)', 'Deployed')
	.option('-D, --description_c <D>', 'Description for the table')
	.option('-f, --enableFeeds', 'Enable feeds on the table data')
	.option('-r, --enableReports', 'Enable reporting on the table')
	.option('-h, --enableHistory', 'Enable data history for the table')
	.action(function(env) {
		console.log("env: " + env);
		for (var i=0;i<env.options.length;i++) {
			var opt = env.options[i].long.substring(2);
			console.log("Opt: " + opt + "=" + env[opt]);
		}
		if (typeof env.name === 'undefined') {
			console.log("The name argument is required to create a table.");
		} else {
			env.name = env.name.replace(/ /g, "_");
			var args = {};
			for (var i=0;i<env.options.length;i++) {
				var opta = env.options[i].long.substring(2);
				var opt;
				if (opta == 'description_c') 
					opt = 'description';
				else 
					opt = opta;
				if (typeof env[opta] !== 'undefined') {
					console.log("Opt: " + opt + "=" + env[opta]);
					args[opt] = env[opta];
				}
			}
			// Validate the default fields
			if (typeof env.deploymentStatus === 'undefined') args["deploymentStatus"] = "deployed";
			/*if (typeof env.enableFeeds === 'undefined') args['enableFeeds'] = false;
			if (typeof env.enableFeeds === 'undefined') args['enableReports'] = false;
			if (typeof env.enableFeeds === 'undefined') args['enableHistory'] = false;*/
			loggedin(args, doCreateTable);
		}
	});

cli.command('tables:list')
	.action(function(env){
		showTablesInProject();
		//loggedin(env, showTables);  	
	});

cli.command('tables:add')
	.option('-n, --name <n>', 'Add existing table to project')
	.action(function(env){
		if (typeof env.name === 'undefined') {
			console.log("Missing required argument 'name'");
		} else {
			loggedin(env, doAddTable);
		}
	});

cli.command('tables:remove')
	.option('-n, --name <n>', 'Remove table from project')
	.action(function(env){
		if (typeof env.name === 'undefined') {
			console.log("Missing required argument 'name'");
		} else {
			loggedin(env, doRemoveTable);
		}
	});

var x = cli.parse(process.argv);


return;

var commandLineArgs = process.argv.slice(2, process.argv.length);
var command = commandLineArgs.shift();

if (typeof command !== 'string') {
//    usage();
    process.exit(1);
}
var argList = require("./argProcessorList").argList;

// Set up the input argument processing / validation.
var argProcessorList = argList.getArgProcessorList(command); //createArgProcessorList();
var commandLineArgsMap;

//console.log("Command: " + command + 
//	"\nprocessorList: " + JSON.stringify(argProcessorList));

commandLineUtils.processArgsInteractive(commandLineArgs, argProcessorList, function (outputArgsMap) {
    commandLineArgsMap = outputArgsMap;
    //console.log("outputArgsMap: " + JSON.stringify(outputArgsMap));
    switch  (command) {
    	case 'makeapp':
    		loggedin(outputArgsMap, makeConnectedApp);
    		break;
        case 'create':
            createApp();
            break;
        case 'showtables':
       		loggedin(outputArgsMap, showTables);
        	break;
        case "createtable":
        	loggedin(outputArgsMap, doCreateTable);
        	break;
        case "deletetable":
        	loggedin(outputArgsMap, doDeleteTable);
        	break;
       	case "login":
       		doLogin(outputArgsMap.username, outputArgsMap.password);
       		break;
        default:
            console.log('Unknown option: \'' + command + '\'.');
            usage(command);
            process.exit(2);
    }
});

function usage(command) {
	switch (command) {
		case "showtables":
			console.log("showtables (--all)");
			break;

	}
}
// -----
// Input argument validation / processing.
// -----

function createArgProcessorList() {
    var argProcessorList = new commandLineUtils.ArgProcessorList();

    // App type
    argProcessorList.addArgProcessor('apptype', 'Enter your application type (native, hybrid_remote, or hybrid_local):', function(appType) {
        appType = appType.trim();
        if (appType !== 'native' && appType !== 'hybrid_remote' && appType !== 'hybrid_local')
            return new commandLineUtils.ArgProcessorOutput(false, 'App type must be native, hybrid_remote, or hybrid_local.');

        return new commandLineUtils.ArgProcessorOutput(true, appType);
    });
    return argProcessorList;

    // App name
    argProcessorList.addArgProcessor('appname', 'Enter your application name:', function(appName) {
        if (appName.trim() === '')
            return new commandLineUtils.ArgProcessorOutput(false, 'Invalid value for app name: \'' + appName + '\'');
        
        return new commandLineUtils.ArgProcessorOutput(true, appName.trim());
    });

    // Target dir
    argProcessorList.addArgProcessor('targetdir', 'Enter the target directory of your app:', function(targetDir) {
        if (targetDir.trim() === '')
            return new commandLineUtils.ArgProcessorOutput(false, 'Invalid value for target dir: \'' + targetDir + '\'');
        
        return new commandLineUtils.ArgProcessorOutput(true, targetDir.trim());
    });

    // Package name
    argProcessorList.addArgProcessor('packagename', 'Enter the package name for your app (com.mycompany.my_app):', function(packageName) {
        if (packageName.trim() === '')
            return new commandLineUtils.ArgProcessorOutput(false, 'Invalid value for package name: \'' + packageName + '\'');

        packageName = packageName.trim();
        var validPackageRegExp = /^[a-z]+[a-z0-9_]*(\.[a-z]+[a-z0-9_]*)*$/;
        if (!validPackageRegExp.test(packageName)) {
            return new commandLineUtils.ArgProcessorOutput(false, '\'' + packageName + '\' is not a valid Java package name.');
        }
        
        return new commandLineUtils.ArgProcessorOutput(true, packageName);
    });

    // Apex page
    argProcessorList.addArgProcessor(
        'apexpage',
        'Enter the Apex page for your app (only applicable for hybrid_remote apps):',
        function(apexPage, argsMap) {
            if (argsMap && argsMap.apptype === 'hybrid_remote') {
                if (apexPage.trim() === '')
                    return new commandLineUtils.ArgProcessorOutput(false, 'Invalid value for Apex page: \'' + apexPage + '\'');

                return new commandLineUtils.ArgProcessorOutput(true, apexPage.trim());
            }

            // Unset any value here, as it doesn't apply for non-remote apps.
            return new commandLineUtils.ArgProcessorOutput(true, undefined);
        },
        function (argsMap) {
            return (argsMap['apptype'] === 'hybrid_remote');
        }
    );

    // Use SmartStore
    argProcessorList.addArgProcessor('usesmartstore', 'Do you want to use SmartStore in your app? [yes/NO] (\'No\' by default)', function(useSmartStore) {
        var boolUseSmartStore = (useSmartStore.trim().toLowerCase() === 'yes');
        return new commandLineUtils.ArgProcessorOutput(true, boolUseSmartStore);
    });

    return argProcessorList;
}