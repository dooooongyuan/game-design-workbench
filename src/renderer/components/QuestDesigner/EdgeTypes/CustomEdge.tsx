import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import './EdgeStyles.css';

// 自定义边组件
const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  label,
  selected,
}) => {
  // 计算贝塞尔曲线路径
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 根据边的类型设置不同的样式
  const getEdgeClass = () => {
    if (selected) return 'custom-edge selected';
    if (data?.type === 'success') return 'custom-edge success';
    if (data?.type === 'failure') return 'custom-edge failure';
    return 'custom-edge';
  };

  return (
    <>
      <path
        id={id}
        className={getEdgeClass()}
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <div className="edge-label-text">{label}</div>
            {data?.condition && (
              <div className="edge-condition">{data.condition}</div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;
