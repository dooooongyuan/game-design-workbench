import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

// 导入关卡原型工具组件
import LevelPrototypeTool from './components/LevelPrototype/LevelPrototypeTool';
// 导入世界观编辑器组件
import WorldEditor from './components/WorldEditor/WorldEditor';
// 导入角色管理系统组件
import CharacterManager from './components/CharacterManager/CharacterManager';
// 导入任务设计器组件
import QuestDesigner from './components/QuestDesigner/QuestDesigner';
// 导入数值平衡模块组件
import BalanceSimulatorTool from './components/BalanceSimulator/BalanceSimulatorTool';
// 导入资源管理中心组件
import ResourceManagerTool from './components/ResourceManager/ResourceManagerTool';
// 导入经济压力测试模块组件
import EconomicPressureTestTool from './components/EconomicPressureTest/EconomicPressureTestTool';
// 导入对话系统组件
// import DialogueSystemTool from './components/DialogueSystem/DialogueSystemTool';

// 导入其他模块的组件
const CollaborationSystem = () => <div>协作系统暂未实现</div>;

const App: React.FC = () => {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>策划工作台</h1>
          <div className="header-version">v0.1.0</div>
        </div>
        
        <nav className="main-nav">
          <Link to="/world-editor" className={location.pathname === '/world-editor' ? 'active' : ''}>
            <span className="nav-icon">🌍</span>
            <span>世界观编辑器</span>
          </Link>
          {/* <Link to="/dialogue-system" className={location.pathname === '/dialogue-system' ? 'active' : ''}>
            <span className="nav-icon">💬</span>
            <span>对话系统</span>
          </Link> */}
          <Link to="/character-manager" className={location.pathname === '/character-manager' ? 'active' : ''}>
            <span className="nav-icon">👤</span>
            <span>角色管理系统</span>
          </Link>
          <Link to="/quest-designer" className={location.pathname === '/quest-designer' ? 'active' : ''}>
            <span className="nav-icon">📜</span>
            <span>任务设计器</span>
          </Link>
          <Link to="/level-prototype" className={location.pathname === '/level-prototype' ? 'active' : ''}>
            <span className="nav-icon">🏗️</span>
            <span>关卡原型工具</span>
          </Link>
          <Link to="/balance-module" className={location.pathname === '/balance-module' ? 'active' : ''}>
            <span className="nav-icon">⚖️</span>
            <span>数值平衡模块</span>
          </Link>
          <Link to="/resource-manager" className={location.pathname === '/resource-manager' ? 'active' : ''}>
            <span className="nav-icon">🗃️</span>
            <span>资源管理中心</span>
          </Link>
          <Link to="/economic-pressure-test" className={location.pathname === '/economic-pressure-test' ? 'active' : ''}>
            <span className="nav-icon">💰</span>
            <span>经济压力测试</span>
          </Link>
          <Link to="/collaboration" className={location.pathname === '/collaboration' ? 'active' : ''}>
            <span className="nav-icon">👥</span>
            <span>协作系统</span>
          </Link>
        </nav>
        
        <div className="header-right">
          <div className="user-info">
            <span className="user-status">在线</span>
            <span className="user-avatar">👨‍💻</span>
          </div>
          <button className="header-icon-btn" onClick={() => setShowSearch(!showSearch)} title="搜索">
            🔍
          </button>
          <button className="header-icon-btn" title="设置">
            ⚙️
          </button>
          <button className="header-icon-btn" title="帮助">
            ❓
          </button>
        </div>
      </header>

      {showSearch && (
        <div className="search-bar">
          <input type="text" placeholder="搜索工具和功能..." autoFocus />
          <button onClick={() => setShowSearch(false)}>取消</button>
        </div>
      )}

      <main className="app-content">
        <Routes>
          <Route path="/" element={<div className="welcome">
            <h2>欢迎使用策划工作台</h2>
            <p>这是一个为游戏策划师打造的一站式工具平台，帮助您高效完成游戏设计工作。</p>
            <p>本项目由<p style={{color: 'red'}}>Trae</p>和<p style={{color: 'blue'}}>Cursor</p>共同开发,模型使用Claude 3.5\3.7 Sonnet</p>
            <p>此工具仅作为Ai能力测试，请勿导入到实际项目中</p>
            <p>"代码疆域里，AI终是执笔的学徒，唯人类智慧方能勾勒文明星图"</p>

          </div>} />
          <Route path="/world-editor" element={<WorldEditor />} />
          <Route path="/character-manager" element={<CharacterManager />} />
          <Route path="/quest-designer" element={<QuestDesigner />} />
          <Route path="/level-prototype" element={<LevelPrototypeTool />} />
          <Route path="/balance-module" element={<BalanceSimulatorTool />} />
          <Route path="/resource-manager" element={<ResourceManagerTool />} />
          <Route path="/economic-pressure-test" element={<EconomicPressureTestTool />} />
          {/* <Route path="/dialogue-system" element={<DialogueSystemTool />} /> */}
          <Route path="/collaboration" element={<CollaborationSystem />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>策划工作台 v0.1.0 | 提升游戏策划效率的一站式工具 | © 2025</p>
      </footer>
    </div>
  );
};

export default App;