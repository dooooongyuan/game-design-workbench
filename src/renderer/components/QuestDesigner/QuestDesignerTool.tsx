import React, { useState, useCallback, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Tabs, Button, message, Modal, Steps, Collapse, Tag, Tooltip, Input, Switch } from 'antd';
import { ReactFlowProvider } from 'reactflow';
import NodeEditor from './NodeEditor';
import PropertiesPanel from './PropertiesPanel';
import ExportPanel from './ExportPanel';
import './QuestDesignerTool.css';

const { TabPane } = Tabs;

// 错误边界组件，用于捕获子组件中的JavaScript错误
class ErrorBoundary extends Component<
  { children: ReactNode, fallback?: ReactNode },
  { hasError: boolean, error: Error | null, errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: ReactNode, fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    // 更新状态，下次渲染时显示降级UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('组件错误:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // 显示自定义的降级UI
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>组件加载出错</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>查看详细错误信息</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>组件堆栈信息:</p>
            <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </details>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 任务设计器工具主组件的属性定义
interface QuestDesignerToolProps {
  initialQuest: {
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
  };
  onBackToList: () => void;
}

// 任务设计器工具主组件
const QuestDesignerTool: React.FC<QuestDesignerToolProps> = ({ initialQuest, onBackToList }) => {
  // 状态管理
  const [nodes, setNodes] = useState<any[]>(initialQuest.nodes);
  const [edges, setEdges] = useState<any[]>(initialQuest.edges);
  // const [questName, setQuestName] = useState<string>(initialQuest.name);
  // const [questDescription, setQuestDescription] = useState<string>(initialQuest.description);
  
  // 已在上面初始化了edges状态
  
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  
  const [questName, setQuestName] = useState<string>(() => {
    // 从localStorage加载任务名称
    const savedQuestName = localStorage.getItem('questDesigner_questName');
    return savedQuestName || '新建任务';
  });
  
  const [questDescription, setQuestDescription] = useState<string>(() => {
    // 从localStorage加载任务描述
    const savedQuestDescription = localStorage.getItem('questDesigner_questDescription');
    return savedQuestDescription || '';
  });
  
  // 添加测试流程相关的状态
  const [isTestModalVisible, setIsTestModalVisible] = useState(false);
  const [testingInProgress, setTestingInProgress] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentTestStep, setCurrentTestStep] = useState(0);
  const [testPlayerState, setTestPlayerState] = useState({
    level: 1,
    gold: 0,
    experience: 0,
    inventory: [],
    quests: {}
  });
  
  // 用于存储所有的定时器ID
  const [timeoutIds, setTimeoutIds] = useState<number[]>([]);
  
  // 调试模式
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // 添加调试信息
  const addDebugInfo = useCallback((info: string) => {
    if (debugMode) {
      setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${info}`]);
    }
  }, [debugMode]);
  
  // 清除调试信息
  const clearDebugInfo = useCallback(() => {
    setDebugInfo([]);
  }, []);
  
  // 切换调试模式
  const toggleDebugMode = useCallback((checked: boolean) => {
    setDebugMode(checked);
    if (checked) {
      addDebugInfo('调试模式已启用');
    } else {
      clearDebugInfo();
    }
  }, [addDebugInfo, clearDebugInfo]);
  
  // 在组件卸载时清除所有定时器
  useEffect(() => {
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [timeoutIds]);
  
  // 安全的setTimeout函数，会自动记录定时器ID
  const safeSetTimeout = (callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    setTimeoutIds(prev => [...prev, id]);
    return id;
  };
  
  // 组件加载完成后的初始化检查
  useEffect(() => {
    try {
      console.log('QuestDesignerTool组件加载完成');
      addDebugInfo('QuestDesignerTool组件加载完成');
      addDebugInfo(`当前节点数: ${nodes.length}`);
      addDebugInfo(`当前边数: ${edges.length}`);
      
      // 检查节点和边的关联性
      const nodeIds = new Set(nodes.map(node => node.id));
      const invalidEdges = edges.filter(
        edge => !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
      );
      
      if (invalidEdges.length > 0) {
        console.warn('发现无效的边（引用了不存在的节点）:', invalidEdges);
        // 可以选择自动清理这些无效的边
        setEdges(edges.filter(
          edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
        ));
      }
    } catch (error) {
      console.error('组件初始化检查时出错:', error);
      addDebugInfo(`初始化检查错误: ${error}`);
    }
  }, [nodes, edges, addDebugInfo]);
  
  // 当节点或边变化时保存到localStorage
  useEffect(() => {
    console.log('Nodes changed, saving to localStorage:', nodes);
    // 确保保存最新的节点数据
    localStorage.setItem('questDesigner_nodes', JSON.stringify(nodes));
    
    // 检查边的有效性，删除引用了不存在节点的边
    const nodeIds = new Set(nodes.map(node => node.id));
    const validEdges = edges.filter(
      edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    
    // 如果有无效的边，更新边数据
    if (validEdges.length !== edges.length) {
      console.log('删除了无效的边:', edges.length - validEdges.length);
      setEdges(validEdges);
    }
  }, [nodes, edges, setEdges]);
  
  useEffect(() => {
    console.log('Edges changed, saving to localStorage:', edges);
    // 立即保存边数据到localStorage
    localStorage.setItem('questDesigner_edges', JSON.stringify(edges));
  }, [edges]);
  
  // 当任务信息变化时保存到localStorage
  useEffect(() => {
    console.log('Quest name changed, saving to localStorage:', questName);
    localStorage.setItem('questDesigner_questName', questName);
  }, [questName]);
  
  useEffect(() => {
    console.log('Quest description changed, saving to localStorage:', questDescription);
    localStorage.setItem('questDesigner_questDescription', questDescription);
  }, [questDescription]);
  
  // 处理节点选择
  const handleNodeSelect = useCallback((node: any) => {
    try {
      console.log('选中节点:', node);
      setSelectedNode(node);
      setSelectedEdge(null);
    } catch (error) {
      console.error('选择节点时出错:', error);
      message.error('选择节点时出错');
    }
  }, []);
  
  // 处理边选择
  const handleEdgeSelect = useCallback((edge: any) => {
    try {
      console.log('选中边:', edge);
      setSelectedEdge(edge);
      setSelectedNode(null);
    } catch (error) {
      console.error('选择边时出错:', error);
      message.error('选择边时出错');
    }
  }, []);
  
  // 处理节点变化
  const handleNodesChange = useCallback((updatedNodes: any) => {
    try {
      console.log('节点变化:', updatedNodes);
      setNodes(updatedNodes);
      
      // 如果当前选中的节点在更新的节点中，更新选中的节点
      if (selectedNode) {
        const updatedSelectedNode = updatedNodes.find((node: any) => node.id === selectedNode.id);
        if (updatedSelectedNode) {
          setSelectedNode(updatedSelectedNode);
        } else {
          // 如果选中的节点被删除了，清除选中状态
          setSelectedNode(null);
        }
      }
      
      // 立即保存到localStorage，确保删除操作被保存
      localStorage.setItem('questDesigner_nodes', JSON.stringify(updatedNodes));
    } catch (error) {
      console.error('处理节点变化时出错:', error);
      message.error('更新节点时出错');
    }
  }, [selectedNode]);
  
  
  // 处理节点更新
  const handleNodeUpdate = useCallback((updatedNode: any) => {
    try {
      // 打印更新前的节点数据，用于调试
      console.log('Before update, nodes:', nodes);
      console.log('Updating node:', updatedNode);
      
      // 更新节点数组中的节点
      setNodes(nds => {
        const newNodes = nds.map(node => 
          node.id === updatedNode.id ? updatedNode : node
        );
        console.log('After update, nodes:', newNodes);
        
        // 直接在这里保存到localStorage，确保使用的是最新的节点数据
        safeSetTimeout(() => {
          localStorage.setItem('questDesigner_nodes', JSON.stringify(newNodes));
          console.log('Saved to localStorage:', newNodes);
        }, 100);
        
        return newNodes;
      });
      
      // 如果当前选中的节点就是被更新的节点，也更新选中的节点
      if (selectedNode && selectedNode.id === updatedNode.id) {
        console.log('Updating selected node:', updatedNode);
        setSelectedNode(updatedNode);
      }
    } catch (error) {
      console.error('更新节点时出错:', error);
      message.error('保存节点属性时出错');
    }
  }, [selectedNode, nodes, safeSetTimeout]);
  
  // 处理边更新
  const handleEdgeUpdate = useCallback((updatedEdge: any) => {
    setEdges(eds => eds.map(edge => 
      edge.id === updatedEdge.id ? updatedEdge : edge
    ));
  }, []);
  
  // 处理任务信息更新
  const handleQuestInfoUpdate = useCallback((name: string, description: string) => {
    setQuestName(name);
    setQuestDescription(description);
  }, []);
  
  // 保存任务
  const handleSaveQuest = useCallback(() => {
    const questData = {
      name: questName,
      description: questDescription,
      nodes,
      edges
    };
    
    // 保存到本地存储
    localStorage.setItem(`quest_${Date.now()}`, JSON.stringify(questData));
    alert('任务已保存');
  }, [questName, questDescription, nodes, edges]);
  
  // 导出任务
  const handleExportQuest = useCallback((format: string) => {
    const questData = {
      name: questName,
      description: questDescription,
      nodes,
      edges
    };
    
    // 根据不同格式导出
    switch (format) {
      case 'json':
        // 导出为JSON
        const jsonData = JSON.stringify(questData, null, 2);
        const jsonBlob = new Blob([jsonData], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `${questName.replace(/\s+/g, '_')}.json`;
        jsonLink.click();
        break;
      case 'unity':
        // 导出为Unity兼容格式
        alert('Unity导出功能开发中');
        break;
      case 'unreal':
        // 导出为Unreal兼容格式
        alert('Unreal导出功能开发中');
        break;
      case 'godot':
        // 导出为Godot兼容格式
        alert('Godot导出功能开发中');
        break;
      default:
        alert('不支持的导出格式');
    }
  }, [questName, questDescription, nodes, edges]);
  
  // 测试任务流程
  const testQuestFlow = () => {
    setIsTestModalVisible(true);
    setTestingInProgress(false);
    setTestResults([]);
    setCurrentTestStep(0);
    setTestPlayerState({
      level: 1,
      gold: 0,
      experience: 0,
      inventory: [],
      quests: {}
    });
  };
  
  // 开始测试流程
  const startTestFlow = () => {
    setTestingInProgress(true);
    
    // 查找开始节点
    const startNode = nodes.find(node => node.type === 'startNode');
    if (!startNode) {
      message.error('未找到开始节点，无法开始测试');
      setTestingInProgress(false);
      return;
    }
    
    // 初始化测试结果
    const initialResult = {
      nodeId: startNode.id,
      nodeType: startNode.type,
      nodeLabel: startNode.data?.label || '任务开始',
      status: 'success',
      message: '任务流程开始',
      outputData: {
        gameVersion: '1.0.0',
        timestamp: Date.now(),
        sessionId: `test-${Date.now()}`
      }
    };
    
    setTestResults([initialResult]);
    setCurrentTestStep(0);
    
    // 开始从起始节点执行流程
    safeSetTimeout(() => {
      executeNextNode(startNode, initialResult.outputData);
    }, 1000);
  };
  
  // 执行下一个节点
  const executeNextNode = (currentNode: any, inputData: any) => {
    // 查找从当前节点出发的边
    const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
    
    if (outgoingEdges.length === 0) {
      // 没有后续节点，测试结束
      setTestingInProgress(false);
      setTestResults(prev => [...prev, {
        nodeId: 'end',
        nodeType: 'end',
        nodeLabel: '流程结束',
        status: 'success',
        message: '任务流程执行完成',
        outputData: {}
      }]);
      return;
    }
    
    // 根据节点类型决定下一步操作
    if (currentNode.type === 'conditionNode') {
      // 条件节点需要评估条件
      const conditionResult = evaluateCondition(currentNode, inputData);
      
      // 根据条件结果选择边
      const nextEdge = outgoingEdges.find(edge => 
        (conditionResult && edge.data?.type === 'success') || 
        (!conditionResult && edge.data?.type === 'failure')
      );
      
      if (nextEdge) {
        const nextNode = nodes.find(node => node.id === nextEdge.target);
        if (nextNode) {
          // 记录条件节点的结果
          setTestResults(prev => [...prev, {
            nodeId: currentNode.id,
            nodeType: currentNode.type,
            nodeLabel: currentNode.data?.label || '条件检查',
            status: 'success',
            message: `条件${conditionResult ? '满足' : '不满足'}，执行${conditionResult ? '成功' : '失败'}分支`,
            conditionResult,
            outputData: inputData
          }]);
          
          setCurrentTestStep(prev => prev + 1);
          
          // 延迟执行下一个节点
          safeSetTimeout(() => {
            executeNextNode(nextNode, inputData);
          }, 1000);
        }
      } else {
        // 没有找到对应的边
        setTestResults(prev => [...prev, {
          nodeId: currentNode.id,
          nodeType: currentNode.type,
          nodeLabel: currentNode.data?.label || '条件检查',
          status: 'error',
          message: `条件${conditionResult ? '满足' : '不满足'}，但未找到对应的${conditionResult ? '成功' : '失败'}分支`,
          conditionResult,
          outputData: {}
        }]);
        setTestingInProgress(false);
      }
    } else if (currentNode.type === 'taskNode') {
      // 任务节点执行任务
      const taskOutput = executeTask(currentNode, inputData);
      
      // 记录任务节点的结果
      setTestResults(prev => [...prev, {
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        nodeLabel: currentNode.data?.label || '执行任务',
        status: 'success',
        message: '任务执行完成',
        outputData: taskOutput
      }]);
      
      setCurrentTestStep(prev => prev + 1);
      
      // 更新玩家状态
      updatePlayerState(currentNode, taskOutput);
      
      // 如果有下一个节点，继续执行
      if (outgoingEdges.length > 0) {
        const nextNode = nodes.find(node => node.id === outgoingEdges[0].target);
        if (nextNode) {
          safeSetTimeout(() => {
            executeNextNode(nextNode, taskOutput);
          }, 1000);
        }
      } else {
        setTestingInProgress(false);
      }
    } else if (currentNode.type === 'dialogueNode') {
      // 对话节点执行对话
      const dialogueOutput = executeDialogue(currentNode, inputData);
      
      // 记录对话节点的结果
      setTestResults(prev => [...prev, {
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        nodeLabel: currentNode.data?.label || '对话',
        status: 'success',
        message: currentNode.data?.text ? `${currentNode.data.character || ''}：${currentNode.data.text}` : '对话执行完成',
        outputData: dialogueOutput
      }]);
      
      setCurrentTestStep(prev => prev + 1);
      
      // 如果有下一个节点，继续执行
      if (outgoingEdges.length > 0) {
        const nextNode = nodes.find(node => node.id === outgoingEdges[0].target);
        if (nextNode) {
          safeSetTimeout(() => {
            executeNextNode(nextNode, dialogueOutput);
          }, 1000);
        }
      } else {
        setTestingInProgress(false);
      }
    } else if (currentNode.type === 'rewardNode') {
      // 奖励节点发放奖励
      const rewardOutput = executeReward(currentNode, inputData);
      
      // 记录奖励节点的结果
      setTestResults(prev => [...prev, {
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        nodeLabel: currentNode.data?.label || '奖励',
        status: 'success',
        message: '奖励发放完成',
        outputData: rewardOutput
      }]);
      
      setCurrentTestStep(prev => prev + 1);
      
      // 更新玩家状态
      updatePlayerState(currentNode, rewardOutput);
      
      // 如果有下一个节点，继续执行
      if (outgoingEdges.length > 0) {
        const nextNode = nodes.find(node => node.id === outgoingEdges[0].target);
        if (nextNode) {
          safeSetTimeout(() => {
            executeNextNode(nextNode, rewardOutput);
          }, 1000);
        }
      } else {
        setTestingInProgress(false);
      }
    } else {
      // 其他类型节点，直接执行下一个
      if (outgoingEdges.length > 0) {
        const nextNode = nodes.find(node => node.id === outgoingEdges[0].target);
        if (nextNode) {
          safeSetTimeout(() => {
            executeNextNode(nextNode, inputData);
          }, 1000);
        }
      } else {
        setTestingInProgress(false);
      }
    }
  };
  
  // 评估条件
  const evaluateCondition = (conditionNode: any, inputData: any) => {
    try {
      // 创建测试上下文
      const testContext = {
        player: testPlayerState,
        quest: {
          id: conditionNode.id,
          status: 'active',
          progress: 0
        },
        input: inputData
      };
      
      // 确定要执行的条件表达式
      let condition = '';
      
      if (conditionNode.data?.conditionType === 'auto' && conditionNode.data?.useInputData && conditionNode.data?.selectedInputNode) {
        // 使用自动条件
        if (conditionNode.data?.autoCondition) {
          condition = conditionNode.data.autoCondition;
        } else {
          // 根据输入节点类型生成默认条件
          const inputNode = nodes.find(n => n.id === conditionNode.data.selectedInputNode);
          if (inputNode) {
            switch (inputNode.type) {
              case 'taskNode':
                // 同时检查任务状态和进度
                const requiredProgress = inputNode.data?.outputData?.progress || 100;
                condition = `input.status === "completed" || (input.status === "in_progress" && input.progress >= ${requiredProgress})`;
                break;
              case 'dialogueNode':
                condition = 'input.selectedChoice !== undefined';
                break;
              case 'rewardNode':
                condition = 'input.claimed === true';
                break;
              case 'startNode':
                condition = 'input.gameVersion !== undefined';
                break;
              default:
                condition = '';
            }
          }
        }
      } else {
        // 使用自定义条件
        condition = conditionNode.data?.condition || '';
      }
      
      if (!condition.trim()) {
        return false;
      }
      
      // 创建安全的执行环境
      const safeEval = new Function(
        'player', 'quest', 'input',
        `try { return !!(${condition}); } catch(e) { console.error('条件表达式执行错误:', e); return false; }`
      );
      
      // 执行条件表达式
      return safeEval(
        testContext.player, 
        testContext.quest, 
        testContext.input
      );
    } catch (error) {
      console.error('评估条件时出错:', error);
      return false;
    }
  };
  
  // 执行任务
  const executeTask = (taskNode: any, inputData: any) => {
    // 使用节点中设置的实际数据，而不是硬编码为完成状态
    const taskData = taskNode.data || {};
    const outputData = taskData.outputData || {};
    
    return {
      taskId: taskNode.data?.taskId || `task-${taskNode.id}`,
      status: outputData.status || 'in_progress',
      progress: outputData.progress !== undefined ? outputData.progress : 50,
      completed: outputData.status === 'completed',
      timeSpent: Math.floor(Math.random() * 120) + 60 // 60-180秒
    };
  };
  
  // 执行对话
  const executeDialogue = (dialogueNode: any, inputData: any) => {
    // 模拟对话执行
    return {
      dialogueId: dialogueNode.data?.dialogueId || `dialogue-${dialogueNode.id}`,
      choices: dialogueNode.data?.choices || ['选项1', '选项2'],
      selectedChoice: dialogueNode.data?.choices?.[0] || '选项1',
      text: dialogueNode.data?.text || '',
      character: dialogueNode.data?.character || ''
    };
  };
  
  // 执行奖励
  const executeReward = (rewardNode: any, inputData: any) => {
    // 模拟奖励发放
    return {
      rewardId: rewardNode.data?.rewardId || `reward-${rewardNode.id}`,
      rewardType: rewardNode.data?.rewardType || 'gold',
      amount: rewardNode.data?.amount || 100,
      claimed: true
    };
  };
  
  // 更新玩家状态
  const updatePlayerState = (node: any, outputData: any) => {
    setTestPlayerState(prevState => {
      const newState = { ...prevState };
      
      if (node.type === 'taskNode') {
        // 任务完成后可能获得经验
        newState.experience = (newState.experience || 0) + 50;
        if (newState.experience >= 100) {
          newState.level = (newState.level || 1) + 1;
          newState.experience = newState.experience - 100;
        }
      } else if (node.type === 'rewardNode') {
        // 根据奖励类型更新玩家状态
        if (outputData.rewardType === 'gold') {
          newState.gold = (newState.gold || 0) + (outputData.amount || 0);
        } else if (outputData.rewardType === 'item') {
          if (!newState.inventory) newState.inventory = [];
          newState.inventory.push({
            id: `item-${Date.now()}`,
            name: outputData.itemName || '未命名物品',
            amount: outputData.amount || 1
          });
        } else if (outputData.rewardType === 'experience') {
          newState.experience = (newState.experience || 0) + (outputData.amount || 0);
          if (newState.experience >= 100) {
            newState.level = (newState.level || 1) + 1;
            newState.experience = newState.experience - 100;
          }
        }
      }
      
      return newState;
    });
  };
  
  // 渲染测试结果
  const renderTestResults = () => {
    return (
      <Steps
        direction="vertical"
        current={currentTestStep}
        items={testResults.map((result, index) => ({
          title: result.nodeLabel,
          description: (
            <div>
              <div>{result.message}</div>
              {result.nodeType === 'conditionNode' && (
                <Tag color={result.conditionResult ? 'success' : 'error'}>
                  条件{result.conditionResult ? '满足' : '不满足'}
                </Tag>
              )}
              <Collapse size="small" ghost>
                <Collapse.Panel header="查看详情" key="1">
                  <pre style={{ fontSize: '12px' }}>
                    {JSON.stringify(result.outputData, null, 2)}
                  </pre>
                </Collapse.Panel>
              </Collapse>
            </div>
          ),
          status: result.status
        }))}
      />
    );
  };
  
  // 渲染玩家状态
  const renderPlayerState = () => {
    return (
      <div style={{ marginTop: '20px' }}>
        <h4>玩家状态</h4>
        <div>等级: {testPlayerState.level}</div>
        <div>金币: {testPlayerState.gold}</div>
        <div>经验: {testPlayerState.experience}/100</div>
        <div>
          物品: {testPlayerState.inventory?.length || 0} 个
          {testPlayerState.inventory?.length > 0 && (
            <Collapse size="small" ghost>
              <Collapse.Panel header="查看物品" key="1">
                <ul>
                  {testPlayerState.inventory.map((item, index) => (
                    <li key={index}>{item.name} x{item.amount}</li>
                  ))}
                </ul>
              </Collapse.Panel>
            </Collapse>
          )}
        </div>
      </div>
    );
  };
  
  // 清除缓存数据
  const clearCachedData = useCallback(() => {
    try {
      console.log('清除缓存数据');
      localStorage.removeItem('questDesigner_nodes');
      localStorage.removeItem('questDesigner_edges');
      localStorage.removeItem('questDesigner_questName');
      localStorage.removeItem('questDesigner_questDescription');
      
      // 重置状态
      setNodes([
        {
          id: 'start-node',
          type: 'startNode',
          position: { x: 250, y: 100 },
          data: { label: '任务开始' }
        }
      ]);
      setEdges([]);
      setSelectedNode(null);
      setSelectedEdge(null);
      setQuestName('新建任务');
      setQuestDescription('');
      
      message.success('缓存数据已清除，任务设计器已重置');
    } catch (error) {
      console.error('清除缓存数据时出错:', error);
      message.error('清除缓存数据时出错');
    }
  }, []);
  
  return (
    <div className="quest-designer-container">
      <div className="quest-designer-header">
        <div className="header-left">
          <Button onClick={onBackToList} style={{ marginRight: 16 }}>
            返回任务列表
          </Button>
          <h2>任务设计器</h2>
        </div>
        <div className="quest-info">
          <input 
            type="text" 
            value={questName} 
            onChange={(e) => setQuestName(e.target.value)}
            placeholder="任务名称"
            className="quest-name-input"
          />
          <Button type="primary" onClick={handleSaveQuest} className="save-button">
            保存任务
          </Button>
          <Button onClick={clearCachedData} className="clear-cache-button">
            重置
          </Button>
          <div className="debug-mode-toggle">
            <span>调试模式</span>
            <Switch 
              checked={debugMode} 
              onChange={toggleDebugMode} 
              size="small" 
            />
          </div>
        </div>
      </div>
      
      <div className="quest-designer-content">
        <div className="node-editor-container">
          <ErrorBoundary>
            <ReactFlowProvider>
              <NodeEditor 
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={setEdges}
                onNodeSelect={handleNodeSelect}
                onEdgeSelect={handleEdgeSelect}
                onTestFlow={testQuestFlow}
              />
            </ReactFlowProvider>
          </ErrorBoundary>
        </div>
        
        <div className="side-panel">
          <Tabs defaultActiveKey="properties">
            <TabPane tab="属性" key="properties">
              <ErrorBoundary>
                <PropertiesPanel 
                  selectedNode={selectedNode}
                  selectedEdge={selectedEdge}
                  onNodeUpdate={handleNodeUpdate}
                  onEdgeUpdate={handleEdgeUpdate}
                  questName={questName}
                  questDescription={questDescription}
                  onQuestInfoUpdate={handleQuestInfoUpdate}
                />
              </ErrorBoundary>
            </TabPane>
            <TabPane tab="导出" key="export">
              <ErrorBoundary>
                <ExportPanel onExport={handleExportQuest} />
              </ErrorBoundary>
            </TabPane>
          </Tabs>
        </div>
      </div>
      
      {/* 测试流程的模态框 */}
      <Modal
        title="测试任务流程"
        open={isTestModalVisible}
        onCancel={() => setIsTestModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setIsTestModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="start" 
            type="primary" 
            onClick={startTestFlow}
            disabled={testingInProgress}
          >
            {testingInProgress ? '测试中...' : '开始测试'}
          </Button>
        ]}
      >
        <ErrorBoundary>
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            {testResults.length > 0 ? (
              <>
                {renderTestResults()}
                {renderPlayerState()}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                点击"开始测试"按钮开始测试任务流程
              </div>
            )}
          </div>
        </ErrorBoundary>
      </Modal>
      
      {/* 调试信息面板 */}
      {debugMode && (
        <div className="debug-panel">
          <div className="debug-panel-header">
            <h3>调试信息</h3>
            <button onClick={clearDebugInfo} className="clear-debug-button">
              清除
            </button>
          </div>
          <div className="debug-panel-content">
            {debugInfo.length === 0 ? (
              <p>暂无调试信息</p>
            ) : (
              <ul>
                {debugInfo.map((info, index) => (
                  <li key={index}>{info}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestDesignerTool;