import React, { useState, useRef, DragEvent } from 'react';
import './ResourceUploader.css';

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

interface ResourceUploaderProps {
  onAddResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const ResourceUploader: React.FC<ResourceUploaderProps> = ({
  onAddResource,
  onSuccess,
  onError
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [resourceName, setResourceName] = useState<string>('');
  const [resourceType, setResourceType] = useState<'image' | 'audio' | 'model' | 'document' | 'other'>('other');
  const [resourceDescription, setResourceDescription] = useState<string>('');
  const [resourceTags, setResourceTags] = useState<string>('');
  const [newTag, setNewTag] = useState<string>('');
  const [metadataKey, setMetadataKey] = useState<string>('');
  const [metadataValue, setMetadataValue] = useState<string>('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理拖拽开始
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // 处理拖拽结束
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // 处理拖拽悬停
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // 处理拖拽放置
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // 处理文件
  const handleFiles = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    
    // 如果资源名称为空，使用第一个文件的名称
    if (resourceName === '' && selectedFiles.length > 0) {
      setResourceName(selectedFiles[0].name.split('.')[0]);
    }
    
    // 根据文件类型自动设置资源类型
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      const fileType = file.type.split('/')[0];
      
      switch (fileType) {
        case 'image':
          setResourceType('image');
          break;
        case 'audio':
          setResourceType('audio');
          break;
        case 'video':
          setResourceType('model'); // 假设视频文件是3D模型
          break;
        case 'application':
          if (file.type.includes('pdf') || file.type.includes('document')) {
            setResourceType('document');
          } else {
            setResourceType('other');
          }
          break;
        default:
          setResourceType('other');
      }
    }
  };

  // 处理添加标签
  const handleAddTag = () => {
    if (newTag.trim() !== '') {
      const currentTags = resourceTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
      
      if (!currentTags.includes(newTag.trim())) {
        setResourceTags(currentTags.length > 0 
          ? `${resourceTags}, ${newTag.trim()}` 
          : newTag.trim()
        );
      }
      
      setNewTag('');
    }
  };

  // 处理添加元数据
  const handleAddMetadata = () => {
    if (metadataKey.trim() !== '' && metadataValue.trim() !== '') {
      setMetadata({
        ...metadata,
        [metadataKey]: metadataValue
      });
      
      setMetadataKey('');
      setMetadataValue('');
    }
  };

  // 处理删除元数据
  const handleRemoveMetadata = (key: string) => {
    const newMetadata = { ...metadata };
    delete newMetadata[key];
    setMetadata(newMetadata);
  };

  // 处理上传资源
  const handleUpload = () => {
    if (files.length === 0) {
      setErrorMessage('请选择要上传的文件');
      if (onError) onError('请选择要上传的文件');
      return;
    }
    
    if (resourceName.trim() === '') {
      setErrorMessage('请输入资源名称');
      if (onError) onError('请输入资源名称');
      return;
    }
    
    const file = files[0];
    
    // 解析标签
    const tags = resourceTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    // 创建资源对象
    const resource = {
      name: resourceName,
      type: resourceType,
      path: URL.createObjectURL(file), // 在实际应用中，这里应该是上传到服务器后的URL
      size: file.size,
      tags,
      description: resourceDescription,
      metadata
    };
    
    try {
      // 调用添加资源函数
      onAddResource(resource);
      
      // 显示成功消息
      if (onSuccess) onSuccess(`资源 "${resourceName}" 上传成功`);
      
      // 重置表单
      setFiles([]);
      setResourceName('');
      setResourceType('other');
      setResourceDescription('');
      setResourceTags('');
      setMetadata({});
      setErrorMessage('');
      
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // 显示错误消息
      const errorMessage = error instanceof Error ? error.message : '上传资源时发生错误';
      setErrorMessage(errorMessage);
      if (onError) onError(errorMessage);
    }
  };

  return (
    <div className="resource-uploader">
      <div className="upload-section">
        <div 
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {files.length > 0 ? (
            <div className="selected-files">
              <div className="file-icon">📄</div>
              <div className="file-info">
                <div className="file-name">{files[0].name}</div>
                <div className="file-size">{(files[0].size / 1024).toFixed(2)} KB</div>
              </div>
              <button 
                className="remove-file"
                onClick={(e) => {
                  e.stopPropagation();
                  setFiles([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <div className="drop-message">
              <div className="drop-icon">📁</div>
              <div className="drop-text">
                拖放文件到这里或点击选择文件
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="resource-form">
        <div className="form-group">
          <label>资源名称:</label>
          <input 
            type="text"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="输入资源名称"
          />
        </div>
        
        <div className="form-group">
          <label>资源类型:</label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value as any)}
          >
            <option value="image">图片</option>
            <option value="audio">音频</option>
            <option value="model">模型</option>
            <option value="document">文档</option>
            <option value="other">其他</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>资源描述:</label>
          <textarea
            value={resourceDescription}
            onChange={(e) => setResourceDescription(e.target.value)}
            placeholder="输入资源描述"
          />
        </div>
        
        <div className="form-group">
          <label>标签:</label>
          <input
            type="text"
            value={resourceTags}
            onChange={(e) => setResourceTags(e.target.value)}
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
          {resourceTags && (
            <div className="tags-preview">
              {resourceTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '').map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>元数据:</label>
          <div className="metadata-editor">
            <div className="metadata-inputs">
              <input
                type="text"
                value={metadataKey}
                onChange={(e) => setMetadataKey(e.target.value)}
                placeholder="键"
              />
              <input
                type="text"
                value={metadataValue}
                onChange={(e) => setMetadataValue(e.target.value)}
                placeholder="值"
              />
              <button 
                className="add-metadata-button"
                onClick={handleAddMetadata}
              >
                添加
              </button>
            </div>
            
            {Object.keys(metadata).length > 0 && (
              <div className="metadata-list">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="metadata-item">
                    <div className="metadata-key">{key}:</div>
                    <div className="metadata-value">{String(value)}</div>
                    <button 
                      className="remove-metadata"
                      onClick={() => handleRemoveMetadata(key)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
        
        <div className="form-actions">
          <button 
            className="upload-button"
            onClick={handleUpload}
            disabled={files.length === 0 || resourceName.trim() === ''}
          >
            上传资源
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceUploader; 