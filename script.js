let quadrant1 = document.querySelector('.quadrant-1'),
	quadrant2 = document.querySelector('.quadrant-2'),
	quadrant3 = document.querySelector('.quadrant-3'),
	quadrant4 = document.querySelector('.quadrant-4'),
	quadrantTasks = Array.from(document.querySelectorAll('.quadrant-tasks')),
	addIcons = Array.from(document.querySelectorAll('.add-icon')),
	closeIcons = Array.from(document.querySelectorAll('.cancel-task')),
	inputFields = Array.from(document.getElementsByTagName('input')),
	inputContainers = Array.from(document.querySelectorAll('.input-container')),
	tasks = Array.from(document.querySelectorAll('.quadrant-tasks div'));

let dragSourceParentElement,
	dragSourceElement,
	backgroundColorsOriginal = [ '#ffd9984a', '#c1ffc54e', '#a8b7ff2a', '#ffa7a62d' ],
	backgroundColorsHover = [ '#ffd99885', '#c1ffc585', '#8e9ff37d', '#ffa7a65c', '#ee505a' ];
//each key for each quadrant, value is array of tasks
let tasksObj = {};

// FUNCTIONS
function toggleInput(i) {
	addIcons[i].classList.toggle('hide');
	inputContainers[i].classList.toggle('show');
	inputFields[i].focus();
}

function addTask(elem) {
	let input = elem.parentElement.previousElementSibling.firstElementChild.value;
	let i = parseInt(elem.getAttribute('data-num'));
	if (input != '') {
		let taskElement = `<div draggable="true" contenteditable="true">${input}</div>`;
		quadrantTasks[i].insertAdjacentHTML('beforeend', taskElement);

		elem.parentElement.previousElementSibling.firstElementChild.value = '';
		closeIcons[i].click();

		//reset tasks
		tasks = Array.from(document.querySelectorAll('.quadrant-tasks div'));

		//add event listener again
		tasks.forEach((task) => {
			task.addEventListener('dragstart', handleDragStart);
			task.addEventListener('dragend', handleDragEnd);
		});

		saveToTasksObj(i + 1, input);
	}
}

function handleDragStart(e) {
	dragSourceElement = this;
	dragSourceParentElement = this.parentElement.parentElement;

	this.style.opacity = 0.2;

	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/html', this.innerText);
}

function handleDragEnd(e) {
	this.style.opacity = 1;
}

function handleDragEnter(e) {
	if (dragSourceParentElement == this) return;

	changeBackgroundColor(this, parseInt(this.getAttribute('data-num')), backgroundColorsHover);
}

function handleDragLeave(e) {
	if (this.classList.contains('header-container')) {
		this.style.background = '#fff';
		return;
	}
	changeBackgroundColor(this, parseInt(this.getAttribute('data-num')), backgroundColorsOriginal);
}

function handleDragOver(e) {
	if (dragSourceParentElement != this) e.preventDefault();
}

function handleDrop(e) {
	if (dragSourceParentElement == this) return;

	//remove dragged element
	dragSourceElement.remove();

	if (!this.classList.contains('header-container')) {
		//insert in new parent
		let taskElement = `<div draggable="true" contenteditable="true">${e.dataTransfer.getData('text/html')}</div>`;
		this.children[1].insertAdjacentHTML('beforeend', taskElement);

		changeBackgroundColor(this, parseInt(this.getAttribute('data-num')), backgroundColorsOriginal);

		//update tasksObj
		updateTasksObj(
			parseInt(dragSourceParentElement.getAttribute('data-num')) + 1,
			parseInt(this.getAttribute('data-num')) + 1,
			e.dataTransfer.getData('text/html')
		);
	} else {
		this.style.background = '#fff';
		//delete from tasksObj
		updateTasksObj(
			parseInt(dragSourceParentElement.getAttribute('data-num')) + 1,
			null,
			e.dataTransfer.getData('text/html')
		);
	}

	//reset tasks
	tasks = Array.from(document.querySelectorAll('.quadrant-tasks div'));

	//add event listener again
	tasks.forEach((task) => {
		task.addEventListener('dragstart', handleDragStart);
		task.addEventListener('dragend', handleDragEnd);
		task.addEventListener('input', handleTaskEdit);
	});
}

function changeBackgroundColor(elem, i, colors) {
	elem.style.background = colors[i];
}

