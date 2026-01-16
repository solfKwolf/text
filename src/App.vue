<template>
  <div class="app">
    <header class="app-header">
      <h1>在线便签 - 免费便捷的在线笔记工具</h1>
      <p class="app-description">支持快速创建、编辑和管理便签，数据本地存储，安全可靠</p>
      <div class="header-actions">
        <button class="btn btn-primary" @click="addNewNote">
          添加便签
        </button>
        <div class="data-menu" ref="dataMenuRef">
          <button class="btn btn-secondary" @click="showDataMenu = !showDataMenu">
            数据管理
          </button>
          <div class="data-menu-dropdown" v-if="showDataMenu">
            <button class="menu-item" @click="handleExport">
              导出数据 (JSON)
            </button>
            <label class="menu-item file-input-label">
              导入数据 (JSON)
              <input 
                type="file" 
                accept=".json" 
                @change="handleImport"
                class="file-input"
              >
            </label>
            <button class="menu-item" @click="handleBackup">
              手动备份
            </button>
            <button class="menu-item" @click="handleRestore" :disabled="!hasBackupData()">
              从备份恢复
            </button>
            <div class="menu-divider"></div>
            <div class="menu-divider"></div>
            <button class="menu-item" @click="toggleAutoBackupSettings">
              自动备份设置
            </button>
            <div class="auto-backup-settings" v-if="showAutoBackupSettings">
              <div class="setting-item">
                <span class="setting-label">自动备份:</span>
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="autoBackupEnabled" 
                    @change="handleAutoBackupToggle"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-item" :disabled="!autoBackupEnabled">
                <span class="setting-label">备份间隔:</span>
                <select 
                  v-model="backupInterval" 
                  @change="handleBackupIntervalChange" 
                  class="interval-select"
                  :disabled="!autoBackupEnabled"
                >
                  <option 
                    v-for="interval in backupIntervals" 
                    :key="interval.value" 
                    :value="interval.value"
                  >
                    {{ interval.label }}
                  </option>
                </select>
              </div>
              <div class="setting-status">
                <span class="status-text">
                  {{ autoBackupEnabled ? '自动备份已开启' : '自动备份已关闭' }}
                </span>
              </div>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-info" v-if="backupInfo">
              <div class="info-item">
                <span class="info-label">最近备份:</span>
                <span class="info-value">{{ formatBackupTime(backupInfo.timestamp) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">备份数量:</span>
                <span class="info-value">{{ backupInfo.noteCount }} 个便签</span>
              </div>
            </div>
            <div class="menu-info" v-else>
              <span>暂无备份数据</span>
            </div>
          </div>
        </div>
      </div>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import Note from './components/Note.vue';
import {
  getAllNotes,
  addNote,
  exportNotesToFile,
  importNotesFromFile,
  backupToLocalStorage,
  restoreFromLocalStorage,
  initAutoBackup,
  hasBackupData,
  getBackupInfo
} from './utils/db';

const notes = ref([]);
const showDataMenu = ref(false);
const backupInfo = ref(null);
const autoBackupInterval = ref(null);
const dataMenuRef = ref(null);
const autoBackupEnabled = ref(true);
const backupInterval = ref(3600000); // 默认1小时
const backupIntervals = [
  { value: 600000, label: '10分钟' },
  { value: 1800000, label: '30分钟' },
  { value: 3600000, label: '1小时' },
  { value: 7200000, label: '2小时' },
  { value: 86400000, label: '24小时' }
];
const showAutoBackupSettings = ref(false);

// 初始化加载所有便签
onMounted(async () => {
  try {
    const allNotes = await getAllNotes();
    notes.value = allNotes;
    
    // 初始化备份信息
    updateBackupInfo();
    
    // 启动自动备份
    setupAutoBackup();
    
    // 添加点击外部关闭菜单的事件监听
    document.addEventListener('click', handleClickOutside);
  } catch (error) {
    console.error('加载便签失败:', error);
  }
});

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  cancelAutoBackup();
});

