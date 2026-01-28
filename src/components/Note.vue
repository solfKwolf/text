<template>
  <div class="note" :style="noteStyle">
    <textarea
      v-model="localContent"
      class="note-content"
      :placeholder="$t('note.content')"
      @input="handleInput"
      @blur="handleBlur"
    ></textarea>
    <div class="note-footer">
      <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
      <div class="note-actions">
        <button class="btn btn-sm" @click="showStylePanel = !showStylePanel">
          {{ $t('app.style') }}
        </button>
        <button class="btn btn-danger btn-sm" @click="handleDelete">
          {{ $t('note.delete') }}
        </button>
      </div>
    </div>
    <!-- 样式编辑面板 -->
    <div class="style-panel" v-if="showStylePanel">
      <!-- 颜色选择器 -->
      <div class="style-section">
        <label>{{ $t('note.color') }}:</label>
        <div class="color-picker">
          <div
            v-for="color in presetColors"
            :key="color"
            class="color-option"
            :style="{ backgroundColor: color }"
            @click="changeColor(color)"
          ></div>
          <input
            type="color"
            class="custom-color"
            v-model="customColor"
            @input="changeColor(customColor)"
          />
        </div>
      </div>
      <!-- 字体大小调整 -->
      <div class="style-section">
        <label>{{ $t('note.fontSize') }}: {{ localFontSize }}px</label>
        <input
          type="range"
          min="12"
          max="24"
          step="2"
          v-model.number="localFontSize"
          @input="changeFontSize"
          class="font-size-slider"
        />
      </div>
      <!-- 主题选择 -->
      <div class="style-section">
        <label>{{ $t('note.theme') }}:</label>
        <select v-model="localTheme" @change="changeTheme" class="theme-select">
          <option value="default">默认</option>
          <option value="blue">蓝色</option>
          <option value="green">绿色</option>
          <option value="purple">紫色</option>
          <option value="pink">粉色</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { updateNote, deleteNote } from '../utils/db';

// 初始化i18n
useI18n();

const props = defineProps({
  note: {
    type: Object,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:note', 'delete']);

// 本地内容
const localContent = ref(props.note.content);
// 样式面板显示状态
const showStylePanel = ref(false);
// 本地样式状态
const localColor = ref(props.note.color);
const localFontSize = ref(props.note.fontSize);
const localTheme = ref(props.note.theme);
// 自定义颜色
const customColor = ref(props.note.color);
// 预设颜色
const presetColors = [
  '#fff9c4', // 默认黄色
  '#e8f5e8', // 绿色
  '#e3f2fd', // 蓝色
  '#f3e5f5', // 紫色
  '#ffebee', // 红色
  '#fff3e0', // 橙色
  '#e0f2f1', // 青色
  '#fce4ec', // 粉色
  '#fafafa', // 白色
  '#e0e0e0'  // 灰色
];
// 主题配置
const themes = {
  default: { color: '#fff9c4', fontSize: 16 },
  blue: { color: '#e3f2fd', fontSize: 16 },
  green: { color: '#e8f5e8', fontSize: 16 },
  purple: { color: '#f3e5f5', fontSize: 16 },
  pink: { color: '#fce4ec', fontSize: 16 }
};

let debounceTimer = null;

// 动态样式计算
const noteStyle = computed(() => {
  return {
    backgroundColor: props.isDarkMode ? '#3d3d3d' : props.note.color,
    fontSize: `${props.note.fontSize}px`
  };
});

// 监听外部note变化，更新本地状态
watch(
  () => props.note,
  (newNote) => {
    localContent.value = newNote.content;
    localColor.value = newNote.color;
    localFontSize.value = newNote.fontSize;
    localTheme.value = newNote.theme;
    customColor.value = newNote.color;
  },
  { deep: true }
);

// 输入防抖处理，避免频繁更新
function handleInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const updatedNote = await updateNote(props.note.id, { content: localContent.value });
      emit('update:note', updatedNote);
    } catch (error) {
      console.error('更新便签失败:', error);
    }
  }, 300);
}

// 失去焦点时立即更新
function handleBlur() {
  clearTimeout(debounceTimer);
  if (localContent.value !== props.note.content) {
    updateNote(props.note.id, { content: localContent.value })
      .then(updatedNote => {
        emit('update:note', updatedNote);
      })
      .catch(error => {
        console.error('更新便签失败:', error);
      });
  }
}

// 更改背景颜色
function changeColor(color) {
  updateNote(props.note.id, { color })
    .then(updatedNote => {
      emit('update:note', updatedNote);
    })
    .catch(error => {
      console.error('更新便签颜色失败:', error);
    });
}

