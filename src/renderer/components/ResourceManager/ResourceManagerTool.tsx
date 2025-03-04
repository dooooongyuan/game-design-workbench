import React, { useState, useEffect } from 'react';
import './ResourceManagerTool.css';
import ResourceList from './ResourceList';
import ResourceDetail from './ResourceDetail';
import ResourceUploader from './ResourceUploader';
import VersionHistory from './VersionHistory';

// 定义资源类型
interface Resource {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'model' | 'document' | 'other';
  path: string;
  size: number;
  tags: string[];
  description: string;
  createdAt: number;
  updatedAt: number;
  versions: ResourceVersion[];
  metadata: Record<string, any>;
}

// 定义资源版本类型
interface ResourceVersion {
  id: string;
  resourceId: string;
  versionNumber: number;
  path: string;
  size: number;
  createdAt: number;
  createdBy: string;
  changeLog: string;
}

// 本地存储键
const STORAGE_KEY_RESOURCES = 'resourceManager_resources';

// 示例资源数据
const EXAMPLE_RESOURCES: Resource[] = [
  {
    id: 'example1',
    name: '角色模型-战士',
    type: 'model',
    path: '/assets/models/warrior.fbx',
    size: 8420000,
    tags: ['角色', '战士', '3D模型'],
    description: '游戏中战士角色的3D模型，包含基础动画和贴图。',
    createdAt: Date.now() - 86400000 * 5, // 5天前
    updatedAt: Date.now() - 86400000 * 2, // 2天前
    versions: [
      {
        id: 'v1',
        resourceId: 'example1',
        versionNumber: 1,
        path: '/assets/models/warrior_v1.fbx',
        size: 7800000,
        createdAt: Date.now() - 86400000 * 5, // 5天前
        createdBy: '张三',
        changeLog: '初始版本'
      },
      {
        id: 'v2',
        resourceId: 'example1',
        versionNumber: 2,
        path: '/assets/models/warrior.fbx',
        size: 8420000,
        createdAt: Date.now() - 86400000 * 2, // 2天前
        createdBy: '李四',
        changeLog: '优化了模型的面数，提高了细节表现'
      }
    ],
    metadata: {
      polygons: 12500,
      format: 'FBX',
      animations: ['idle', 'walk', 'attack', 'death']
    }
  },
  {
    id: 'example2',
    name: '背景音乐-主城',
    type: 'audio',
    path: '/assets/audio/main_city.mp3',
    size: 4560000,
    tags: ['音频', '背景音乐', '主城'],
    description: '游戏主城场景的背景音乐，循环播放。',
    createdAt: Date.now() - 86400000 * 10, // 10天前
    updatedAt: Date.now() - 86400000 * 3, // 3天前
    versions: [
      {
        id: 'v1',
        resourceId: 'example2',
        versionNumber: 1,
        path: '/assets/audio/main_city_draft.mp3',
        size: 3800000,
        createdAt: Date.now() - 86400000 * 10, // 10天前
        createdBy: '王五',
        changeLog: '初始版本'
      },
      {
        id: 'v2',
        resourceId: 'example2',
        versionNumber: 2,
        path: '/assets/audio/main_city_v2.mp3',
        size: 4200000,
        createdAt: Date.now() - 86400000 * 7, // 7天前
        createdBy: '王五',
        changeLog: '调整了音乐的节奏和音量'
      },
      {
        id: 'v3',
        resourceId: 'example2',
        versionNumber: 3,
        path: '/assets/audio/main_city.mp3',
        size: 4560000,
        createdAt: Date.now() - 86400000 * 3, // 3天前
        createdBy: '赵六',
        changeLog: '添加了更多的乐器层次，增强了空间感'
      }
    ],
    metadata: {
      format: 'MP3',
      bitrate: '320kbps',
      duration: '3:45',
      loop: true
    }
  },
  {
    id: 'example3',
    name: '游戏UI设计文档',
    type: 'document',
    path: '/assets/docs/ui_design.pdf',
    size: 2340000,
    tags: ['文档', 'UI', '设计'],
    description: '游戏UI的设计文档，包含所有界面的设计规范和交互说明。',
    createdAt: Date.now() - 86400000 * 15, // 15天前
    updatedAt: Date.now() - 86400000, // 1天前
    versions: [
      {
        id: 'v1',
        resourceId: 'example3',
        versionNumber: 1,
        path: '/assets/docs/ui_design_draft.pdf',
        size: 1800000,
        createdAt: Date.now() - 86400000 * 15, // 15天前
        createdBy: '李四',
        changeLog: '初始版本'
      },
      {
        id: 'v2',
        resourceId: 'example3',
        versionNumber: 2,
        path: '/assets/docs/ui_design_v2.pdf',
        size: 2100000,
        createdAt: Date.now() - 86400000 * 8, // 8天前
        createdBy: '李四',
        changeLog: '添加了战斗界面的设计规范'
      },
      {
        id: 'v3',
        resourceId: 'example3',
        versionNumber: 3,
        path: '/assets/docs/ui_design_v3.pdf',
        size: 2200000,
        createdAt: Date.now() - 86400000 * 4, // 4天前
        createdBy: '张三',
        changeLog: '更新了商城界面的设计'
      },
      {
        id: 'v4',
        resourceId: 'example3',
        versionNumber: 4,
        path: '/assets/docs/ui_design.pdf',
        size: 2340000,
        createdAt: Date.now() - 86400000, // 1天前
        createdBy: '李四',
        changeLog: '完善了所有界面的交互说明'
      }
    ],
    metadata: {
      format: 'PDF',
      pages: 48,
      author: '设计团队'
    }
  }
];

