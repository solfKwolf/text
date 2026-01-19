---
name: "vue3-note-manager"
description: "管理Vue 3便签应用的核心功能，包括便签的增删改查、数据持久化、数据管理增强和用户体验优化。当需要开发或改进便签应用时调用。"
---

# Vue 3 便签管理器

## 功能介绍

这个技能用于管理基于Vue 3 + Vite的在线便签应用，提供完整的便签管理功能，包括：

1. **便签基本操作**：创建、编辑、删除便签
2. **数据持久化**：使用IndexedDB进行本地存储
3. **数据管理增强**：
   - 导入/导出数据（JSON格式）
   - 备份/恢复功能（LocalStorage）
   - 自动备份机制（可设置备份间隔）
4. **UI优化**：
   - 响应式设计
   - 统一的按钮样式
   - 点击外部关闭下拉菜单
5. **用户体验**：实时更新、平滑动画效果

## 核心文件结构

```
src/
├── App.vue              # 主应用组件
├── main.js              # 应用入口
├── style.css            # 全局样式（包含公共按钮样式）
├── components/          # Vue组件
│   └── Note.vue         # 单个便签组件
└── utils/               # 工具函数
    └── db.js            # IndexedDB操作封装
```

## 主要功能实现

### 1. 便签管理

- **创建便签**：调用`addNote`函数添加新便签
- **编辑便签**：实时更新便签内容并保存到数据库
- **删除便签**：从列表中移除并删除数据库记录
- **获取所有便签**：从IndexedDB读取并展示所有便签

### 2. 数据持久化

使用IndexedDB进行本地数据存储，提供以下功能：

- `getAllNotes()`：获取所有便签
- `addNote(note)`：添加新便签
- `updateNote(id, content)`：更新便签
- `deleteNote(id)`：删除便签
- `clearAllNotes()`：清空所有便签
- `bulkAddNotes(notes)`：批量添加便签

### 3. 数据管理增强

- **导出数据**：将便签导出为JSON文件
- **导入数据**：从JSON文件导入便签
- **备份数据**：将数据备份到LocalStorage
- **恢复数据**：从LocalStorage恢复数据
- **自动备份**：
  - 可开启/关闭自动备份
  - 支持设置不同备份间隔（10分钟、30分钟、1小时、2小时、24小时）
  - 显示自动备份状态

### 4. 公共样式

提供统一的按钮样式和UI组件：

- **基础按钮**：`.btn` - 统一的大小、圆角、过渡效果
- **按钮变体**：
  - `.btn-primary` - 主要按钮（绿色）
  - `.btn-secondary` - 次要按钮（蓝色）
  - `.btn-danger` - 危险按钮（红色）
  - `.btn-sm` - 小型按钮
- **状态样式**：悬停、点击、禁用状态

## 核心功能详解

### 1. 数据管理功能

#### 1.1 导出功能

```javascript
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
```

#### 1.2 导入功能

```javascript
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
```

#### 1.3 自动备份设置

```javascript
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
```

### 2. UI优化

#### 2.1 统一按钮样式

```css
/* 公共按钮样式类 */
.btn {
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 110px;
  text-align: center;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 按钮变体 */
.btn-primary { background-color: #4caf50; color: white; }
.btn-secondary { background-color: #2196f3; color: white; }
.btn-danger { background-color: #f44336; color: white; }
.btn-sm { padding: 6px 12px; font-size: 12px; min-width: 80px; }
```

#### 2.2 点击外部关闭下拉菜单

```javascript
// 点击外部关闭菜单
function handleClickOutside(event) {
  if (showDataMenu.value && dataMenuRef.value && !dataMenuRef.value.contains(event.target)) {
    showDataMenu.value = false;
  }
}

// 在组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// 在组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
```

## 主要功能实现

### 1. 便签管理

- **创建便签**：调用`addNote`函数添加新便签
- **编辑便签**：实时更新便签内容并保存到数据库
- **删除便签**：从列表中移除并删除数据库记录
- **获取所有便签**：从IndexedDB读取并展示所有便签

