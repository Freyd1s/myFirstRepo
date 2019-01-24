function InterfaceComponent () {            // класс: элемент интерфейса
    this._element = null;
    let rendered = false;

    this.renderFunction = null;

    this.render = function () {             //метод прорисовки, запускаем только когда потребуется отобразить элемент
        if (!rendered) {
            rendered = true;
            this.renderFunction();
        }
        return this._element;
    };

    this.getElement = function () {         //метод для обращения к DOM-элементу объекта
        return this._element;
    }
}

function CreatingForm () {                          // класс: форма создания объектов
    InterfaceComponent.apply(this);
                                                    //метод формирования структуры, параметры: заголовок,
    this.makeHTML = function (parameters) {         // поля input type = text, и наличие кнопки закрыть окно.
        let HTML = `<Form>` +                       // для удобства применяем табличное форматирование.
                        `<table><tbody>` +
                            `<tr>` +
                                `<td colspan="2"><h4>${parameters.name}</h4></td>` +
                            `</tr>`;

        for (let i = 0; i < parameters.inputs.length; i++) {
            HTML +=         `<tr>` +
                                `<td>${parameters.inputs[i]}</td>` +
                                `<td><input type='text'></td>` +
                            `</tr>`;
        }

        HTML +=             `<tr>` +
                                `<td colspan="2"><span class="tooltip hidden"></span>` +
                                `<input type='submit' value='Create'></td>` +
                            `</tr>` +
                        `</tbody></table>` +
                    `</Form>`;

        if (parameters.closeButton) {
            HTML += `<button class='closeButton'></button>`;
        }

        return HTML;
    };

    this.checkInputFields = function (options) {                        //метод поверки заполнения полей input

        let tooltip = this._form.querySelector('.tooltip');    //показываем подсказки в случае неверного
        tooltip.classList.add('hidden');                                //заполнения полей

        for (let i = 0; i < this._inputs.length; i++ ) {                //заполнены ли поля
            if (this._inputs[i].value === '') {
                tooltip.classList.remove('hidden');
                tooltip.textContent = 'Some fields are empty';
                return false;
            }
        }                                                               //options: параметры для доп. проверок

        if (options.arrayType === 'Map') {                              //проверяем, уникальность заполненного поля,
            let index = options.inputIndex;                             //созданные объекты хранятся в структуре Map.
            if (options.array.has(this._inputs[index].value) ) {
                tooltip.classList.remove('hidden');
                tooltip.textContent = 'Already exist';
                return false;
            }
        }

        return true;
    };

    this.defineElements = function () {                                 //сохраняем ссылки на основные элементы
        this._form = this._element.querySelector('Form');               //для упрощения работы с ними.
        this._inputs = this._element.querySelectorAll('input');
        this._closeButton = this._element.querySelector('.closeButton');
    }
}

function ProjectManager (options) {                  //главный элемент интерфейса, задает разметку документа.
    InterfaceComponent.apply(this);                  //наследует от класса компонент интерфейса.

    let body = null;
    let sideBlock = null;
    this.projects = new Map();                       // хранит объекты с уникальным название - проекты.
    let projectCreator = null;
    let plusButton = null;

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');
        element.innerHTML = `<div class="pM__title">${options.title}</div>` +
                            `<div class='pM__body'></div>` +
                            `<div class='pM__sideBlock'></div>`;
        body = element.querySelector('.pM__body');
        sideBlock = element.querySelector('.pM__sideBlock');

        this.addProjectCreator();                                               //добавляем виджеты в блоки
        let workerCreator = new WorkerCreator();
        sideBlock.appendChild( workerCreator.render() );
        workerCreator.createWorkersContainer();
    };
                                                                  //методы добавления элементов в тело интерфейса
    this.addProject = function (newProject) {
        body.appendChild(newProject.render() );
        this.projects.set(newProject.name, newProject);
    };

    this.deleteProject = function (delProject) {
        body.removeChild(delProject.getElement() );
        this.projects.delete(delProject.name);
    };

    this.addProjectCreator = function () {
        projectCreator = new ProjectCreator({manager: this});
        body.appendChild(projectCreator.render() );
        projectCreator.setFocus();
    };

    this.deleteProjectCreator = function () {
        body.removeChild(projectCreator.getElement() );
        projectCreator = null;
    };

    this.addPlusProjectButton = function () {
        plusButton = new PlusProjectButton({manager: this});
        body.appendChild(plusButton.render() );
    };

    this.deletePlusProjectButton = function () {
        body.removeChild(plusButton.getElement() );
        plusButton = null;
    };

    this.toJSON = function () {
        let res = {};

        for (let projectName of this.projects.keys() ) {
            res[projectName] = this.projects.get(projectName);
        }
        return res;
    }
}

function ProjectCreator (options) {                // Элемент - создатель проектов
    CreatingForm.apply(this);

    let manager = options.manager;                 // передаем ссылку на главный элемент интерфейса, для работы с ним

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');
        element.className = 'widget projectCreator';
        let parameters = {name: 'Create new project', inputs: ['Name:'], closeButton: true };
        element.innerHTML = this.makeHTML (parameters);

        this.defineElements();

        this._form.onsubmit = function () {        // onsubmit используем для удобной работы вводы по нажатию enter
            submit();
            return false;                          // Не отправляем данные на сервер.
        };

        this._closeButton.onclick = function () {
            closeForm();
        };
    };

    function submit () {
        let isOk = this.checkInputFields( {inputIndex: 0, array: manager.projects, arrayType: 'Map'} );
        if (isOk) createProject(this._inputs[0].value);
    }

    function createProject(name) {                          // метод создания нового проекта
        let project = new Project ( {name: name,
                                    manager: manager} );
        manager.addProject(project);
        closeForm();
    }

    function closeForm () {
        manager.addPlusProjectButton();
        manager.deleteProjectCreator();
    }

    this.setFocus = function () {
        this._inputs[0].focus();
    };

    submit = submit.bind(this);              //фиксируем контекст, для вызова из процедуры обработки события onsubmit
}

function WorkerCreator () {                         //элемент - создатель исполнителей.
    CreatingForm.apply(this);

    let newWorkers = null;                  //зраним ссылку на контейнер, в который будем добавлять нвоый исполнителей
    let newWorkerId = 1;                   //каждому работнику добавляем уникальный id, имя и фамилия могут повторятся

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');
        element.className = 'widget workerCreator';
        let parameters = {name: 'Create new worker',
                            inputs: ['First name: ', 'Last name: ', 'Speciality: '],
                            closeButton: false };
        element.innerHTML = this.makeHTML(parameters);

        this.defineElements();

        this._form.onsubmit = function () {
            submit();
            return false;
        };
    };

    this.createWorkersContainer = function () {             //создаем элемент интерфейса контейнер для исполнителей
        newWorkers = new FreeWorkers();
        this.getElement().parentElement.appendChild( newWorkers.render() );
    };

    function submit() {
        let isOk = this.checkInputFields( {arrayType: 'none'} );
        if (isOk) createWorker();
    }

    function createWorker () {
        let options = {id: newWorkerId,
            firstName: this._inputs[0].value,
            lastName: this._inputs[1].value,
            speciality: this._inputs[2].value,
            container: newWorkers};
        let worker = new Worker(options);
        newWorkerId++;

        newWorkers.addDragElement(worker.render() );
    }

    submit = submit.bind(this);
    createWorker = createWorker.bind(this);
}

function TaskCreator (options) {                    //элемент создатель задач
    CreatingForm.apply(this);

    let worker = options.worker;
    let container = options.container;

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');

        let parameters = {name: 'Create new task', inputs: ['Name: '], closeButton: true };
        element.innerHTML = `<div class="modal"></div>` +           //добавляем элемент с классом модальное окно
            `<div class="widget taskCreator">` +                    //запрещая обращения к скрытым элементам
            this.makeHTML(parameters) +
            `</div>`;

        this.defineElements();
        let closeButton = this._closeButton;

        this._inputs[0].setAttribute('tabindex', '1');          //добавляем первый 2 индекса перехода для возвращения
        this._inputs[1].setAttribute('tabindex', '2');          // к ним после выделения элементов браузера

        this._form.onsubmit = function () {
            submit();
            return false;
        };

        this._inputs[1].onblur = function () {   //при переходе со 2-го элемента фокусируемся на последнем в документе
            closeButton.focus();                 // не давая возможность пользователю обратиться к скрытым элементам
        };

        closeButton.onclick = function () {
            document.body.removeChild(element);
        };
    };

    function submit () {
        let isOk = this.checkInputFields( {inputIndex: 0, array: worker.tasks, arrayType: 'Map'} );
        if (isOk) createTask();
    }

    function createTask () {
        let taskName = this._inputs[0].value;
        let task = new Task ({name: taskName});

        container.selfObject.addDragElement(task.render() );
        document.body.removeChild(this.getElement() );              //после использования удаляем данный виджет
    }

    submit = submit.bind(this);
    createTask= createTask.bind(this);

    document.body.appendChild(this.render() );                  //сразу после создания объекта добавляем его на экран
    this._inputs[0].focus();
}

function PlusProjectButton (options) {                  //элемент кнопка добавления новых проектов
    InterfaceComponent.apply(this);

    let manager = options.manager;

    this.renderFunction = function () {
        let element = this._element = document.createElement('button');
        element.className = 'plusButton';

        element.onclick = function () {
            manager.addProjectCreator();
            manager.deletePlusProjectButton();
        };
    };
}

function DragElementsContainer (options) {                  //класс: контейнер элементов с функционалом dragAndDrop
    let element = options.element;
    let array = options.array;
    let keyType = options.keyType;
    element.selfObject = this;                         //сохраняем ссылку на объект для обращения к методам элемента

    this.isEmpty = function () {                       //если контейнер пуст, изменяем его оформление с помощью css
        if (array.size === 0) {
            element.classList.add('empty');
        }
    };

    this.addDragElement = function (dragElement) {          //добавление элемента в контейнер
        let dragObject = dragElement.selfObject;            //в параметре selfObject хранится ссылка на js-объект
        array.set(dragObject[keyType], dragObject);         // использеуем его для обновления структур Map
        element.classList.remove('empty');
        element.appendChild(dragElement);
    };

    this.removeDragElement = function (dragElement) {       //удаление элемента из контейнера
        let dragObject = dragElement.selfObject;
        array.delete(dragObject[keyType]);
        element.removeChild(dragElement);
        this.isEmpty();
    };

    this.isDragElementCorrect = options.correctFunction;    //метод проверки возможности добавления метода в контейнер


}


function Project (options) {                                // класс: проект
    InterfaceComponent.apply(this);

    this.name = options.name;
    let manager = options.manager;
    this.workers = new Map();

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');
        element.className = 'widget project';
        element.innerHTML = `<button class='closeButton'></button>` +
            `<h3></h3>` +
            `Workers:` +
            `<div  class="dragElementsContainer empty droppable" data-drop-type="worker"></div>` +
            `<button class="taskButton">Tasks...</button>`;

        //записываем навзвание через textContent, чтобы пользователь не встраивал свою разметку в HTML
        element.querySelector('h3').textContent = this.name;

        let closeButton = element.querySelector('.closeButton');
        let taskButton = element.querySelector('.taskButton');
        let container = element.querySelector('.dragElementsContainer');
                                                                                    //наследуем класс контейнер
        DragElementsContainer.apply(this, [ {element: container, array: this.workers,
                                                    keyType: 'id', correctFunction: () => true } ] );

        closeButton.onclick = function () {
            del();
        };

        taskButton.onclick = function () {
            openTaskManager();
        }
    };

    this.toJSON = function () {
        let res = {workers: []};

        for (let workerName of this.workers.keys() ) {
            res.workers.push(this.workers.get(workerName) );
        }
        return res;
    };

    function del () {
        manager.deleteProject(manager.projects.get(this.name) );
    }

    function openTaskManager () {
        let taskManager = new TaskManager({project: this, projectName: this.name});
        document.body.appendChild(taskManager.render() );
    }

    del = del.bind(this);
    openTaskManager = openTaskManager.bind(this);
}

function FreeWorkers () {                               // элемент интерфейса - контейнер новых исполнителей
    InterfaceComponent.apply(this);

    this.workers = new Map();

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');
        element.className = 'widget freeWorkers';
        element.innerHTML = `Workers:` +
            `<div  class="dragElementsContainer empty scrollable droppable" data-drop-type="worker"></div>`;

        let container = element.querySelector('.dragElementsContainer');

        DragElementsContainer.apply(this, [ {element: container, array: this.workers,
            keyType: 'id', correctFunction: () => true } ] );
    };
}

function WorkerTasks (options) {                                // элемент интерфейса - контейнер задач у исполнителя
    InterfaceComponent.apply(this);

    let worker = options.worker;

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');
        element.className = 'widget';
        element.innerHTML = `<h3></h3>` +
            `<h4></h4>` +
            `Tasks:` +
            `<div  class="dragElementsContainer empty droppable" data-drop-type="task"></div>` +
            `<button class="taskButton">add new task</button>`;

        element.querySelector('h3').textContent = worker.firstName + ' ' + worker.lastName;
        element.querySelector('h4').textContent = worker.speciality;

        let button = element.querySelector('button');
        let container = element.querySelector('.dragElementsContainer');

        DragElementsContainer.apply(this, [ {element: container, array: worker.tasks, keyType: 'name',
                    correctFunction: (dragElement) => !worker.tasks.has(dragElement.selfObject.name) } ] );

        for (let task of worker.tasks.values() ) {              // воссоздаем имеющиеся задачи у данного исполнителя
            container.appendChild(task.render() );   //render если объекты были получены с сервера и не строились ранее
            container.classList.remove('empty');
        }

        button.onclick = function () {
            let taskCreator = new TaskCreator ({worker: worker, container: container});
        }
    };
}

