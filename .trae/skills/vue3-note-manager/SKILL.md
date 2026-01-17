---
name: "vue3-note-manager"
description: "管理Vue 3便签应用的核心功能，包括便签的增删改查、数据持久化和用户体验优化。当需要开发或改进便签应用时调用。"
---

# Vue 3 便签管理器

## 功能介绍

这个技能用于管理基于Vue 3 + Vite的在线便签应用，提供完整的便签管理功能，包括：

1. **便签基本操作**：创建、编辑、删除便签
2. **数据持久化**：使用IndexedDB进行本地存储
3. **数据管理**：导入/导出数据、备份/恢复功能
4. **用户体验优化**：响应式设计、实时更新

## 核心文件结构

```
src/
├── App.vue              # 主应用组件
├── main.js              # 应用入口
├── components/          # Vue组件
└── utils/               # 工具函数
    └── db.js           # IndexedDB操作封装
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
    await importNotesFromFile(file);
    // 重新加载便签
    const allNotes = await getAllNotes();
    notes.value = allNotes;
    alert('导入成功！');
  } catch (error) {
    alert('导入失败: ' + error.message);
  }
}
```

## 技术栈

- **Vue 3**：使用Composition API开发
- **Vite**：构建工具
- **IndexedDB**：本地数据存储
- **LocalStorage**：数据备份

## 优化建议

1. **添加标签系统**：支持为便签添加多个标签，实现按标签筛选
2. **搜索功能**：添加搜索框，支持按内容搜索便签
3. **便签个性化**：支持为便签设置不同颜色、主题等
4. **排序功能**：支持按创建时间、更新时间排序
5. **内容增强**：支持基本文本格式化、插入图片等

## 扩展功能

- **键盘快捷键**：添加常用操作的键盘快捷键
- **夜间模式**：实现明暗主题切换
- **便签提醒**：支持添加便签提醒功能
- **云同步**：添加云同步功能，实现多设备数据同步

这个技能可以帮助开发者快速开发和扩展Vue 3便签应用，提供完整的功能框架和最佳实践。