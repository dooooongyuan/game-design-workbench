import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './NodeStyles.css';

// 条件节点组件
const ConditionNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="condition-node node">
      <div className="node-header">
        <div className="node-title">{data.label || '条件'}</div>
      </div>
      <div className="node-content">
        <div className="node-description">{data.description || '条件检查'}</div>
        {data.condition && (
          <div className="node-condition">
            <strong>条件表达式:</strong> {data.condition}
          </div>
        )}
        <div className="node-branches">
          <div className="node-branch success">
            <div className="branch-dot success"></div>
            <span>满足条件</span>
          </div>
          <div className="node-branch failure">
            <div className="branch-dot failure"></div>
            <span>不满足条件</span>
          </div>
        </div>
      </div>
      
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{ background: '#555' }}
      />
      
      {/* 输出连接点 - 满足条件 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ background: '#4CAF50', left: '30%' }}
      />
      
      {/* 输出连接点 - 不满足条件 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ background: '#F44336', left: '70%' }}
      />
    </div>
  );
};

export default memo(ConditionNode); 