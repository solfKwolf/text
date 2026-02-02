<template>
  <div v-if="showInstallPrompt" class="pwa-install-prompt" :class="{ 'dark-mode': isDarkMode }">
    <div class="pwa-install-content">
      <div class="pwa-icon">
        <img src="/favicon.svg" alt="便签图标" />
      </div>
      <div class="pwa-message">
        <h3>{{ $t('pwa.install.title') }}</h3>
        <p>{{ $t('pwa.install.message') }}</p>
      </div>
      <div class="pwa-actions">
        <button class="btn btn-secondary" @click="dismissPrompt">
          {{ $t('pwa.install.later') }}
        </button>
        <button class="btn btn-primary" @click="installPwa">
          {{ $t('pwa.install.now') }}
        </button>
      </div>
      <button class="pwa-close-btn" @click="dismissPrompt" aria-label="关闭">
        &times;
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

// 定义 props
const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['install-success', 'install-error']);

// i18n 实例
const { t } = useI18n();

// 状态
const showInstallPrompt = ref(false);
const deferredPrompt = ref(null);
const installAttempted = ref(false);

// 监听 PWA 安装提示事件
function handleBeforeInstallPrompt(event) {
  // 阻止 Chrome 67 及更早版本自动显示安装提示
  event.preventDefault();
  // 存储事件以便稍后触发
  deferredPrompt.value = event;
  // 显示自定义安装提示
  showInstallPrompt.value = true;
}

// 监听 PWA 安装完成事件
function handleAppInstalled() {
  // 清除延迟的安装提示
  deferredPrompt.value = null;
  // 隐藏安装提示
  showInstallPrompt.value = false;
  // 标记已尝试安装
  installAttempted.value = true;
  // 触发安装成功事件
  emit('install-success');
}

// 安装 PWA
function installPwa() {
  if (!deferredPrompt.value) return;
  
  // 显示安装提示
  deferredPrompt.value.prompt();
  
  // 等待用户响应
  deferredPrompt.value.userChoice
    .then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('用户接受了 PWA 安装');
        emit('install-success');
      } else {
        console.log('用户拒绝了 PWA 安装');
        emit('install-error');
      }
      // 无论结果如何，清除延迟的提示
      deferredPrompt.value = null;
      showInstallPrompt.value = false;
      installAttempted.value = true;
    })
    .catch((error) => {
      console.error('PWA 安装失败:', error);
      emit('install-error');
      deferredPrompt.value = null;
      showInstallPrompt.value = false;
    });
}

// 关闭安装提示
function dismissPrompt() {
  showInstallPrompt.value = false;
  // 可以选择在此处设置一个超时，避免频繁显示提示
  localStorage.setItem('pwaInstallDismissed', Date.now().toString());
}

// 检查是否应该显示安装提示
function shouldShowInstallPrompt() {
  // 检查是否已经尝试过安装
  if (installAttempted.value) return false;
  
  // 检查是否用户最近关闭了提示
  const dismissedTime = localStorage.getItem('pwaInstallDismissed');
  if (dismissedTime) {
    const now = Date.now();
    const dismissedAt = parseInt(dismissedTime, 10);
    // 如果在过去 24 小时内关闭过提示，不显示
    if (now - dismissedAt < 24 * 60 * 60 * 1000) {
      return false;
    }
  }
  
  // 检查是否已经安装
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }
  
  return true;
}

// 生命周期
onMounted(() => {
  // 添加事件监听
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleAppInstalled);
});
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 480px;
  width: 90%;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 10000;
  animation: slideUp 0.3s ease-out;
  transition: all 0.3s ease;
}

.pwa-install-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
}

.pwa-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background-color: #fff9c4;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pwa-icon img {
  width: 32px;
  height: 32px;
}

.pwa-message {
  flex: 1;
  min-width: 0;
}

.pwa-message h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.pwa-message p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.pwa-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pwa-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.pwa-close-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

/* 暗色模式样式 */
.pwa-install-prompt.dark-mode {
  background-color: #333;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.pwa-install-prompt.dark-mode .pwa-icon {
  background-color: #444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.pwa-install-prompt.dark-mode .pwa-message h3 {
  color: #fff;
}

.pwa-install-prompt.dark-mode .pwa-message p {
  color: #ddd;
}

.pwa-install-prompt.dark-mode .pwa-close-btn {
  color: #777;
}

.pwa-install-prompt.dark-mode .pwa-close-btn:hover {
  background-color: #444;
  color: #fff;
}

/* 动画效果 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pwa-install-prompt {
    width: 95%;
    padding: 16px;
  }
  
  .pwa-install-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .pwa-icon {
    width: 48px;
    height: 48px;
  }
  
  .pwa-icon img {
    width: 28px;
    height: 28px;
  }
  
  .pwa-actions {
    flex-direction: row;
    width: 100%;
    justify-content: center;
  }
  
  .pwa-message h3 {
    font-size: 16px;
  }
  
  .pwa-message p {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .pwa-actions {
    flex-direction: column;
  }
  
  .pwa-actions .btn {
    width: 100%;
  }
}
</style>

<style>
/* 按钮样式（复用现有样式） */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.btn-primary {
  background-color: #fbc02d;
  color: #333;
}

.btn-primary:hover {
  background-color: #f9a825;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(251, 192, 45, 0.4);
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
  transform: translateY(-1px);
}

/* 暗色模式按钮样式 */
.dark-mode .btn-secondary {
  background-color: #444;
  color: #ddd;
  border-color: #555;
}

.dark-mode .btn-secondary:hover {
  background-color: #555;
}
</style>