// 更改字体大小
function changeFontSize() {
  updateNote(props.note.id, { fontSize: localFontSize.value })
    .then(updatedNote => {
      emit('update:note', updatedNote);
    })
    .catch(error => {
      console.error('更新便签字体大小失败:', error);
    });
}

// 更改主题
function changeTheme() {
  const theme = themes[localTheme.value] || themes.default;
  updateNote(props.note.id, {
    color: theme.color,
    fontSize: theme.fontSize,
    theme: localTheme.value
  })
    .then(updatedNote => {
      emit('update:note', updatedNote);
    })
    .catch(error => {
      console.error('更新便签主题失败:', error);
    });
}

// 删除便签
function handleDelete() {
  deleteNote(props.note.id)
    .then(() => {
      emit('delete', props.note.id);
    })
    .catch(error => {
      console.error('删除便签失败:', error);
    });
}

// 格式化日期
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.note {
  border: 1px solid #fbc02d;
  border-radius: 8px;
  padding: 16px;
  width: 280px;
  min-height: 150px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease;
  position: relative;
}

.note:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.note-content {
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  line-height: 1.5;
  outline: none;
  font-family: inherit;
  color: var(--text-primary);
  transition: font-size 0.2s ease, color 0.3s ease;
}

.note-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
  transition: color 0.3s ease;
}

.note-actions {
  display: flex;
  gap: 8px;
}

.note-date {
  font-size: 11px;
  color: #888;
  transition: color 0.3s ease;
}

/* 样式面板 */
.style-panel {
  margin-top: 16px;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.style-section {
  margin-bottom: 12px;
}

.style-section:last-child {
  margin-bottom: 0;
}

.style-section label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #555;
  transition: color 0.3s ease;
}

/* 颜色选择器 */
.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #e0e0e0;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: #333;
}

.custom-color {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
}

.custom-color::-webkit-color-swatch {
  border: none;
  border-radius: 50%;
}

.custom-color::-moz-color-swatch {
  border: none;
  border-radius: 50%;
}

/* 字体大小滑块 */
.font-size-slider {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  transition: background-color 0.3s ease;
}

.font-size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #409eff;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.font-size-slider::-webkit-slider-thumb:hover {
  background: #66b1ff;
  transform: scale(1.2);
}

.font-size-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #409eff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.font-size-slider::-moz-range-thumb:hover {
  background: #66b1ff;
  transform: scale(1.2);
}

/* 主题选择 */
.theme-select {
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
}

.theme-select:hover {
  border-color: #409eff;
}

.theme-select:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 按钮样式 */
.btn {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #e0e0e0;
  background-color: white;
  color: #555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background-color: #f5f7fa;
  border-color: #c0c4cc;
}

.btn-danger {
  background-color: #f56c6c;
  color: white;
  border-color: #f56c6c;
}

.btn-danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}

/* 输入框占位符 */
.note-content::placeholder {
  color: #999;
  font-style: italic;
  transition: color 0.3s ease;
}

/* 暗色模式样式 */
:deep(.dark-mode) .note {
  border-color: #444;
  background-color: #3d3d3d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

:deep(.dark-mode) .note:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

:deep(.dark-mode) .note-content {
  color: #fff;
}

:deep(.dark-mode) .note-content::placeholder {
  color: #888;
}

:deep(.dark-mode) .note-footer {
  color: #aaa;
}

:deep(.dark-mode) .note-date {
  color: #888;
}

:deep(.dark-mode) .style-panel {
  background-color: rgba(51, 51, 51, 0.8);
  border-color: #555;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

:deep(.dark-mode) .style-section label {
  color: #ddd;
}

:deep(.dark-mode) .color-option {
  border-color: #555;
}

:deep(.dark-mode) .color-option:hover {
  border-color: #fff;
}

:deep(.dark-mode) .custom-color {
  border-color: #555;
}

:deep(.dark-mode) .font-size-slider {
  background: #555;
}

:deep(.dark-mode) .theme-select {
  background-color: #444;
  color: #ddd;
  border-color: #555;
}

:deep(.dark-mode) .theme-select:hover {
  border-color: #66b1ff;
}

:deep(.dark-mode) .theme-select:focus {
  border-color: #66b1ff;
  box-shadow: 0 0 0 2px rgba(102, 177, 255, 0.2);
}

:deep(.dark-mode) .btn {
  background-color: #444;
  color: #ddd;
  border-color: #555;
}

:deep(.dark-mode) .btn:hover {
  background-color: #555;
  border-color: #666;
}

:deep(.dark-mode) .btn-danger {
  background-color: #f56c6c;
  color: white;
  border-color: #f56c6c;
}

:deep(.dark-mode) .btn-danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}
</style>