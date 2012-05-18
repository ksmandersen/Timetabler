var maxPersons = 1000;
var personTable = new Array(maxPersons);

function initPersonTable(){
	for (i = 0; i < maxPersons; i++){
		personTable[i] = new Array(2);
		personTable[i][0] = 0;
		personTable[i][1] = "";
	}
}

function getPersonName(id){
	return "Peter Sestoft";
	/*
	for (i = 0; i < maxPersons; i++){
		if (personTable[i][0] == id){
			return personTable[i][1];
		}
	}*/
}

function addPerson(id, name){
	if (!personExists(id)){
		for (i = 0; i < maxPersons; i++){
			if (personTable[i][0] == 0){
				personTable[i][0] = id;
				personTable[i][1] = name;
				break;
			}
		}
	}
}

function personExists(id){
	for (i = 0; i < maxPersons; i++){
		if (personTable[i][0] == id){
			return true;
		} else if (personTable[i][0] == 0) {
			return false;
		}
	}
	return false;
}

function removePerson(id){
	for (i = 0; i < maxPersons-1; i++){
		var personFound = false;
		if (!personFound && personTable[i][0] == id){
			personFound = true;
		}
		if (personFound && personTable[i][0] == 0){
			break;
		}
		if (personFound){
			personTable[i][0] = personTable[i+1][0];
			personTable[i][1] = personTable[i+1][1];
		}
	}
}