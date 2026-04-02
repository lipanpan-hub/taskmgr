import tkinter as tk
from tkinter import messagebox
import winsound
import threading
import time

class AlertWindow:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("提示")
        self.root.attributes("-topmost", True)
        self.root.geometry("400x200")
        self.root.resizable(False, False)
        self.root.configure(bg="red")
        self._center_window()

        self.flash_state = True
        self.running = True

        self._setup_ui()
        self._start_flash()
        self._play_sound()

    def _center_window(self):
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        x = (screen_width - width) // 2
        y = (screen_height - height) // 2
        self.root.geometry(f"{width}x{height}+{x}+{y}")

    def _setup_ui(self):
        frame = tk.Frame(self.root, bg="red")
        frame.pack(expand=True, fill="both")

        self.label = tk.Label(
            frame,
            text="⚠️ 任务完成！⚠️",
            font=("Microsoft YaHei", 18, "bold"),
            bg="red",
            fg="white"
        )
        self.label.pack(expand=True)

        close_btn = tk.Button(
            frame,
            text="关闭",
            font=("Microsoft YaHei", 12, "bold"),
            bg="white",
            fg="red",
            width=10,
            command=self._close
        )
        close_btn.pack(pady=10)

        self.root.protocol("WM_DELETE_WINDOW", self._close)

    def _start_flash(self):
        def flash():
            colors = ["red", "orange"]
            idx = 0
            while self.running:
                self.root.configure(bg=colors[idx])
                self.label.configure(bg=colors[idx])
                idx = (idx + 1) % len(colors)
                time.sleep(0.5)
        threading.Thread(target=flash, daemon=True).start()

    def _play_sound(self):
        def sound():
            for _ in range(3):
                if not self.running:
                    break
                winsound.Beep(1000, 300)
                time.sleep(0.2)
                winsound.Beep(1500, 300)
                time.sleep(0.5)
        threading.Thread(target=sound, daemon=True).start()

    def _close(self):
        self.running = False
        self.root.destroy()

    def show(self):
        self.root.mainloop()

if __name__ == "__main__":
    alert = AlertWindow()
    alert.show()
