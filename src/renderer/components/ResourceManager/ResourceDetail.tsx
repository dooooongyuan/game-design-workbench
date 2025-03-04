import React, { useState, useEffect } from 'react';
import './ResourceDetail.css';
import VersionHistory from './VersionHistory';

// 导入资源类型
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

// 导入资源版本类型
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

interface ResourceDetailProps {
  resource: Resource | null;
  selectedVersionId: string | null;
  onUpdateResource: (updates: Partial<Resource>) => void;
  onDeleteResource: () => void;
  onAddVersion: (version: Omit<ResourceVersion, 'id' | 'resourceId' | 'versionNumber' | 'createdAt'>) => void;
  onSwitchVersion: (versionId: string) => void;
}

const ResourceDetail: React.FC<ResourceDetailProps> = ({
  resource,
  selectedVersionId,
  onUpdateResource,
  onDeleteResource,
  onAddVersion,
  onSwitchVersion
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');
  const [editedDescription, setEditedDescription] = useState<string>('');
  const [editedTags, setEditedTags] = useState<string>('');
  const [newTag, setNewTag] = useState<string>('');
  const [isUploadingNewVersion, setIsUploadingNewVersion] = useState<boolean>(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionChangeLog, setNewVersionChangeLog] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'info' | 'versions' | 'preview'>('info');

  // 当资源变化时更新编辑状态
  useEffect(() => {
    if (resource) {
      setEditedName(resource.name);
      setEditedDescription(resource.description);
      setEditedTags(resource.tags.join(', '));
    }
  }, [resource]);

  if (!resource) {
    return <div className="resource-detail-empty">请选择一个资源查看详情</div>;
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // 处理保存编辑
  const handleSaveEdit = () => {
    const tags = editedTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    onUpdateResource({
      name: editedName,
      description: editedDescription,
      tags
    });

    setIsEditing(false);
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditedName(resource.name);
    setEditedDescription(resource.description);
    setEditedTags(resource.tags.join(', '));
    setIsEditing(false);
  };

  // 处理添加标签
  const handleAddTag = () => {
    if (newTag.trim() !== '') {
      const currentTags = editedTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
      
      if (!currentTags.includes(newTag.trim())) {
        setEditedTags(currentTags.length > 0 
          ? `${editedTags}, ${newTag.trim()}` 
          : newTag.trim()
        );
      }
      
      setNewTag('');
    }
  };

  // 处理上传新版本
  const handleUploadNewVersion = () => {
    if (newVersionFile && newVersionChangeLog.trim() !== '') {
      // 在实际应用中，这里应该处理文件上传
      // 这里简化为直接使用文件信息
      onAddVersion({
        path: URL.createObjectURL(newVersionFile),
        size: newVersionFile.size,
        createdBy: '当前用户',
        changeLog: newVersionChangeLog
      });
      
      setIsUploadingNewVersion(false);
      setNewVersionFile(null);
      setNewVersionChangeLog('');
    }
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setNewVersionFile(event.target.files[0]);
    }
  };

  // 获取当前版本
  const getCurrentVersion = (): ResourceVersion | undefined => {
    if (selectedVersionId) {
      return resource.versions.find(v => v.id === selectedVersionId);
    }
    return resource.versions[resource.versions.length - 1];
  };

  // 获取资源预览
  const renderResourcePreview = () => {
    const currentVersion = getCurrentVersion();
    if (!currentVersion) return null;

    switch (resource.type) {
      case 'image':
        return (
          <div className="resource-preview image-preview">
            <img src={currentVersion.path} alt={resource.name} />
          </div>
        );
      case 'audio':
        return (
          <div className="resource-preview audio-preview">
            <audio controls>
              <source src={currentVersion.path} />
              您的浏览器不支持音频预览
            </audio>
          </div>
        );
      case 'document':
        return (
          <div className="resource-preview document-preview">
            <iframe src={currentVersion.path} title={resource.name}></iframe>
          </div>
        );
      default:
        return (
          <div className="resource-preview generic-preview">
            <div className="preview-icon">📦</div>
            <div className="preview-message">无法预览此类型的资源</div>
          </div>
        );
    }
  };

  return (
    <div className="resource-detail">
      <div className="resource-detail-header">
        <div className="resource-title">
          {isEditing ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="资源名称"
            />
          ) : (
            <h2>{resource.name}</h2>
          )}
        </div>
        
        <div className="resource-actions">
          {isEditing ? (
            <>
              <button 
                className="action-button save"
                onClick={handleSaveEdit}
              >
                保存
              </button>
              <button 
                className="action-button cancel"
                onClick={handleCancelEdit}
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button 
                className="action-button edit"
                onClick={() => setIsEditing(true)}
              >
                编辑
              </button>
              <button 
                className="action-button delete"
                onClick={onDeleteResource}
              >
                删除
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="resource-detail-tabs">
        <button 
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          基本信息
        </button>
        <button 
          className={`tab-button ${activeTab === 'versions' ? 'active' : ''}`}
          onClick={() => setActiveTab('versions')}
        >
          版本历史
        </button>
        <button 
          className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          资源预览
        </button>
      </div>
      
      <div className="resource-detail-content">
        {activeTab === 'info' && (
          <div className="resource-info">
            <div className="info-section">
              <div className="info-label">类型:</div>
              <div className="info-value">{resource.type}</div>
            </div>
            
            <div className="info-section">
              <div className="info-label">大小:</div>
              <div className="info-value">{formatFileSize(resource.size)}</div>
            </div>
            
            <div className="info-section">
              <div className="info-label">创建时间:</div>
              <div className="info-value">{formatDate(resource.createdAt)}</div>
            </div>
            
            <div className="info-section">
              <div className="info-label">更新时间:</div>
              <div className="info-value">{formatDate(resource.updatedAt)}</div>
            </div>
            
            <div className="info-section">
              <div className="info-label">版本数:</div>
              <div className="info-value">{resource.versions.length}</div>
            </div>
            
            <div className="info-section description">
              <div className="info-label">描述:</div>
              {isEditing ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="资源描述"
                />
              ) : (
                <div className="info-value">{resource.description || '无描述'}</div>
              )}
            </div>
            
            <div className="info-section tags">
              <div className="info-label">标签:</div>
              {isEditing ? (
                <div className="tags-editor">
                  <input
                    type="text"
                    value={editedTags}
                    onChange={(e) => setEditedTags(e.target.value)}
                    placeholder="标签 (用逗号分隔)"
                  />
                  <div className="add-tag-section">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="添加新标签"
                    />
                    <button 
                      className="add-tag-button"
                      onClick={handleAddTag}
                    >
                      添加
                    </button>
                  </div>
                </div>
              ) : (
                <div className="info-value tags-list">
                  {resource.tags.length > 0 ? (
                    resource.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))
                  ) : (
                    '无标签'
                  )}
                </div>
              )}
            </div>
            
            <div className="info-section metadata">
              <div className="info-label">元数据:</div>
              <div className="info-value">
                {Object.keys(resource.metadata).length > 0 ? (
                  <pre>{JSON.stringify(resource.metadata, null, 2)}</pre>
                ) : (
                  '无元数据'
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'versions' && (
          <div className="resource-versions">
            <div className="versions-header">
              <h3>版本历史</h3>
              <button 
                className="add-version-button"
                onClick={() => setIsUploadingNewVersion(!isUploadingNewVersion)}
              >
                {isUploadingNewVersion ? '取消上传' : '上传新版本'}
              </button>
            </div>
            
            {isUploadingNewVersion && (
              <div className="upload-version-form">
                <div className="form-group">
                  <label>选择文件:</label>
                  <input 
                    type="file" 
                    onChange={handleFileSelect}
                  />
                </div>
                
                <div className="form-group">
                  <label>变更说明:</label>
                  <textarea
                    value={newVersionChangeLog}
                    onChange={(e) => setNewVersionChangeLog(e.target.value)}
                    placeholder="描述这个版本的变更内容"
                  />
                </div>
                
                <button 
                  className="upload-button"
                  onClick={handleUploadNewVersion}
                  disabled={!newVersionFile || newVersionChangeLog.trim() === ''}
                >
                  上传
                </button>
              </div>
            )}
            
            <VersionHistory
              versions={resource.versions}
              selectedVersionId={selectedVersionId}
              onSwitchVersion={onSwitchVersion}
            />
          </div>
        )}
        
        {activeTab === 'preview' && (
          <div className="resource-preview-container">
            {renderResourcePreview()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceDetail; 