// 设置自动备份
function setupAutoBackup() {
  cancelAutoBackup();
  if (autoBackupEnabled.value) {
    autoBackupInterval.value = initAutoBackup(backupInterval.value);
  }
}

// 取消自动备份
function cancelAutoBackup() {
  if (autoBackupInterval.value) {
    clearInterval(autoBackupInterval.value);
    autoBackupInterval.value = null;
  }
}

// 处理自动备份开关变化
function handleAutoBackupToggle() {
  setupAutoBackup();
}

// 处理备份间隔变化
function handleBackupIntervalChange() {
  setupAutoBackup();
}

// 切换自动备份设置显示
function toggleAutoBackupSettings() {
  showAutoBackupSettings.value = !showAutoBackupSettings.value;
}

// 点击外部关闭菜单
function handleClickOutside(event) {
  if (showDataMenu.value && dataMenuRef.value && !dataMenuRef.value.contains(event.target)) {
    showDataMenu.value = false;
  }
}

// 更新备份信息
function updateBackupInfo() {
  backupInfo.value = getBackupInfo();
}

// 处理导出
async function handleExport() {
  try {
    await exportNotesToFile();
    alert('导出成功！');
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
}

// 处理导入
async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const count = await importNotesFromFile(file);
    // 重新加载便签
    const allNotes = await getAllNotes();
    notes.value = allNotes;
    alert(`导入成功！共导入 ${count} 个便签`);
    // 重置文件输入
    event.target.value = '';
  } catch (error) {
    console.error('导入失败:', error);
    alert('导入失败: ' + error.message);
    // 重置文件输入
    event.target.value = '';
  }
}

// 处理手动备份
async function handleBackup() {
  try {
    await backupToLocalStorage();
    updateBackupInfo();
    alert('备份成功！');
  } catch (error) {
    console.error('备份失败:', error);
    alert('备份失败: ' + error.message);
  }
}

// 处理恢复
async function handleRestore() {
  if (!hasBackupData()) {
    alert('没有找到备份数据！');
    return;
  }
  
  if (!confirm('确定要从备份恢复数据吗？这将覆盖当前所有便签！')) {
    return;
  }
  
  try {
    await restoreFromLocalStorage();
    // 重新加载便签
    const allNotes = await getAllNotes();
    notes.value = allNotes;
    alert('恢复成功！');
  } catch (error) {
    console.error('恢复失败:', error);
    alert('恢复失败: ' + error.message);
  }
}

// 格式化备份时间
function formatBackupTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

.data-menu {
  position: relative;
}

.data-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1000;
  margin-top: 4px;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  border: none;
  background: none;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 0;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item:disabled {
  color: #999;
  cursor: not-allowed;
}

.menu-item:disabled:hover {
  background-color: transparent;
}

.file-input-label {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.file-input {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 100%;
  min-height: 100%;
  font-size: 100px;
  text-align: right;
  filter: alpha(opacity=0);
  opacity: 0;
  outline: none;
  cursor: pointer;
  display: block;
}

.menu-divider {
  height: 1px;
  background-color: #eee;
  margin: 8px 0;
}

.menu-info {
  padding: 10px 16px;
  font-size: 12px;
  color: #666;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.info-label {
  font-weight: 500;
}

.info-value {
  color: #333;
}

/* 自动备份设置样式 */
.auto-backup-settings {
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  font-size: 14px;
  color: #333;
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #4caf50;
}

input:focus + .toggle-slider {
  box-shadow: 0 0 1px #4caf50;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* 下拉选择框样式 */
.interval-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
}

.interval-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #999;
}

/* 设置状态样式 */
.setting-status {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.status-text {
  font-size: 12px;
  color: #666;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .add-note-btn,
  .data-menu-btn {
    width: 100%;
  }
  
  .data-menu-dropdown {
    left: 0;
    right: 0;
    min-width: auto;
  }
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