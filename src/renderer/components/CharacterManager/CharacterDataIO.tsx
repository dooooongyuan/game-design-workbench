import React, { useState } from 'react';
import { Button, Upload, message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { Character } from './CharacterManager';
import './CharacterDataIO.css';

// 自定义导出图标（向下箭头）
const ExportIcon = () => (
  <span className="custom-icon" style={{ fontSize: '18px', marginRight: '10px' }}>
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  </span>
);

// 自定义导入图标（向上箭头）
const ImportIcon = () => (
  <span className="custom-icon" style={{ fontSize: '18px', marginRight: '10px' }}>
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M5 15l7-7 7 7h-4v6H9v-6H5zm14-9v2H5V6h14z" />
    </svg>
  </span>
);

interface CharacterDataIOProps {
  characters: Character[];
  onImport: (characters: Character[]) => void;
}

const CharacterDataIO: React.FC<CharacterDataIOProps> = ({ characters, onImport }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 导出角色数据
  const handleExport = () => {
    try {
      // 创建一个包含角色数据的JSON字符串
      const dataStr = JSON.stringify(characters, null, 2);
      
      // 创建一个Blob对象
      const blob = new Blob([dataStr], { type: 'application/json' });
      
      // 创建一个下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `角色数据_${new Date().toISOString().split('T')[0]}.json`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('角色数据导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };

  // 导入前确认
  const showImportConfirm = () => {
    setIsModalVisible(true);
  };

  // 处理导入
  const handleImport = (importedCharacters: Character[]) => {
    try {
      onImport(importedCharacters);
      message.success('角色数据导入成功');
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请检查文件格式');
    }
  };

  // 上传配置
  const uploadProps: UploadProps = {
    accept: '.json',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedData = JSON.parse(content);
          
          // 验证导入的数据格式
          if (Array.isArray(importedData) && importedData.length > 0) {
            // 检查是否包含必要的字段
            const isValid = importedData.every((char: any) => 
              char.id && char.name && char.attributes && char.relationships !== undefined
            );
            
            if (isValid) {
              handleImport(importedData);
            } else {
              message.error('导入失败：数据格式不正确');
            }
          } else {
            message.error('导入失败：未找到有效的角色数据');
          }
        } catch (error) {
          console.error('解析JSON失败:', error);
          message.error('导入失败：文件格式错误');
        }
      };
      
      reader.readAsText(file);
      return false; // 阻止默认上传行为
    },
  };

  return (
    <div className="character-data-io">
      <div className="data-io-buttons">
        <Button 
          icon={<ExportIcon />} 
          onClick={handleExport}
          className="export-button"
        >
          导出角色数据
        </Button>
        
        <Upload {...uploadProps}>
          <Button 
            icon={<ImportIcon />} 
            onClick={showImportConfirm}
            className="import-button"
          >
            导入角色数据
          </Button>
        </Upload>
      </div>

      <Modal
        title="导入确认"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '22px', marginRight: '10px' }} />
          <div>
            <p>请选择导入方式：</p>
            <p>1. 导入的角色数据将<strong>替换</strong>当前所有角色</p>
            <p>2. 导入前请确保已备份当前角色数据</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CharacterDataIO;