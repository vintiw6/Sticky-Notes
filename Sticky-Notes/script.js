document.addEventListener('DOMContentLoaded', () => {
    const stickyNotes = document.querySelectorAll('.sticky-note');

    const allPinTypes = [
        'pin-music-png',
        'pin-bulb-png',
        'pin-heart-png',
        'pin-notes-png',
        'pin-misc-png'
    ];

    const assignRandomPinType = (pinSymbolElement) => {
        const randomIndex = Math.floor(Math.random() * allPinTypes.length);
        const randomPinType = allPinTypes[randomIndex];
        pinSymbolElement.classList.remove(...allPinTypes);
        pinSymbolElement.classList.add(randomPinType);
    };

    const updateNoteTitleAndPin = (noteElement, newTitle) => {
        const noteId = noteElement.dataset.noteId;
        const currentData = localStorage.getItem(`todo_${noteId}`);
        let noteData = currentData ? JSON.parse(currentData) : { title: '', items: [] };

        noteData.title = newTitle;
        localStorage.setItem(`todo_${noteId}`, JSON.stringify(noteData));

        const pinSymbolElement = noteElement.querySelector('.pin-symbol');
        if (pinSymbolElement) {
            assignRandomPinType(pinSymbolElement);
        }
    };

    const saveData = (noteId, data) => {
        localStorage.setItem(`todo_${noteId}`, JSON.stringify(data));
    };

    const loadData = (noteId) => {
        const data = localStorage.getItem(`todo_${noteId}`);
        return data ? JSON.parse(data) : { title: '', items: [] };
    };

    const renderTodoItems = (noteElement, noteId) => {
        const todoListUl = noteElement.querySelector('.todo-items');
        todoListUl.innerHTML = '';

        const noteData = loadData(noteId);
        const items = noteData.items;

        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.classList.add('todo-item');
            if (item.completed) {
                li.classList.add('completed');
            }

            li.innerHTML = `
                <input type="checkbox" ${item.completed ? 'checked' : ''} data-index="${index}">
                <label>${item.text}</label>
                <button class="delete-btn" data-index="${index}">✖</button>
            `;
            todoListUl.appendChild(li);
        });
    };

    stickyNotes.forEach(note => {
        const noteId = note.dataset.noteId;
        const noteTitleElement = note.querySelector('.note-title');
        const pinSymbolElement = note.querySelector('.pin-symbol');

        const initialNoteData = loadData(noteId);
        if (initialNoteData.title && initialNoteData.title !== "") {
            noteTitleElement.textContent = initialNoteData.title;
        } else {
            noteTitleElement.textContent = "Click to Edit Title";
            initialNoteData.title = noteTitleElement.textContent;
            saveData(noteId, initialNoteData);
        }

        if (pinSymbolElement) {
            assignRandomPinType(pinSymbolElement);
        }

        renderTodoItems(note, noteId);

        note.addEventListener('click', (event) => {
            if (event.target.closest('.todo-list') || event.target.closest('.add-item-form') || event.target.classList.contains('note-title-input')) {
                return;
            }

            const isActive = note.classList.contains('active');
            stickyNotes.forEach(otherNote => {
                if (otherNote !== note && otherNote.classList.contains('active')) {
                    const otherTitleElement = otherNote.querySelector('.note-title');
                    const otherInputElement = otherNote.querySelector('.note-title-input');
                    if (otherInputElement) {
                        const savedTitle = loadData(otherNote.dataset.noteId).title;
                        otherTitleElement.textContent = savedTitle || "Click to Edit Title";
                        otherInputElement.replaceWith(otherTitleElement);
                    }
                    otherNote.classList.remove('active');
                }
            });

            note.classList.toggle('active');

            if (note.classList.contains('active')) {
                const inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.classList.add('note-title-input');
                const currentSavedTitle = loadData(noteId).title;
                inputElement.value = (currentSavedTitle === "Click to Edit Title") ? "" : currentSavedTitle;

                noteTitleElement.replaceWith(inputElement);
                inputElement.focus();
                inputElement.select();

                inputElement.addEventListener('blur', () => {
                    const newTitle = inputElement.value.trim();
                    const finalTitle = newTitle || "Click to Edit Title";
                    noteTitleElement.textContent = finalTitle;
                    inputElement.replaceWith(noteTitleElement);
                    updateNoteTitleAndPin(note, finalTitle);
                });

                inputElement.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        inputElement.blur();
                    }
                });
            } else {
                const inputElement = note.querySelector('.note-title-input');
                if (inputElement) {
                    const newTitle = inputElement.value.trim();
                    const finalTitle = newTitle || "Click to Edit Title";
                    noteTitleElement.textContent = finalTitle;
                    inputElement.replaceWith(noteTitleElement);
                    updateNoteTitleAndPin(note, finalTitle);
                }
            }
        });

        const addItemBtn = note.querySelector('.add-item-btn');
        const newItemInput = note.querySelector('.add-item-form input[type="text"]');

        const addNewItem = () => {
            const text = newItemInput.value.trim();
            if (text) {
                const noteData = loadData(noteId);
                noteData.items.push({ text: text, completed: false });
                saveData(noteId, noteData);
                renderTodoItems(note, noteId);
                newItemInput.value = '';
            }
        };

        addItemBtn.addEventListener('click', addNewItem);
        newItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addNewItem();
            }
        });

        note.querySelector('.todo-items').addEventListener('click', (event) => {
            const target = event.target;
            const index = parseInt(target.dataset.index);
            const noteData = loadData(noteId);
            let items = noteData.items;

            if (target.type === 'checkbox') {
                items[index].completed = target.checked;
                saveData(noteId, noteData);
                renderTodoItems(note, noteId);
            } else if (target.classList.contains('delete-btn')) {
                items.splice(index, 1);
                saveData(noteId, noteData);
                renderTodoItems(note, noteId);
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.sticky-note') && !event.target.classList.contains('note-title-input')) {
            stickyNotes.forEach(note => {
                if (note.classList.contains('active')) {
                    const titleElement = note.querySelector('.note-title');
                    const inputElement = note.querySelector('.note-title-input');
                    if (inputElement) {
                        const newTitle = inputElement.value.trim();
                        const finalTitle = newTitle || "Click to Edit Title";
                        titleElement.textContent = finalTitle;
                        inputElement.replaceWith(titleElement);
                        updateNoteTitleAndPin(note, finalTitle);
                    }
                    note.classList.remove('active');
                }
            });
        }
    });
});