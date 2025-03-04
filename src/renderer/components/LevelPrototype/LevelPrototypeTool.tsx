import React, { useState, useEffect } from 'react';
import './LevelPrototypeTool.css';
import TwoDLayoutEditor from './TwoDLayoutEditor';
import ThreeDPreview from './ThreeDPreview';

// 定义关卡数据类型
interface LevelObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  properties: Record<string, any>;
}

interface LevelData {
  name: string;
  objects: LevelObject[];
  terrain: any[];
  properties: Record<string, any>;
  lastModified?: number; // 添加最后修改时间
}

// 本地存储的保存的关卡列表
interface SavedLevel {
  id: string;
  name: string;
  lastModified: number;
  thumbnail?: string; // 关卡预览图，可选
}

const STORAGE_KEY_LEVELS = 'levelPrototype_savedLevels';
const STORAGE_KEY_PREFIX = 'levelPrototype_level_';
const AUTO_SAVE_INTERVAL = 60000; // 自动保存间隔，60秒

const LevelPrototypeTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'2d' | '3d'>('2d');
  const [levelData, setLevelData] = useState<LevelData>({
    name: '新关卡',
    objects: [],
    terrain: [],
    properties: {},
    lastModified: Date.now()
  });
  
  // 当前编辑的关卡ID
  const [currentLevelId, setCurrentLevelId] = useState<string>('');
  // 保存的关卡列表
  const [savedLevels, setSavedLevels] = useState<SavedLevel[]>([]);
  // 显示保存的关卡列表
  const [showSavedLevels, setShowSavedLevels] = useState<boolean>(false);
  // 是否有未保存更改
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // 状态消息
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  // 添加展开/关闭状态
  const [expandedSections, setExpandedSections] = useState<{
    levelInfo: boolean;
    levelProperties: boolean;
    objectPalette: boolean;
  }>({
    levelInfo: true,
    levelProperties: true,
    objectPalette: true
  });
  
  // 添加对象搜索状态
  const [objectSearchTerm, setObjectSearchTerm] = useState<string>('');
  
  // 切换展开/关闭状态
  const toggleSection = (section: 'levelInfo' | 'levelProperties' | 'objectPalette') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // 过滤对象列表
  const filterObjects = (objectName: string) => {
    if (!objectSearchTerm) return true;
    return objectName.toLowerCase().includes(objectSearchTerm.toLowerCase());
  };
  
  // 加载已保存的关卡列表
  useEffect(() => {
    const savedLevelsJson = localStorage.getItem(STORAGE_KEY_LEVELS);
    if (savedLevelsJson) {
      try {
        const parsedLevels = JSON.parse(savedLevelsJson);
        setSavedLevels(parsedLevels);
      } catch (error) {
        console.error('加载已保存关卡列表失败:', error);
        showStatusMessage('加载已保存关卡列表失败', 'error');
      }
    }
    
    // 检查是否有自动保存的关卡
    const autoSavedLevel = localStorage.getItem(`${STORAGE_KEY_PREFIX}autosave`);
    if (autoSavedLevel) {
      try {
        const parsedLevel = JSON.parse(autoSavedLevel);
        const lastModified = new Date(parsedLevel.lastModified);
        const now = new Date();
        const timeDiff = Math.floor((now.getTime() - lastModified.getTime()) / (1000 * 60)); // 分钟差
        
        // 如果有最近的自动保存，询问是否恢复
        if (timeDiff < 60) { // 只恢复1小时内的自动保存
          if (window.confirm(`发现${timeDiff}分钟前自动保存的关卡"${parsedLevel.name}"，是否恢复？`)) {
            setLevelData(parsedLevel);
            showStatusMessage('已恢复自动保存的关卡', 'info');
          }
        }
      } catch (error) {
        console.error('解析自动保存关卡失败:', error);
      }
    }
  }, []);
  
  // 状态改变时标记未保存更改
  useEffect(() => {
    if (currentLevelId) {
      setHasUnsavedChanges(true);
    }
  }, [levelData]);
  
  // 自动保存功能
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (hasUnsavedChanges) {
        autoSaveLevel();
      }
    }, AUTO_SAVE_INTERVAL);
    
    return () => clearInterval(autoSaveTimer);
  }, [hasUnsavedChanges, levelData]);
  
  // 自动保存当前关卡
  const autoSaveLevel = () => {
    try {
      const dataToSave = {
        ...levelData,
        lastModified: Date.now()
      };
      localStorage.setItem(`${STORAGE_KEY_PREFIX}autosave`, JSON.stringify(dataToSave));
      console.log('关卡已自动保存', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  };
  
  // 显示状态消息
  const showStatusMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    // 3秒后自动清除消息
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // 处理关卡数据变更
  const handleLevelDataChange = (newData: Partial<LevelData>) => {
    setLevelData(prev => ({
      ...prev,
      ...newData,
      lastModified: Date.now()
    }));
  };

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // 保存关卡数据到localStorage
  const handleSaveLevel = () => {
    try {
      // 如果是新关卡，生成ID
      const levelId = currentLevelId || generateId();
      
      // 准备保存数据
      const dataToSave = {
        ...levelData,
        lastModified: Date.now()
      };
      
      // 保存关卡数据
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${levelId}`, JSON.stringify(dataToSave));
      
      // 更新关卡列表
      const levelInfo: SavedLevel = {
        id: levelId,
        name: levelData.name,
        lastModified: dataToSave.lastModified
      };
      
      const updatedLevels = savedLevels.filter(level => level.id !== levelId);
      updatedLevels.push(levelInfo);
      
      // 按最后修改时间排序
      updatedLevels.sort((a, b) => b.lastModified - a.lastModified);
      
      // 保存关卡列表
      localStorage.setItem(STORAGE_KEY_LEVELS, JSON.stringify(updatedLevels));
      setSavedLevels(updatedLevels);
      
      // 更新当前关卡ID
      setCurrentLevelId(levelId);
      setHasUnsavedChanges(false);
      
      showStatusMessage('关卡保存成功！', 'success');
    } catch (error) {
      console.error('保存关卡失败:', error);
      showStatusMessage('保存关卡失败，请检查浏览器存储空间', 'error');
    }
  };

  // 加载关卡数据
  const handleLoadLevel = (levelId: string) => {
    try {
      // 如果有未保存的更改，询问用户
      if (hasUnsavedChanges && !window.confirm('当前关卡有未保存的更改，确定要加载其他关卡吗？')) {
        return;
      }
      
      const levelJson = localStorage.getItem(`${STORAGE_KEY_PREFIX}${levelId}`);
      if (levelJson) {
        const loadedLevel = JSON.parse(levelJson);
        
        // 数据验证和修复
        if (!loadedLevel.objects) {
          loadedLevel.objects = [];
          console.warn('加载的关卡数据中没有objects字段，已创建空数组');
        }
        
        if (!Array.isArray(loadedLevel.objects)) {
          loadedLevel.objects = [];
          console.warn('加载的关卡数据中objects不是数组，已重置为空数组');
        }
        
        if (!loadedLevel.terrain) {
          loadedLevel.terrain = [];
        }
        
        if (!loadedLevel.properties) {
          loadedLevel.properties = {};
        }
        
        // 验证对象数据的完整性
        const validObjects = loadedLevel.objects.filter((obj: any) => {
          const isValid = obj && obj.id && obj.type && 
            typeof obj.x === 'number' && typeof obj.y === 'number' && 
            typeof obj.width === 'number' && typeof obj.height === 'number';
          
          if (!isValid) {
            console.warn('忽略无效对象:', obj);
          }
          
          return isValid;
        });
        
        if (validObjects.length !== loadedLevel.objects.length) {
          console.warn(`过滤了${loadedLevel.objects.length - validObjects.length}个无效对象`);
          loadedLevel.objects = validObjects;
        }
        
        // 确保每个对象都有rotation属性
        loadedLevel.objects = loadedLevel.objects.map((obj: any) => ({
          ...obj,
          rotation: obj.rotation || 0,
          properties: obj.properties || {}
        }));
        
        console.log('加载关卡数据:', loadedLevel);
        console.log('对象数量:', loadedLevel.objects.length);
        if (loadedLevel.objects.length > 0) {
          console.log('第一个对象示例:', loadedLevel.objects[0]);
        }
        
        // 更新状态
        setLevelData(loadedLevel);
        setCurrentLevelId(levelId);
        setHasUnsavedChanges(false);
        setShowSavedLevels(false);
        showStatusMessage(`已加载关卡"${loadedLevel.name}"，包含${loadedLevel.objects.length}个对象`, 'success');
      } else {
        showStatusMessage('找不到关卡数据', 'error');
      }
    } catch (error) {
      console.error('加载关卡失败:', error);
      showStatusMessage('加载关卡失败: ' + (error instanceof Error ? error.message : String(error)), 'error');
    }
  };

  // 删除保存的关卡
  const handleDeleteLevel = (levelId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    
    if (window.confirm('确定要删除这个关卡吗？此操作不可撤销。')) {
      try {
        // 从localStorage中删除关卡数据
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${levelId}`);
        
        // 更新关卡列表
        const updatedLevels = savedLevels.filter(level => level.id !== levelId);
        localStorage.setItem(STORAGE_KEY_LEVELS, JSON.stringify(updatedLevels));
        setSavedLevels(updatedLevels);
        
        showStatusMessage('关卡已删除', 'info');
        
        // 如果删除的是当前编辑的关卡，重置编辑状态
        if (levelId === currentLevelId) {
          setCurrentLevelId('');
          setLevelData({
            name: '新关卡',
            objects: [],
            terrain: [],
            properties: {},
            lastModified: Date.now()
          });
        }
      } catch (error) {
        console.error('删除关卡失败:', error);
        showStatusMessage('删除关卡失败', 'error');
      }
    }
  };

  // 创建新关卡
  const handleNewLevel = () => {
    // 如果有未保存的更改，询问用户
    if (hasUnsavedChanges && !window.confirm('当前关卡有未保存的更改，确定要创建新关卡吗？')) {
      return;
    }
    
    setLevelData({
      name: '新关卡',
      objects: [],
      terrain: [],
      properties: {},
      lastModified: Date.now()
    });
    setCurrentLevelId('');
    setHasUnsavedChanges(false);
    showStatusMessage('已创建新关卡', 'info');
  };

  // 导入关卡数据
  const handleImportLevel = () => {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(fileInput);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target?.result as string;
          console.log('导入的原始数据:', result.substring(0, 500) + '...');
          
          const importedData = JSON.parse(result);
          console.log('解析后的导入数据:', importedData);
          
          // 详细验证数据有效性
          if (!importedData.name) {
            importedData.name = '导入的关卡';
            console.warn('导入的关卡数据没有name字段，已设置默认名称');
          }
          
          if (!importedData.objects) {
            importedData.objects = [];
            console.warn('导入的关卡数据没有objects字段，已创建空数组');
          }
          
          if (!Array.isArray(importedData.objects)) {
            importedData.objects = [];
            console.warn('导入的关卡数据中objects不是数组，已重置为空数组');
          }
          
          // 验证对象数据的完整性
          const validObjects = importedData.objects.filter((obj: any) => {
            const isValid = obj && obj.id && obj.type && 
              typeof obj.x === 'number' && typeof obj.y === 'number' && 
              typeof obj.width === 'number' && typeof obj.height === 'number';
            
            if (!isValid) {
              console.warn('忽略无效对象:', obj);
            }
            
            return isValid;
          });
          
          if (validObjects.length !== importedData.objects.length) {
            console.warn(`过滤了${importedData.objects.length - validObjects.length}个无效对象`);
            importedData.objects = validObjects;
          }
          
          if (!importedData.terrain) {
            importedData.terrain = [];
          }
          
          if (!importedData.properties) {
            importedData.properties = {};
          }
          
          // 如果有未保存的更改，询问用户
          if (hasUnsavedChanges && !window.confirm('当前关卡有未保存的更改，确定要导入新关卡吗？')) {
            document.body.removeChild(fileInput);
            return;
          }
          
          // 确保每个对象都有一个有效的id
          importedData.objects = importedData.objects.map((obj: any) => {
            if (!obj.id) {
              obj.id = generateId();
            }
            if (!obj.properties) {
              obj.properties = {};
            }
            return obj;
          });
          
          // 更新数据
          const updatedData = {
            ...importedData,
            lastModified: Date.now()
          };
          
          console.log('最终导入数据:', updatedData);
          
          setLevelData(updatedData);
          setCurrentLevelId(''); // 导入后视为新关卡
          setHasUnsavedChanges(true);
          showStatusMessage(`已导入关卡"${updatedData.name}"，包含${updatedData.objects.length}个对象`, 'success');
        } catch (error) {
          console.error('导入关卡失败:', error);
          showStatusMessage('导入失败: ' + (error instanceof Error ? error.message : String(error)), 'error');
        }
        document.body.removeChild(fileInput);
      };
      
      reader.onerror = () => {
        showStatusMessage('读取文件失败', 'error');
        document.body.removeChild(fileInput);
      };
      
      reader.readAsText(file);
    };
    
    fileInput.click();
  };

  // 导出关卡数据
  const handleExportLevel = () => {
    try {
      // 准备导出数据
      const exportData = {
        ...levelData,
        exportTime: new Date().toISOString()
      };
      
      // 创建一个Blob对象
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${levelData.name || 'level'}_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      showStatusMessage('关卡导出成功', 'success');
    } catch (error) {
      console.error('导出关卡失败:', error);
      showStatusMessage('导出关卡失败', 'error');
    }
  };

  // 处理对象拖拽开始事件
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, objectType: string) => {
    e.dataTransfer.setData('text/plain', objectType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="level-prototype-container">
      <div className="level-prototype-header">
        <h2>关卡原型工具</h2>
        <div className="level-info-bar">
          <span className="level-name">
            {currentLevelId ? `${levelData.name} ${hasUnsavedChanges ? '*' : ''}` : '新关卡 *'}
          </span>
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}
        </div>
        <div className="view-toggle">
          <button 
            className={activeTab === '2d' ? 'active' : ''} 
            onClick={() => setActiveTab('2d')}
          >
            2D布局
          </button>
          <button 
            className={activeTab === '3d' ? 'active' : ''} 
            onClick={() => setActiveTab('3d')}
          >
            3D预览
          </button>
        </div>
      </div>

      <div className="level-prototype-content">
        <div className="level-sidebar">
          <div className="sidebar-section">
            <div className="section-header" onClick={() => toggleSection('levelInfo')}>
              <h3>关卡信息</h3>
              <span className={`toggle-icon ${expandedSections.levelInfo ? 'expanded' : 'collapsed'}`}>
                {expandedSections.levelInfo ? '▼' : '►'}
              </span>
            </div>
            {expandedSections.levelInfo && (
              <div className="section-content">
                <div className="form-group">
                  <label>关卡名称</label>
                  <input 
                    type="text" 
                    value={levelData.name} 
                    onChange={(e) => handleLevelDataChange({ name: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <div className="section-header" onClick={() => toggleSection('levelProperties')}>
              <h3>关卡属性</h3>
              <span className={`toggle-icon ${expandedSections.levelProperties ? 'expanded' : 'collapsed'}`}>
                {expandedSections.levelProperties ? '▼' : '►'}
              </span>
            </div>
            {expandedSections.levelProperties && (
              <div className="section-content">
                <div className="level-properties">
                  <div className="property-item">
                    <label>难度</label>
                    <select
                      value={levelData.properties.difficulty || 'normal'}
                      onChange={(e) => handleLevelDataChange({
                        properties: { ...levelData.properties, difficulty: e.target.value }
                      })}
                    >
                      <option value="easy">简单</option>
                      <option value="normal">普通</option>
                      <option value="hard">困难</option>
                      <option value="expert">专家</option>
                    </select>
                  </div>
                  <div className="property-item">
                    <label>环境类型</label>
                    <select
                      value={levelData.properties.environment || 'indoor'}
                      onChange={(e) => handleLevelDataChange({
                        properties: { ...levelData.properties, environment: e.target.value }
                      })}
                    >
                      <option value="indoor">室内</option>
                      <option value="outdoor">室外</option>
                      <option value="underground">地下</option>
                      <option value="space">太空</option>
                      <option value="water">水下</option>
                    </select>
                  </div>
                  <div className="property-item">
                    <label>时间限制(秒)</label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={levelData.properties.timeLimit || 0}
                      onChange={(e) => handleLevelDataChange({
                        properties: { ...levelData.properties, timeLimit: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="property-item">
                    <label>最大玩家数</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={levelData.properties.maxPlayers || 1}
                      onChange={(e) => handleLevelDataChange({
                        properties: { ...levelData.properties, maxPlayers: parseInt(e.target.value) || 1 }
                      })}
                    />
                  </div>
                  <div className="property-item">
                    <label>描述</label>
                    <textarea
                      rows={3}
                      value={levelData.properties.description || ''}
                      onChange={(e) => handleLevelDataChange({
                        properties: { ...levelData.properties, description: e.target.value }
                      })}
                      placeholder="输入关卡描述..."
                    />
                  </div>
                  <div className="property-item">
                    <label>标签</label>
                    <input
                      type="text"
                      value={levelData.properties.tags || ''}
                      onChange={(e) => handleLevelDataChange({
                        properties: { ...levelData.properties, tags: e.target.value }
                      })}
                      placeholder="用逗号分隔多个标签"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="sidebar-section">
            <div className="section-header" onClick={() => toggleSection('objectPalette')}>
              <h3>对象库</h3>
              <span className={`toggle-icon ${expandedSections.objectPalette ? 'expanded' : 'collapsed'}`}>
                {expandedSections.objectPalette ? '▼' : '►'}
              </span>
            </div>
            {expandedSections.objectPalette && (
              <div className="section-content">
                <div className="object-search">
                  <input
                    type="text"
                    placeholder="搜索对象..."
                    value={objectSearchTerm}
                    onChange={(e) => setObjectSearchTerm(e.target.value)}
                    className="object-search-input"
                  />
                  {objectSearchTerm && (
                    <button 
                      className="clear-search-button"
                      onClick={() => setObjectSearchTerm('')}
                      title="清除搜索"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="object-categories">
                  {objectSearchTerm && !['墙', '地板', '障碍物', '楼梯', '平台', '坡道', '玩家', 'NPC', '敌人', '友军', 'BOSS', '宠物', '门', '宝箱', '开关', '按钮', '杠杆', '传送门', '灯光', '植物', '家具', '雕像', '旗帜', '画像', '粒子', '音效', '触发器', '光晕', '烟雾', '火焰', '武器', '盔甲', '药水', '钥匙', '金币', '卷轴', '陷阱', '尖刺', '落石', '弹射器', '摆锤', '激光', '水域', '岩浆', '毒沼', '风区', '雾区', '雪地'].some(obj => obj.toLowerCase().includes(objectSearchTerm.toLowerCase())) && (
                    <div className="no-search-results">
                      没有找到匹配"{objectSearchTerm}"的对象
                    </div>
                  )}
                  <div className="object-category">
                    <h4>地形</h4>
                    <div className="object-list">
                      {filterObjects('墙') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '墙')}
                        >墙</div>
                      )}
                      {filterObjects('地板') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '地板')}
                        >地板</div>
                      )}
                      {filterObjects('障碍物') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '障碍物')}
                        >障碍物</div>
                      )}
                      {filterObjects('楼梯') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '楼梯')}
                        >楼梯</div>
                      )}
                      {filterObjects('平台') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '平台')}
                        >平台</div>
                      )}
                      {filterObjects('坡道') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '坡道')}
                        >坡道</div>
                      )}
                    </div>
                  </div>
                  <div className="object-category">
                    <h4>角色</h4>
                    <div className="object-list">
                      {filterObjects('玩家') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '玩家')}
                        >玩家</div>
                      )}
                      {filterObjects('NPC') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'NPC')}
                        >NPC</div>
                      )}
                      {filterObjects('敌人') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '敌人')}
                        >敌人</div>
                      )}
                      {filterObjects('友军') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '友军')}
                        >友军</div>
                      )}
                      {filterObjects('BOSS') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'BOSS')}
                        >BOSS</div>
                      )}
                      {filterObjects('宠物') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '宠物')}
                        >宠物</div>
                      )}
                    </div>
                  </div>
                  <div className="object-category">
                    <h4>交互物</h4>
                    <div className="object-list">
                      {filterObjects('门') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '门')}
                        >门</div>
                      )}
                      {filterObjects('宝箱') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '宝箱')}
                        >宝箱</div>
                      )}
                      {filterObjects('开关') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '开关')}
                        >开关</div>
                      )}
                      {filterObjects('按钮') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '按钮')}
                        >按钮</div>
                      )}
                      {filterObjects('杠杆') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '杠杆')}
                        >杠杆</div>
                      )}
                      {filterObjects('传送门') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '传送门')}
                        >传送门</div>
                      )}
                    </div>
                  </div>
                  <div className="object-category">
                    <h4>装饰</h4>
                    <div className="object-list">
                      {filterObjects('灯光') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '灯光')}
                        >灯光</div>
                      )}
                      {filterObjects('植物') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '植物')}
                        >植物</div>
                      )}
                      {filterObjects('家具') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '家具')}
                        >家具</div>
                      )}
                      {filterObjects('雕像') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '雕像')}
                        >雕像</div>
                      )}
                      {filterObjects('旗帜') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '旗帜')}
                        >旗帜</div>
                      )}
                      {filterObjects('画像') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '画像')}
                        >画像</div>
                      )}
                    </div>
                  </div>
                  <div className="object-category">
                    <h4>特效</h4>
                    <div className="object-list">
                      {filterObjects('粒子') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '粒子')}
                        >粒子</div>
                      )}
                      {filterObjects('音效') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '音效')}
                        >音效</div>
                      )}
                      {filterObjects('触发器') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '触发器')}
                        >触发器</div>
                      )}
                      {filterObjects('光晕') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '光晕')}
                        >光晕</div>
                      )}
                      {filterObjects('烟雾') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '烟雾')}
                        >烟雾</div>
                      )}
                      {filterObjects('火焰') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '火焰')}
                        >火焰</div>
                      )}
                    </div>
                  </div>
                  <div className="object-category">
                    <h4>道具</h4>
                    <div className="object-list">
                      {filterObjects('武器') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '武器')}
                        >武器</div>
                      )}
                      {filterObjects('盔甲') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '盔甲')}
                        >盔甲</div>
                      )}
                      {filterObjects('药水') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '药水')}
                        >药水</div>
                      )}
                      {filterObjects('钥匙') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '钥匙')}
                        >钥匙</div>
                      )}
                      {filterObjects('金币') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '金币')}
                        >金币</div>
                      )}
                      {filterObjects('卷轴') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '卷轴')}
                        >卷轴</div>
                      )}
                    </div>
                  </div>
                  <div className="object-category">
                    <h4>机关</h4>
                    <div className="object-list">
                      {filterObjects('陷阱') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '陷阱')}
                        >陷阱</div>
                      )}
                      {filterObjects('尖刺') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '尖刺')}
                        >尖刺</div>
                      )}
                      {filterObjects('落石') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '落石')}
                        >落石</div>
                      )}
                      {filterObjects('弹射器') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '弹射器')}
                        >弹射器</div>
                      )}
                      {filterObjects('摆锤') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '摆锤')}
                        >摆锤</div>
                      )}
                      {filterObjects('激光') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '激光')}
                        >激光</div>
                      )}
                    </div>
                  </div>
                  <div className="object-category">
                    <h4>环境</h4>
                    <div className="object-list">
                      {filterObjects('水域') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '水域')}
                        >水域</div>
                      )}
                      {filterObjects('岩浆') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '岩浆')}
                        >岩浆</div>
                      )}
                      {filterObjects('毒沼') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '毒沼')}
                        >毒沼</div>
                      )}
                      {filterObjects('风区') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '风区')}
                        >风区</div>
                      )}
                      {filterObjects('雾区') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '雾区')}
                        >雾区</div>
                      )}
                      {filterObjects('雪地') && (
                        <div 
                          className="object-item" 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, '雪地')}
                        >雪地</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="level-editor-area">
          {activeTab === '2d' ? (
            <TwoDLayoutEditor 
              levelData={levelData} 
              onLevelDataChange={handleLevelDataChange} 
            />
          ) : (
            <ThreeDPreview 
              levelData={levelData} 
            />
          )}
        </div>
      </div>

      <div className="level-prototype-footer">
        <div className="file-actions">
          <button className="btn-new" onClick={handleNewLevel}>新建</button>
          <button className="btn-open" onClick={() => setShowSavedLevels(!showSavedLevels)}>打开</button>
          <button className="btn-save" onClick={handleSaveLevel}>保存</button>
        </div>
        <div className="export-actions">
          <button className="btn-export" onClick={handleExportLevel}>导出</button>
          <button className="btn-import" onClick={handleImportLevel}>导入</button>
        </div>
      </div>
      
      {showSavedLevels && (
        <div className="saved-levels-dialog">
          <div className="dialog-header">
            <h3>已保存的关卡</h3>
            <button className="btn-close" onClick={() => setShowSavedLevels(false)}>×</button>
          </div>
          <div className="dialog-content">
            {savedLevels.length === 0 ? (
              <div className="no-levels">没有已保存的关卡</div>
            ) : (
              <div className="level-list">
                {savedLevels.map(level => (
                  <div 
                    key={level.id} 
                    className="level-item" 
                    onClick={() => handleLoadLevel(level.id)}
                  >
                    <div className="level-name">{level.name}</div>
                    <div className="level-time">上次修改: {formatTime(level.lastModified)}</div>
                    <button 
                      className="btn-delete" 
                      onClick={(e) => handleDeleteLevel(level.id, e)}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelPrototypeTool;