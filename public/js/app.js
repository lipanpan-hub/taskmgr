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

    formatTriggerDateTime(value) {
      if (!value) return '';
      if (typeof value !== 'string') return String(value);
      const normalized = value.includes('T') ? value : value.replace(' ', 'T');
      const date = new Date(normalized);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    formatTimeOnly(value) {
      if (!value || typeof value !== 'string') return '';
      const match = value.match(/(\d{1,2}:\d{2})(?::\d{2})?$/);
      return match ? match[1] : value;
    },

    parseListValue(value) {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
        }
      }
      return [];
    },

    formatDaysOfWeek(daysValue) {
      const days = this.parseListValue(daysValue);
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return days
        .map(d => dayNames[Number(d)])
        .filter(Boolean)
        .join(', ');
    },

    formatMonths(monthsValue) {
      const months = this.parseListValue(monthsValue);
      return months
        .map(m => Number(m))
        .filter(m => !Number.isNaN(m))
        .map(m => `${m}月`)
        .join(', ');
    },

    formatDaysOfMonth(daysValue) {
      const days = this.parseListValue(daysValue);
      return days
        .map(d => Number(d))
        .filter(d => !Number.isNaN(d))
        .map(d => `${d}日`)
        .join(', ');
    },

    formatWeeksOfMonth(weeksValue) {
      const weeks = this.parseListValue(weeksValue);
      const weekNames = {
        1: '第一周',
        2: '第二周',
        3: '第三周',
        4: '第四周',
        5: '最后一周'
      };
      return weeks
        .map(w => weekNames[Number(w)])
        .filter(Boolean)
        .join(', ');
    },

    getWeeklyInterval(details) {
      return details?.intervalWeeks ?? details?.interval ?? 1;
    },

    getMonthlyTriggerMode(details) {
      if (details?.triggerMode === 'days' || details?.triggerMode === 'weeks') {
        return details.triggerMode;
      }
      if (this.parseListValue(details?.weeksOfMonth).length > 0 || this.parseListValue(details?.daysOfWeek).length > 0) {
        return 'weeks';
      }
      if (this.parseListValue(details?.daysOfMonth).length > 0) {
        return 'days';
      }
      return '';
    },

    getTriggerStartTime(details) {
      return details?.startTime || details?.time || '';
    },

    shouldShowStartWhenAvailable(details) {
      return Boolean(details?.startWhenAvailable);
    },

    getWeeklySummary(details) {
      const interval = this.getWeeklyInterval(details);
      const days = this.formatDaysOfWeek(details?.daysOfWeek);
      const time = this.formatTimeOnly(this.getTriggerStartTime(details));
      const intervalText = interval > 1 ? `每 ${interval} 周` : '每周';
      const dayText = days || '未配置星期';
      const timeText = time || '未配置时间';
      return `${intervalText}的 ${dayText} ${timeText}`;
    },

    getMonthlySummary(details) {
      const months = this.formatMonths(details?.months);
      const mode = this.getMonthlyTriggerMode(details);
      const time = this.formatTimeOnly(this.getTriggerStartTime(details));

      if (mode === 'days') {
        const days = this.formatDaysOfMonth(details?.daysOfMonth);
        return `${months || '未配置月份'} 的 ${days || '未配置日期'} ${time || '未配置时间'}`;
      }

      if (mode === 'weeks') {
        const weeks = this.formatWeeksOfMonth(details?.weeksOfMonth);
        const days = this.formatDaysOfWeek(details?.daysOfWeek);
        return `${months || '未配置月份'} 的 ${weeks || '未配置周次'} ${days || '未配置星期'} ${time || '未配置时间'}`;
      }

      return '未识别到完整的每月触发规则';
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