//i = idx, tells which quadrant
function saveToTasksObj(i, taskInput) {
	let temp = [];

	if (tasksObj[`quadrant-${i}`] == undefined) {
		temp.push(taskInput);
		tasksObj[`quadrant-${i}`] = temp;
	} else tasksObj[`quadrant-${i}`].push(taskInput);

	updateLS(tasksObj);
}

function updateTasksObj(parentQuadrant, currentQuadrant, taskInput) {
	//remove from previous quadrant
	tasksObj[`quadrant-${parentQuadrant}`] = tasksObj[`quadrant-${parentQuadrant}`].filter((task) => task != taskInput);

	if (currentQuadrant == null) {
		updateLS(tasksObj);
		return;
	}

	//else insert into new quadrant if moved
	saveToTasksObj(currentQuadrant, taskInput);
}

function editTasksObj(parentQuadrant, position, newValue) {
	if (newValue == '')
		tasksObj[`quadrant-${parentQuadrant}`] = tasksObj[`quadrant-${parentQuadrant}`].filter(
			(task, idx) => idx != position
		);
	else tasksObj[`quadrant-${parentQuadrant}`][position] = newValue;
	updateLS(tasksObj);
}

function updateLS(tasksObj) {
	localStorage.setItem('tasksObj', JSON.stringify(tasksObj));
}

function getFromLS() {
	if (localStorage.getItem('tasksObj')) {
		tasksObj = JSON.parse(localStorage.getItem('tasksObj'));
		buildTasks(tasksObj);
		return;
	}
	tasksObj = {};
}

function buildTasks(tasksObj) {
	let taskElements;
	for (let [ quadrant, tasks ] of Object.entries(tasksObj)) {
		taskElements = '';
		tasks.forEach((task) => {
			taskElements += `<div draggable="true" contenteditable="true">${task}</div>`;
		});
		quadrantTasks[parseInt(quadrant.slice(-1)) - 1].insertAdjacentHTML('beforeend', taskElements);
	}

	//reset tasks
	tasks = Array.from(document.querySelectorAll('.quadrant-tasks div'));

	//add event listener again
	tasks.forEach((task) => {
		task.addEventListener('dragstart', handleDragStart);
		task.addEventListener('dragend', handleDragEnd);
		task.addEventListener('input', handleTaskEdit);
	});
}

function handleTaskEdit(e) {
	let parentQuadrant = parseInt(e.target.parentElement.parentElement.getAttribute('data-num'));

	let position;
	Array.from(quadrantTasks[parentQuadrant].children).forEach((child, pos) => {
		if (e.target.innerText == child.innerText) {
			position = pos;
			return;
		}
	});

	editTasksObj(parentQuadrant + 1, position, e.target.innerText);

	if (e.target.innerText == '') e.target.remove();

	editTasksObj;
}

// EVENTS
window.onload = () => {
	getFromLS();
};

//generalise later
quadrant1.addEventListener('dragenter', handleDragEnter);
quadrant1.addEventListener('dragover', handleDragOver);
quadrant1.addEventListener('dragleave', handleDragLeave);
quadrant1.addEventListener('drop', handleDrop);

quadrant2.addEventListener('dragenter', handleDragEnter);
quadrant2.addEventListener('dragover', handleDragOver);
quadrant2.addEventListener('dragleave', handleDragLeave);
quadrant2.addEventListener('drop', handleDrop);

quadrant3.addEventListener('dragenter', handleDragEnter);
quadrant3.addEventListener('dragover', handleDragOver);
quadrant3.addEventListener('dragleave', handleDragLeave);
quadrant3.addEventListener('drop', handleDrop);

quadrant4.addEventListener('dragenter', handleDragEnter);
quadrant4.addEventListener('dragover', handleDragOver);
quadrant4.addEventListener('dragleave', handleDragLeave);
quadrant4.addEventListener('drop', handleDrop);

// NOTE: dragenter used to change bg instead of dragover to avoid continuous rendering

document.querySelector('.header-container').addEventListener('dragenter', handleDragEnter);
document.querySelector('.header-container').addEventListener('dragover', handleDragOver);
document.querySelector('.header-container').addEventListener('dragleave', handleDragLeave);
document.querySelector('.header-container').addEventListener('drop', handleDrop);

// enter to submit new task
// escape to close
