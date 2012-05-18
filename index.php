<?php

/**
 * index.php
 *
 * This is the entry point for the server script. All requests
 * made to the domain will be redirected to this file by the
 * rewrite rules in .htaccess unless the URI is of an existing
 * file.
 *
 * This file will load all necessary resources needed for the site
 * to function like: Routing, DBMS driver, templating engine and
 * MVC controlller.
 *
 * The controller will instantiated and a proper a ction will be 
 * invoked based upon the inferred controller name and action
 * name from the request URI.
 *
 */

// Include libraries, and etc.
require_once 'lib/router.php';
require_once 'lib/db.php';
require_once 'lib/twig/lib/Twig/AutoLoader.php';
require_once 'lib/Controller.php';

// Register the template engine auto loader
Twig_Autoloader::register();

// Set the default timezone to Copenhagen
date_default_timezone_set("Europe/Copenhagen");

// Initialize the routing library
$router = new Router();
$router->default_routes();
// Default page is index of plans
$router->map('/', array('controller' => 'plans', 'action' => 'index'));
$router->execute();


// Catch any exception thrown while trying to display
// the page and give a 404.
try
{
	// Infer the controller name from the route
	$file = 'app/Controllers/' . $router->controller_name . 'Controller.php';
	if (!file_exists($file))
		throw new Exception();
		
	// Infer the action on the controller from the route
	if (in_array(!$router->action, array('index', 'view', 'edit', 'add', 'delete', 'save')))
		throw new Exception();
		
	require_once $file;
	
	// Instantiate the controller
	$class_name = $router->controller_name . "Controller";
	$controller = new $class_name;
	$is_jsview = ($router->controller == "plans" and $router->action == "view") ? true : false;
	
	# Set up the PDO database connection
	$db = new db("mysql:host=localhost;dbname=lokale_itu_dk;", "lokale_itu_dk", "JJ52nI>:XT~Y4lOdOdQE", array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
	$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	$db->exec("SET CHARACTER SET utf8");
	
	# Set up Twig
	$loader = new Twig_Loader_Filesystem("app/Views");
	$twig = new Twig_Environment($loader);
	$twig->getExtension('core')->setDateFormat('d/m/Y', '%d days');
	$twig->getExtension('core')->setTimezone('Europe/Copenhagen');
	
	# Prepare controller
	$controller->request = array(
		"action"	=> $router->action,
		"isAjax"	=> (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest'),
		"isPost"	=> ($_SERVER['REQUEST_METHOD'] == "POST"),
		"isGet"		=> ($_SERVER['REQUEST_METHOD'] == "GET"),
		"data"		=> $_POST,
	);
	
	$controller->db = $db;
	$controller->t = $twig;
	
	# Output header
	if(!$controller->request['isAjax'])
		echo $twig->render("Layout/header.html", array("is_jsview" => $is_jsview));
	
	// If the route had a variable then pass it the action when called
	$params = ($router->id != null) ? array($router->id) : array();
	
	// Call the action on the controller with any variables
	call_user_func_array(array($controller,$router->action), $params);
	
	# Output footer
	if(!$controller->request['isAjax'])
		echo $twig->render("Layout/footer.html", array("scripts" => $controller->scripts));
}
catch(Exception $e)
{
	echo $e;
	die("Page not found");
}


?>