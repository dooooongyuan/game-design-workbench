import React from 'react';
import { Button, Tabs } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import './CharacterAttributes.css';

interface CharacterAttributesProps {
  attributes: { [key: string]: number };
  onAttributeChange: (key: string, value: number) => void;
  onAttributeDelete: (key: string) => void;
}

const CharacterAttributes: React.FC<CharacterAttributesProps> = ({
  attributes,
  onAttributeChange,
  onAttributeDelete
}) => {
  const handleDecrease = (key: string) => {
    const newValue = Math.max(0, attributes[key] - 1);
    onAttributeChange(key, newValue);
  };

  const handleIncrease = (key: string) => {
    const newValue = Math.min(20, attributes[key] + 1);
    onAttributeChange(key, newValue);
  };

  const handleDelete = (key: string) => {
    onAttributeDelete(key);
  };

  const renderAttributeBar = (key: string, value: number) => {
    const percentage = (value / 20) * 100;
    const attributeNameMap: { [key: string]: string } = {
      strength: '力量',
      intelligence: '智力',
      charisma: '魅力',
      agility: '敏捷',
      constitution: '体质'
    };

    return (
      <div key={key} className="attribute-item" data-type={key}>
        <div className="attribute-header">
          <span className="attribute-name">{attributeNameMap[key] || key}</span>
          <div className="attribute-controls">
            <Button 
              type="text" 
              size="small"
              className="control-button decrease"
              onClick={() => handleDecrease(key)}
            >
              -
            </Button>
            <span className="attribute-value">{value}</span>
            <Button 
              type="text" 
              size="small"
              className="control-button increase"
              onClick={() => handleIncrease(key)}
            >
              +
            </Button>
            <Button
              type="text"
              size="small"
              className="attribute-delete-btn"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(key)}
            />
          </div>
        </div>
        <div className="attribute-bar-container">
          <div 
            className="attribute-bar"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="character-attributes ant-tabs-wrapper">
      <Tabs defaultActiveKey="basic">
        <Tabs.TabPane tab="基础属性" key="basic">
          <div className="attributes-container">
            {Object.entries(attributes).map(([key, value]) => 
              renderAttributeBar(key, value)
            )}
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default CharacterAttributes; 