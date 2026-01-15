<template>
  <div class="note">
    <textarea
      v-model="localContent"
      class="note-content"
      placeholder="输入便签内容..."
      @input="handleInput"
      @blur="handleBlur"
    ></textarea>
    <div class="note-footer">
      <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
      <button class="note-delete" @click="handleDelete">
        删除
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { updateNote, deleteNote } from '../utils/db';

const props = defineProps({
  note: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:note', 'delete']);

const localContent = ref(props.note.content);
let debounceTimer = null;

// 监听外部note变化，更新本地内容
watch(
  () => props.note,
  (newNote) => {
    localContent.value = newNote.content;
  },
  { deep: true }
);

// 输入防抖处理，避免频繁更新
function handleInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const updatedNote = await updateNote(props.note.id, localContent.value);
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
    updateNote(props.note.id, localContent.value)
      .then(updatedNote => {
        emit('update:note', updatedNote);
      })
      .catch(error => {
        console.error('更新便签失败:', error);
      });
  }
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
  background-color: #fff9c4;
  border: 1px solid #fbc02d;
  border-radius: 8px;
  padding: 16px;
  width: 280px;
  min-height: 150px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
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
  font-size: 16px;
  line-height: 1.5;
  outline: none;
  font-family: inherit;
  color: #333;
}

.note-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.note-delete {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;
}

.note-delete:hover {
  background-color: #d32f2f;
}

.note-content::placeholder {
  color: #999;
  font-style: italic;
}
</style>