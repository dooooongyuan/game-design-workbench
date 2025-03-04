import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './NodeStyles.css';

// 任务节点组件
const TaskNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="task-node node">
      <div className="node-header">
        <div className="node-title">{data.label || '任务'}</div>
      </div>
      <div className="node-content">
        <div className="node-description">{data.description || '完成任务'}</div>
        {data.objective && (
          <div className="node-objective">
            <strong>目标:</strong> {data.objective}
            {data.requiredCount > 1 && ` x${data.requiredCount}`}
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

export default memo(TaskNode); 