function Worker (options) {                     // элемент интерфейса - исполнитель
    InterfaceComponent.apply(this);

    this.id = options.id;
    this.firstName = options.firstName;
    this.lastName = options.lastName;
    this.speciality = options.speciality;
    this.container = options.container;
    this.tasks = new Map();
                                                                    //класс draggable задает поведение - dragAndDrop
    this.renderFunction = function () {
        let element = this._element = document.createElement('div');
        element.className = 'worker draggable';
        element.dataset.dragType = 'worker';    //аттрибут для проверки совместимости переносимого элемента и контейнера
        element.innerHTML = `<button class="closeButton"></button><span></span>`;
        element.querySelector("span").textContent = this.firstName + ' ' + this.lastName;
        element.selfObject = this;

        let closeButton = element.querySelector('.closeButton');
        closeButton.onclick = function () {
            del();
        }
    };

    this.toJSON = function () {
        let res = {firstName: this.firstName,
            lastName: this.lastName,
            speciality: this.speciality,
            tasks : []};

        for (let taskName of this.tasks.keys() ) {
            res.tasks.push(this.tasks.get(taskName) );
        }
        return res;
    };

    function del () {
        this.container.removeDragElement(this.getElement() );
    }
    del = del.bind(this);
}

function Task (options) {                       // элемент интерфейса - задача
    InterfaceComponent.apply(this);

    this.name = options.name;
    this.description = '';

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');
        element.className = 'task draggable';
        element.dataset.dragType = 'task';
        element.innerHTML = `<button class="questionButton"></button><span></span>`;
        element.querySelector("span").textContent = this.name;
        element.selfObject = this;

        let questionButton = element.querySelector('.questionButton');
        questionButton.onclick = function () {
            edit();
        }
    };

    this.toJSON = function () {
        return {name: this.name, description: this.description};
    };

    function edit () {
        let taskEdit = new TaskEdit({task: this});
    }
    edit = edit.bind(this);
}

function TaskManager (options) {            //элемент интерфейса - окно работы с задачами исполнителей проекта
    InterfaceComponent.apply(this);         // с помощью css перекрывает основное окно документа.

    let project = options.project;
    let workers = project.workers;

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');
        element.className = 'taskManager';
        element.innerHTML = `<div class="tM__title"></div>` +
                            `<div class="tM__body"></div>` +
                            `<div class="tM__sideBlock">` +
                                `<button class="closeFormButton"></button>` +
                                `<div class="trashCan droppable" data-drop-type="task"></div>` +
                            `</div>`;

        element.querySelector('.tM__title').textContent = options.projectName;

        let body = element.querySelector('.tM__body');
        let closeButton = element.querySelector('.closeFormButton');
        let trashCan = element.querySelector('.trashCan');
                                                            //высота окна минимум должна перекрывать высоту документа
        body.style.minHeight = document.body.querySelector('.pM__body').offsetHeight + 'px';

        for (let worker of workers.values() ) {
            let workerTasks = new WorkerTasks({ worker: worker});
            body.appendChild(workerTasks.render() );
        }

        closeButton.onclick = function () {
            document.body.removeChild(element);
        };

        trashCan.selfObject = {};                                       //методы необходимые для работы dragAndDrop
        trashCan.selfObject.addDragElement = function (dragElement) {   //при добавлении в корзину, удаляем переносимый
            document.body.removeChild(dragElement);                     //элемент.
        };
        trashCan.selfObject.isDragElementCorrect = () => true;
    };
}

function TaskEdit (options) {                               // элемент интерфейса - окно редактирования задачи
    InterfaceComponent.apply(this);

    let task = options.task;
    let description = task.description;
    let textArea = null;

    this.renderFunction = function () {
        let element = this._element = document.createElement('div');

        element.innerHTML = `<div class="modal"></div>` +
            `<div class="widget taskEdit">` +
            `<h4></h4>` +
            `<span>Task Description:</span>` +
            `<textarea class="taskDescription">${description}</textarea>` +
            `<button class='closeButton'></button>` +
            `</div>`;

        element.querySelector('h4').textContent = task.name;

        let closeButton = element.querySelector('.closeButton');
        textArea = element.querySelector('textarea');

        textArea.setAttribute('tabindex', '1');

        closeButton.onclick = function () {
            task.description = textArea.value;
            document.body.removeChild(element);
        };

        textArea.onblur = function () {
            closeButton.focus();
        }
    };

    document.body.appendChild(this.render() );
    textArea.focus();
}
