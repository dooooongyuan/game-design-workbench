import React, { useState, useEffect } from 'react';
import './EconomicPressureTestTool.css';
import SystemEditor from './SystemEditor';
import ScenarioEditor from './ScenarioEditor';
import SimulationEngine from './SimulationEngine';
import ResultsViewer from './ResultsViewer';

// 定义经济系统类型
interface EconomySystem {
  id: string;
  name: string;
  description: string;
  resources: Resource[];
  actors: Actor[];
  transactions: Transaction[];
  lastModified: number;
}

// 定义资源类型
interface Resource {
  id: string;
  name: string;
  initialAmount: number;
  regenerationRate: number;
  maxAmount: number;
  description: string;
}

// 定义经济主体类型
interface Actor {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'system';
  resources: { [resourceId: string]: number };
  behavior: ActorBehavior;
  description: string;
}

// 定义主体行为类型
interface ActorBehavior {
  consumptionRate: { [resourceId: string]: number };
  productionRate: { [resourceId: string]: number };
  tradingStrategy: 'aggressive' | 'balanced' | 'conservative';
  priorityResources: string[];
}

// 定义交易类型
interface Transaction {
  id: string;
  name: string;
  sourceActorId: string;
  targetActorId: string;
  resources: { [resourceId: string]: number };
  conditions: TransactionCondition[];
  probability: number;
  cooldown: number;
  description: string;
}

// 定义交易条件类型
interface TransactionCondition {
  type: 'resourceAmount' | 'actorState' | 'timeElapsed' | 'randomChance';
  resourceId?: string;
  operator: '>' | '<' | '==' | '>=' | '<=';
  value: number;
}

// 定义模拟结果类型
interface SimulationResult {
  id: string;
  scenarioId: string;
  systemId: string;
  timestamp: number;
  duration: number;
  iterations: number;
  seed: number;
  timeSeriesData: any[];
  events: any[];
  summary: {
    resourceStats: { [resourceId: string]: any };
    actorStats: { [actorId: string]: any };
    transactionStats: { [transactionId: string]: any };
    systemStability: number;
    inflationRate: number;
    inequalityIndex: number;
  };
}

// 定义模拟事件类型
interface SimulationEvent {
  timestamp: number;
  type: string;
  description: string;
  data: any;
}

// 定义模拟场景类型
interface SimulationScenario {
  id: string;
  name: string;
  economySystemId: string;
  duration: number;
  events: ScenarioEvent[];
  description: string;
}

// 定义场景事件类型
interface ScenarioEvent {
  id: string;
  description: string;
  triggerTime: number;
  type: 'resource_shock' | 'actor_behavior_change' | 'transaction_change';
  data: any;
}

// 本地存储键
const STORAGE_KEY_ECONOMY_SYSTEMS = 'economicPressureTest_systems';
const STORAGE_KEY_SIMULATION_RESULTS = 'economicPressureTest_results';
const STORAGE_KEY_SIMULATION_SCENARIOS = 'economicPressureTest_scenarios';