### 2. 数据持久化

使用IndexedDB进行本地数据存储，提供以下功能：

- `getAllNotes()`：获取所有便签
- `addNote(note)`：添加新便签
- `updateNote(id, content)`：更新便签
- `deleteNote(id)`：删除便签

### 3. 数据管理

- **导出数据**：将便签导出为JSON文件
- **导入数据**：从JSON文件导入便签
- **备份数据**：将数据备份到LocalStorage
- **恢复数据**：从LocalStorage恢复数据
- **自动备份**：设置定时自动备份

## 使用示例

### 创建新便签

```javascript
// 在组件中调用
const newNote = await addNote({ content: '' });
notes.value.push(newNote);
```

### 编辑便签

```javascript
// 监听便签内容变化
const handleNoteChange = async (id, content) => {
  await updateNote(id, content);
};
```

### 数据导入导出

```javascript
// 导出数据
export async function handleExport() {
  try {
    await exportNotesToFile();
    alert('导出成功！');
  } catch (error) {
    alert('导出失败: ' + error.message);
  }
}

// 导入数据
export async function handleImport(event) {
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
    alert('导入失败: ' + error.message);
    // 重置文件输入
    event.target.value = '';
  }
}
```

### 自动备份设置

```javascript
// 处理备份间隔变化
function handleBackupIntervalChange() {
  setupAutoBackup();
}

// 设置自动备份
function setupAutoBackup() {
  cancelAutoBackup();
  
  if (autoBackupEnabled.value) {
    autoBackupInterval.value = initAutoBackup(backupInterval.value);
  }
}
```

## 技术栈

- **Vue 3**：使用Composition API开发
- **Vite**：构建工具
- **IndexedDB**：本地数据存储
- **LocalStorage**：数据备份
- **CSS3**：响应式设计和动画效果

## 优化建议

1. **添加标签系统**：支持为便签添加多个标签，实现按标签筛选
2. **搜索功能**：添加搜索框，支持按内容搜索便签
3. **便签个性化**：支持为便签设置不同颜色、主题等
4. **排序功能**：支持按创建时间、更新时间排序
5. **内容增强**：支持基本文本格式化、插入图片等
6. **性能优化**：
   - 实现虚拟列表，优化大量便签的渲染性能
   - 添加防抖/节流，减少频繁的数据库操作
   - 使用Web Workers处理大量数据的导入/导出

## 扩展功能

- **键盘快捷键**：添加常用操作的键盘快捷键
- **夜间模式**：实现明暗主题切换
- **便签提醒**：支持添加便签提醒功能
- **云同步**：添加云同步功能，实现多设备数据同步
- **便签共享**：支持生成便签链接分享给他人

## 常见问题与解决方案

### 1. 更新便签时报错

**问题**：`DataError: Failed to execute 'get' on 'IDBObjectStore': No key or key range specified.`

**解决方案**：确保在调用`updateNote`函数时正确传递了`id`参数，并且该参数不为空。

### 2. 自动备份不工作

**问题**：设置了自动备份但没有执行

**解决方案**：检查`autoBackupEnabled`状态是否为`true`，并确保`setupAutoBackup`函数正确调用了`initAutoBackup`。

### 3. 导入数据失败

**问题**：导入JSON文件时提示格式错误

**解决方案**：确保导入的文件是有效的JSON数组格式，并且包含正确的便签数据结构。

## 最佳实践

1. **代码组织**：使用清晰的文件结构和命名规范
2. **错误处理**：添加完善的错误处理机制
3. **用户反馈**：提供清晰的操作结果提示
4. **性能优化**：避免频繁的DOM操作和数据库查询
5. **可访问性**：确保应用对所有用户都可访问
6. **安全性**：保护用户数据，避免XSS等安全问题

这个技能可以帮助开发者快速开发和扩展Vue 3便签应用，提供完整的功能框架、最佳实践和解决方案。