import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './NodeStyles.css';

// 奖励节点组件
const RewardNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="reward-node node">
      <div className="node-header">
        <div className="node-title">{data.label || '奖励'}</div>
      </div>
      <div className="node-content">
        <div className="node-description">{data.description || '奖励'}</div>
        {data.rewardType && (
          <div className="node-reward-type">
            <strong>类型:</strong> {getRewardTypeName(data.rewardType)}
          </div>
        )}
        {data.rewardValue && (
          <div className="node-reward-value">
            <strong>奖励:</strong> {data.rewardValue}
          </div>
        )}
      </div>
      
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{ background: '#555' }}
      />
      
      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{ background: '#4CAF50' }}
      />
    </div>
  );
};

// 获取奖励类型名称
const getRewardTypeName = (type: string): string => {
  switch (type) {
    case 'item':
      return '物品';
    case 'experience':
      return '经验';
    case 'currency':
      return '货币';
    case 'reputation':
      return '声望';
    default:
      return type;
  }
};

export default memo(RewardNode); 