<template>
  <div class="app">
    <!-- 语言切换下拉按钮 -->
    <div class="language-dropdown" ref="languageDropdownRef">
      <button class="lang-dropdown-btn" @click="showLanguageDropdown = !showLanguageDropdown">
        {{ currentLanguage === 'zh-CN' ? $t('language.zh') : $t('language.en') }}
        <span class="dropdown-arrow" :class="{ rotated: showLanguageDropdown }"></span>
      </button>
      <div class="lang-dropdown-menu" v-if="showLanguageDropdown">
        <button 
          class="lang-dropdown-item" 
          @click="switchLanguage('zh-CN')"
          :class="{ active: currentLanguage === 'zh-CN' }"
        >
          {{ $t('language.zh') }}
        </button>
        <button 
          class="lang-dropdown-item" 
          @click="switchLanguage('en-US')"
          :class="{ active: currentLanguage === 'en-US' }"
        >
          {{ $t('language.en') }}
        </button>
      </div>
    </div>
    
    <header class="app-header">
      <h1>{{ $t('app.title') }} - {{ $t('app.title') }}免费便捷的在线笔记工具</h1>
      <p class="app-description">支持快速创建、编辑和管理便签，数据本地存储，安全可靠</p>
      <div class="header-actions">
        <button class="btn btn-primary" @click="addNewNote">
          {{ $t('app.addNote') }}
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
        <h2>{{ $t('app.title') }}</h2>
        <p>{{ $t('app.title') }}{{ $t('app.description') }}</p>
        <ul>
          <li v-for="(feature, index) in $tm('app.features')" :key="index">
            {{ feature }}
          </li>
        </ul>
        <p>{{ $t('app.title') }}{{ $t('app.emptyState.startUsing') }}</p>
      </div>
      <div class="notes-grid" v-else>
        <Note
          v-for="note in notes"
          :key="note.id"
          :note="note"
          :is-dark-mode="isDarkMode"
          @update:note="handleUpdateNote"
          @delete="handleDeleteNote"
        />
      </div>
    </main>
    
    <!-- 版本号信息 -->
    <footer class="app-footer">
      <p class="version-info">
        {{ $t('footer.version') }}: commit {{ commitHash }} | {{ formatDate(commitDate) }} | {{ $t('footer.version') }}于 {{ formatDate(buildTime) }}
      </p>
    </footer>
    
    <!-- 主题切换按钮 -->
    <button class="theme-toggle-btn" @click="toggleTheme" :aria-label="isDarkMode ? $t('theme.light') : $t('theme.dark')">
      <img src="/icons/sun.svg" alt="太阳图标" class="theme-icon" v-if="!isDarkMode" />
      <img src="/icons/moon.svg" alt="月亮图标" class="theme-icon" v-else />
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
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

// 版本号信息 - 从构建时注入
const commitHash = __COMMIT_HASH__;
const commitDate = __COMMIT_DATE__;
const buildTime = __BUILD_TIME__;

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

// i18n 实例
const { locale } = useI18n();
const currentLanguage = computed(() => locale.value);

// 语言下拉菜单
const showLanguageDropdown = ref(false);
const languageDropdownRef = ref(null);

// 主题管理
const isDarkMode = ref(false);

// 切换主题
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  // 保存主题设置到localStorage
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
  // 更新body类
  updateBodyClass();
}

// 更新body类
function updateBodyClass() {
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 切换语言
function switchLanguage(lang) {
  locale.value = lang;
  localStorage.setItem('language', lang);
  showLanguageDropdown.value = false;
}

// 初始化加载所有便签
onMounted(async () => {
  try {
    const allNotes = await getAllNotes();
    notes.value = allNotes;
    
    // 初始化备份信息
    updateBackupInfo();
    
    // 启动自动备份
    setupAutoBackup();
    
    // 初始化主题
    const savedTheme = localStorage.getItem('theme');
    isDarkMode.value = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // 初始化语言
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      locale.value = savedLanguage;
    }
    
    // 更新body类
    updateBodyClass();
    
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
  if (showLanguageDropdown.value && languageDropdownRef.value && !languageDropdownRef.value.contains(event.target)) {
    showLanguageDropdown.value = false;
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

/* 语言下拉菜单样式 */
.language-dropdown {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.lang-dropdown-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  justify-content: space-between;
}

.lang-dropdown-btn:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.dropdown-arrow {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #666;
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.lang-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 100%;
  margin-top: 4px;
  overflow: hidden;
  animation: dropdownFadeIn 0.2s ease;
}

.lang-dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  border: none;
  background: none;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-dropdown-item:hover {
  background-color: #f5f5f5;
}

.lang-dropdown-item.active {
  background-color: var(--primary-color);
  color: white;
}

/* 动画效果 */
@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 暗色模式下的语言下拉菜单样式 */
:deep(.dark-mode) .lang-dropdown-btn {
  background-color: #444;
  color: #ddd;
  border-color: #555;
}

:deep(.dark-mode) .lang-dropdown-btn:hover {
  background-color: #555;
  border-color: #666;
}

:deep(.dark-mode) .dropdown-arrow {
  border-top-color: #ddd;
}

:deep(.dark-mode) .lang-dropdown-menu {
  background-color: #444;
  border-color: #555;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.dark-mode) .lang-dropdown-item {
  color: #ddd;
}

:deep(.dark-mode) .lang-dropdown-item:hover {
  background-color: #555;
}

:deep(.dark-mode) .lang-dropdown-item.active {
  background-color: var(--primary-color);
  color: white;
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
  align-items: start;
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

/* 版本号样式 */
.app-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
  font-size: 12px;
  color: #999;
  padding-bottom: 20px;
  transition: all var(--transition-base);
}

.version-info {
  margin: 0;
  font-family: monospace;
}

/* 主题切换按钮样式 */
.theme-toggle-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--primary-color);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  transition: all var(--transition-base);
  z-index: 1000;
}

.theme-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.theme-icon {
  width: 24px;
  height: 24px;
  color: white;
  transition: all var(--transition-base);
}
</style>