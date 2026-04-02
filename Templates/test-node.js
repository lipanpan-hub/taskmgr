import { exec } from 'node:child_process';
import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function showDesktopNotification(title, message) {
  const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$notification = New-Object System.Windows.Forms.NotifyIcon
$notification.Icon = [System.Drawing.SystemIcons]::Information
$notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Warning
$notification.BalloonTipTitle = "${title}"
$notification.BalloonTipText = "${message}"
$notification.Visible = $true
$notification.ShowBalloonTip(10000)
Start-Sleep -Seconds 12
$notification.Dispose()
`;

  const tempFile = join(tmpdir(), `notification-${Date.now()}.ps1`);

  try {
    writeFileSync(tempFile, '\uFEFF' + psScript, 'utf8');
    await execAsync(`powershell -ExecutionPolicy Bypass -File "${tempFile}"`);
    console.log('✅ 桌面通知已发送');
  } catch (error) {
    console.error('❌ 发送通知失败:', error.message);
  } finally {
    try {
      unlinkSync(tempFile);
    } catch {}
  }
}

async function showMultipleNotifications() {
  console.log('🔔 开始发送桌面通知...\n');

  await showDesktopNotification(
    '⚠️ 重要提醒',
    '这是一条非常明显的桌面提示消息！'
  );
}

await showMultipleNotifications();
