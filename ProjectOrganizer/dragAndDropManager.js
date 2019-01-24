let dragAndDropManager = new function () {

    let dragObject = {};                                        //объект с данными о переносимом объекте

    document.addEventListener('mousedown', mousedown);

    function mousedown (event) {                                //обработка начала переноса

        if (event.which !== 1) return;                          //запрещаем перенос при нажатии правой кнопки мыши

        if (event.target.tagName === 'BUTTON') return;          //для работы кнопок с событием onclick внутри элемента

        //используем делегирование для выявления нажатия на переносимый элемент
        dragObject.element = event.target.closest('.draggable');
        if (!dragObject.element) return;

        //сохраняем координаты захвата элемента
        let marginTop = getComputedStyle(dragObject.element).marginTop;
        let marginLeft = getComputedStyle(dragObject.element).marginLeft;

        dragObject.shiftX = event.clientX - dragObject.element.getBoundingClientRect().left + parseInt(marginLeft);
        dragObject.shiftY = event.clientY - dragObject.element.getBoundingClientRect().top + parseInt(marginTop);

        //записываем тип (элемент может быть перенесен только в контейнер с аналогичным типом)
        dragObject.dragType = dragObject.element.dataset.dragType;

        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);

        event.preventDefault();
    }

    function mousemove (event) {
        if (!dragObject.avatar) {
            dragObject.avatar = makeAvatar();               //в начале переноса создаем элемент, отображающий перенос
            dragObject.dropElement = getDropArea(event);
        }

        move(event);                                        //перемещаем аватар на новые координаты

        dropLeave(dragObject.dropElement);                  //обрабатываем реакцию контейнера на перемещения
        dragObject.dropElement = getDropArea(event);        //dropLeave для выхода из зоны сброса контейнера
        dropEnter(dragObject.dropElement);                  //dropEnter - для входа
    }                                                       //getDropArea - определение контейнера под аватаром

    function mouseup () {

        if (dragObject.avatar !== undefined) {
            dropLeave(dragObject.dropElement);
            drop(dragObject.dropElement);                   //drop - завершение переноса
        }
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
    }

    function makeAvatar () {
        let avatar = dragObject.element;                    //в качестве аватара использвем сам элемент

        avatar.prevParams = {parent: avatar.parentElement,  //записываем старые параметры позиционирования
            position: avatar.style.position,
            left: avatar.style.left,
            top: avatar.style.top,
            margin: avatar.style.margin,
            zIndex: avatar.style.zIndex};

        avatar.parentElement.selfObject.removeDragElement(avatar);  //вытаскиваем из старого контейнера
        document.body.appendChild(avatar);                          //и помещаем в body поверх всего
        avatar.style.position = 'absolute';
        avatar.style.margin = '0';
        avatar.style.zIndex = '10';

        avatar.acceptDrop = function () {                           //процедура завершения переноса
            let parameters = avatar.prevParams;
            parameters.parent.selfObject.addDragElement(avatar);    //возвращаем элементу старые параметры
            avatar.style.position = parameters.position;
            avatar.style.left = parameters.left;
            avatar.style.top = parameters.top;
            avatar.style.margin = parameters.margin;
            avatar.style.zIndex = parameters.zIndex;
        };

        return avatar;
    }

    function move (event) {

        let top = event.pageY - dragObject.shiftY;
        let left = event.pageX - dragObject.shiftX;

        top = Math.min(top, window.innerHeight - dragObject.avatar.offsetHeight);
        top = Math.max(0, top);
        left = Math.min (left, window.innerWidth - dragObject.avatar.offsetWidth);
        left = Math.max (0, left);

        dragObject.avatar.style.top = top + 'px';
        dragObject.avatar.style.left = left + 'px';
    }

    function getDropArea (event) {           //чтобы определить котейнер под аватаром - на время удаляем его из потока
        dragObject.avatar.classList.add('hidden');
        let dropElement = document.elementFromPoint(event.clientX, event.clientY);
        dragObject.avatar.classList.remove('hidden');
        if (!dropElement) return null;
        dropElement = dropElement.closest('.droppable');        //ищем элемент - контейнер с требуемым типом
        if (dropElement) {
            if (dropElement.dataset.dropType === dragObject.dragType) {
                return dropElement;
            }
        }
        return null;
    }

    function dropLeave (dropElement) {                 //реакцию контейнера на перемещения задаем с помощью стилей css
        if (dropElement) {
            dropElement.classList.remove('droping');
        }
    }

    function dropEnter (dropElement) {
        if (dropElement) {
            dropElement.classList.add('droping');
            dropElement.classList.remove('reject');

            //если сброс по каким-то причинам не возможен - проверяем в методе обЪъкта контейнера isDragElementCorrect
            if (!dropElement.selfObject.isDragElementCorrect(dragObject.avatar) ) {
                dropElement.classList.add('reject');
            }
        }
    }

    function drop (dropElement) {
        if (dropElement &&  !dropElement.classList.contains('reject') ) {   //если под курсором разрешенный контейнер
            dragObject.avatar.prevParams.parent = dropElement;              //меняем родителя в параметрах аватара
            dragObject.avatar.selfObject.container = dropElement.selfObject;
        }
        dragObject.avatar.acceptDrop();
        dragObject = {};                                                    //обнуляем объекты с данными о переносе
    }
};