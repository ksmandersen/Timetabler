var maxCourses = 1000;
var courseTable = new Array(maxCourses);

function initCourseTable(){
	for (i = 0; i < maxCourses; i++){
		courseTable[i] = new Array(2);
		courseTable[i][0] = 0;
		courseTable[i][1] = "";
	}
}

function getCourseName(id){
	return "BDSA";
	/*
	for (i = 0; i < maxCourses; i++){
		if (courseTable[i][0] == id){
			return courseTable[i][1];
		}
	}*/
}

function addCourse(id, name){
	if (!courseExists(id)){
		for (i = 0; i < maxCourses; i++){
			if (courseTable[i][0] == 0){
				courseTable[i][0] = id;
				courseTable[i][1] = name;
				break;
			}
		}
	}
}

function courseExists(id){
	for (i = 0; i < maxCourses; i++){
		if (courseTable[i][0] == id){
			return true;
		} else if (courseTable[i][0] == 0) {
			return false;
		}
	}
	return false;
}

function removeCourse(id){
	for (i = 0; i < maxCourses-1; i++){
		var courseFound = false;
		if (!courseFound && courseTable[i][0] == id){
			courseFound = true;
		}
		if (courseFound && courseTable[i][0] == 0){
			break;
		}
		if (courseFound){
			courseTable[i][0] = courseTable[i+1][0];
			courseTable[i][1] = courseTable[i+1][1];
		}
	}
}