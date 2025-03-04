import React from 'react';
import './ResourceList.css';

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
  versions: any[];
  metadata: Record<string, any>;
}

interface ResourceListProps {
  resources: Resource[];
  selectedResourceId: string | null;
  onSelectResource: (id: string) => void;
  onDeleteResource: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
  filterTags: string[];
  onFilterTagsChange: (tags: string[]) => void;
}

const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  selectedResourceId,
  onSelectResource,
  onDeleteResource,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterTags,
  onFilterTagsChange
}) => {
  // 获取所有可用的标签
  const getAllTags = (): string[] => {
    const tagsSet = new Set<string>();
    resources.forEach(resource => {
      resource.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  };

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

  // 获取资源类型图标
  const getResourceTypeIcon = (type: string): string => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'audio':
        return '🔊';
      case 'model':
        return '🧩';
      case 'document':
        return '📄';
      default:
        return '📦';
    }
  };

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    if (filterTags.includes(tag)) {
      onFilterTagsChange(filterTags.filter(t => t !== tag));
    } else {
      onFilterTagsChange([...filterTags, tag]);
    }
  };

  return (
    <div className="resource-list-container">
      <div className="resource-list-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索资源..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => onSearchChange('')}
            >
              ×
            </button>
          )}
        </div>
        
        <div className="filter-section">
          <div className="filter-label">类型:</div>
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="image">图片</option>
            <option value="audio">音频</option>
            <option value="model">模型</option>
            <option value="document">文档</option>
            <option value="other">其他</option>
          </select>
        </div>
        
        <div className="filter-section">
          <div className="filter-label">标签:</div>
          <div className="tags-container">
            {getAllTags().map(tag => (
              <div 
                key={tag}
                className={`tag ${filterTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="resource-list">
        {resources.length === 0 ? (
          <div className="no-resources">
            <p>没有找到资源</p>
            <p>请上传新资源或调整过滤条件</p>
          </div>
        ) : (
          <table className="resource-table">
            <thead>
              <tr>
                <th className="column-type">类型</th>
                <th className="column-name">名称</th>
                <th className="column-size">大小</th>
                <th className="column-info-group" colSpan={3}>
                  <div className="info-header-group">
                    <div className="info-header-item">版本数</div>
                    <div className="info-header-item">标签</div>
                    <div className="info-header-item">更新时间</div>
                  </div>
                </th>
                <th className="column-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(resource => (
                <tr 
                  key={resource.id}
                  className={selectedResourceId === resource.id ? 'selected' : ''}
                  onClick={() => onSelectResource(resource.id)}
                >
                  <td className="resource-type">
                    {getResourceTypeIcon(resource.type)}
                  </td>
                  <td className="resource-name">
                    {resource.name}
                  </td>
                  <td className="resource-size">
                    {formatFileSize(resource.size)}
                  </td>
                  <td className="resource-info-group" colSpan={3}>
                    <div className="info-group">
                      <div className="info-item resource-versions">
                        <span className="version-badge">{resource.versions.length}</span>
                      </div>
                      <div className="info-item resource-tags">
                        {resource.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      <div className="info-item resource-date">
                        {formatDate(resource.updatedAt)}
                      </div>
                    </div>
                  </td>
                  <td className="resource-actions">
                    <div className="action-buttons">
                      <button 
                        className="action-button view"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectResource(resource.id);
                        }}
                      >
                        查看
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteResource(resource.id);
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ResourceList; 