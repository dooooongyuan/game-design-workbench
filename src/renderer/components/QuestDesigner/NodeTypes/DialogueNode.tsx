import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './NodeStyles.css';

// 对话节点组件
const DialogueNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="dialogue-node node">
      <div className="node-header">
        <div className="node-title">{data.label || '对话'}</div>
      </div>
      <div className="node-content">
        <div className="node-description">{data.description || '对话'}</div>
        {data.character && (
          <div className="node-character">
            <strong>角色:</strong> {data.character}
          </div>
        )}
        {data.text && (
          <div className="node-text">
            <strong>内容:</strong> {data.text.length > 50 ? `${data.text.substring(0, 50)}...` : data.text}
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

export default memo(DialogueNode); 