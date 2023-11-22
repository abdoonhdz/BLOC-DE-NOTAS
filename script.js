let anadirBtn = document.getElementById('agregar');
const INDEXDB_NAME = "clickBD";
const INDEXDB_VERSION = 1;
const STORE_NAME = "cliksStore";

let db = null;
let counter = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(INDEXDB_NAME, INDEXDB_VERSION);
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                let objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

document.addEventListener('DOMContentLoaded', () => {
    openDB()
        .then((database) => {
            db = database;
            return checkNotesExistence();
        })
        .then((notesExist) => {
            if (!notesExist) {
                addDefaultNote();
            }
            loadNotes();
        })
        .catch((error) => {
            console.error("Error al abrir la base de datos:", error);
        });
});

function checkNotesExistence() {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction([STORE_NAME], 'readonly');
        let objectStore = transaction.objectStore(STORE_NAME);
        let countRequest = objectStore.count();

        countRequest.onsuccess = (event) => {
            let noteCount = event.target.result;
            resolve(noteCount > 0);
        };

        countRequest.onerror = (event) => {
            console.error("Error al contar las notas:", event.target.error);
            reject(event.target.error);
        };
    });
}

function addDefaultNote() {
    let defaultText = "Esta es una nota por defecto.";
    let transaction = db.transaction([STORE_NAME], 'readwrite');
    let objectStore = transaction.objectStore(STORE_NAME);
    let data = {
        id: counter,
        text: defaultText
    };
    objectStore.add(data);
    counter++;

    // Crear y agregar la nota por defecto en la interfaz de usuario
    createNoteElement(data);
}

function loadNotes() {
    let transaction = db.transaction([STORE_NAME], 'readonly');
    let objectStore = transaction.objectStore(STORE_NAME);
    let cursorRequest = objectStore.openCursor();

    cursorRequest.onsuccess = (event) => {
        let cursor = event.target.result;
        if (cursor) {
            createNoteElement(cursor.value);
            cursor.continue();
        }
    };

    cursorRequest.onerror = (event) => {
        console.error("Error al cargar las notas:", event.target.error);
    };
}

function createNoteElement(data) {
    let nota = document.createElement('div');
    nota.classList.add('nota');
    nota.dataset.id = data.id;
    let eliminar = document.createElement('div');
    eliminar.classList.add('eliminar');
    let i = document.createElement('i');
    i.classList.add('fas');
    i.classList.add('fa-trash-alt');
    let i2 = document.createElement('i');
    i2.classList.add('fas');
    i2.classList.add('fa-pen');
    eliminar.appendChild(i);
    eliminar.appendChild(i2);
    nota.appendChild(eliminar);
    let cuerpo = document.createElement('div');
    cuerpo.classList.add('main');
    let escribir = document.createElement('textarea');
    escribir.classList.add('escribir');
    escribir.value = data.text;
    cuerpo.appendChild(escribir);

    nota.appendChild(cuerpo);
    document.body.appendChild(nota);

    i.addEventListener('click', () => {
        document.body.removeChild(nota);
        deleteNoteFromDB(data.id);
    });

    i2.addEventListener('click', () => {
        // Actualizar la nota en la base de datos con el nuevo texto del textarea
        updateNoteContent(data.id, escribir.value);
    });

    // Manejar cambios en el área de texto para guardar automáticamente
    escribir.addEventListener('input', () => {
        saveNoteContent(data.id, escribir.value);
    });
}

function deleteNoteFromDB(noteId) {
    let transaction = db.transaction([STORE_NAME], 'readwrite');
    let objectStore = transaction.objectStore(STORE_NAME);
    objectStore.delete(noteId);
}

function updateNoteContent(noteId, content) {
    let transaction = db.transaction([STORE_NAME], 'readwrite');
    let objectStore = transaction.objectStore(STORE_NAME);
    objectStore.get(noteId).onsuccess = (event) => {
        let data = event.target.result;
        data.text = content;
        objectStore.put(data);
    };
}

function saveNoteContent(noteId, content) {
    let transaction = db.transaction([STORE_NAME], 'readwrite');
    let objectStore = transaction.objectStore(STORE_NAME);
    objectStore.get(noteId).onsuccess = (event) => {
        let data = event.target.result;
        data.text = content;
        objectStore.put(data);
    };
}

anadirBtn.addEventListener('click', () => {
    let nota = document.createElement('div');
    nota.classList.add('nota');
    let eliminar = document.createElement('div');
    eliminar.classList.add('eliminar');
    let i = document.createElement('i');
    i.classList.add('fas');
    i.classList.add('fa-trash-alt');
    let i2 = document.createElement('i');
    i2.classList.add('fas');
    i2.classList.add('fa-pen');
    eliminar.appendChild(i);
    eliminar.appendChild(i2);
    nota.appendChild(eliminar);
    let cuerpo = document.createElement('div');
    cuerpo.classList.add('main');
    let escribir = document.createElement('textarea');
    escribir.classList.add('escribir');
    cuerpo.appendChild(escribir);

    nota.appendChild(cuerpo);
    document.body.appendChild(nota);

    i.addEventListener('click', () => {
        document.body.removeChild(nota);
        // Aquí puedes agregar el código para eliminar la nota de la base de datos si es necesario
        deleteNoteFromDB(counter);
    });

    i2.addEventListener('click', () => {
        // Actualizar la nota en la base de datos con el nuevo texto del textarea
        updateNoteContent(counter, escribir.value);
    });

    openDB()
        .then(() => {
            let transaction = db.transaction([STORE_NAME], 'readwrite');
            let objectStore = transaction.objectStore(STORE_NAME);
            let data = {
                id: counter,
                text: escribir.value
            };
            objectStore.add(data);
            counter++;
        });
});
