// IndexedDB数据库操作封装
const DB_NAME = 'notesDB';
const DB_VERSION = 2;
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
    // 默认样式值
    const defaultStyle = {
      color: '#fff9c4', // 默认黄色
      fontSize: 16,      // 默认16px
      theme: 'default'   // 默认主题
    };
    const newNote = {
      ...note,
      ...defaultStyle,
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
export async function updateNote(id, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const note = request.result;
      if (note) {
        // 合并更新，支持更新content、color、fontSize等字段
        const updatedNote = {
          ...note,
          ...updates,
          updatedAt: Date.now()
        };
        const updateRequest = store.put(updatedNote);
        updateRequest.onsuccess = () => {
          resolve(updatedNote);
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

// 清空所有便签
export async function clearAllNotes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 批量添加便签
export async function bulkAddNotes(notes) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let count = 0;
    const total = notes.length;
    
    notes.forEach(note => {
      const newNote = {
        ...note,
        createdAt: note.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      const request = store.add(newNote);
      
      request.onsuccess = () => {
        count++;
        if (count === total) {
          resolve(total);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
    
    if (total === 0) {
      resolve(0);
    }
  });
}

// 备份数据到LocalStorage
export async function backupToLocalStorage() {
  try {
    const notes = await getAllNotes();
    const backupData = {
      version: '1.0',
      timestamp: Date.now(),
      notes
    };
    localStorage.setItem('notesBackup', JSON.stringify(backupData));
    return backupData;
  } catch (error) {
    console.error('备份失败:', error);
    throw error;
  }
}

// 从LocalStorage恢复数据
export async function restoreFromLocalStorage() {
  try {
    const backupStr = localStorage.getItem('notesBackup');
    if (!backupStr) {
      throw new Error('没有找到备份数据');
    }
    
    const backupData = JSON.parse(backupStr);
    if (!backupData.notes || !Array.isArray(backupData.notes)) {
      throw new Error('备份数据格式错误');
    }
    
    // 清空现有数据
    await clearAllNotes();
    // 导入备份数据
    await bulkAddNotes(backupData.notes);
    
    return backupData;
  } catch (error) {
    console.error('恢复失败:', error);
    throw error;
  }
}

// 导出数据为JSON文件
export async function exportNotesToFile() {
  try {
    const notes = await getAllNotes();
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    return notes;
  } catch (error) {
    console.error('导出失败:', error);
    throw error;
  }
}

// 从JSON文件导入数据
export async function importNotesFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const notes = JSON.parse(e.target.result);
        if (!Array.isArray(notes)) {
          throw new Error('文件格式错误，需要JSON数组');
        }
        
        // 清空现有数据
        await clearAllNotes();
        // 导入数据
        const count = await bulkAddNotes(notes);
        resolve(count);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
}

// 初始化自动备份
export function initAutoBackup(interval = 3600000) { // 默认1小时
  // 立即执行一次备份
  backupToLocalStorage().catch(console.error);
  
  // 设置定时备份
  const backupInterval = setInterval(() => {
    backupToLocalStorage().catch(console.error);
  }, interval);
  
  return backupInterval;
}

// 检查是否有备份数据
export function hasBackupData() {
  return localStorage.getItem('notesBackup') !== null;
}

// 获取备份信息
export function getBackupInfo() {
  const backupStr = localStorage.getItem('notesBackup');
  if (backupStr) {
    try {
      const backupData = JSON.parse(backupStr);
      return {
        timestamp: backupData.timestamp,
        noteCount: backupData.notes ? backupData.notes.length : 0
      };
    } catch (error) {
      console.error('解析备份信息失败:', error);
      return null;
    }
  }
  return null;
}