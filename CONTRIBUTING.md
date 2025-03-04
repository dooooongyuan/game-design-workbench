
## 项目部署-开发环境设置

1. 克隆仓库
```bash
git clone https://github.com/dooooonyuan/game-design-workbench.git
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