const EconomicPressureTestTool: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'systems' | 'scenarios' | 'simulation' | 'results'>('systems');
  const [economySystems, setEconomySystems] = useState<EconomySystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [simulationScenarios, setSimulationScenarios] = useState<SimulationScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  
  // 模拟配置
  const [simulationConfig, setSimulationConfig] = useState({
    iterations: 10,
    seed: Math.floor(Math.random() * 1000),
    logLevel: 'info' as 'debug' | 'info' | 'error'
  });
  
  // 模拟进度
  const [simulationProgress, setSimulationProgress] = useState(0);

  // 从本地存储加载数据
  useEffect(() => {
    try {
      const savedSystems = localStorage.getItem(STORAGE_KEY_ECONOMY_SYSTEMS);
      if (savedSystems) {
        setEconomySystems(JSON.parse(savedSystems));
      }

      const savedScenarios = localStorage.getItem(STORAGE_KEY_SIMULATION_SCENARIOS);
      if (savedScenarios) {
        setSimulationScenarios(JSON.parse(savedScenarios));
      }

      const savedResults = localStorage.getItem(STORAGE_KEY_SIMULATION_RESULTS);
      if (savedResults) {
        setSimulationResults(JSON.parse(savedResults));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      showStatusMessage('加载数据失败', 'error');
    }
  }, []);

  // 保存经济系统到本地存储
  useEffect(() => {
    if (economySystems.length > 0) {
      localStorage.setItem(STORAGE_KEY_ECONOMY_SYSTEMS, JSON.stringify(economySystems));
    }
  }, [economySystems]);

  // 保存模拟场景到本地存储
  useEffect(() => {
    if (simulationScenarios.length > 0) {
      localStorage.setItem(STORAGE_KEY_SIMULATION_SCENARIOS, JSON.stringify(simulationScenarios));
    }
  }, [simulationScenarios]);

  // 保存模拟结果到本地存储
  useEffect(() => {
    if (simulationResults.length > 0) {
      localStorage.setItem(STORAGE_KEY_SIMULATION_RESULTS, JSON.stringify(simulationResults));
    }
  }, [simulationResults]);

  // 显示状态消息
  const showStatusMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    // 3秒后自动清除消息
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // 创建新经济系统
  const handleCreateSystem = () => {
    const newSystem: EconomySystem = {
      id: generateId(),
      name: '新经济系统',
      description: '',
      resources: [],
      actors: [],
      transactions: [],
      lastModified: Date.now()
    };

    setEconomySystems([...economySystems, newSystem]);
    setSelectedSystemId(newSystem.id);
    showStatusMessage('已创建新经济系统', 'success');
  };

  // 更新经济系统
  const handleUpdateSystem = (updatedSystem: Partial<EconomySystem>) => {
    if (!selectedSystemId) return;

    const updated = economySystems.map(system => 
      system.id === selectedSystemId 
        ? { ...system, ...updatedSystem, lastModified: Date.now() } 
        : system
    );

    setEconomySystems(updated);
    showStatusMessage('经济系统已更新', 'success');
  };

  // 删除经济系统
  const handleDeleteSystem = (systemId: string) => {
    if (window.confirm('确定要删除这个经济系统吗？相关的模拟场景和结果也会被删除。')) {
      setEconomySystems(economySystems.filter(s => s.id !== systemId));
      
      // 同时删除相关的模拟场景和结果
      setSimulationScenarios(simulationScenarios.filter(s => s.economySystemId !== systemId));
      setSimulationResults(simulationResults.filter(r => r.systemId !== systemId));
      
      if (selectedSystemId === systemId) {
        setSelectedSystemId(null);
      }
      
      showStatusMessage('经济系统已删除', 'success');
    }
  };

  // 处理模拟进度更新
  const handleSimulationProgress = (progress: number) => {
    setSimulationProgress(progress);
  };

  // 处理模拟完成
  const handleSimulationComplete = (result: any) => {
    // 确保result对象包含必要的属性
    const validatedResult = {
      ...result,
      summary: result.summary || {
        systemStability: 0,
        inflationRate: 0,
        inequalityIndex: 0,
        resourceStats: {},
        actorStats: {},
        transactionStats: {}
      }
    };
    
    // 保存模拟结果
    setSimulationResults([...simulationResults, validatedResult]);
    showStatusMessage('模拟完成', 'success');
    
    // 自动切换到结果标签页
    setActiveTab('results');
    setSelectedResultId(validatedResult.id);
  };

  // 处理模拟错误
  const handleSimulationError = (error: string) => {
    showStatusMessage(`模拟错误: ${error}`, 'error');
  };

  // 创建新模拟场景
  const handleCreateScenario = (systemId: string) => {
    // 确保系统存在
    const system = economySystems.find(s => s.id === systemId);
    if (!system) {
      showStatusMessage('找不到选择的经济系统', 'error');
      return;
    }

    const newScenario: SimulationScenario = {
      id: generateId(),
      name: '新模拟场景',
      economySystemId: systemId,
      duration: 365, // 默认模拟一年
      events: [],
      description: ''
    };

    console.log('创建新场景:', newScenario, '基于系统:', system);

    setSimulationScenarios([...simulationScenarios, newScenario]);
    setSelectedScenarioId(newScenario.id);
    showStatusMessage('已创建新模拟场景', 'success');
  };

  // 更新模拟场景
  const handleUpdateScenario = (updatedScenario: Partial<SimulationScenario>) => {
    if (!selectedScenarioId) return;

    const updated = simulationScenarios.map(scenario => 
      scenario.id === selectedScenarioId 
        ? { ...scenario, ...updatedScenario } 
        : scenario
    );

    setSimulationScenarios(updated);
    showStatusMessage('模拟场景已更新', 'success');
  };

  // 删除模拟场景
  const handleDeleteScenario = (scenarioId: string) => {
    if (window.confirm('确定要删除这个模拟场景吗？')) {
      setSimulationScenarios(simulationScenarios.filter(s => s.id !== scenarioId));
      
      if (selectedScenarioId === scenarioId) {
        setSelectedScenarioId(null);
      }
      
      showStatusMessage('模拟场景已删除', 'success');
    }
  };

  // 运行模拟
  const handleRunSimulation = (scenarioId: string) => {
    const scenario = simulationScenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      showStatusMessage('找不到选择的模拟场景', 'error');
      return;
    }

    const system = economySystems.find(s => s.id === scenario.economySystemId);
    if (!system) {
      showStatusMessage('找不到关联的经济系统', 'error');
      return;
    }

    // TODO: 实现实际的模拟逻辑
    // 这里只是一个简单的示例，实际应用中需要更复杂的经济模型模拟

    // 创建模拟结果
    const result: SimulationResult = {
      id: generateId(),
      scenarioId: scenario.id,
      systemId: system.id,
      timestamp: Date.now(),
      duration: scenario.duration,
      iterations: simulationConfig.iterations,
      seed: simulationConfig.seed,
      timeSeriesData: [],
      events: [],
      summary: {
        resourceStats: {},
        actorStats: {},
        transactionStats: {},
        systemStability: 0,
        inflationRate: 0,
        inequalityIndex: 0
      }
    };

    // 保存结果
    setSimulationResults([...simulationResults, result]);
    setSelectedResultId(result.id);
    setActiveTab('results');
    showStatusMessage('模拟完成', 'success');
  };

  // 获取选中的经济系统
  const getSelectedSystem = (): EconomySystem | null => {
    return economySystems.find(s => s.id === selectedSystemId) || null;
  };

  // 获取选中的模拟场景
  const getSelectedScenario = (): SimulationScenario | null => {
    return simulationScenarios.find(s => s.id === selectedScenarioId) || null;
  };

  // 获取选中的模拟结果
  const getSelectedResult = (): SimulationResult | null => {
    return simulationResults.find(r => r.id === selectedResultId) || null;
  };

  // 根据ID获取系统
  const getSystemById = (systemId: string | undefined) => {
    if (!systemId) return null;
    return economySystems.find(s => s.id === systemId) || null;
  };

  // 根据ID获取场景
  const getScenarioById = (scenarioId: string | undefined) => {
    if (!scenarioId) return null;
    return simulationScenarios.find(s => s.id === scenarioId) || null;
  };

  // 获取场景名称
  const getScenarioName = (scenarioId: string | undefined) => {
    if (!scenarioId) return '未知场景';
    const scenario = simulationScenarios.find(s => s.id === scenarioId);
    return scenario ? scenario.name : '未知场景';
  };

  // 删除结果
  const handleDeleteResult = (resultId: string) => {
    setSimulationResults(simulationResults.filter(r => r.id !== resultId));
    if (selectedResultId === resultId) {
      setSelectedResultId(null);
    }
    showStatusMessage('模拟结果已删除', 'success');
  };

  return (
    <div className="economic-pressure-test">
      <div className="economic-pressure-test-header">
        <div className="economic-pressure-test-title">经济压力测试仪</div>
        <div className="economic-pressure-test-tabs">
          <button 
            className={`tab-button ${activeTab === 'systems' ? 'active' : ''}`}
            onClick={() => setActiveTab('systems')}
          >
            经济系统
          </button>
          <button 
            className={`tab-button ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('scenarios')}
          >
            模拟场景
          </button>
          <button 
            className={`tab-button ${activeTab === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulation')}
          >
            运行模拟
          </button>
          <button 
            className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            结果分析
          </button>
        </div>
        <div className="economic-pressure-test-actions">
          {activeTab === 'systems' && (
            <button 
              className="action-button primary"
              onClick={handleCreateSystem}
            >
              新建经济系统
            </button>
          )}
          
          {activeTab === 'scenarios' && selectedSystemId && (
            <button 
              className="action-button primary"
              onClick={() => handleCreateScenario(selectedSystemId)}
            >
              新建模拟场景
            </button>
          )}
          
          <button 
            className="action-button tutorial-toggle"
            onClick={() => setShowTutorial(!showTutorial)}
          >
            {showTutorial ? '隐藏教程' : '显示教程'} 📚
          </button>
        </div>
      </div>
      
      <div className="economic-pressure-test-body">
        {showTutorial && (
          <div className="economic-tutorial-modal">
            <div className="economic-tutorial-content">
              <div className="economic-tutorial-header">
                <h3>使用教程</h3>
                <button 
                  className="economic-tutorial-close"
                  onClick={() => setShowTutorial(false)}
                >
                  ×
                </button>
              </div>
              <div className="economic-tutorial-sections">
                {activeTab === 'systems' && (
                  <div className="economic-tutorial-section">
                    <h4>经济系统编辑器使用指南</h4>
                    <ol>
                      <li>点击<strong>新建经济系统</strong>按钮创建一个新的经济系统</li>
                      <li>添加资源并设置其初始数量、再生速率和最大数量</li>
                      <li>添加经济主体（玩家、NPC、系统）并设置其行为模式</li>
                      <li>定义交易规则和条件</li>
                      <li>完成后可以创建模拟场景</li>
                    </ol>
                    <div className="economic-tutorial-tips">
                      <strong>提示：</strong>设计平衡的经济系统需要考虑资源的产出和消耗比例
                    </div>
                  </div>
                )}
                
                {activeTab === 'scenarios' && (
                  <div className="economic-tutorial-section">
                    <h4>模拟场景使用指南</h4>
                    <ol>
                      <li>选择一个已有的经济系统</li>
                      <li>创建新的模拟场景</li>
                      <li>设置模拟持续时间</li>
                      <li>添加经济冲击事件（如资源短缺、通货膨胀等）</li>
                      <li>点击<strong>运行模拟</strong>按钮执行模拟</li>
                    </ol>
                    <div className="economic-tutorial-tips">
                      <strong>提示：</strong>添加多种不同类型的经济冲击可以测试系统的稳定性
                    </div>
                  </div>
                )}
                
                {activeTab === 'results' && (
                  <div className="economic-tutorial-section">
                    <h4>结果分析使用指南</h4>
                    <ol>
                      <li>选择一个模拟结果查看详细数据</li>
                      <li>分析资源价格和数量的变化趋势</li>
                      <li>查看经济主体的财富分布变化</li>
                      <li>识别经济系统中的潜在问题和瓶颈</li>
                      <li>根据分析结果调整经济系统设计</li>
                    </ol>
                    <div className="economic-tutorial-tips">
                      <strong>提示：</strong>关注极端情况下的系统表现，确保游戏经济不会崩溃
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className={`economic-pressure-test-content ${showTutorial ? 'with-tutorial' : ''}`}>
          {activeTab === 'systems' && (
            <div className="system-editor">
              <div className="system-list">
                <h3>经济系统列表</h3>
                {economySystems.length === 0 ? (
                  <div className="empty-list">没有经济系统，点击"新建经济系统"按钮创建</div>
                ) : (
                  <ul>
                    {economySystems.map(system => (
                      <li 
                        key={system.id}
                        className={selectedSystemId === system.id ? 'selected' : ''}
                        onClick={() => setSelectedSystemId(system.id)}
                      >
                        <span className="system-name">{system.name}</span>
                        <button 
                          className="delete-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSystem(system.id);
                          }}
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="system-detail">
                {selectedSystemId ? (
                  <SystemEditor 
                    system={getSelectedSystem() as any} 
                    onUpdateSystem={handleUpdateSystem} 
                  />
                ) : (
                  <div className="no-selection">
                    <p>请选择一个经济系统或创建新系统</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'scenarios' && (
            <div className="simulation-panel">
              <div className="scenario-list">
                <h3>模拟场景列表</h3>
                {simulationScenarios.length === 0 ? (
                  <div className="empty-list">没有模拟场景，请先选择一个经济系统并创建场景</div>
                ) : (
                  <ul>
                    {simulationScenarios.map(scenario => (
                      <li 
                        key={scenario.id}
                        className={selectedScenarioId === scenario.id ? 'selected' : ''}
                        onClick={() => setSelectedScenarioId(scenario.id)}
                      >
                        <span className="scenario-name">{scenario.name}</span>
                        <div className="scenario-actions">
                          <button 
                            className="action-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedScenarioId(scenario.id);
                              setActiveTab('simulation');
                            }}
                          >
                            运行模拟
                          </button>
                          <button 
                            className="delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScenario(scenario.id);
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="scenario-detail">
                {selectedScenarioId ? (
                  <ScenarioEditor 
                    scenario={getSelectedScenario() as any} 
                    system={getSelectedSystem() as any}
                    onUpdateScenario={handleUpdateScenario} 
                  />
                ) : (
                  <div className="no-selection">
                    <p>请选择一个模拟场景或创建新场景</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'simulation' && (
            <div className="simulation-section">
              <div className="section-header">
                <h3>运行模拟</h3>
              </div>
              
              {!selectedScenarioId ? (
                <div className="empty-message">
                  <p>请先选择一个模拟场景</p>
                </div>
              ) : (
                <div className="simulation-panel">
                  <div className="simulation-config">
                    <h4>模拟设置: {getSelectedScenario()?.name}</h4>
                    <p>基于经济系统: {getSystemById(getSelectedScenario()?.economySystemId)?.name || '未找到系统'}</p>
                    
                    {/* 添加系统检查警告 */}
                    {!getSystemById(getSelectedScenario()?.economySystemId) && (
                      <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#fee2e2', 
                        border: '1px solid #fecaca', 
                        borderRadius: '4px', 
                        color: '#b91c1c', 
                        marginBottom: '15px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>警告:</strong> 找不到关联的经济系统 (ID: {getSelectedScenario()?.economySystemId})。
                            请确保该系统存在，或者为此场景选择一个新的系统。
                          </div>
                          {economySystems.length > 0 && (
                            <button 
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                const firstSystem = economySystems[0];
                                handleUpdateScenario({
                                  economySystemId: firstSystem.id
                                });
                                showStatusMessage(`已自动关联场景到系统: ${firstSystem.name}`, 'info');
                              }}
                            >
                              自动修复
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* 添加调试信息 */}
                    <div className="debug-info" style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '4px', fontSize: '0.9rem' }}>
                      <div><strong>场景ID:</strong> {selectedScenarioId}</div>
                      <div><strong>系统ID:</strong> {getSelectedScenario()?.economySystemId}</div>
                      <div><strong>系统是否存在:</strong> {getSystemById(getSelectedScenario()?.economySystemId) ? '是' : '否'}</div>
                      <div><strong>场景事件数:</strong> {getSelectedScenario()?.events?.length || 0}</div>
                      <div><strong>系统资源数:</strong> {getSystemById(getSelectedScenario()?.economySystemId)?.resources?.length || 0}</div>
                      <div><strong>系统主体数:</strong> {getSystemById(getSelectedScenario()?.economySystemId)?.actors?.length || 0}</div>
                    </div>
                    
                    {/* 添加系统选择功能 */}
                    <div className="form-group">
                      <label>选择经济系统</label>
                      <select 
                        value={getSelectedScenario()?.economySystemId || ''}
                        onChange={(e) => {
                          const scenarioId = selectedScenarioId;
                          if (scenarioId) {
                            handleUpdateScenario({ 
                              economySystemId: e.target.value 
                            });
                            console.log('更新场景系统:', e.target.value);
                          }
                        }}
                      >
                        <option value="">-- 请选择系统 --</option>
                        {economySystems.map(system => (
                          <option key={system.id} value={system.id}>{system.name}</option>
                        ))}
                      </select>
                      <span className="input-hint">如果找不到关联的系统，可以在此选择一个新的系统</span>
                    </div>
                    
                    <div className="simulation-controls">
                      <div className="form-group">
                        <label>模拟次数</label>
                        <input 
                          type="number" 
                          value={simulationConfig.iterations} 
                          onChange={(e) => setSimulationConfig({
                            ...simulationConfig,
                            iterations: Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                          })}
                          min={1}
                          max={100}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>随机种子</label>
                        <input 
                          type="number" 
                          value={simulationConfig.seed} 
                          onChange={(e) => setSimulationConfig({
                            ...simulationConfig,
                            seed: parseInt(e.target.value) || 42
                          })}
                        />
                        <span className="input-hint">使用相同的种子可以重现相同的模拟结果</span>
                      </div>
                      
                      <div className="form-group">
                        <label>详细日志</label>
                        <select 
                          value={simulationConfig.logLevel} 
                          onChange={(e) => setSimulationConfig({
                            ...simulationConfig,
                            logLevel: e.target.value as 'debug' | 'info' | 'error'
                          })}
                        >
                          <option value="debug">调试 (全部信息)</option>
                          <option value="info">信息 (重要事件)</option>
                          <option value="error">错误 (仅错误信息)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <SimulationEngine 
                    scenario={getSelectedScenario()}
                    system={getSystemById(getSelectedScenario()?.economySystemId)}
                    config={{
                      scenarioId: selectedScenarioId || '',
                      systemId: getSelectedScenario()?.economySystemId || '',
                      iterations: simulationConfig.iterations,
                      seed: simulationConfig.seed,
                      logLevel: simulationConfig.logLevel
                    }}
                    onProgress={handleSimulationProgress}
                    onComplete={handleSimulationComplete}
                    onError={(error) => {
                      handleSimulationError(error);
                      console.error('模拟错误:', error);
                    }}
                  />
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'results' && (
            <div className="results-section">
              <div className="section-header">
                <h3>结果分析</h3>
              </div>
              
              {simulationResults.length === 0 ? (
                <div className="empty-message">
                  <p>暂无模拟结果，请先运行模拟</p>
                </div>
              ) : (
                <div className="results-panel">
                  <div className="results-list">
                    <h4>模拟结果列表</h4>
                    <div className="result-cards">
                      {simulationResults.map(result => (
                        <div 
                          key={result.id} 
                          className={`result-card ${selectedResultId === result.id ? 'selected' : ''}`}
                          onClick={() => setSelectedResultId(result.id)}
                        >
                          <h5>{getScenarioName(result.scenarioId)}</h5>
                          <div className="result-meta">
                            <span>时间: {new Date(result.timestamp).toLocaleString()}</span>
                            <span>迭代: {result.iterations}</span>
                          </div>
                          <div className="result-stats">
                            <div className="stat-item">
                              <div className="stat-label">稳定性</div>
                              <div className="stat-value">{result.summary && typeof result.summary.systemStability === 'number' ? result.summary.systemStability.toFixed(2) : 'N/A'}</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-label">通胀率</div>
                              <div className="stat-value">{result.summary && typeof result.summary.inflationRate === 'number' ? (result.summary.inflationRate * 100).toFixed(2) + '%' : 'N/A'}</div>
                            </div>
                          </div>
                          <button 
                            className="delete-button small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('确定要删除这个模拟结果吗？')) {
                                handleDeleteResult(result.id);
                              }
                            }}
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedResultId && (
                    <ResultsViewer 
                      result={getSelectedResult()}
                      system={getSystemById(getSelectedResult()?.systemId)}
                      scenario={getScenarioById(getSelectedResult()?.scenarioId)}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {statusMessage && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}
    </div>
  );
};

export default EconomicPressureTestTool; 