import React, { useState } from 'react';
import QuestDesignerTool from './QuestDesignerTool';
import QuestList from './QuestList';
import './QuestDesigner.css';

// 任务设计器入口组件
const QuestDesigner: React.FC = () => {
  const [currentQuest, setCurrentQuest] = useState<any>(null);

  // 处理任务选择
  const handleQuestSelect = (questData: any) => {
    setCurrentQuest(questData);
  };

  // 处理新建任务
  const handleQuestCreate = () => {
    setCurrentQuest({
      name: '新建任务',
      description: '',
      nodes: [
        {
          id: 'start-node',
          type: 'startNode',
          position: { x: 250, y: 100 },
          data: { label: '任务开始' }
        }
      ],
      edges: []
    });
  };

  // 返回任务列表
  const handleBackToList = () => {
    setCurrentQuest(null);
  };

  return (
    <div className="quest-designer">
      {currentQuest ? (
        <QuestDesignerTool
          initialQuest={currentQuest}
          onBackToList={handleBackToList}
        />
      ) : (
        <QuestList
          onQuestSelect={handleQuestSelect}
          onQuestCreate={handleQuestCreate}
        />
      )}
    </div>
  );
};

export default QuestDesigner;