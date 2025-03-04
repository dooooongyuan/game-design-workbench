import React from 'react';
import './VersionHistory.css';

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

interface VersionHistoryProps {
  versions: ResourceVersion[];
  selectedVersionId: string | null;
  onSwitchVersion: (versionId: string) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  selectedVersionId,
  onSwitchVersion
}) => {
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

  // 计算版本之间的差异
  const getVersionDiff = (version: ResourceVersion, index: number): string => {
    if (index === versions.length - 1) return '初始版本';
    
    const prevVersion = versions[index + 1];
    const sizeDiff = version.size - prevVersion.size;
    
    if (sizeDiff === 0) return '无变化';
    
    const sign = sizeDiff > 0 ? '+' : '';
    return `${sign}${formatFileSize(sizeDiff)}`;
  };

  return (
    <div className="version-history">
      {versions.length === 0 ? (
        <div className="no-versions">
          <p>没有版本历史记录</p>
        </div>
      ) : (
        <div className="versions-timeline">
          {versions
            .slice()
            .sort((a, b) => b.versionNumber - a.versionNumber)
            .map((version, index) => (
              <div 
                key={version.id}
                className={`version-item ${selectedVersionId === version.id ? 'selected' : ''}`}
                onClick={() => onSwitchVersion(version.id)}
              >
                <div className="version-header">
                  <div className="version-number">版本 {version.versionNumber}</div>
                  <div className="version-date">{formatDate(version.createdAt)}</div>
                </div>
                
                <div className="version-body">
                  <div className="version-info">
                    <div className="info-row">
                      <div className="info-label">大小:</div>
                      <div className="info-value">{formatFileSize(version.size)}</div>
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">变化:</div>
                      <div className="info-value diff">{getVersionDiff(version, index)}</div>
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">创建者:</div>
                      <div className="info-value">{version.createdBy}</div>
                    </div>
                  </div>
                  
                  <div className="version-changelog">
                    <div className="changelog-label">变更说明:</div>
                    <div className="changelog-content">{version.changeLog}</div>
                  </div>
                </div>
                
                <div className="version-actions">
                  {selectedVersionId !== version.id && (
                    <button 
                      className="switch-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchVersion(version.id);
                      }}
                    >
                      切换到此版本
                    </button>
                  )}
                  
                  <button 
                    className="download-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(version.path, '_blank');
                    }}
                  >
                    下载
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default VersionHistory; 