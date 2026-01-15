<template>
  <div class="app">
    <header class="app-header">
      <h1>在线便签</h1>
      <button class="add-note-btn" @click="addNewNote">
        添加便签
      </button>
    </header>
    
    <main class="app-main">
      <div v-if="notes.length === 0" class="empty-state">
        <p>还没有便签，点击上方"添加便签"开始创建</p>
      </div>
      <div class="notes-grid" v-else>
        <Note
          v-for="note in notes"
          :key="note.id"
          :note="note"
          @update:note="handleUpdateNote"
          @delete="handleDeleteNote"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Note from './components/Note.vue';
import { getAllNotes, addNote } from './utils/db';

const notes = ref([]);

// 初始化加载所有便签
onMounted(async () => {
  try {
    const allNotes = await getAllNotes();
    notes.value = allNotes;
  } catch (error) {
    console.error('加载便签失败:', error);
  }
});

// 添加新便签
async function addNewNote() {
  try {
    const newNote = await addNote({ content: '' });
    notes.value.push(newNote);
  } catch (error) {
    console.error('添加便签失败:', error);
  }
}

// 处理便签更新
function handleUpdateNote(updatedNote) {
  const index = notes.value.findIndex(note => note.id === updatedNote.id);
  if (index !== -1) {
    notes.value[index] = updatedNote;
  }
}

// 处理便签删除
function handleDeleteNote(noteId) {
  notes.value = notes.value.filter(note => note.id !== noteId);
}
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.app-header h1 {
  font-size: 28px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.add-note-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.add-note-btn:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-main {
  min-height: 500px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 18px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

@media (max-width: 768px) {
  .app {
    padding: 15px;
  }
  
  .app-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .notes-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
}
</style>