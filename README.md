# SQL-Inventory-App

-- A Node.js application for manupilating a mySQL product inventory database

--Installation
- Using your terminal, navigate to the directory containing those files
- Enter "npm install" into the terminal to install dependencies
- Start up your MAMP
- Enter "node bamazonCustomer" into the terminal to run the Customer Application
- Enter "node bamazonManager" into the terminal to run the Manager Application

-- bamazonCustomer.js  -- Execute this application first
This application first prompts the user for their localhost credentials. After successful connection,
it then checks to see if a "bamazon" database exists on the server. If it does not, the database is
created, and rows of product data are inserted. If it already exists or after creation, then a
connection is made to the database.

Next, all data in the database is displayed in the terminal with prettified formatting thanks to the
npm table-json package. The user is then asked if they would like to purchase an item. If not, then
the database connection ends. If so, the user is prompted to enter which item and quantity they would
like to buy. All inputs are validated so that only numbers or strings may be entered as appropriate.

-- bamazonManager.js  -- Execute this application second
"bamazonManager" can only be run once the "bamazon" database exists on localhost. If you do not have
a "bamazon" database, you will need to launch "bamazonCustomer" as instructed above first. This step
need only be performed once.

This program allows the user to perform a number of advanced functions in addition to viewing the
current product inventory. They can view items with less than Qty(5) in stock. They can add stock
to existing inventory items, or add new products to the inventory. At each stage, inputs are
validated, and the appropriate changes are made to the mySQL database to reflect the inputs.
