import React, { useEffect, useState } from 'react';
import { Node, Edge } from 'reactflow';
import { Input, Form, Button, Select, InputNumber, Divider, Switch, Alert, Tooltip, Checkbox, Radio } from 'antd';
import './PropertiesPanel.css';
import { message } from 'antd';

const { TextArea } = Input;
const { Option } = Select;
const { Group: RadioGroup } = Radio;

// 定义属性面板组件的属性
interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onNodeUpdate: (node: Node) => void;
  onEdgeUpdate: (edge: Edge) => void;
  questName: string;
  questDescription: string;
  onQuestInfoUpdate: (name: string, description: string) => void;
}

// 属性面板组件
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  selectedEdge,
  onNodeUpdate,
  onEdgeUpdate,
  questName,
  questDescription,
  onQuestInfoUpdate,
}) => {
  // 本地状态
  const [nodeData, setNodeData] = useState<any>(null);
  const [edgeData, setEdgeData] = useState<any>(null);
  const [localQuestName, setLocalQuestName] = useState(questName);
  const [localQuestDescription, setLocalQuestDescription] = useState(questDescription);
  const [testValue, setTestValue] = useState<string>('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [useInputData, setUseInputData] = useState<boolean>(false);
  const [selectedInputNode, setSelectedInputNode] = useState<string | null>(null);
  
  // 当选中的节点或边变化时更新本地状态
  useEffect(() => {
    if (selectedNode) {
      // 打印选中节点的数据，用于调试
      console.log('PropertiesPanel received node data:', selectedNode.data);
      
      // 从localStorage加载角色数据
      const savedCharacters = localStorage.getItem('characters');
      const characters = savedCharacters ? JSON.parse(savedCharacters) : [];
      
      // 将角色数据添加到节点数据中
      const updatedNodeData = {
        ...selectedNode.data,
        characters: characters
      };
      
      setNodeData(updatedNodeData);
      setEdgeData(null);
      setTestValue('');
      setTestResult(null);
      setTestError(null);
      setUseInputData(updatedNodeData.useInputData || false);
      setSelectedInputNode(null);
    } else if (selectedEdge) {
      setEdgeData({ ...selectedEdge.data });
      setNodeData(null);
      setTestValue('');
      setTestResult(null);
      setTestError(null);
      setUseInputData(false);
      setSelectedInputNode(null);
    } else {
      setNodeData(null);
      setEdgeData(null);
      setTestValue('');
      setTestResult(null);
      setTestError(null);
      setUseInputData(false);
      setSelectedInputNode(null);
    }
  }, [selectedNode, selectedEdge]);
  
  // 获取不同节点类型的默认输出数据
  const getDefaultOutputDataForType = (type: string) => {
    switch (type) {
      case 'startNode':
        return { status: 'started' };
      case 'taskNode':
        return { status: 'completed', progress: 0 };
      case 'dialogueNode':
        return { dialogueCompleted: true };
      case 'rewardNode':
        return { rewarded: true, rewardType: 'item', rewardValue: 0 };
      case 'conditionNode':
        return {};
      case 'endNode':
        return { status: 'ended' };
      default:
        return {};
    }
  };
  
  // 当任务名称或描述变化时更新本地状态
  useEffect(() => {
    setLocalQuestName(questName);
    setLocalQuestDescription(questDescription);
  }, [questName, questDescription]);
  
  // 处理节点数据变化
  const handleNodeDataChange = (key: string, value: any) => {
    if (!nodeData || !selectedNode) return;
    
    const updatedData = { ...nodeData, [key]: value };
    setNodeData(updatedData);
    
    // 不再自动更新节点，而是等待用户点击保存按钮
    // const updatedNode = {
    //   ...selectedNode,
    //   data: updatedData,
    // };
    // 
    // onNodeUpdate(updatedNode);
  };
  
  // 保存节点数据
  const saveNodeData = () => {
    if (!nodeData || !selectedNode) return;
    
    // 确保outputData存在
    const outputData = nodeData.outputData || getDefaultOutputDataForType(selectedNode.type);
    
    // 处理自动判断条件
    let finalNodeData = { ...nodeData };
    
    if (selectedNode.type === 'conditionNode' && nodeData.conditionType === 'auto' && useInputData && nodeData.selectedInputNode) {
      const inputNode = nodeData.inputNodes?.find(n => n.id === nodeData.selectedInputNode);
      if (inputNode) {
        let autoCondition = '';
        switch (inputNode.type) {
          case 'taskNode':
            autoCondition = 'input.status === "completed"';
            break;
          case 'dialogueNode':
            autoCondition = 'input.selectedChoice !== undefined';
            break;
          case 'rewardNode':
            autoCondition = 'input.claimed === true';
            break;
          case 'startNode':
            autoCondition = 'input.gameVersion !== undefined';
            break;
        }
        finalNodeData.autoCondition = autoCondition;
      }
    }
    
    // 确保保存角色数据
    if (selectedNode.type === 'dialogueNode') {
      // 从localStorage获取最新的角色数据
      const savedCharacters = localStorage.getItem('characters');
      const characters = savedCharacters ? JSON.parse(savedCharacters) : [];
      finalNodeData.characters = characters;
    }
    
    // 打印保存前的节点数据，用于调试
    console.log('Before saving, selectedNode:', selectedNode);
    console.log('Before saving, nodeData:', finalNodeData);
    
    // 创建一个新的节点对象，确保所有数据都被保留
    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,  // 保留原始数据
        ...finalNodeData,      // 更新编辑的数据
        outputData: outputData // 确保outputData存在
      },
    };
    
    // 打印保存的节点数据，用于调试
    console.log('Saving node data:', updatedNode);
    
    // 调用父组件的onNodeUpdate函数更新节点
    onNodeUpdate(updatedNode);
    
    // 显示保存成功的消息
    message.success('节点属性已保存');
  };
  
  // 处理边数据变化
  const handleEdgeDataChange = (key: string, value: any) => {
    if (!edgeData || !selectedEdge) return;
    
    const updatedData = { ...edgeData, [key]: value };
    setEdgeData(updatedData);
    
    // 不再自动更新边，而是等待用户点击保存按钮
    // const updatedEdge = {
    //   ...selectedEdge,
    //   data: updatedData,
    // };
    // 
    // onEdgeUpdate(updatedEdge);
  };
  
  // 保存边数据
  const saveEdgeData = () => {
    if (!edgeData || !selectedEdge) return;
    
    const updatedEdge = {
      ...selectedEdge,
      data: edgeData,
    };
    
    onEdgeUpdate(updatedEdge);
    message.success('边属性已保存');
  };
  
  // 处理边类型变化
  const handleEdgeTypeChange = (value: string) => {
    if (!selectedEdge) return;
    
    const updatedData = { ...edgeData, type: value };
    setEdgeData(updatedData);
    
    // 更新边的样式和标记
    const updatedEdge = {
      ...selectedEdge,
      data: updatedData,
      markerEnd: {
        ...selectedEdge.markerEnd,
        color: value === 'failure' ? '#F44336' : 
               value === 'success' ? '#4CAF50' : '#888',
      },
    };
    
    onEdgeUpdate(updatedEdge);
  };
  
  // 处理边动画变化
  const handleEdgeAnimatedChange = (checked: boolean) => {
    if (!selectedEdge) return;
    
    const updatedEdge = {
      ...selectedEdge,
      animated: checked,
    };
    
    onEdgeUpdate(updatedEdge);
  };
  
  // 处理使用输入数据变化
  const handleUseInputDataChange = (checked: boolean) => {
    if (!nodeData || !selectedNode) return;
    
    setUseInputData(checked);
    
    const updatedData = { ...nodeData, useInputData: checked };
    setNodeData(updatedData);
    
    // 不再自动更新节点，而是等待用户点击保存按钮
    // const updatedNode = {
    //   ...selectedNode,
    //   data: updatedData,
    // };
    // 
    // onNodeUpdate(updatedNode);
  };
  
  // 生成条件表达式
  const generateConditionExpression = (inputNode: any) => {
    if (!inputNode) return '';
    
    let autoCondition = '';
    switch (inputNode.type) {
      case 'taskNode':
        const taskData = inputNode.data || {};
        const taskStatus = taskData.status || 'completed';
        const taskProgress = taskData.progress || 10;
        // 修改条件表达式，使其能够处理任务未完成但进度达标的情况
        autoCondition = `input.status === "completed" || (input.status === "in_progress" && input.progress >= ${taskProgress})`;
        break;
      case 'dialogueNode':
        const dialogueData = inputNode.data || {};
        const selectedChoice = dialogueData.selectedChoice || 'choice1';
        autoCondition = `input.selectedChoice === "${selectedChoice}"`;
        break;
      case 'rewardNode':
        const rewardData = inputNode.data || {};
        const claimed = rewardData.claimed !== undefined ? rewardData.claimed : true;
        autoCondition = `input.claimed === ${claimed}`;
        break;
      case 'startNode':
        const startData = inputNode.data || {};
        const gameVersion = startData.gameVersion || '1.0.0';
        autoCondition = `input.gameVersion === "${gameVersion}"`;
        break;
      default:
        autoCondition = '';
    }
    
    return autoCondition;
  };

  // 处理选择输入节点变化
  const handleSelectedInputNodeChange = (value: string) => {
    if (!nodeData || !selectedNode) return;
    
    setSelectedInputNode(value);
    
    // 查找选中的输入节点
    const selectedInput = nodeData.inputNodes?.find(n => n.id === value);
    
    // 根据节点类型和实际数据自动生成条件表达式
    const autoCondition = generateConditionExpression(selectedInput);
    
    // 更新节点数据
    const updatedData = { 
      ...nodeData, 
      selectedInputNode: value,
      // 如果已经有条件表达式，则不覆盖
      condition: nodeData.condition || autoCondition
    };
    setNodeData(updatedData);
    
    // 不再自动更新节点，而是等待用户点击保存按钮
    // const updatedNode = {
    //   ...selectedNode,
    //   data: updatedData,
    // };
    // 
    // onNodeUpdate(updatedNode);
  };
  
  // 处理任务信息更新
  const handleQuestInfoUpdate = () => {
    onQuestInfoUpdate(localQuestName, localQuestDescription);
    message.success('任务信息已保存');
  };
  
  // 测试条件表达式
  const testConditionExpression = () => {
    try {
      // 创建测试上下文
      const testContext = {
        player: {
          level: 1,
          gold: 0,
          experience: 0,
          inventory: [],
          quests: {}
        },
        quest: {
          id: selectedNode?.id || '',
          status: 'active',
          progress: 0
        }
      };

      // 如果使用输入数据，添加输入节点的数据
      if (useInputData && nodeData.selectedInputNode) {
        const inputNode = nodeData.inputNodes?.find(n => n.id === nodeData.selectedInputNode);
        if (inputNode) {
          let inputData = {};
          
          switch (inputNode.type) {
            case 'taskNode':
              inputData = {
                taskId: inputNode.data?.taskId || 'task-123',
                status: inputNode.data?.status || 'completed',
                progress: inputNode.data?.progress || 10,
                completed: inputNode.data?.completed !== undefined ? inputNode.data.completed : false,
                timeSpent: inputNode.data?.timeSpent || 120
              };
              break;
            case 'dialogueNode':
              inputData = {
                dialogueId: inputNode.data?.dialogueId || 'dialogue-123',
                choices: inputNode.data?.choices || ['choice1', 'choice2'],
                selectedChoice: inputNode.data?.selectedChoice || 'choice1'
              };
              break;
            case 'rewardNode':
              inputData = {
                rewardId: inputNode.data?.rewardId || 'reward-123',
                rewardType: inputNode.data?.rewardType || 'item',
                amount: inputNode.data?.amount || 1,
                claimed: inputNode.data?.claimed !== undefined ? inputNode.data.claimed : true
              };
              break;
            case 'startNode':
              inputData = {
                gameVersion: inputNode.data?.gameVersion || '1.0.0',
                timestamp: inputNode.data?.timestamp || Date.now(),
                sessionId: inputNode.data?.sessionId || 'example-session-id'
              };
              break;
            default:
              inputData = {};
          }
          
          testContext.input = inputData;
        }
      }

      // 解析测试值
      if (testValue) {
        try {
          // 尝试解析为JSON格式
          try {
            const jsonData = JSON.parse(testValue);
            Object.assign(testContext, jsonData);
          } catch (jsonError) {
            // 如果不是有效的JSON，尝试解析为键值对格式
            const pairs = testValue.split(',').map(pair => pair.trim());
            for (const pair of pairs) {
              const [path, valueStr] = pair.split(':').map(part => part.trim());
              if (!path || valueStr === undefined) {
                throw new Error(`无效的键值对: ${pair}`);
              }
              
              // 解析值
              let value;
              try {
                // 尝试解析为数字或布尔值
                if (valueStr === 'true') value = true;
                else if (valueStr === 'false') value = false;
                else if (!isNaN(Number(valueStr))) value = Number(valueStr);
                else {
                  // 如果是字符串，移除引号
                  value = valueStr.replace(/^['"](.*)['"]$/, '$1');
                }
              } catch (e) {
                value = valueStr;
              }
              
              // 设置嵌套属性
              const parts = path.split('.');
              let current = testContext;
              for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) current[part] = {};
                current = current[part];
              }
              current[parts[parts.length - 1]] = value;
            }
          }
        } catch (e) {
          setTestError(`测试值格式错误: ${e.message}`);
          return;
        }
      }

      // 确定要执行的条件表达式
      let condition = '';
      
      if (nodeData.conditionType === 'auto' && useInputData && nodeData.selectedInputNode) {
        const inputNode = nodeData.inputNodes?.find(n => n.id === nodeData.selectedInputNode);
        if (inputNode) {
          switch (inputNode.type) {
            case 'taskNode':
              // 同时检查任务状态和进度
              const taskProgress = inputNode.data?.progress || 10;
              condition = `input.status === "completed" || (input.status === "in_progress" && input.progress >= ${taskProgress})`;
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
        // 如果已经保存了自动条件，优先使用保存的条件
        if (nodeData.autoCondition) {
          condition = nodeData.autoCondition;
        }
      } else {
        // 使用自定义条件
        condition = nodeData?.condition || '';
      }
      
      if (!condition.trim()) {
        setTestError('请输入条件表达式或选择自动判断条件');
        return;
      }

      // 创建安全的执行环境
      const safeEval = new Function(
        'player', 'quest', 'input',
        `try { return !!(${condition}); } catch(e) { throw new Error('条件表达式执行错误: ' + e.message); }`
      );

      // 执行条件表达式
      const result = safeEval(
        testContext.player, 
        testContext.quest, 
        testContext.input
      );

      // 设置测试结果
      setTestResult(result);
      setTestError(null);
      
      // 显示测试上下文（调试用）
      console.log('测试上下文:', testContext);
      console.log('条件表达式:', condition);
      console.log('测试结果:', result);
    } catch (error) {
      setTestError(`${error.message}`);
      setTestResult(null);
    }
  };
  
  // 渲染节点属性编辑器
  const renderNodeProperties = () => {
    if (!selectedNode || !nodeData) return null;
    
    // 根据节点类型渲染不同的属性编辑器
    switch (selectedNode.type) {
      case 'startNode':
        return (
          <div className="node-properties">
            <h3>开始节点属性</h3>
            <Form layout="vertical">
              <Form.Item label="标签">
                <Input
                  value={nodeData.label}
                  onChange={(e) => handleNodeDataChange('label', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="描述">
                <TextArea
                  value={nodeData.description}
                  onChange={(e) => handleNodeDataChange('description', e.target.value)}
                  rows={4}
                />
              </Form.Item>
              <Divider style={{ margin: '12px 0' }} />
              <h4>输出数据</h4>
              <div className="node-output-data">
                <pre>{JSON.stringify(nodeData.outputData || { status: 'started' }, null, 2)}</pre>
              </div>
              <Form.Item>
                <Button type="primary" onClick={saveNodeData} style={{ marginTop: '16px' }}>
                  保存节点属性
                </Button>
              </Form.Item>
            </Form>
          </div>
        );
        
      case 'taskNode':
        return (
          <div className="node-properties">
            <h3>任务节点属性</h3>
            <Form layout="vertical">
              <Form.Item label="标签">
                <Input
                  value={nodeData.label}
                  onChange={(e) => handleNodeDataChange('label', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="描述">
                <TextArea
                  value={nodeData.description}
                  onChange={(e) => handleNodeDataChange('description', e.target.value)}
                  rows={4}
                />
              </Form.Item>
              <Form.Item label="目标">
                <Input
                  value={nodeData.objective}
                  onChange={(e) => handleNodeDataChange('objective', e.target.value)}
                  placeholder="例如：收集10个苹果"
                />
              </Form.Item>
              <Form.Item label="需要数量">
                <InputNumber
                  value={nodeData.requiredCount}
                  onChange={(value) => handleNodeDataChange('requiredCount', value)}
                  min={1}
                />
              </Form.Item>
              <Divider style={{ margin: '12px 0' }} />
              <h4>输出数据</h4>
              <div className="node-output-data">
                <Form.Item label="状态">
                  <Select
                    value={nodeData.outputData?.status || 'completed'}
                    onChange={(value) => {
                      const updatedOutputData = {
                        ...nodeData.outputData || { progress: 0 },
                        status: value
                      };
                      handleNodeDataChange('outputData', updatedOutputData);
                    }}
                  >
                    <Select.Option value="completed">已完成</Select.Option>
                    <Select.Option value="in_progress">进行中</Select.Option>
                    <Select.Option value="failed">失败</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="进度">
                  <InputNumber
                    value={nodeData.outputData?.progress || 0}
                    onChange={(value) => {
                      const updatedOutputData = {
                        ...nodeData.outputData || { status: 'completed' },
                        progress: value
                      };
                      handleNodeDataChange('outputData', updatedOutputData);
                    }}
                    min={0}
                    max={100}
                  />
                </Form.Item>
                <pre>{JSON.stringify(nodeData.outputData || { status: 'completed', progress: 0 }, null, 2)}</pre>
              </div>
              <Form.Item>
                <Button type="primary" onClick={saveNodeData} style={{ marginTop: '16px' }}>
                  保存节点属性
                </Button>
              </Form.Item>
            </Form>
          </div>
        );
        
      case 'conditionNode':
        return (
          <div className="node-properties">
            <h3>条件节点属性</h3>
            <Form layout="vertical">
              <Form.Item label="标签">
                <Input
                  value={nodeData.label || ''}
                  onChange={(e) => handleNodeDataChange('label', e.target.value)}
                  placeholder="输入节点标签"
                />
              </Form.Item>
              
              <Form.Item label="描述">
                <Input.TextArea
                  value={nodeData.description || ''}
                  onChange={(e) => handleNodeDataChange('description', e.target.value)}
                  placeholder="输入节点描述"
                  rows={2}
                />
              </Form.Item>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Form.Item>
                <Checkbox 
                  checked={useInputData} 
                  onChange={(e) => handleUseInputDataChange(e.target.checked)}
                >
                  使用上一个节点的输出数据
                </Checkbox>
              </Form.Item>
              
              {useInputData && nodeData.inputNodes && nodeData.inputNodes.length > 0 && (
                <Form.Item label="选择输入节点">
                  <Select
                    value={nodeData.selectedInputNode || ''}
                    onChange={handleSelectedInputNodeChange}
                    placeholder="选择一个输入节点"
                    style={{ width: '100%' }}
                  >
                    {nodeData.inputNodes.map((node: any) => (
                      <Option key={node.id} value={node.id}>
                        {node.label} ({node.type})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
              
              {useInputData && nodeData.selectedInputNode && (
                <div className="input-node-data">
                  <h4>输入节点数据</h4>
                  <div className="node-input-data">
                    {renderInputNodeData(nodeData.selectedInputNode)}
                  </div>
                </div>
              )}
              
              <Form.Item 
                label="条件类型"
              >
                <Radio.Group 
                  value={nodeData.conditionType || 'auto'} 
                  onChange={(e) => handleNodeDataChange('conditionType', e.target.value)}
                >
                  <Radio value="auto">自动判断</Radio>
                  <Radio value="custom">自定义条件</Radio>
                </Radio.Group>
              </Form.Item>
              
              {(nodeData.conditionType === 'custom' || !nodeData.conditionType) && (
                <Form.Item 
                  label={
                    <span>
                      条件表达式
                      <Tooltip title={
                        <div>
                          <p>使用JavaScript表达式编写条件，可以访问以下对象：</p>
                          <ul>
                            <li><strong>player</strong>: 玩家数据 (例如: player.level &gt; 10)</li>
                            <li><strong>quest</strong>: 任务数据 (例如: quest.status === 'active')</li>
                            {useInputData && <li><strong>input</strong>: 输入节点数据 (例如: input.progress &gt; 50)</li>}
                          </ul>
                          <p>表达式必须返回布尔值(true/false)</p>
                        </div>
                      }>
                        <span style={{ marginLeft: '5px', cursor: 'help' }}>ℹ️</span>
                      </Tooltip>
                    </span>
                  }
                >
                  <Input
                    value={nodeData?.condition || ''}
                    onChange={(e) => handleNodeDataChange('condition', e.target.value)}
                    placeholder="例如: player.level >= 10 || quest.gold > 100"
                  />
                  {useInputData && nodeData.selectedInputNode && (
                    <Button 
                      type="link" 
                      onClick={() => {
                        // 查找选中的输入节点
                        const selectedInput = nodeData.inputNodes?.find(n => n.id === nodeData.selectedInputNode);
                        // 生成条件表达式
                        const autoCondition = generateConditionExpression(selectedInput);
                        if (autoCondition) {
                          handleNodeDataChange('condition', autoCondition);
                        }
                      }}
                      style={{ marginTop: '5px' }}
                    >
                      根据输入节点生成条件表达式
                    </Button>
                  )}
                </Form.Item>
              )}
              
              {nodeData.conditionType === 'auto' && useInputData && nodeData.selectedInputNode && (
                <Alert
                  message="自动判断条件"
                  description={
                    <div>
                      <p>系统将根据输入节点的类型自动判断条件：</p>
                      <ul>
                        <li>任务节点: 判断任务是否完成 (status === "completed")</li>
                        <li>对话节点: 判断对话是否完成</li>
                        <li>奖励节点: 判断奖励是否已领取</li>
                      </ul>
                      <p>无需手动编写条件表达式</p>
                    </div>
                  }
                  type="info"
                  showIcon
                />
              )}
              
              <Divider style={{ margin: '12px 0' }} />
              
              {nodeData.conditionType === 'custom' && (
                <>
                  <h4>条件测试</h4>
                  <Alert
                    message="条件测试说明"
                    description={
                      <div>
                        <p>1. 在条件表达式中输入要测试的条件</p>
                        <p>2. 在测试值中输入要测试的变量值</p>
                        <p>3. 点击"测试条件"按钮查看结果</p>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: '10px' }}
                  />
                  <Form.Item 
                    label={
                      <span>
                        测试值
                        <Tooltip title={
                          <div>
                            <p>支持两种格式：</p>
                            <p>1. 简单键值对：player.level: 10, input.progress: 50</p>
                            <p>2. JSON格式：{`{"player":{"level":10},"input":{"progress":50}}`}</p>
                          </div>
                        }>
                          <span style={{ marginLeft: '5px', cursor: 'help' }}>ℹ️</span>
                        </Tooltip>
                      </span>
                    }
                  >
                    <Input
                      value={testValue}
                      onChange={(e) => setTestValue(e.target.value)}
                      placeholder={useInputData ? "例如：input.progress: 50" : "例如：player.level: 10"}
                    />
                  </Form.Item>
                  
                  <Button type="primary" onClick={testConditionExpression}>
                    测试条件
                  </Button>
                  
                  {testResult !== null && (
                    <Alert
                      message={testResult ? "条件满足" : "条件不满足"}
                      description={
                        <div>
                          <p>条件表达式返回: <strong>{String(testResult)}</strong></p>
                          <p>将执行: <strong>{testResult ? "成功分支" : "失败分支"}</strong></p>
                        </div>
                      }
                      type={testResult ? "success" : "warning"}
                      showIcon
                      style={{ marginTop: '10px' }}
                    />
                  )}
                  
                  {testError && (
                    <Alert
                      message="测试错误"
                      description={testError}
                      type="error"
                      showIcon
                      style={{ marginTop: '10px' }}
                    />
                  )}
                </>
              )}
              
              <Divider style={{ margin: '12px 0' }} />
              
              <div className="condition-branches">
                <h4>分支说明</h4>
                <p>条件节点有两个分支：</p>
                <div className="branch-info success">
                  <div className="branch-dot success"></div>
                  <span>成功分支：条件表达式返回true时执行</span>
                </div>
                <div className="branch-info failure">
                  <div className="branch-dot failure"></div>
                  <span>失败分支：条件表达式返回false时执行</span>
                </div>
              </div>
              
              <Button type="primary" onClick={saveNodeData} style={{ marginTop: '15px' }}>
                保存节点属性
              </Button>
            </Form>
          </div>
        );
        
      case 'dialogueNode':
        return (
          <div className="node-properties">
            <h3>对话节点属性</h3>
            <Form layout="vertical">
              <Form.Item label="标签">
                <Input
                  value={nodeData.label}
                  onChange={(e) => handleNodeDataChange('label', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="描述">
                <TextArea
                  value={nodeData.description}
                  onChange={(e) => handleNodeDataChange('description', e.target.value)}
                  rows={4}
                />
              </Form.Item>
              <Form.Item label="对话角色">
                <Select
                  value={nodeData?.character || undefined}
                  onChange={(value) => handleNodeDataChange('character', value)}
                  placeholder="选择对话角色"
                  style={{ width: '100%' }}
                >
                  {(nodeData.characters || []).map((char: any) => (
                    <Option key={char.id} value={char.id}>
                      {char.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="对话内容">
                <TextArea
                  value={nodeData?.text || ''}
                  onChange={(e) => handleNodeDataChange('text', e.target.value)}
                  placeholder="输入对话内容"
                  rows={4}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={saveNodeData} style={{ marginTop: '16px' }}>
                  保存节点属性
                </Button>
              </Form.Item>
            </Form>
          </div>
        );


      case 'rewardNode':
        return (
          <div className="node-properties">
            <h3>奖励节点属性</h3>
            <Form layout="vertical">
              <Form.Item label="标签">
                <Input
                  value={nodeData.label}
                  onChange={(e) => handleNodeDataChange('label', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="描述">
                <TextArea
                  value={nodeData.description}
                  onChange={(e) => handleNodeDataChange('description', e.target.value)}
                  rows={4}
                />
              </Form.Item>
              <Form.Item label="奖励类型">
                <Select
                  value={nodeData.rewardType || 'item'}
                  onChange={(value) => handleNodeDataChange('rewardType', value)}
                >
                  <Option value="item">物品</Option>
                  <Option value="experience">经验</Option>
                  <Option value="currency">货币</Option>
                  <Option value="reputation">声望</Option>
                </Select>
              </Form.Item>
              <Form.Item label="奖励值">
                <Input
                  value={nodeData.rewardValue}
                  onChange={(e) => handleNodeDataChange('rewardValue', e.target.value)}
                  placeholder="例如：金币x100"
                />
              </Form.Item>
              <Divider style={{ margin: '12px 0' }} />
              <h4>输出数据</h4>
              <div className="node-output-data">
                <Form.Item label="奖励状态">
                  <Switch
                    checked={nodeData.outputData?.rewarded !== false}
                    onChange={(checked) => {
                      const updatedOutputData = {
                        ...nodeData.outputData || { rewardType: nodeData.rewardType || 'item', rewardValue: 0 },
                        rewarded: checked
                      };
                      handleNodeDataChange('outputData', updatedOutputData);
                    }}
                  />
                </Form.Item>
                <Form.Item label="奖励类型">
                  <Select
                    value={nodeData.outputData?.rewardType || nodeData.rewardType || 'item'}
                    onChange={(value) => {
                      const updatedOutputData = {
                        ...nodeData.outputData || { rewarded: true, rewardValue: 0 },
                        rewardType: value
                      };
                      handleNodeDataChange('outputData', updatedOutputData);
                    }}
                  >
                    <Select.Option value="gold">金币</Select.Option>
                    <Select.Option value="exp">经验</Select.Option>
                    <Select.Option value="item">物品</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="奖励数值">
                  <InputNumber
                    value={nodeData.outputData?.rewardValue || 0}
                    onChange={(value) => {
                      const updatedOutputData = {
                        ...nodeData.outputData || { rewarded: true, rewardType: nodeData.rewardType || 'item' },
                        rewardValue: value
                      };
                      handleNodeDataChange('outputData', updatedOutputData);
                    }}
                    min={0}
                  />
                </Form.Item>
                <pre>{JSON.stringify(nodeData.outputData || { rewarded: true, rewardType: nodeData.rewardType || 'item', rewardValue: 0 }, null, 2)}</pre>
              </div>
              <Form.Item>
                <Button type="primary" onClick={saveNodeData} style={{ marginTop: '16px' }}>
                  保存节点属性
                </Button>
              </Form.Item>
            </Form>
          </div>
        );
        
      case 'endNode':
        return (
          <div className="node-properties">
            <h3>结束节点属性</h3>
            <Form layout="vertical">
              <Form.Item label="标签">
                <Input
                  value={nodeData.label}
                  onChange={(e) => handleNodeDataChange('label', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="描述">
                <TextArea
                  value={nodeData.description}
                  onChange={(e) => handleNodeDataChange('description', e.target.value)}
                  rows={4}
                />
              </Form.Item>
              <Divider style={{ margin: '12px 0' }} />
              <h4>输出数据</h4>
              <div className="node-output-data">
                <pre>{JSON.stringify(nodeData.outputData || { status: 'ended' }, null, 2)}</pre>
              </div>
              <Form.Item>
                <Button type="primary" onClick={saveNodeData} style={{ marginTop: '16px' }}>
                  保存节点属性
                </Button>
              </Form.Item>
            </Form>
          </div>
        );
        
      default:
        return (
          <div className="node-properties">
            <h3>节点属性</h3>
            <p>未知节点类型</p>
          </div>
        );
    }
  };
  
  // 渲染输入节点数据
  const renderInputNodeData = (nodeId: string) => {
    // 从nodeData.inputNodes中查找节点，而不是使用不存在的nodes变量
    const node = nodeData.inputNodes?.find(n => n.id === nodeId);
    if (!node) {
      return <div>未找到节点</div>;
    }

    let outputData = {};
    let exampleCondition = '';
    
    switch (node.type) {
      case 'startNode':
        outputData = {
          gameVersion: '1.0.0',
          timestamp: Date.now(),
          sessionId: 'example-session-id'
        };
        exampleCondition = 'input.gameVersion === "1.0.0"';
        break;
      case 'taskNode':
        outputData = {
          taskId: node.data?.taskId || 'task-123',
          progress: 50,
          completed: false,
          timeSpent: 120 // 秒
        };
        exampleCondition = 'input.progress >= 50';
        break;
      case 'dialogueNode':
        outputData = {
          dialogueId: node.data?.dialogueId || 'dialogue-123',
          choices: ['choice1', 'choice2'],
          selectedChoice: 'choice1'
        };
        exampleCondition = 'input.selectedChoice === "choice1"';
        break;
      case 'rewardNode':
        outputData = {
          rewardId: node.data?.rewardId || 'reward-123',
          rewardType: node.data?.rewardType || 'item',
          amount: node.data?.amount || 1,
          claimed: true
        };
        exampleCondition = 'input.claimed === true';
        break;
      default:
        outputData = { message: '此节点类型没有输出数据' };
        exampleCondition = '';
    }

    return (
      <div className="input-data-preview">
        <div className="data-section">
          <h5>数据结构</h5>
          <pre>{JSON.stringify(outputData, null, 2)}</pre>
        </div>
        <div className="example-section">
          <h5>条件表达式示例</h5>
          <code>{exampleCondition}</code>
        </div>
        <Alert
          message="提示"
          description={`在条件表达式中，您可以通过 input.属性名 来访问上述数据`}
          type="info"
          showIcon
          style={{ marginTop: '10px' }}
        />
      </div>
    );
  };
  
  // 渲染边属性编辑器
  const renderEdgeProperties = () => {
    if (!selectedEdge || !edgeData) return null;
    
    return (
      <div className="edge-properties">
        <h3>连接属性</h3>
        <Form layout="vertical">
          <Form.Item label="标签">
            <Input
              value={selectedEdge.label}
              onChange={(e) => {
                const updatedEdge = {
                  ...selectedEdge,
                  label: e.target.value,
                };
                onEdgeUpdate(updatedEdge);
              }}
            />
          </Form.Item>
          <Form.Item label="条件">
            <Input
              value={edgeData.condition}
              onChange={(e) => handleEdgeDataChange('condition', e.target.value)}
              placeholder="例如：player.hasItem('key')"
            />
          </Form.Item>
          <Form.Item label="连接类型">
            <Select
              value={edgeData.type || 'default'}
              onChange={handleEdgeTypeChange}
            >
              <Option value="default">默认</Option>
              <Option value="success">成功路径</Option>
              <Option value="failure">失败路径</Option>
            </Select>
          </Form.Item>
          <Form.Item label="动画效果">
            <Switch
              checked={selectedEdge.animated}
              onChange={handleEdgeAnimatedChange}
            />
          </Form.Item>
          <Form.Item label="线条样式">
            <div className="edge-style-preview">
              <div className={`edge-preview ${edgeData.type || 'default'}`}></div>
              <span className="edge-preview-label">
                {edgeData.type === 'success' ? '成功路径' : 
                 edgeData.type === 'failure' ? '失败路径' : '默认'}
              </span>
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={saveEdgeData}>
              保存边属性
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };
  
  // 渲染任务信息编辑器
  const renderQuestInfo = () => {
    if (selectedNode || selectedEdge) return null;
    
    return (
      <div className="quest-info-editor">
        <h3>任务信息</h3>
        <Form layout="vertical">
          <Form.Item label="任务名称">
            <Input
              value={localQuestName}
              onChange={(e) => setLocalQuestName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="任务描述">
            <TextArea
              value={localQuestDescription}
              onChange={(e) => setLocalQuestDescription(e.target.value)}
              rows={6}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleQuestInfoUpdate}>
              保存任务信息
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };
  
  return (
    <div className="properties-panel">
      {renderNodeProperties()}
      {renderEdgeProperties()}
      {renderQuestInfo()}
      
      {!selectedNode && !selectedEdge && !localQuestName && (
        <div className="empty-state">
          <p>选择一个节点或连接线以编辑其属性</p>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;