import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './NodeStyles.css';

// 结束节点组件
const EndNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="end-node node">
      <div className="node-header">
        <div className="node-title">{data.label || '结束'}</div>
      </div>
      <div className="node-content">
        <div className="node-description">{data.description || '任务结束'}</div>
      </div>
      
      {/* 只有输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default memo(EndNode); 