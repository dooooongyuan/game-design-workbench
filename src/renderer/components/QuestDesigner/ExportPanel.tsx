import React, { useState } from 'react';
import { Radio, Button, Form, Select, Divider, message } from 'antd';
import './ExportPanel.css';

const { Option } = Select;

// 定义导出面板组件的属性
interface ExportPanelProps {
  onExport: (format: string) => void;
}

// 导出面板组件
const ExportPanel: React.FC<ExportPanelProps> = ({ onExport }) => {
  // 本地状态
  const [exportFormat, setExportFormat] = useState<string>('json');
  const [engineType, setEngineType] = useState<string>('unity');
  
  // 处理导出格式变化
  const handleFormatChange = (e: any) => {
    setExportFormat(e.target.value);
  };
  
  // 处理引擎类型变化
  const handleEngineChange = (value: string) => {
    setEngineType(value);
  };
  
  // 处理导出
  const handleExport = () => {
    if (exportFormat === 'engine') {
      onExport(engineType);
    } else {
      onExport(exportFormat);
    }
    
    message.success('导出请求已发送');
  };
  
  return (
    <div className="export-panel">
      <h3>导出任务</h3>
      
      <Form layout="vertical">
        <Form.Item label="导出格式">
          <Radio.Group onChange={handleFormatChange} value={exportFormat}>
            <Radio value="json">JSON</Radio>
            <Radio value="xml">XML</Radio>
            <Radio value="csv">CSV</Radio>
            <Radio value="engine">游戏引擎</Radio>
          </Radio.Group>
        </Form.Item>
        
        {exportFormat === 'engine' && (
          <Form.Item label="游戏引擎">
            <Select value={engineType} onChange={handleEngineChange}>
              <Option value="unity">Unity</Option>
              <Option value="unreal">Unreal Engine</Option>
              <Option value="godot">Godot</Option>
            </Select>
          </Form.Item>
        )}
        
        <Divider />
        
        <Form.Item>
          <Button type="primary" onClick={handleExport}>
            导出
          </Button>
        </Form.Item>
      </Form>
      
      <div className="export-info">
        <h4>导出格式说明</h4>
        <ul>
          <li>
            <strong>JSON</strong>: 通用格式，适合大多数游戏引擎和工具
          </li>
          <li>
            <strong>XML</strong>: 适合需要结构化数据的项目
          </li>
          <li>
            <strong>CSV</strong>: 适合表格数据，可导入到Excel等工具
          </li>
          <li>
            <strong>Unity</strong>: 导出为Unity ScriptableObject兼容格式
          </li>
          <li>
            <strong>Unreal Engine</strong>: 导出为Unreal DataTable兼容格式
          </li>
          <li>
            <strong>Godot</strong>: 导出为Godot Resource文件格式
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ExportPanel; 