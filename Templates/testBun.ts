/* eslint-disable unicorn/filename-case */
import { unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const countdownSeconds = 5

function createCountdownHtml(): string {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>倒计时提醒</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            font-family: "Microsoft YaHei", sans-serif;
        }
        .container {
            text-align: center;
        }
        .countdown {
            font-size: 120px;
            font-weight: bold;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }
        .message {
            font-size: 24px;
            margin-top: 20px;
            color: #ccc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="countdown" id="countdown">${countdownSeconds}</div>
        <div class="message" id="message">秒后提醒</div>
    </div>
    <script>
        let seconds = ${countdownSeconds};
        const countdownEl = document.getElementById('countdown');
        const messageEl = document.getElementById('message');
        
        const timer = setInterval(() => {
            seconds--;
            if (seconds > 0) {
                countdownEl.textContent = seconds;
            } else {
                clearInterval(timer);
                countdownEl.textContent = '时间到！';
                countdownEl.style.color = '#4CAF50';
                messageEl.textContent = '倒计时已完成';
                setTimeout(() => window.close(), 1500);
            }
        }, 1000);
    </script>
</body>
</html>`

    const htmlPath = join(tmpdir(), `countdown-${Date.now()}.html`)
    writeFileSync(htmlPath, html, 'utf8')
    return htmlPath
}

async function openInBrowser(htmlPath: string): Promise<void> {
    const { exec } = await import('node:child_process')
    const { platform } = process
    if (platform === 'win32') {
        exec(`start "" "${htmlPath}"`)
    } else if (platform === 'darwin') {
        exec(`open "${htmlPath}"`)
    } else {
        exec(`xdg-open "${htmlPath}"`)
    }
}

let htmlPath: null | string = null

try {
    console.log(`开始 ${countdownSeconds} 秒倒计时...`)
    htmlPath = createCountdownHtml()
    await openInBrowser(htmlPath)
    console.log('倒计时窗口已在浏览器中打开')
    
    setTimeout(() => {
        if (htmlPath) {
            try { unlinkSync(htmlPath) } catch {}
        }
    }, (countdownSeconds + 3) * 1000)
} catch (error) {
    console.error('发生错误:', error)
    if (htmlPath) {
        try { unlinkSync(htmlPath) } catch {}
    }
}
