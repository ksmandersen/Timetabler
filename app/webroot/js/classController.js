var maxClasses = 1000;
var classTable = new Array(maxClasses);

function initClassTable(){
	for (i = 0; i < maxClasses; i++){
		classTable[i] = new Array(2);
		classTable[i][0] = 0;
		classTable[i][1] = "";
	}
}

function getClassName(id){
	return "BSWU12";
	/*
	for (i = 0; i < maxClasses; i++){
		if (ClassTable[i][0] == id){
			return ClassTable[i][1];
		}
	}*/
}

function addClass(id, name){
	if (!classExists(id)){
		for (i = 0; i < maxClasses; i++){
			if (classTable[i][0] == 0){
				classTable[i][0] = id;
				classTable[i][1] = name;
				break;
			}
		}
	}
}

function classExists(id){
	for (i = 0; i < maxClasses; i++){
		if (classTable[i][0] == id){
			return true;
		} else if (classTable[i][0] == 0) {
			return false;
		}
	}
	return false;
}

function removeClass(id){
	for (i = 0; i < maxClasses-1; i++){
		var classFound = false;
		if (!classFound && classTable[i][0] == id){
			classFound = true;
		}
		if (classFound && classTable[i][0] == 0){
			break;
		}
		if (classFound){
			classTable[i][0] = classTable[i+1][0];
			classTable[i][1] = classTable[i+1][1];
		}
	}
}