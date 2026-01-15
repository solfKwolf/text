<template>
  <div class="app">

    
    <header class="app-header">
      <h1>在线便签 - 免费便捷的在线笔记工具</h1>
      <p class="app-description">支持快速创建、编辑和管理便签，数据本地存储，安全可靠</p>
      <button class="add-note-btn" @click="addNewNote">
        添加便签
      </button>
    </header>
    
    <main class="app-main">
      <div v-if="notes.length === 0" class="empty-state">
        <h2>开始使用在线便签</h2>
        <p>在线便签是一款免费、便捷的在线笔记工具，支持：</p>
        <ul>
          <li>快速创建和编辑便签</li>
          <li>数据本地存储，安全可靠</li>
          <li>响应式设计，适配各种设备</li>
          <li>简洁美观的界面</li>
        </ul>
        <p>点击上方"添加便签"按钮开始创建您的第一个便签吧！</p>
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
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
  text-align: center;
}

.app-header h1 {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.app-description {
  font-size: 16px;
  color: #666;
  margin: 0 0 16px 0;
  max-width: 600px;
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
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 2px dashed #ddd;
  max-width: 800px;
  margin: 0 auto;
}

.empty-state h2 {
  font-size: 24px;
  color: #333;
  margin: 0 0 16px 0;
}

.empty-state p {
  font-size: 16px;
  margin: 12px 0;
}

.empty-state ul {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.empty-state li {
  font-size: 16px;
  margin: 8px 0;
  padding: 8px 0;
  background-color: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
}

.empty-state li:before {
  content: "✓ ";
  color: #4caf50;
  font-weight: bold;
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