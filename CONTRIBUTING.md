
## 项目部署-开发环境设置

### 系统要求
- 操作系统：Windows 10/11、macOS 10.15+、Linux (Ubuntu 18.04+)
  
### 环境要求
- Node.js：v16.x 或更高版本
- npm：v8.x 或更高版本

### 软件要求

- Git：最新版本
- 现代浏览器：Chrome、Firefox、Edge最新版本

## 开发环境搭建

### 1. 安装Node.js和npm

#### Windows
1. 访问 [Node.js官网](https://nodejs.org/)
2. 下载并安装LTS版本
3. 安装完成后，打开命令提示符验证安装：
   ```
   node -v
   npm -v
   ```

#### macOS
1. 使用Homebrew安装：
   ```
   brew install node
   ```
2. 或访问Node.js官网下载安装包
3. 验证安装：
   ```
   node -v
   npm -v
   ```

#### Linux (Ubuntu)
1. 使用apt安装：
   ```
   sudo apt update
   sudo apt install nodejs npm
   ```
2. 验证安装：
   ```
   node -v
   npm -v
   ```

### 2. 安装Git/不想安装直接下压缩包

#### Windows
1. 访问 [Git官网](https://git-scm.com/)
2. 下载并安装最新版本
3. 安装时选择默认选项即可
4. 验证安装：
   ```
   git --version
   ```

#### macOS
1. 使用Homebrew安装：
   ```
   brew install git
   ```
2. 验证安装：
   ```
   git --version
   ```

#### Linux (Ubuntu)
1. 使用apt安装：
   ```
   sudo apt update
   sudo apt install git
   ```
2. 验证安装：
   ```
   git --version
   ```

### 部署步骤

1. 克隆仓库
```bash
git clone https://github.com/dooooongyuan/game-design-workbench.git
cd game-design-workbench
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

## 项目结构

```
src/
├── main.ts                 # Electron主进程
├── renderer/               # 渲染进程
│   ├── App.tsx             # 应用主组件
│   ├── components/         # 组件目录
│   │   ├── BalanceSimulator/   # 数值平衡模块
│   │   ├── CharacterManager/   # 角色管理系统
│   │   ├── EconomicPressureTest/ # 经济系统压力测试
│   │   ├── LevelPrototype/     # 关卡原型工具
│   │   ├── QuestDesigner/      # 任务设计器
│   │   ├── ResourceManager/    # 资源管理中心
│   │   └── WorldEditor/        # 世界观编辑器
│   ├── utils/              # 工具函数
│   └── index.tsx           # 渲染进程入口
```


## 联系方式
QQ：212519642

如有任何问题，请通过GitHub Issues或讨论区联系我们。

