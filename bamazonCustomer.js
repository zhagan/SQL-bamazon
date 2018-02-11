var mysql = require("mysql");
var inquirer = require('inquirer');
var json_tb = require('json-table');

var connection = {}; //global variable so I don't have to pass it around

getCredentials();

// prompts user for localhost credentials instead
// of saving in this file and revealing passwords
function getCredentials() {

	inquirer.prompt([
		{
			name: 'mySQLPort',
			type: 'input',
			message: 'What port do you use to connect to mySQL@localhost?',
			default: '8889',
			validate: function(input) {
				pattern = '^[0-9]+$';
				isValid = input.match(pattern);

				if(isValid) {
					return true;
				}

				else {
					return 'Invalid input. Enter an integer port number.';
				}
			}
		},
		{
			name: 'mySQLUser',
			type: 'input',
			message: 'What is your mySQL@localhost username?',
			default: 'root'
		},
		{
			name: 'mySQLPass',
			type: 'password',
			message: 'What is your mySQL@localhost password?',
			default: ''
		}
	])

	.then(function(answers) {
		connection = mysql.createConnection(
			{
				host: 'localhost',
				port: answers.mySQLPort,
				user: answers.mySQLUser,
				password: answers.mySQLPass
			}
		);

		connection.connect(function(err) {
			if (err) throw err;

			console.log("connected as id " + connection.threadId);

			checkIfDB();
		});
	});
}

// checks to see if database already exists

function checkIfDB() {
	
	connection.query(
		'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = "bamazon"',

		function (err, res) {
			if (err) throw err;

			if (!res[0]) {
				createDB();
			}

			else {
				displayInventory();
			}
		}
	);
}

// creates database and table if it does not exist
// I know this isn't standard practice, but CONVENTIONS BE DARNED!

function createDB() {
  console.log('Creating store database...');

  connection.query(
		'CREATE DATABASE IF NOT EXISTS bamazon',

		function (err, res) {
			if (err) throw err;
		}
	);

	useDatabase();

	connection.query(
		'CREATE TABLE IF NOT EXISTS products (' +
		  'item_id INT NOT NULL AUTO_INCREMENT,' +
		  'product_name VARCHAR(32) NOT NULL,' +
 		  'department_name VARCHAR(32) NOT NULL,' +
 		  'price DEC(10,2) NOT NULL DEFAULT 0,' +
 		  'stock_quantity INT(10) DEFAULT 0,' +
		 'PRIMARY KEY (item_id)' +
	  ')',

		function (err, res) {
			if (err) throw err;
		}
	);

	var values = [
		['apples', 'produce', 0.50, 25],
		['bananas', 'produce', 0.25, 48],
		['Doritos chips', 'snacks', 1.99, 18],
		['tortilla chips', 'snacks', 1.29, 20],
		['salsa', 'snacks', 1.89, 25],
		['beef filet mignon', 'meats', 15.00, 10],
		['chicken wing', 'meats', 0.59, 50],
		['milk', 'dairy', 1.68, 30],
		['parmesean cheese', 'dairy', 2.00, 22],
		['pork loin', 'meat', 8.95, 14],
		['Amy\'s pizza', 'frozen', 9.15, 4],
		['peas', 'frozen', 2.05, 30]
	];

	connection.query(
		'INSERT INTO products ' +
		'(product_name, department_name, price, stock_quantity) ' +
		'VALUES ?', [values],

		function (err, res) {
			if (err) throw err;
		}
	);

	displayInventory();
}

function useDatabase() {
  connection.query(
		'USE bamazon',

		function (err, res) {
			if (err) throw err;
		}
	);
}

function displayInventory() {
	console.log('\n- - - ~~~ Bamazon Store Inventory ~~~ - - -\n');

	useDatabase();

	connection.query(
		'SELECT item_id, product_name, department_name, price, stock_quantity FROM products',
		function (err, res) {
			if (err) throw err;

			if (res) {

				//prints JSON object into a table using npm json-table

				var json_tb_out = new json_tb(res, {
					chars: {
            'top': '═' , 'top-mid': '╤' , 'top-left': '╔' ,
            'top-right': '╗', 'bottom': '═' , 'bottom-mid': '╧' ,
            'bottom-left': '╚' , 'bottom-right': '╝', 'left': '║' ,
            'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼',
            'right': '║' , 'right-mid': '╢' , 'middle': '│'
					}
				},

				function(table) {
					table.show();
					confirmPurchase();
				});
			}
		}
	);
}

function confirmPurchase() {

	inquirer.prompt(
		{
			name: 'confirm',
			type: 'confirm',
			message: 'Would you like to make a purchase?',
			default: 'true'
		}
	)
	.then(function(answers) {
		if (answers.confirm) {
			purchasePrompt();
		}

		else {
			console.log('\nThank you for using the store. Goodbye.\n');
			connection.end();
		}
	});
}

function purchasePrompt() {
	inquirer.prompt([
		{
			name: 'id',
			type: 'input',
			message: 'Which item_id would you like to buy?',
			validate: function(input) {
				pattern = '^[0-9]+$';
				isValid = input.match(pattern);

				if(isValid) {
					return true;
				}

				else {
					return 'Invalid input. Enter an integer item_id.';
				}
			}
		},
		{
			name: 'qty',
			type: 'input',
			message: 'What quantity of that item would you like to buy?',
			validate: function(input) {
				pattern = '^[0-9]+$';
				isValid = input.match(pattern);

				if(isValid) {
					return true;
				}

				else {
					return 'Invalid input. Enter an integer quantity.';
				}
			}
		}
	])

	.then(function checkStock(answers) {
		var buyQty = Number(answers.qty);
		var id = Number(answers.id);

		connection.query(
			'SELECT * FROM products WHERE ?',
			{item_id: id},

			function(err, res) {
				if (err) throw err;

				if (res[0]) {
					var stockQty = res[0].stock_quantity;

					if (buyQty > stockQty) {
						console.log(
							'\nThe store does not have ' +
							buyQty + ' of item_id ' + id +
							'. Please revise your selection.\n'
						);
						purchasePrompt();
					}

					else {
						purchase(buyQty, res[0]);
					}
				}

				else {
					console.log('\nThat item_id does not exist yet, try another.\n');
					purchasePrompt();
				}
			}
		);
	});
}

function purchase(buyQty, itemData) {
	var id = itemData.item_id;
	var price = itemData.price;
	var stockQty = itemData.stock_quantity;
	var newStockQty = stockQty - buyQty;
	var cost = (price * buyQty).toFixed(2);

	connection.query(
		'UPDATE products SET ? WHERE ?',
		[{
			stock_quantity: newStockQty
		},
		{
      item_id: id
		}],
		function(err, res) {
			if (err) throw err;

			else {
				console.log(
				  '\nPurchase complete for Qty(' +
				  buyQty + ') of item_id ' + id +
				  ' at a total cost of $' + cost + '.\n'
				);

				setTimeout(displayInventory, 5000);
			}
		}
	);
}
