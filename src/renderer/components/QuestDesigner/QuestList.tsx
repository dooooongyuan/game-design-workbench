import React, { useState, useEffect } from 'react';
import { List, Button, Modal, Input, Form, Empty, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined } from '@ant-design/icons';
import './QuestList.css';

interface QuestData {
  id: string;
  name: string;
  description: string;
  lastModified: number;
  nodes: any[];
  edges: any[];
}

interface QuestListProps {
  onQuestSelect: (quest: QuestData) => void;
  onQuestCreate: () => void;
}

const QuestList: React.FC<QuestListProps> = ({ onQuestSelect, onQuestCreate }) => {
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [searchText, setSearchText] = useState('');
  
  // 加载所有保存的任务
  useEffect(() => {
    loadQuests();
  }, []);
  
  // 从localStorage加载所有任务
  const loadQuests = () => {
    try {
      const questList: QuestData[] = [];
      
      // 遍历localStorage中的所有键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // 检查是否是任务数据
        if (key && key.startsWith('quest_')) {
          try {
            const questData = JSON.parse(localStorage.getItem(key) || '');
            questList.push({
              id: key,
              name: questData.name || '未命名任务',
              description: questData.description || '',
              lastModified: parseInt(key.split('_')[1]) || Date.now(),
              nodes: questData.nodes || [],
              edges: questData.edges || []
            });
          } catch (err) {
            console.error(`解析任务数据出错 (${key}):`, err);
          }
        }
      }
      
      // 按最后修改时间排序（最新的在前）
      questList.sort((a, b) => b.lastModified - a.lastModified);
      setQuests(questList);
    } catch (error) {
      console.error('加载任务列表出错:', error);
      message.error('加载任务列表失败');
    }
  };
  
  // 处理任务选择
  const handleQuestSelect = (quest: QuestData) => {
    onQuestSelect(quest);
  };
  
  // 处理任务删除
  const handleQuestDelete = (questId: string) => {
    try {
      localStorage.removeItem(questId);
      setQuests(quests.filter(quest => quest.id !== questId));
      message.success('任务已删除');
    } catch (error) {
      console.error('删除任务出错:', error);
      message.error('删除任务失败');
    }
  };
  
  // 处理任务导入
  const handleImport = () => {
    try {
      if (!importJson.trim()) {
        message.error('请输入有效的JSON数据');
        return;
      }
      
      const questData = JSON.parse(importJson);
      
      // 验证导入的数据
      if (!questData.name || !Array.isArray(questData.nodes) || !Array.isArray(questData.edges)) {
        message.error('无效的任务数据格式');
        return;
      }
      
      // 保存导入的任务
      const questId = `quest_${Date.now()}`;
      localStorage.setItem(questId, JSON.stringify(questData));
      
      // 更新任务列表
      loadQuests();
      
      // 关闭导入对话框
      setIsImportModalVisible(false);
      setImportJson('');
      
      message.success('任务导入成功');
    } catch (error) {
      console.error('导入任务出错:', error);
      message.error('导入任务失败，请检查JSON格式是否正确');
    }
  };
  
  // 过滤任务列表
  const filteredQuests = quests.filter(quest => 
    quest.name.toLowerCase().includes(searchText.toLowerCase()) ||
    quest.description.toLowerCase().includes(searchText.toLowerCase())
  );
  
  return (
    <div className="quest-list-container">
      <div className="quest-list-header">
        <h2>任务列表</h2>
        <div className="quest-list-actions">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onQuestCreate}
          >
            新建任务
          </Button>
          <Button 
            icon={<ImportOutlined />} 
            onClick={() => setIsImportModalVisible(true)}
          >
            导入任务
          </Button>
        </div>
      </div>
      
      <Input.Search
        placeholder="搜索任务"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      
      {filteredQuests.length > 0 ? (
        <List
          className="quest-list"
          itemLayout="horizontal"
          dataSource={filteredQuests}
          renderItem={quest => (
            <List.Item
              actions={[
                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => handleQuestSelect(quest)}
                >
                  编辑
                </Button>,
                <Popconfirm
                  title="确定要删除这个任务吗？"
                  onConfirm={() => handleQuestDelete(quest.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={<a onClick={() => handleQuestSelect(quest)}>{quest.name}</a>}
                description={
                  <div>
                    <p>{quest.description || '无描述'}</p>
                    <p className="quest-meta-info">
                      节点数: {quest.nodes.length} | 
                      最后修改: {new Date(quest.lastModified).toLocaleString()}
                    </p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty 
          description={searchText ? '没有找到匹配的任务' : '暂无任务'} 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
      
      {/* 导入任务对话框 */}
      <Modal
        title="导入任务"
        open={isImportModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setIsImportModalVisible(false);
          setImportJson('');
        }}
        okText="导入"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="粘贴任务JSON数据">
            <Input.TextArea
              rows={10}
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder="在此粘贴任务的JSON数据..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestList;