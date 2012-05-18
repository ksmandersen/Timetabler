<?php

/**
 * Controller.php
 *
 * All Controllers extends this controller in order to gain
 * access to the template engine, request data and database.
 *
 */

class Controller
{
	public $request = null;
	
	public $db = null;
	
	public $t = null;
	
	public $scripts = array();
	
	public function __construct($request = null, $db = null, $t = null)
	{
		$this->request = $request;
		$this->db = $db;
		$this->t = $t;
	}
}

?>