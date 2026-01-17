---
name: "vue-expert"
description: "Vue 3 专家技能，提供 Vue 3 开发的最佳实践、组件设计、性能优化和架构建议。当需要开发、优化或重构 Vue 3 应用时调用。"
---

# Vue 3 专家

## 功能介绍

这个技能提供全面的 Vue 3 开发支持，包括核心功能实现、最佳实践指导、性能优化建议和架构设计方案。

### 核心功能

1. **Vue 3 基础**：Composition API、响应式系统、生命周期钩子
2. **组件设计**：组件拆分、Props 设计、事件处理、插槽使用
3. **状态管理**：Pinia 集成、状态设计、持久化方案
4. **路由管理**：Vue Router 集成、路由设计、权限控制
5. **性能优化**：虚拟列表、懒加载、缓存策略、SSR 支持
6. **工具链**：Vite 配置、ESLint 规范、单元测试
7. **最佳实践**：代码组织、样式管理、可访问性

## 技术栈

- **Vue 3**：使用 Composition API 开发
- **Vite**：构建工具
- **Pinia**：状态管理
- **Vue Router**：路由管理
- **ESLint**：代码规范
- **Vitest**：单元测试

## 最佳实践

### 1. 组件设计原则

- **单一职责**：每个组件只负责一个功能
- **props 验证**：使用 TypeScript 或 props 验证确保数据类型正确
- **事件命名**：使用 kebab-case 命名事件，如 `update:model-value`
- **插槽设计**：合理使用默认插槽和具名插槽，增强组件灵活性
- **样式隔离**：使用 scoped CSS 或 CSS Modules 避免样式冲突

### 2. Composition API 使用

```javascript
// 推荐：使用组合式函数组织逻辑
import { ref, computed, onMounted } from 'vue';

const useCounter = () => {
  const count = ref(0);
  const doubled = computed(() => count.value * 2);
  
  const increment = () => {
    count.value++;
  };
  
  onMounted(() => {
    console.log('Counter mounted');
  });
  
  return {
    count,
    doubled,
    increment
  };
};

export default useCounter;
```

### 3. 状态管理设计

- **模块化**：按功能模块拆分 Pinia store
- **扁平化状态**：避免深层嵌套状态，便于维护
- **使用 actions 处理异步**：将异步逻辑封装在 actions 中
- **持久化状态**：使用插件或自定义逻辑持久化关键状态

```javascript
// stores/counter.js
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    lastUpdated: null
  }),
  
  getters: {
    doubled: (state) => state.count * 2
  },
  
  actions: {
    increment() {
      this.count++;
      this.lastUpdated = new Date();
    },
    
    async fetchCount() {
      // 异步逻辑
      const response = await fetch('/api/count');
      const data = await response.json();
      this.count = data.count;
    }
  }
});
```

### 4. 路由设计

- **嵌套路由**：合理使用嵌套路由组织页面结构
- **动态路由**：使用动态路由处理参数化页面
- **路由守卫**：使用全局守卫、路由守卫和组件守卫控制访问
- **懒加载**：使用动态导入实现路由组件懒加载

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/views/About.vue')
    },
    {
      path: '/users/:id',
      name: 'UserDetail',
      component: () => import('@/views/UserDetail.vue'),
      props: true
    }
  ]
});
```

### 5. 性能优化

- **虚拟列表**：使用 `vue-virtual-scroller` 或自定义实现处理大数据列表
- **懒加载**：图片、组件、路由的懒加载
- **缓存策略**：使用 `keep-alive` 缓存组件，使用 HTTP 缓存优化请求
- **减少重渲染**：合理使用 `computed`、`watch` 和 `watchEffect`，避免不必要的重渲染
- **SSR 支持**：对于需要 SEO 的应用，考虑使用 Nuxt 或 Vite SSR

### 6. 样式管理

- **CSS 变量**：使用 CSS 变量实现主题切换和样式复用
- **原子化 CSS**：考虑使用 Tailwind CSS 或 Windi CSS 实现高效样式开发
- **样式抽取**：将公共样式抽取为独立文件，方便复用
- **响应式设计**：使用 CSS Grid 和 Flexbox 实现响应式布局

## 工具链配置

### 1. Vite 配置

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
```

### 2. ESLint 配置

参考项目中的 `.eslintrc.js` 或 `eslint.config.js` 配置，确保代码符合规范。

### 3. 单元测试

使用 Vitest 进行单元测试，测试组件、组合式函数和工具函数。

```javascript
// tests/components/Button.test.js
import { mount } from '@vue/test-utils';
import Button from '@/components/Button.vue';

describe('Button Component', () => {
  it('renders correctly', () => {
    const wrapper = mount(Button, {
      props: {
        type: 'primary'
      },
      slots: {
        default: 'Click me'
      }
    });
    
    expect(wrapper.text()).toBe('Click me');
    expect(wrapper.classes()).toContain('btn-primary');
  });
  
  it('emits click event', async () => {
    const wrapper = mount(Button);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
```

## 常见问题解决方案

### 1. 响应式数据更新不触发重渲染

- 确保使用 `ref` 或 `reactive` 包装数据
- 对于数组和对象，使用 Vue 提供的方法修改，或使用 `toRefs`
- 检查是否在模板中使用了响应式数据

### 2. 组件间通信

- **父子组件**：使用 props 和事件
- **祖孙组件**：使用 `provide/inject`
- **跨组件**：使用 Pinia 或事件总线

### 3. 路由守卫中的异步操作

```javascript
// router/index.js
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  if (requiresAuth) {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
      next();
    } else {
      next('/login');
    }
  } else {
    next();
  }
});
```

## 使用示例

### 创建一个基础组件

```vue
<template>
  <div class="card">
    <slot name="header">
      <h3>{{ title }}</h3>
    </slot>
    <slot></slot>
    <slot name="footer"></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.card {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  background-color: var(--card-bg);
  box-shadow: var(--shadow-sm);
}
</style>
```

### 使用组合式函数

```vue
<template>
  <div class="counter">
    <h2>{{ count }}</h2>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup>
import useCounter from '@/composables/useCounter';

const { count, doubled, increment } = useCounter();
</script>
```

## 架构设计建议

1. **分层架构**：
   - `src/components`：通用组件
   - `src/views`：页面组件
   - `src/composables`：组合式函数
   - `src/stores`：状态管理
   - `src/utils`：工具函数
   - `src/services`：API 服务
   - `src/router`：路由配置

2. **模块化设计**：
   - 按功能模块组织代码
   - 每个模块包含组件、状态、服务等
   - 模块间通过 API 或事件通信

3. **可扩展性**：
   - 设计灵活的组件接口
   - 使用插件机制扩展功能
   - 考虑未来需求，预留扩展点

## 总结

这个技能提供了全面的 Vue 3 开发支持，从基础到高级，从组件设计到架构设计，从性能优化到工具链配置。通过遵循最佳实践，可以开发出高质量、可维护、高性能的 Vue 3 应用。