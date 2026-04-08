// 主题切换
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-theme');
  localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
});

// 加载保存的主题
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  body.classList.add('dark-theme');
}

// 模态框控制
const modal = document.getElementById('taskModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskNameInput = document.getElementById('taskNameInput');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.querySelector('.btn-cancel');
const taskForm = document.getElementById('taskForm');
const formTaskName = document.getElementById('formTaskName');

// 打开模态框
addTaskBtn.addEventListener('click', () => {
  const taskName = taskNameInput.value.trim();
  if (!taskName) {
    alert('请输入任务名称');
    return;
  }
  formTaskName.value = taskName;
  modal.classList.add('active');
});

// 关闭模态框
const closeModal = () => {
  modal.classList.remove('active');
  taskForm.reset();
  taskNameInput.value = '';
};

closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// 表单提交
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const taskData = {
    name: formTaskName.value,
    description: document.getElementById('formDescription').value,
    executable: document.getElementById('formExecutable').value,
    arguments: document.getElementById('formArguments').value,
    triggerType: document.getElementById('formTriggerType').value,
    startTime: document.getElementById('formStartTime').value,
    allowMissed: document.getElementById('formAllowMissed').checked
  };

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (response.ok) {
      closeModal();
      loadTasks();
    } else {
      alert('创建任务失败');
    }
  } catch (error) {
    console.error('创建任务出错:', error);
    alert('创建任务出错');
  }
});

// 加载任务列表
async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    const tasks = await response.json();
    renderTasks(tasks);
  } catch (error) {
    console.error('加载任务失败:', error);
  }
}

// 渲染任务列表
function renderTasks(tasks) {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无任务</p>';
    return;
  }

  tasks.forEach(task => {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.innerHTML = `
      <div class="task-header">
        <div class="task-name">${task.name}</div>
        <div class="task-actions">
          <button class="task-btn" onclick="editTask('${task.id}')" title="编辑">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="task-btn" onclick="deleteTask('${task.id}')" title="删除">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="task-description">${task.description || '无描述'}</div>
      <div class="task-details">
        <div>执行文件: ${task.executable}</div>
        <div>触发类型: ${getTriggerTypeText(task.triggerType)}</div>
        <div>开始时间: ${formatDateTime(task.startTime)}</div>
      </div>
    `;
    taskList.appendChild(taskItem);
  });
}

// 获取触发类型文本
function getTriggerTypeText(type) {
  const types = {
    once: '一次性',
    daily: '每天',
    weekly: '每周',
    monthly: '每月'
  };
  return types[type] || type;
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-CN');
}

// 删除任务
async function deleteTask(taskId) {
  if (!confirm('确定要删除这个任务吗?')) {
    return;
  }

  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadTasks();
    } else {
      alert('删除任务失败');
    }
  } catch (error) {
    console.error('删除任务出错:', error);
    alert('删除任务出错');
  }
}

// 编辑任务
function editTask(taskId) {
  alert('编辑功能待实现');
}

// 任务过滤
const taskFilter = document.getElementById('taskFilter');
taskFilter.addEventListener('change', () => {
  loadTasks();
});

// 设置按钮
const settingsBtn = document.getElementById('settingsBtn');
settingsBtn.addEventListener('click', () => {
  alert('设置功能待实现');
});

// 页面加载时加载任务
loadTasks();
