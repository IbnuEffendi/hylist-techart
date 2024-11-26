document.addEventListener('DOMContentLoaded', () => {
    // Load tasks from localStorage
    loadTasks();

    // Add task
    document.querySelector('.todo-button').addEventListener('click', (event) => {
        event.preventDefault();
        addTask();
    });

    // Set default date and time
    setDefaultDateTime();

    // Filter tasks
    document.querySelector('.filter-todo').addEventListener('change', filterTasks);
    document.querySelector('.search').addEventListener('input', filterTasks);
    document.querySelector('.sort').addEventListener('change', sortTasks);
});

function setDefaultDateTime() {
    const now = new Date();
    const dateInput = document.querySelector('.todo-date');
    const timeInput = document.querySelector('.todo-time');

    // Format the date as YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;

    // Format the time as HH:MM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
}

function addTask() {
    const taskInput = document.querySelector('.todo-task');
    const timeInput = document.querySelector('.todo-time');
    const dateInput = document.querySelector('.todo-date');
    const priorityInput = document.querySelector('.todo-priority');
    
    if (taskInput.value.trim() === '') return;

    const task = {
        id: Date.now(),
        title: taskInput.value,
        time: timeInput.value,
        date: dateInput.value,
        priority: priorityInput.value,
        status: 'not_started'
    };

    const tasks = getTasksFromStorage();
    tasks.push(task);
    saveTasksToStorage(tasks);
    displayTask(task);

    taskInput.value = '';
    timeInput.value = '';
    dateInput.value = '';
    priorityInput.value = 'normal';

    // Set default date and time again
    setDefaultDateTime();
}

function displayTask(task) {
    const taskList = document.querySelector('.todo-list');
    const now = new Date();
    const taskDate = new Date(task.date + 'T' + task.time);
    const isOverdue = taskDate < now && task.status !== 'completed';

    const taskItem = document.createElement('li');
    taskItem.className = `task-item ${task.status} ${isOverdue ? 'overdue' : ''}`;
    taskItem.dataset.id = task.id;

    const taskLeft = document.createElement('div');
    taskLeft.className = 'task-left';

    const statusDropdown = document.createElement('select');
    statusDropdown.className = `task-status ${task.status}`;
    statusDropdown.innerHTML = `
        <option value="not_started" ${task.status === 'not_started' ? 'selected' : ''}>&#x25CB;</option>
        <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>&#x25D4;</option>
        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>&#x2714;</option>
    `;
    statusDropdown.addEventListener('change', updateTaskStatus);

    taskLeft.appendChild(statusDropdown);

    const taskRight = document.createElement('div');
    taskRight.className = 'task-right';
    taskRight.innerHTML = `
        <span class="task-title">${task.title}</span>
        <div class="task-details">
            <span class="task-time"><i class="bi bi-clock"></i> ${task.time}</span>
            <span class="task-date"><i class="bi bi-calendar"></i> ${task.date}</span>
            <span class="task-priority"><i class="bi bi-flag"></i> ${formatPriority(task.priority)}</span>
        </div>
    `;

    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';
    taskActions.innerHTML = `
        <button class="edit-task"><i class="bi bi-pencil"></i></button>
        <button class="delete-task"><i class="bi bi-trash"></i></button>
    `;

    taskItem.appendChild(taskLeft);
    taskItem.appendChild(taskRight);
    taskItem.appendChild(taskActions);

    taskList.appendChild(taskItem);

    taskActions.querySelector('.edit-task').addEventListener('click', editTask);
    taskActions.querySelector('.delete-task').addEventListener('click', (event) => {
        deleteTask(event, taskItem);
    });
}

function formatPriority(priority) {
    return priority.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function updateTaskStatus(event) {
    const taskItem = event.target.closest('.task-item');
    const taskId = taskItem.dataset.id;
    const tasks = getTasksFromStorage();
    const task = tasks.find(t => t.id == taskId);
    task.status = event.target.value;
    saveTasksToStorage(tasks);

    taskItem.className = `task-item ${task.status}`;
    taskItem.querySelector('.task-left').classList.add('highlight'); // Tambahkan kelas highlight untuk animasi

    if (task.status === 'completed') {
        taskItem.classList.remove('overdue');
    } else {
        const now = new Date();
        const taskDate = new Date(task.date + 'T' + task.time);
        if (taskDate < now) {
            taskItem.classList.add('overdue');
        } else {
            taskItem.classList.remove('overdue');
        }
    }
    event.target.className = `task-status ${task.status}`;
}

function editTask(event) {
    const taskItem = event.target.closest('.task-item');
    const taskId = taskItem.dataset.id;
    const tasks = getTasksFromStorage();
    const task = tasks.find(t => t.id == taskId);

    document.querySelector('.todo-task').value = task.title;
    document.querySelector('.todo-time').value = task.time;
    document.querySelector('.todo-date').value = task.date;
    document.querySelector('.todo-priority').value = task.priority;

    deleteTaskById(taskId);
}

function deleteTask(event, taskItem) {
    const taskId = taskItem.dataset.id;
    taskItem.classList.add('fade-out'); // Tambahkan kelas fade-out untuk animasi
    taskItem.addEventListener('animationend', () => {
        deleteTaskById(taskId);
    });
}

function deleteTaskById(taskId) {
    const tasks = getTasksFromStorage().filter(t => t.id != taskId);
    saveTasksToStorage(tasks);
    document.querySelector(`.task-item[data-id="${taskId}"]`).remove();
}

function filterTasks() {
    const searchValue = document.querySelector('.search').value.toLowerCase();
    const filterValue = document.querySelector('.filter-todo').value.toLowerCase();
    const tasks = document.querySelectorAll('.task-item');

    tasks.forEach(task => {
        const title = task.querySelector('.task-title').textContent.toLowerCase();
        const priority = task.querySelector('.task-priority').textContent.toLowerCase().replace(/\s/g, '_');
        const status = task.querySelector('.task-status').value;
        const matchesSearch = title.includes(searchValue);
        const matchesFilter = filterValue === 'all' || priority.includes(filterValue) || status === filterValue;
        task.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
}

function sortTasks() {
    const sortValue = document.querySelector('.sort').value;
    const taskList = document.querySelector('.todo-list');
    const tasks = Array.from(taskList.children);

    tasks.sort((a, b) => {
        const getValue = (task, key) => task.querySelector(`.task-${key}`).textContent;
        switch (sortValue) {
            case 'time':
                return getValue(a, 'time').localeCompare(getValue(b, 'time'));
            case 'abjad':
                return getValue(a, 'title').localeCompare(getValue(b, 'title'));
            case 'priority':
                return getValue(a, 'priority').localeCompare(getValue(b, 'priority'));
            case 'status':
                return getValue(a, 'status').localeCompare(getValue(b, 'status'));
            default:
                return 0;
        }
    });

    tasks.forEach(task => taskList.appendChild(task));
}

function getTasksFromStorage() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
}

function saveTasksToStorage(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const tasks = getTasksFromStorage();
    tasks.forEach(displayTask);
}