const ResourceManagerTool: React.FC = () => {
  // 状态管理
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'detail' | 'upload'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // 从本地存储加载数据
  useEffect(() => {
    try {
      const savedResources = localStorage.getItem(STORAGE_KEY_RESOURCES);
      if (savedResources) {
        setResources(JSON.parse(savedResources));
      } else {
        // 如果没有保存的资源，使用示例资源
        setResources(EXAMPLE_RESOURCES);
        localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(EXAMPLE_RESOURCES));
      }
    } catch (error) {
      console.error('加载资源数据失败:', error);
      showStatusMessage('加载资源数据失败', 'error');
      // 使用示例资源作为备用
      setResources(EXAMPLE_RESOURCES);
    }
  }, []);

  // 保存资源到本地存储
  useEffect(() => {
    if (resources.length > 0) {
      localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(resources));
    }
  }, [resources]);

  // 显示状态消息
  const showStatusMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    // 3秒后自动清除消息
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // 处理选择资源
  const handleSelectResource = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setActiveTab('detail');
  };

  // 添加新资源
  const handleAddResource = (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) => {
    const newResource: Resource = {
      ...resource,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      versions: [{
        id: generateId(),
        resourceId: '',  // 将在下面更新
        versionNumber: 1,
        path: resource.path,
        size: resource.size,
        createdAt: Date.now(),
        createdBy: '当前用户',
        changeLog: '初始版本'
      }]
    };
    
    // 更新版本的resourceId
    newResource.versions[0].resourceId = newResource.id;
    
    setResources([...resources, newResource]);
    setSelectedResourceId(newResource.id);
    setActiveTab('detail');
    showStatusMessage('资源已添加', 'success');
  };

  // 更新资源
  const handleUpdateResource = (resourceId: string, updates: Partial<Resource>) => {
    const updatedResources = resources.map(resource => 
      resource.id === resourceId 
        ? { ...resource, ...updates, updatedAt: Date.now() } 
        : resource
    );
    
    setResources(updatedResources);
    showStatusMessage('资源已更新', 'success');
  };

  // 删除资源
  const handleDeleteResource = (resourceId: string) => {
    if (window.confirm('确定要删除这个资源吗？所有版本都将被删除。')) {
      setResources(resources.filter(r => r.id !== resourceId));
      
      if (selectedResourceId === resourceId) {
        setSelectedResourceId(null);
        setSelectedVersionId(null);
      }
      
      showStatusMessage('资源已删除', 'success');
    }
  };

  // 添加新版本
  const handleAddVersion = (resourceId: string, version: Omit<ResourceVersion, 'id' | 'resourceId' | 'versionNumber' | 'createdAt'>) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;
    
    const newVersion: ResourceVersion = {
      ...version,
      id: generateId(),
      resourceId: resourceId,
      versionNumber: resource.versions.length + 1,
      createdAt: Date.now()
    };
    
    const updatedResource = {
      ...resource,
      path: version.path,
      size: version.size,
      updatedAt: Date.now(),
      versions: [...resource.versions, newVersion]
    };
    
    setResources(resources.map(r => r.id === resourceId ? updatedResource : r));
    setSelectedVersionId(newVersion.id);
    showStatusMessage('新版本已添加', 'success');
  };

  // 切换到特定版本
  const handleSwitchVersion = (resourceId: string, versionId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;
    
    const version = resource.versions.find(v => v.id === versionId);
    if (!version) return;
    
    const updatedResource = {
      ...resource,
      path: version.path,
      size: version.size,
      updatedAt: Date.now()
    };
    
    setResources(resources.map(r => r.id === resourceId ? updatedResource : r));
    setSelectedVersionId(versionId);
    showStatusMessage(`已切换到版本 ${version.versionNumber}`, 'success');
  };

  // 获取当前选中的资源
  const getSelectedResource = (): Resource | null => {
    if (!selectedResourceId) return null;
    return resources.find(r => r.id === selectedResourceId) || null;
  };

  // 获取当前选中的版本
  const getSelectedVersion = (): ResourceVersion | null => {
    const resource = getSelectedResource();
    if (!resource || !selectedVersionId) return null;
    return resource.versions.find(v => v.id === selectedVersionId) || null;
  };

  // 过滤资源
  const getFilteredResources = (): Resource[] => {
    return resources.filter(resource => {
      // 按名称和描述搜索
      const matchesSearch = searchQuery === '' || 
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 按类型过滤
      const matchesType = filterType === 'all' || resource.type === filterType;
      
      // 按标签过滤
      const matchesTags = filterTags.length === 0 || 
        filterTags.every(tag => resource.tags.includes(tag));
      
      return matchesSearch && matchesType && matchesTags;
    });
  };

  return (
    <div className="resource-manager">
      <div className="resource-manager-header">
        <div className="resource-manager-title">资源管理中心</div>
        
        <div className="resource-manager-tabs">
          <button 
            className={`resource-tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            资源列表
          </button>
          <button 
            className={`resource-tab-button ${activeTab === 'detail' ? 'active' : ''}`}
            onClick={() => setActiveTab('detail')}
            disabled={!selectedResourceId}
          >
            资源详情
          </button>
          <button 
            className={`resource-tab-button ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            上传资源
          </button>
        </div>
        
        <div className="resource-manager-actions">
          <button 
            className="action-button tutorial-toggle"
            onClick={() => setShowTutorial(!showTutorial)}
          >
            {showTutorial ? '隐藏教程' : '显示教程'} 📚
          </button>
        </div>
      </div>
      
      <div className="resource-manager-body">
        {showTutorial && (
          <div className="resource-tutorial-modal">
            <div className="resource-tutorial-content">
              <div className="resource-tutorial-header">
                <h3>使用教程</h3>
                <button 
                  className="resource-tutorial-close"
                  onClick={() => setShowTutorial(false)}
                >
                  ×
                </button>
              </div>
              
              {activeTab === 'list' && (
                <div className="resource-tutorial-section">
                  <h4>资源列表使用指南</h4>
                  <ol>
                    <li>使用搜索框查找特定资源</li>
                    <li>使用类型和标签过滤器筛选资源</li>
                    <li>点击资源项查看详细信息</li>
                    <li>使用右侧操作按钮管理资源</li>
                  </ol>
                  <div className="resource-tutorial-tips">
                    <strong>提示：</strong>可以通过拖放方式重新排序资源
                  </div>
                </div>
              )}
              
              {activeTab === 'detail' && (
                <div className="resource-tutorial-section">
                  <h4>资源详情使用指南</h4>
                  <ol>
                    <li>查看资源的基本信息和预览</li>
                    <li>编辑资源的名称、描述和标签</li>
                    <li>管理资源的版本历史</li>
                    <li>切换到不同版本查看历史变更</li>
                    <li>下载或导出资源</li>
                  </ol>
                  <div className="resource-tutorial-tips">
                    <strong>提示：</strong>版本历史允许您回溯到任何历史版本
                  </div>
                </div>
              )}
              
              {activeTab === 'upload' && (
                <div className="resource-tutorial-section">
                  <h4>上传资源使用指南</h4>
                  <ol>
                    <li>选择要上传的文件</li>
                    <li>填写资源的名称、描述和类型</li>
                    <li>添加标签以便于分类和搜索</li>
                    <li>添加自定义元数据</li>
                    <li>点击上传按钮完成资源添加</li>
                  </ol>
                  <div className="resource-tutorial-tips">
                    <strong>提示：</strong>添加详细的元数据可以帮助团队更好地理解和使用资源
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className={`resource-manager-content ${showTutorial ? 'with-tutorial' : ''}`}>
          {activeTab === 'list' && (
            <ResourceList
              resources={getFilteredResources()}
              selectedResourceId={selectedResourceId}
              onSelectResource={handleSelectResource}
              onDeleteResource={handleDeleteResource}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              filterTags={filterTags}
              onFilterTagsChange={setFilterTags}
            />
          )}
          
          {activeTab === 'detail' && selectedResourceId && (
            <ResourceDetail
              resource={getSelectedResource()}
              selectedVersionId={selectedVersionId}
              onUpdateResource={(updates) => handleUpdateResource(selectedResourceId, updates)}
              onDeleteResource={() => handleDeleteResource(selectedResourceId)}
              onAddVersion={(version) => handleAddVersion(selectedResourceId, version)}
              onSwitchVersion={(versionId) => handleSwitchVersion(selectedResourceId, versionId)}
            />
          )}
          
          {activeTab === 'upload' && (
            <ResourceUploader
              onAddResource={handleAddResource}
              onSuccess={(message) => showStatusMessage(message, 'success')}
              onError={(message) => showStatusMessage(message, 'error')}
            />
          )}
        </div>
      </div>
      
      {statusMessage && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}
    </div>
  );
};

export default ResourceManagerTool; 