import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './NodeStyles.css';

// 开始节点组件
const StartNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="start-node node">
      <div className="node-header">
        <div className="node-title">{data.label || '开始'}</div>
      </div>
      <div className="node-content">
        <div className="node-description">{data.description || '任务开始'}</div>
      </div>
      
      {/* 只有输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{ background: '#4CAF50' }}
      />
    </div>
  );
};

export default memo(StartNode); 