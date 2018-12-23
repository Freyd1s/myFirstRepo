function InterfaceComponent (name, parent, title) {            //Конструктор компонентов интерфейса
    this.name = name;
    this.width = 200;
    this.height = 120;
    this.marginLeft = 30;
    this.marginTop = 30;
    let self = this;

    this.highLight = function () {                              //Увеличиваем компонент при наведении
        this.style.width = self.width + 30 + "px";
        this.style.height = self.height + 20 + "px";
        this.style.marginLeft = self.marginLeft - 15 + "px";
        this.style.marginTop = self.marginTop - 10 + "px";
        this.firstElementChild.style.marginTop = "26px";
    };

    this.lowLight = function () {                               //возвращаем в исходное состояние
        this.style.width = self.width + "px";
        this.style.height = self.height + "px";
        this.style.marginLeft = self.marginLeft + "px";
        this.style.marginTop = self.marginTop + "px";
        this.firstElementChild.style.marginTop = "16px";
    };

    let div = document.createElement('div');            //Создаем div элемент внутри parent
    div.innerHTML = '<p>' + title + "</p>";
    div.className = "myDiv";
    div.setAttribute("name",this.name);
    parent.appendChild(div);
    div.onmousemove = this.highLight;
    div.onmouseout = this.lowLight;

    this.element = div;                                         //Аттрибут объекта - ссылка на элемент интерфейса
}

function ProjectCreator () {                                            //Конструктор объекта создатель проектов
    InterfaceComponent.apply(this, arguments);                  //наследует от InterfaceComponent

    this.projects = [];

    this.createNewProject = function () {                               //Метод создания проекта

        this.previousElementSibling.style.borderColor = "lightGrey";    //Проверяем введено ли имя проекта
        let name = this.previousElementSibling.value;
        if (name === "" ) {
            this.previousElementSibling.style.borderColor = "red";
            return;
        }
        for (let i = 0; i < projectCreator.projects.length; i++) {      //Не сущеествует ли проект с таким же именем
            if (projectCreator.projects[i].name === name) {
                this.previousElementSibling.style.borderColor = "red";
                return;
            }
        }
                                                                //Проверяем помещается ли новый проект на экране.
        let widthBetweenDivs = 280 + 2 + 26;                    //Диапазон занимаемый 1 DIV: width + border + margin
        if (document.documentElement.clientWidth < (projectCreator.projects.length + 1) * widthBetweenDivs + 23 ) {
                                                                // 23 = 15 + 8 (scrollbar + firstDivLeftBodyMargin
            alert ("Sorry, this version of program doesn't support creating more projects!");
            return;
        }

        let div = document.createElement('div');                //Создаем вспомогательный Div - рамку
        div.className = "dividingDiv";
        div.setAttribute("name","helpDiv");
        document.body.appendChild(div);

        projectCreator.projects.push( new Project( name, div, "Проект: " + name) );     //создаем проект
    };

    let input = document.createElement('input');                //Создаем элемент textBox в элементе создатель
    this.element.appendChild(input);
    input.setAttribute("placeholder", "Введите название проекта");

    let button = document.createElement('button');              //Создаем кнопку "Создать"
    button.textContent = "Создать";
    this.element.appendChild(button);
    button.style.marginTop = '10px';
    button.style.marginBottom = '10px';
    button.onclick = this.createNewProject;                     //Прикрепляем метод объекта к событию onClick кнопки
}

function Project (name, parent, title) {                                //Конструктор объекта Проект
    InterfaceComponent.apply(this, arguments);

    let widthBetweenDivs = 280 + 2 + 26;                        //Диапазон занимаемый 1 DIV: width + border + margin
    this.posX = projectCreator.projects.length * widthBetweenDivs - 5;  //Крайняя левая координата диапазона элемента

    this.createWorker = function () {                                   //Метод добавления исполнителя к проекту
        let name = this.previousElementSibling.value;
        new Worker(name, this.parentElement.parentElement, "Исполнитель: " + name);
    };

    let input = document.createElement('input');            //Создаем элемент textBox внутри элемента Проект
    this.element.appendChild(input);
    input.setAttribute("placeholder", "Введите имя исполнителя");

    let button = document.createElement('button');          //СОздаем кнопку - добавить исполнителя
    button.textContent = "Добавить исполнителя";
    this.element.appendChild(button);
    button.style.marginTop = '10px';
    button.style.marginBottom = '10px';
    button.onclick = this.createWorker;
}

function Worker (name, parent, title) {                                 //Конструктор объекта Исполнитель
    InterfaceComponent.apply(this, arguments);

    this.height = 40;
    this.marginTop = 20;
    let thisElement = this.element;                                     //Дублируем ссылку на элемент в переменную,
                                                                        //для обращения к элементу по ней через
    this.element.style.height = "40px";                                 //замыкание в функциях обработки событий.
    this.element.style.marginTop = "20px";
    this.element.style.lineHeight = "2px";

    this.element.ondragstart = function () {                            //Отключаем срабатывание браузерного события
        return false;                                                   //Drag and Drop
    };

    this.element.onmousedown = function (event) {                       //Создаем свой метод Drag And Drop
        thisElement.style.position = "absolute";

        function move (event) {                                 //Процедура обновления координат размещения элемента
            let marginL = parseInt(thisElement.style.marginLeft);
            let marginT = parseInt(thisElement.style.marginTop);
            thisElement.style.left = event.pageX - thisElement.offsetWidth/2 - marginL + "px";
            thisElement.style.top = event.pageY - thisElement.offsetHeight/2 - marginT + "px";
        }

        move(event);

        document.onmousemove = function (event) {           //При перетаскивании обновляем текущее отображение элемента
            move(event);                                    //Цепляем событие на document, на случай выхода курсора за
        };                                                  //объект

        thisElement.onmouseup = function (event) {                      //При отпускании очищаем событие onmousemove,
            document.onmousemove = null;                                //проверяем текущие координаты курсора,
            let newProj;                                                //определяем какой проект ближе.
            for (let i = projectCreator.projects.length; i > 0; i--) {  //Определение проекта по событию невозможно,
                if (projectCreator.projects[i-1].posX <= event.pageX) { //элемент остается внутри своего родителя, даже
                    newProj = projectCreator.projects[i-1].element;     //когда находится над другим элементом.
                    break;
                }
            }
            thisElement.parentElement.removeChild(thisElement);         //Удаляем Исполнителя из старого проекта
            newProj.parentElement.appendChild(thisElement);             //и добавляем в новый
            thisElement.style.position = "static";
            thisElement.onmouseup = null;                               //очищаем событие onmouseup
        }
    }
}