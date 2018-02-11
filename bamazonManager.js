var mysql = require("mysql");
var inquirer = require('inquirer');
var json_tb = require('json-table');

var connection = {}; //global variable so I don't have to pass it around

getCredentials();

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
      selectAction();
		});
	});
}

// I skipped the checking for and creating the database here
// It should already be created from running bamazonCustomer.js

function selectAction() {
  inquirer.prompt(
    {
      name: 'action',
      type: 'list',
      message: 'What would you like to do?',
      default: 'View Products for Sale',
      choices: [
        'View Products for Sale',
        'View Low Inventory Products',
        'Re-Stock Inventory',
        'Add New Product to Inventory',
        'Exit the Store'
      ]
    }
  )

  .then(function(answers) {

    if (answers.action === 'View Products for Sale') {
      displayInventory();
    }

    else if (answers.action === 'View Low Inventory Products') {
      displayLowInventory();
    }

    else if (answers.action === 'Re-Stock Inventory') {
      restockInventory();
    }

    else if (answers.action === 'Add New Product to Inventory') {
      addNewProduct();
    }

    else if (answers.action === 'Exit the Store') {
      console.log('\nThank you for vising the store. Goodbye.\n')
      connection.end();
    }
  });
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
	console.log('\n- - -~~~ Bamazon Store Inventory ~~~ - - -\n');

	useDatabase();

	connection.query(
    'SELECT * FROM products',

		function (err, res) {
      if (err) throw err;

      if (res) {

        //prints JSON object into a table
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
				});
      }

      selectAction();
		}
	);
}

function displayLowInventory() {
	console.log('\n- - -~~~ Bamazon Store: Low-Inventory Items ~~~ - - -\n');

	useDatabase();

	connection.query(
    'SELECT * FROM products WHERE stock_quantity < 5',

    function (err, res) {
      if (err) throw err;

      if (res) {

				//prints JSON object into a table
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
				});
      }

      selectAction();
		}
	);
}

function restockInventory() {
  inquirer.prompt([
    {
      name: 'id',
      type: 'input',
      message: 'Which item_id would you like to re-stock?',
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
      message: 'What quantity of that item would you like to add to inventory?',
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

  .then(function restock(answers) {
    var restockQty = Number(answers.qty);
    var id = Number(answers.id);
    console.log(typeof id);

    useDatabase();

    connection.query(
      'SELECT * FROM products WHERE ?',
      {item_id: id},
      function(err, res) {

        if (err) throw err;

        if (res[0]) {
          var stockQty = res[0].stock_quantity;
          var newStockQty = stockQty + restockQty;

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
                  '\nRestock complete. Increased inventory of item_id ' +
                  id +  ' from Qty(' + stockQty + ') to Qty(' + newStockQty + ').\n'
                );

                setTimeout(selectAction, 5000);
              }
            }
          );
        }

        else {
          console.log('\nThat item_id does not exist yet, try another.\n');

          restockInventory();
        }
      }
    );
  });
}

function addNewProduct() {

	inquirer.prompt([
    {
      name: 'name',
      type: 'input',
      message: 'What is the name of the item you would like to add?',
      validate: function(input) {

        pattern = '^[a-zA-Z ]+$';
        isValid = input.match(pattern);

        if(isValid) {
          return true;
        }

        else {
          return 'Invalid input. Enter only letter characters and spaces.';
        }
      }
    },
    {
      name: 'department',
      type: 'list',
      message: 'In which department does that item belong?',
      choices: [
        'dairy',
        'meat',
        'produce',
        'snacks'
      ]
    },
    {
      name: 'price',
      type: 'input',
      message: 'What is the unit price of the item in dollars?',
      validate: function(input) {

        pattern = '^[0-9]+(\.[0-9][0-9])?$';
        isValid = input.match(pattern);

        if(isValid) {
          return true;
        }

        else {
          return 'Invalid input. Enter only decimal numbers with up to two decimal places.';
        }
      }
    },
    {
      name: 'qty',
      type: 'input',
      message: 'What quantity of that item would you like to add?',
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
    },
  ])

  .then(function(answers) {
    var name = answers.name;
    var department = answers.department;
    var price = Number(answers.price);
    var qty = Number(answers.qty);
    var values = [[name, department, price, qty]];

    useDatabase();

    connection.query(
      'INSERT INTO products ' +
      '(product_name, department_name, price, stock_quantity) ' +
      'VALUES ?', [values],

      function (err, res) {
        if (err) throw err;

        if (res) {
          console.log('\nQty(' + qty + ') ' + name + ' added.\n');

          setTimeout(selectAction, 5000);
        }
      }
    );
  });
}
