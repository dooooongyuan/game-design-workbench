import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  Panel,
  MarkerType,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  NodeRemoveChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { message } from 'antd';

// 导入自定义节点类型
import StartNode from './NodeTypes/StartNode';
import TaskNode from './NodeTypes/TaskNode';
import ConditionNode from './NodeTypes/ConditionNode';
import DialogueNode from './NodeTypes/DialogueNode';
import RewardNode from './NodeTypes/RewardNode';
import EndNode from './NodeTypes/EndNode';

// 导入自定义边类型
import CustomEdge from './EdgeTypes/CustomEdge';

// 定义自定义节点类型映射
const nodeTypes: NodeTypes = {
  startNode: StartNode,
  taskNode: TaskNode,
  conditionNode: ConditionNode,
  dialogueNode: DialogueNode,
  rewardNode: RewardNode,
  endNode: EndNode,
};

// 定义自定义边类型映射
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// 定义NodeEditor组件的属性
interface NodeEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeSelect: (node: Node | null) => void;
  onEdgeSelect: (edge: Edge | null) => void;
  onTestFlow?: () => void;
}

// NodeEditor组件
const NodeEditor: React.FC<NodeEditorProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  onEdgeSelect,
  onTestFlow
}) => {
  // 使用ref保存ReactFlow实例
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // 添加状态来跟踪当前选中的节点和边
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  
  // 组件加载时记录日志
  useEffect(() => {
    console.log('NodeEditor组件加载，初始节点数:', nodes.length);
    console.log('初始边数:', edges.length);
    
    // 检查节点和边的有效性
    try {
      if (nodes && Array.isArray(nodes)) {
        nodes.forEach((node, index) => {
          if (!node.id) {
            console.error(`节点${index}缺少id属性:`, node);
          }
          if (!node.type) {
            console.error(`节点${node.id || index}缺少type属性:`, node);
          }
          if (!node.position) {
            console.error(`节点${node.id || index}缺少position属性:`, node);
          }
        });
      } else {
        console.error('节点不是数组或为空:', nodes);
      }
      
      if (edges && Array.isArray(edges)) {
        edges.forEach((edge, index) => {
          if (!edge.id) {
            console.error(`边${index}缺少id属性:`, edge);
          }
          if (!edge.source) {
            console.error(`边${edge.id || index}缺少source属性:`, edge);
          }
          if (!edge.target) {
            console.error(`边${edge.id || index}缺少target属性:`, edge);
          }
        });
      } else {
        console.error('边不是数组或为空:', edges);
      }
    } catch (error) {
      console.error('检查节点和边时出错:', error);
    }
    
    return () => {
      console.log('NodeEditor组件卸载');
    };
  }, []);
  
  // 当节点或边变化时记录日志
  useEffect(() => {
    console.log('节点更新:', nodes);
  }, [nodes]);
  
  useEffect(() => {
    console.log('边更新:', edges);
  }, [edges]);
  
  // 处理节点变化
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // 过滤掉删除操作，我们需要单独处理
      const nonRemoveChanges = changes.filter(change => change.type !== 'remove');
      const removeChanges = changes.filter(change => change.type === 'remove');
      
      // 应用非删除操作的变化
      let updatedNodes = applyNodeChanges(nonRemoveChanges, nodes);
      
      // 处理删除操作
      if (removeChanges.length > 0) {
        const nodeIdsToRemove = new Set(
          removeChanges.map(change => (change as NodeRemoveChange).id)
        );
        
        // 找到要删除的节点相关的边
        const edgesToRemove = edges.filter(
          edge => 
            nodeIdsToRemove.has(edge.source) || 
            nodeIdsToRemove.has(edge.target)
        );
        
        // 通知父组件删除这些边
        if (edgesToRemove.length > 0) {
          const updatedEdges = edges.filter(
            edge => 
              !nodeIdsToRemove.has(edge.source) && 
              !nodeIdsToRemove.has(edge.target)
          );
          onEdgesChange(updatedEdges);
        }
        
        // 过滤掉要删除的节点
        updatedNodes = updatedNodes.filter(node => !nodeIdsToRemove.has(node.id));
      }
      
      // 确保保留每个节点的完整数据
      updatedNodes = updatedNodes.map(updatedNode => {
        const originalNode = nodes.find(node => node.id === updatedNode.id);
        if (originalNode) {
          return {
            ...updatedNode,
            data: {
              ...originalNode.data,
              ...updatedNode.data,
              // 确保位置变化不会影响节点数据
              position: updatedNode.position,
            }
          };
        }
        return updatedNode;
      });
      
      onNodesChange(updatedNodes);
    },
    [nodes, edges, onNodesChange, onEdgesChange]
  );
  
  // 处理边变化
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      onEdgesChange(updatedEdges);
    },
    [edges, onEdgesChange]
  );
  
  // 处理连接
  const handleConnect = useCallback(
    (connection: Connection) => {
      // 确定边的类型
      let edgeType = 'custom';
      let edgeData: any = { condition: '' };
      
      // 如果是从条件节点的true输出连接，设置为成功路径
      if (connection.sourceHandle === 'true') {
        edgeData.type = 'success';
      }
      // 如果是从条件节点的false输出连接，设置为失败路径
      else if (connection.sourceHandle === 'false') {
        edgeData.type = 'failure';
      }
      
      // 创建新边
      const newEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        type: edgeType,
        animated: false,
        label: getEdgeLabelByHandles(connection.sourceHandle, connection.targetHandle),
        data: edgeData,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edgeData.type === 'failure' ? '#F44336' : 
                 edgeData.type === 'success' ? '#4CAF50' : '#888',
        },
      };
      
      const updatedEdges = addEdge(newEdge, edges);
      onEdgesChange(updatedEdges);
      
      // 更新目标节点的输入数据引用
      updateNodeInputReferences(connection.source, connection.target);
    },
    [edges, onEdgesChange, nodes]
  );
  
  // 更新节点的输入数据引用
  const updateNodeInputReferences = (sourceId: string, targetId: string) => {
    const sourceNode = nodes.find(node => node.id === sourceId);
    const targetNode = nodes.find(node => node.id === targetId);
    
    if (!sourceNode || !targetNode) return;
    
    // 如果目标节点是条件节点，添加对源节点输出的引用
    if (targetNode.type === 'conditionNode') {
      const updatedNode = {
        ...targetNode,
        data: {
          ...targetNode.data,
          inputRefs: {
            ...(targetNode.data.inputRefs || {}),
            [sourceId]: {
              nodeId: sourceId,
              nodeType: sourceNode.type,
              nodeLabel: sourceNode.data.label || sourceNode.type,
            }
          }
        }
      };
      
      onNodesChange(nodes.map(node => node.id === targetId ? updatedNode : node));
    }
  };
  
  // 获取节点的输入节点
  const getNodeInputs = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];
    
    return getIncomers(node, nodes, edges);
  };
  
  // 获取节点的输出节点
  const getNodeOutputs = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];
    
    return getOutgoers(node, nodes, edges);
  };
  
  // 根据连接点类型获取边标签
  const getEdgeLabelByHandles = (sourceHandle: string | null, targetHandle: string | null) => {
    if (sourceHandle === 'true') return '满足条件';
    if (sourceHandle === 'false') return '不满足条件';
    return '连接';
  };
  
  // 处理节点点击
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // 获取节点的输入节点
      const inputNodes = getNodeInputs(node.id);
      
      // 确保节点数据中包含完整的数据
      const currentNode = nodes.find(n => n.id === node.id);
      if (!currentNode) {
        onNodeSelect(node);
        setSelectedNode(node);
        setSelectedEdge(null);
        return;
      }
      
      // 确保outputData存在
      const outputData = currentNode.data.outputData || getDefaultDataForType(currentNode.type).outputData;
      
      // 更新节点数据，包含输入节点信息，保留所有原始数据
      const updatedNode = {
        ...currentNode,
        data: {
          ...currentNode.data,
          outputData: outputData,
          inputNodes: inputNodes.map(n => ({
            id: n.id,
            type: n.type,
            label: n.data.label || n.type,
            outputData: n.data.outputData
          }))
        }
      };
      
      // 打印节点数据，用于调试
      console.log('Selected node data:', updatedNode.data);
      
      // 更新本地状态和父组件状态
      setSelectedNode(updatedNode);
      setSelectedEdge(null);
      onNodeSelect(updatedNode);
    },
    [onNodeSelect, nodes, edges]
  );
  
  // 处理边点击
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
      onEdgeSelect(edge);
    },
    [onEdgeSelect]
  );
  
  // 处理背景点击
  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    onNodeSelect(null);
    onEdgeSelect(null);
  }, [onNodeSelect, onEdgeSelect]);
  
  // 处理拖放
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // 处理放置
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      
      if (!reactFlowWrapper.current || !reactFlowInstance) return;
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      // 检查是否有效的节点类型
      if (!type || !nodeTypes[type as keyof NodeTypes]) {
        return;
      }
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // 创建新节点
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type} node`, ...getDefaultDataForType(type) },
      };
      
      // 更新节点
      const updatedNodes = [...nodes, newNode];
      onNodesChange(updatedNodes);
    },
    [reactFlowInstance, nodes, onNodesChange]
  );
  
  // 获取不同节点类型的默认数据
  const getDefaultDataForType = (type: string) => {
    switch (type) {
      case 'startNode':
        return { 
          description: '任务开始',
          outputData: { status: 'started' }
        };
      case 'taskNode':
        return { 
          description: '完成任务', 
          objective: '', 
          requiredCount: 1,
          outputData: { status: 'completed', progress: 0 }
        };
      case 'conditionNode':
        return { 
          description: '条件检查', 
          condition: '', 
          branches: [],
          inputRefs: {},
          useInputData: true
        };
      case 'dialogueNode':
        return { 
          description: '对话', 
          character: '', 
          text: '',
          outputData: { dialogueCompleted: true }
        };
      case 'rewardNode':
        return { 
          description: '奖励', 
          rewards: [],
          outputData: { rewarded: true, rewardType: '', rewardValue: 0 }
        };
      case 'endNode':
        return { 
          description: '任务结束',
          outputData: { status: 'ended' }
        };
      default:
        return {};
    }
  };
  
  // 添加新节点
  const addNewNode = useCallback(
    (type: string) => {
      // 计算新节点位置
      const position = {
        x: Math.random() * 400,
        y: Math.random() * 400,
      };
      
      // 创建新节点
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type}`, ...getDefaultDataForType(type) },
      };
      
      // 更新节点
      const updatedNodes = [...nodes, newNode];
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );
  
  // 默认边配置
  const defaultEdgeOptions = {
    type: 'custom',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#888',
    },
    style: { strokeWidth: 2, stroke: '#888' },
  };
  
  // 处理ReactFlow初始化
  const onInit = useCallback((instance: any) => {
    console.log('ReactFlow初始化成功');
    setReactFlowInstance(instance);
  }, []);
  
  // 处理ReactFlow错误
  const handleError = useCallback((error: Error) => {
    console.error('ReactFlow渲染错误:', error);
    message.error('流程图渲染出错，请刷新页面重试');
  }, []);
  
  return (
    <div className="node-editor" ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onInit={onInit}
        onError={handleError}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-left" className="node-panel">
          <div className="node-buttons">
            <button onClick={() => addNewNode('startNode')}>开始节点</button>
            <button onClick={() => addNewNode('taskNode')}>任务节点</button>
            <button onClick={() => addNewNode('conditionNode')}>条件节点</button>
            <button onClick={() => addNewNode('dialogueNode')}>对话节点</button>
            <button onClick={() => addNewNode('rewardNode')}>奖励节点</button>
            <button onClick={() => addNewNode('endNode')}>结束节点</button>
            {onTestFlow && <button onClick={onTestFlow} className="test-flow-button">测试流程</button>}
          </div>
        </Panel>
        <Panel position="top-right" className="node-panel">
          <div className="node-buttons">
            <button 
              onClick={() => {
                if (selectedNode) {
                  // 创建一个删除节点的变更
                  const deleteChange: NodeRemoveChange = {
                    id: selectedNode.id,
                    type: 'remove',
                  };
                  handleNodesChange([deleteChange]);
                  onNodeSelect(null);
                  message.success('节点已删除');
                } else {
                  message.info('请先选择要删除的节点');
                }
              }}
              className="delete-button"
              style={{ backgroundColor: '#ff4d4f', color: 'white' }}
            >
              删除节点
            </button>
            <button 
              onClick={() => {
                if (selectedEdge) {
                  // 过滤掉选中的边
                  const updatedEdges = edges.filter(edge => edge.id !== selectedEdge.id);
                  onEdgesChange(updatedEdges);
                  onEdgeSelect(null);
                  message.success('连线已删除');
                } else {
                  message.info('请先选择要删除的连线');
                }
              }}
              className="delete-button"
              style={{ backgroundColor: '#ff4d4f', color: 'white', marginLeft: '8px' }}
            >
              删除连线
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default NodeEditor;