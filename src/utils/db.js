// IndexedDB数据库操作封装
const DB_NAME = 'notesDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

// 打开数据库连接
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// 获取所有便签
export async function getAllNotes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const request = index.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 添加便签
export async function addNote(note) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const newNote = {
      ...note,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const request = store.add(newNote);

    request.onsuccess = () => {
      resolve(newNote);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 更新便签
export async function updateNote(id, content) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const note = request.result;
      if (note) {
        note.content = content;
        note.updatedAt = Date.now();
        const updateRequest = store.put(note);
        updateRequest.onsuccess = () => {
          resolve(note);
        };
        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
      } else {
        reject(new Error('Note not found'));
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 删除便签
export async function deleteNote(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}