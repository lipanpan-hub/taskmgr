// Alpine.js 主应用
function taskManager() {
  return {
    // #region 状态管理
    isDark: false,
    tasks: [],
    loading: false,
    socket: null,
    connectionStatus: 'disconnected',
    toast: {
      show: false,
      message: '',
      type: 'info',
      icon: 'fa-info-circle'
    },
    // #endregion

    // #region 初始化
    init() {
      this.loadTheme();
      this.initWebSocket();
    },

    initWebSocket() {
      this.socket = io();

      this.socket.on('connect', () => {
        console.log('WebSocket 已连接');
        this.connectionStatus = 'connected';
        this.showMessage('实时连接已建立', 'success');
        this.loadTasks(); // 连接成功后再加载任务
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket 已断开');
        this.connectionStatus = 'disconnected';
        this.showMessage('实时连接已断开', 'warning');
      });

      this.socket.on('task:updated', (data) => {
        console.log('收到任务更新:', data);
        this.loadTasks();
      });

      this.socket.on('task:created', (data) => {
        console.log('收到新任务:', data);
        this.showMessage('新任务已创建', 'info');
        this.loadTasks();
      });

      this.socket.on('task:deleted', (data) => {
        console.log('任务已删除:', data);
        this.showMessage('任务已删除', 'info');
        this.loadTasks();
      });
    },

    loadTheme() {
      const savedTheme = localStorage.getItem('theme');
      this.isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (this.isDark) {
        document.documentElement.classList.add('dark');
      }
    },
    // #endregion

    // #region 主题切换
    toggleTheme() {
      this.isDark = !this.isDark;
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    },
    // #endregion

    // #region 计算属性
    get filteredTasks() {
      return this.tasks;
    },
    // #endregion

    // #region 任务操作
    loadTasks() {
      this.loading = true;
      this.socket.emit('task:getAll', (response) => {
        this.loading = false;
        if (response.success) {
          this.tasks = response.data;
        } else {
          console.error('加载任务失败:', response);
          this.showMessage('加载任务失败: ' + (response.message || response.error), 'error');
        }
      });
    },

    deleteTask(taskId) {
      if (!confirm('确定要删除这个任务吗？此操作不可恢复。')) {
        return;
      }

      this.socket.emit('task:delete', taskId, (response) => {
        if (response.success) {
          this.showMessage('任务已删除', 'success');
        } else {
          console.error('删除任务失败:', response);
          this.showMessage('删除任务失败: ' + (response.message || response.error), 'error');
        }
      });
    },

    toggleTask(task) {
      this.socket.emit('task:update', {
        id: task.id,
        updates: { enabled: !task.enabled }
      }, (response) => {
        if (response.success) {
          this.showMessage(`任务已${task.enabled ? '禁用' : '启用'}`, 'success');
        } else {
          console.error('切换任务状态失败:', response);
          this.showMessage('操作失败: ' + (response.message || response.error), 'error');
        }
      });
    },
    // #endregion

    // #region 工具函数
    getTriggerTypeText(type) {
      const types = {
        once: '一次性',
        daily: '每天',
        weekly: '每周',
        monthly: '每月',
        boot: '系统启动',
        logon: '用户登录'
      };
      return types[type] || type;
    },

    formatDateTime(dateTimeStr) {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('zh-CN');
    },

    showMessage(message, type = 'info') {
      const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
      };
      
      this.toast = {
        show: true,
        message,
        type,
        icon: icons[type]
      };
      
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    }
    // #endregion
  };
}
