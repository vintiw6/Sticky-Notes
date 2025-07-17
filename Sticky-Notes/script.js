document.addEventListener('DOMContentLoaded', () => {
    const stickyNotes = document.querySelectorAll('.sticky-note');
const allPinTypes = ['📌', '📍', '📎', '❤️', '💡', '⭐', '🎵', '🔥', '✅'];

const assignRandomPinType = (pinSymbolElement) => {
    const randomIndex = Math.floor(Math.random() * allPinTypes.length);
    const randomEmoji = allPinTypes[randomIndex];
    pinSymbolElement.textContent = randomEmoji; // Set the emoji as text
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
// --- NEW: Function to unfocus all notes ---
const unfocusAllNotes = () => {
    document.querySelectorAll('.sticky-note').forEach(note => {
        note.classList.remove('focused', 'unfocused');
        note.style.transform = ''; // Clear the JS-applied transform
    });
};
    // --- NEW: Function to check if two rectangles overlap ---
    function doRectsOverlap(rect1, rect2) {
        return !(rect1.right < rect2.left ||
                 rect1.left > rect2.right ||
                 rect1.bottom < rect2.top ||
                 rect1.top > rect2.bottom);
    }

    // --- NEW: Array to store bounding rectangles of already placed notes ---
    let placedNotesRects = [];

    // --- NEW: Configure placement area and attempts ---
    const MARGIN_PERCENT = 5; // % margin from viewport edges
    const MAX_PLACEMENT_ATTEMPTS = 200; // Max tries to place a single note without overlap


    stickyNotes.forEach(note => {
        const noteId = note.dataset.noteId;
        const noteTitleElement = note.querySelector('.note-title');
        const pinSymbolElement = note.querySelector('.pin-symbol');

        // Load initial title from localStorage or set default for editable
        const initialNoteData = loadData(noteId);
        if (initialNoteData.title && initialNoteData.title !== "") {
            noteTitleElement.textContent = initialNoteData.title;
        } else {
            noteTitleElement.textContent = "Click to Edit Title";
            initialNoteData.title = noteTitleElement.textContent;
            saveData(noteId, initialNoteData);
        }

        // --- MODIFIED: Randomize Note Position without Overlap ---
        let foundPosition = false;
        for (let attempts = 0; attempts < MAX_PLACEMENT_ATTEMPTS; attempts++) {
            // Get viewport dimensions (excluding scrollbars)
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Define the usable area for placing notes
            // Deduct note's approximate size (e.g., 400px wide, 350px tall plus some buffer)
            // and desired margins
            const noteApproxWidth = 480; // Max width of focused note + buffer
            const noteApproxHeight = 480; // Max height of focused note + buffer

            const minX = viewportWidth * (MARGIN_PERCENT / 100);
            const maxX = viewportWidth - (viewportWidth * (MARGIN_PERCENT / 100)) - noteApproxWidth;
            const minY = viewportHeight * (MARGIN_PERCENT / 100);
            const maxY = viewportHeight - (viewportHeight * (MARGIN_PERCENT / 100)) - noteApproxHeight;

            if (maxX < minX || maxY < minY) {
                console.warn("Viewport too small or notes too large for non-overlapping placement.");
                // Fallback: place notes at a default non-random position if space is too tight
                note.style.position = 'absolute';
                note.style.top = `${5 + (noteId.split('-')[1] * 15)}%`; // Basic staggered
                note.style.left = `${5 + (noteId.split('-')[1] * 15)}%`;
                note.style.setProperty('--note-rotation', `${Math.random() * 10 - 5}deg`);
                foundPosition = true;
                break;
            }

            const randomTopPx = Math.random() * (maxY - minY) + minY;
            const randomLeftPx = Math.random() * (maxX - minX) + minX;
            const randomRotation = Math.random() * 20 - 10; // -10deg to +10deg

            // Temporarily apply style to get its bounding box
            note.style.position = 'absolute';
            note.style.top = `${randomTopPx}px`;
            note.style.left = `${randomLeftPx}px`;
            note.style.setProperty('--note-rotation', `${randomRotation}deg`);

            // Force reflow to get accurate bounding client rect after applying styles
            note.offsetWidth;

            const currentNoteRect = note.getBoundingClientRect();

            let overlap = false;
            for (const placedRect of placedNotesRects) {
                if (doRectsOverlap(currentNoteRect, placedRect)) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                foundPosition = true;
                placedNotesRects.push(currentNoteRect);
                break; // Found a non-overlapping spot
            }
        }

        if (!foundPosition) {
            console.warn(`Could not find non-overlapping position for note ${noteId} after ${MAX_PLACEMENT_ATTEMPTS} attempts. Allowing overlap.`);
            // If no position found after many attempts, leave it where it last tried (might overlap)
        }


        // Assign initial random pin type
        if (pinSymbolElement) {
            assignRandomPinType(pinSymbolElement);
        }

        renderTodoItems(note, noteId);

        // Handle note click for focus/unfocus
       // --- MODIFIED: Handle note click for focus/unfocus with smooth transform ---
note.addEventListener('click', (event) => {
    // If clicked on an interactive element inside the note, do nothing
    if (event.target.closest('.note-title-input, .todo-list, .add-item-form')) {
        return;
    }

    const isCurrentlyFocused = note.classList.contains('focused');

    // First, unfocus all notes to reset their state
    unfocusAllNotes();

    if (!isCurrentlyFocused) {
        // --- This is the new animation logic ---
        note.classList.add('focused');

        // 1. Get the note's current size/position and the viewport size
        const noteRect = note.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 2. Calculate the scale and translation needed to center the note
        // Aim for the note to be 80% of the smaller viewport dimension
        const targetWidth = Math.min(viewportWidth, viewportHeight) * 0.8;
        const scale = targetWidth / noteRect.width;

        const translateX = (viewportWidth / 2) - noteRect.left - (noteRect.width / 2);
        const translateY = (viewportHeight / 2) - noteRect.top - (noteRect.height / 2);

        // 3. Apply the transform directly to the element's style
        note.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(0deg)`;

        // 4. Add 'unfocused' class to all other notes
        document.querySelectorAll('.sticky-note').forEach(otherNote => {
            if (otherNote !== note) {
                otherNote.classList.add('unfocused');
            }
        });
    }
});

        // Title Editing triggered by clicking the title H3 itself
        noteTitleElement.addEventListener('click', (event) => {
            event.stopPropagation(); // Stop click from propagating to the parent note

            // If already an input, just focus it
            if (noteTitleElement.tagName === 'INPUT') {
                noteTitleElement.focus();
                noteTitleElement.select();
                return;
            }

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
        });

        // Event listener for adding new items
        const addItemBtn = note.querySelector('.add-item-form button');
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

        // Event listener for checking/deleting items (delegation)
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

    // Global click handler to unfocus notes
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.sticky-note') && !event.target.classList.contains('note-title-input')) {
            stickyNotes.forEach(note => {
                // Ensure any active title input is reverted to h3
                const titleElement = note.querySelector('.note-title');
                const inputElement = note.querySelector('.note-title-input');
                if (inputElement) {
                    const savedTitle = loadData(note.dataset.noteId).title;
                    titleElement.textContent = savedTitle || "Click to Edit Title";
                    inputElement.replaceWith(titleElement);
                    updateNoteTitleAndPin(note, finalTitle);
                }
                note.classList.remove('focused');
                note.classList.remove('unfocused');
            });
        }
    });
});