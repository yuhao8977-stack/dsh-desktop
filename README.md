# DeepSeek Harness 桌面版（dsh-desktop）

> 将 DeepSeek Harness（Web UI: `http://127.0.0.1:3080`）封装为**独立桌面程序**的 Electron 项目。

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `main.js` | 主进程：检测/自动启动 DSH 服务 → 打开独立窗口 |
| `package.json` | 项目配置（依赖 electron / electron-builder） |
| `package-lock.json` | 依赖版本锁定 |

## 🚀 使用

```bash
npm install        # 安装依赖
npm start          # 启动桌面程序
npm run dist       # 打包便携版 exe（electron-builder）
```

## ⚙️ 工作原理

1. 检测 `127.0.0.1:3080` 端口是否可达
2. 未运行 → 自动执行 `npx @deepseek-ai/dsh web` 启动 DSH 服务（等待最多 90 秒）
3. 打开 Electron 窗口加载 Web UI（单实例锁防重复打开）

## 📦 绿色版（完整可运行程序，不在此仓库）

- 可执行版：`C:\Users\admin\DSH桌面版\`（含 `DeepSeek-Harness-桌面版.exe`，约 268MB）
- 压缩包：`C:\Users\admin\dsh-desktop\DeepSeek-Harness-桌面版-绿色版.zip`（约 107MB，可拷贝到其他电脑）
- 桌面快捷方式：`DeepSeek Harness 桌面版.lnk`

> `node_modules/`、`dist/`、`*.zip` 已通过 .gitignore 排除（体积大且可由 npm 重建）。
