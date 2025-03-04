import React, { useState, useEffect } from 'react';
import './BalanceSimulatorTool.css';
import FormulaEditor from './FormulaEditor';
import SimulationPanel from './SimulationPanel';
import ResultsViewer from './ResultsViewer';

// 定义公式类型
interface Formula {
  id: string;
  name: string;
  expression: string;
  description: string;
  variables: Variable[];
  lastModified: number;
}

// 定义变量类型
interface Variable {
  id: string;
  name: string;
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  description?: string;
}

// 定义模拟配置类型
interface SimulationConfig {
  id: string;
  name: string;
  formulaId: string;
  variableRanges: VariableRange[];
  iterations: number;
  lastModified: number;
}

// 定义变量范围类型
interface VariableRange {
  variableId: string;
  start: number;
  end: number;
  step: number;
}

// 定义模拟结果类型
interface SimulationResult {
  id: string;
  configId: string;
  timestamp: number;
  data: Array<{
    inputs: Record<string, number>;
    output: number;
  }>;
}

// 本地存储键
const STORAGE_KEY_FORMULAS = 'balanceSimulator_formulas';
const STORAGE_KEY_CONFIGS = 'balanceSimulator_configs';
const STORAGE_KEY_RESULTS = 'balanceSimulator_results';

const BalanceSimulatorTool: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'editor' | 'simulation' | 'results'>('editor');
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<SimulationConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [importExportModal, setImportExportModal] = useState<{
    isOpen: boolean;
    type: 'import' | 'export';
    dataType: 'formulas' | 'configs' | 'results';
    data: string;
  } | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);

  // 从本地存储加载数据
  useEffect(() => {
    try {
      const savedFormulas = localStorage.getItem(STORAGE_KEY_FORMULAS);
      if (savedFormulas) {
        setFormulas(JSON.parse(savedFormulas));
      }

      const savedConfigs = localStorage.getItem(STORAGE_KEY_CONFIGS);
      if (savedConfigs) {
        setConfigs(JSON.parse(savedConfigs));
      }

      const savedResults = localStorage.getItem(STORAGE_KEY_RESULTS);
      if (savedResults) {
        setResults(JSON.parse(savedResults));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      showStatusMessage('加载数据失败', 'error');
    }
  }, []);

  // 保存公式到本地存储
  useEffect(() => {
    if (formulas.length > 0) {
      localStorage.setItem(STORAGE_KEY_FORMULAS, JSON.stringify(formulas));
    }
  }, [formulas]);

  // 保存配置到本地存储
  useEffect(() => {
    if (configs.length > 0) {
      localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(configs));
    }
  }, [configs]);

  // 保存结果到本地存储
  useEffect(() => {
    if (results.length > 0) {
      localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
    }
  }, [results]);

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

  // 创建新公式
  const handleCreateFormula = () => {
    const newFormula: Formula = {
      id: generateId(),
      name: '新公式',
      expression: '',
      description: '',
      variables: [],
      lastModified: Date.now()
    };

    setFormulas([...formulas, newFormula]);
    setSelectedFormulaId(newFormula.id);
    showStatusMessage('已创建新公式', 'success');
  };

  // 更新公式
  const handleUpdateFormula = (updatedFormula: Partial<Formula>) => {
    if (!selectedFormulaId) return;

    const updated = formulas.map(formula => 
      formula.id === selectedFormulaId 
        ? { ...formula, ...updatedFormula, lastModified: Date.now() } 
        : formula
    );

    setFormulas(updated);
    showStatusMessage('公式已更新', 'success');
  };

  // 删除公式
  const handleDeleteFormula = (formulaId: string) => {
    if (window.confirm('确定要删除这个公式吗？相关的模拟配置也会被删除。')) {
      setFormulas(formulas.filter(f => f.id !== formulaId));
      
      // 同时删除相关的模拟配置
      setConfigs(configs.filter(c => c.formulaId !== formulaId));
      
      if (selectedFormulaId === formulaId) {
        setSelectedFormulaId(null);
      }
      
      showStatusMessage('公式已删除', 'success');
    }
  };

  // 添加变量
  const handleAddVariable = (formulaId: string) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (!formula) return;

    const newVariable: Variable = {
      id: generateId(),
      name: `变量${formula.variables.length + 1}`,
      defaultValue: 0,
      minValue: 0,
      maxValue: 100,
      step: 1,
      description: ''
    };

    const updatedFormula = {
      ...formula,
      variables: [...formula.variables, newVariable],
      lastModified: Date.now()
    };

    setFormulas(formulas.map(f => f.id === formulaId ? updatedFormula : f));
  };

  // 删除变量
  const handleRemoveVariable = (formulaId: string, variableId: string) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (!formula) return;

    const updatedFormula = {
      ...formula,
      variables: formula.variables.filter(v => v.id !== variableId),
      lastModified: Date.now()
    };

    setFormulas(formulas.map(f => f.id === formulaId ? updatedFormula : f));
  };

  // 更新变量
  const handleUpdateVariable = (formulaId: string, variableId: string, updates: Partial<Variable>) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (!formula) return;

    const updatedVariables = formula.variables.map(variable => 
      variable.id === variableId ? { ...variable, ...updates } : variable
    );

    const updatedFormula = {
      ...formula,
      variables: updatedVariables,
      lastModified: Date.now()
    };

    setFormulas(formulas.map(f => f.id === formulaId ? updatedFormula : f));
  };

  // 创建新模拟配置
  const handleCreateConfig = (formulaId: string) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (!formula) {
      showStatusMessage('找不到选择的公式', 'error');
      return;
    }

    const variableRanges = formula.variables.map(variable => ({
      variableId: variable.id,
      start: variable.defaultValue,
      end: variable.defaultValue,
      step: variable.step || 1
    }));

    const newConfig: SimulationConfig = {
      id: generateId(),
      name: `${formula.name}的模拟`,
      formulaId,
      variableRanges,
      iterations: 100,
      lastModified: Date.now()
    };

    setConfigs([...configs, newConfig]);
    setSelectedConfigId(newConfig.id);
    setActiveTab('simulation');
    showStatusMessage('已创建新模拟配置', 'success');
  };

  // 更新模拟配置
  const handleUpdateConfig = (updatedConfig: Partial<SimulationConfig>) => {
    if (!selectedConfigId) return;

    const updated = configs.map(config => 
      config.id === selectedConfigId 
        ? { ...config, ...updatedConfig, lastModified: Date.now() } 
        : config
    );

    setConfigs(updated);
    showStatusMessage('模拟配置已更新', 'success');
  };

  // 删除模拟配置
  const handleDeleteConfig = (configId: string) => {
    if (window.confirm('确定要删除这个模拟配置吗？')) {
      setConfigs(configs.filter(c => c.id !== configId));
      
      if (selectedConfigId === configId) {
        setSelectedConfigId(null);
      }
      
      showStatusMessage('模拟配置已删除', 'success');
    }
  };

  // 运行模拟
  const handleRunSimulation = (configId: string) => {
    console.log('BalanceSimulatorTool: handleRunSimulation被调用，configId =', configId);
    
    if (!configId) {
      showStatusMessage('请选择一个有效的模拟配置', 'error');
      console.error('BalanceSimulatorTool: 无效的configId');
      return;
    }
    
    // 确保配置存在
    const config = configs.find(c => c.id === configId);
    if (!config) {
      showStatusMessage('找不到指定的模拟配置', 'error');
      console.error('BalanceSimulatorTool: 找不到configId对应的配置:', configId);
      return;
    }
    
    console.log('BalanceSimulatorTool: 找到配置，设置状态');
    
    // 设置选中的配置ID
    setSelectedConfigId(configId);
    
    // 确保切换到模拟面板
    setActiveTab('simulation');
    
    console.log('BalanceSimulatorTool: 状态已设置，activeTab =', 'simulation', 'selectedConfigId =', configId);
  };

  // 保存模拟结果
  const handleSaveResult = (result: SimulationResult) => {
    try {
      console.log('接收到模拟结果，准备保存:', result.id);
      
      // 检查结果数据是否有效
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        showStatusMessage('模拟结果数据无效', 'error');
        console.error('模拟结果数据无效:', result);
        return;
      }
      
      // 保存结果
      setResults(prevResults => [...prevResults, result]);
      
      // 设置选中的结果ID
      setSelectedResultId(result.id);
      
      // 切换到结果查看器
      setActiveTab('results');
      
      showStatusMessage('模拟完成，结果已保存', 'success');
      console.log('模拟结果已保存，切换到结果查看器');
    } catch (error) {
      console.error('保存模拟结果时出错:', error);
      showStatusMessage(`保存结果失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  // 删除模拟结果
  const handleDeleteResult = (resultId: string) => {
    if (window.confirm('确定要删除这个模拟结果吗？')) {
      setResults(results.filter(r => r.id !== resultId));
      
      if (selectedResultId === resultId) {
        setSelectedResultId(null);
      }
      
      showStatusMessage('模拟结果已删除', 'success');
    }
  };

  // 选择模拟结果
  const handleSelectResult = (resultId: string) => {
    console.log('选择模拟结果:', resultId);
    setSelectedResultId(resultId);
    setActiveTab('results');
    showStatusMessage('已加载模拟结果', 'success');
  };

  // 导出数据
  const handleExportData = (type: 'formulas' | 'configs' | 'results') => {
    let data = '';
    let title = '';

    switch (type) {
      case 'formulas':
        data = JSON.stringify(formulas, null, 2);
        title = '导出公式';
        break;
      case 'configs':
        data = JSON.stringify(configs, null, 2);
        title = '导出模拟配置';
        break;
      case 'results':
        data = JSON.stringify(results, null, 2);
        title = '导出模拟结果';
        break;
    }

    setImportExportModal({
      isOpen: true,
      type: 'export',
      dataType: type,
      data
    });
  };

  // 导入数据
  const handleImportData = (type: 'formulas' | 'configs' | 'results') => {
    let title = '';

    switch (type) {
      case 'formulas':
        title = '导入公式';
        break;
      case 'configs':
        title = '导入模拟配置';
        break;
      case 'results':
        title = '导入模拟结果';
        break;
    }

    setImportExportModal({
      isOpen: true,
      type: 'import',
      dataType: type,
      data: ''
    });
  };

  // 确认导入
  const handleConfirmImport = () => {
    if (!importExportModal) return;

    try {
      const data = JSON.parse(importExportModal.data);

      switch (importExportModal.dataType) {
        case 'formulas':
          if (Array.isArray(data)) {
            setFormulas([...formulas, ...data]);
            showStatusMessage('公式导入成功', 'success');
          }
          break;
        case 'configs':
          if (Array.isArray(data)) {
            setConfigs([...configs, ...data]);
            showStatusMessage('模拟配置导入成功', 'success');
          }
          break;
        case 'results':
          if (Array.isArray(data)) {
            setResults([...results, ...data]);
            showStatusMessage('模拟结果导入成功', 'success');
          }
          break;
      }

      setImportExportModal(null);
    } catch (error) {
      showStatusMessage('导入失败，数据格式不正确', 'error');
    }
  };

  // 获取当前选中的公式
  const getSelectedFormula = (): Formula | null => {
    if (!selectedFormulaId) return null;
    return formulas.find(f => f.id === selectedFormulaId) || null;
  };

  // 测试公式
  const handleTestFormula = (formula: Formula) => {
    // 这个函数在FormulaEditor组件内部实现
  };

  return (
    <div className="balance-simulator">
      <div className="balance-simulator-header">
        <div className="balance-simulator-title">数值平衡模块</div>
        
        <div className="balance-simulator-tabs">
          <button 
            className={`balance-tab-button ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            公式编辑器
          </button>
          <button 
            className={`balance-tab-button ${activeTab === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulation')}
          >
            模拟面板
          </button>
          <button 
            className={`balance-tab-button ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            结果查看器
          </button>
        </div>
        
        <div className="balance-simulator-actions">
          {activeTab === 'editor' && (
            <>
              <button 
                className="action-button primary"
                onClick={handleCreateFormula}
              >
                新建公式
              </button>
              <button 
                className="action-button"
                onClick={() => handleExportData('formulas')}
              >
                导出公式
              </button>
              <button 
                className="action-button"
                onClick={() => handleImportData('formulas')}
              >
                导入公式
              </button>
            </>
          )}
          
          {activeTab === 'simulation' && (
            <>
              <button 
                className="action-button"
                onClick={() => handleExportData('configs')}
              >
                导出配置
              </button>
              <button 
                className="action-button"
                onClick={() => handleImportData('configs')}
              >
                导入配置
              </button>
            </>
          )}
          
          {activeTab === 'results' && (
            <>
              <button 
                className="action-button"
                onClick={() => handleExportData('results')}
              >
                导出结果
              </button>
              <button 
                className="action-button"
                onClick={() => handleImportData('results')}
              >
                导入结果
              </button>
            </>
          )}
          <button 
            className="action-button"
            onClick={() => setShowTutorial(!showTutorial)}
          >
            {showTutorial ? '隐藏教程' : '显示教程'}
          </button>
        </div>
      </div>
      
      <div className="balance-simulator-body">
        {showTutorial && (
          <div className="tutorial-panel full-width">
            <div className="tutorial-header">
              <h3>使用教程</h3>
              <button 
                className="tutorial-toggle"
                onClick={() => setShowTutorial(false)}
              >
                隐藏教程 <span>×</span>
              </button>
            </div>
            <div className="tutorial-sections">
              <div className="tutorial-section">
                <div className="tutorial-content">
                  <h4>公式编辑器使用指南</h4>
                  <ol>
                    <li>点击<strong>新建公式</strong>按钮创建一个新的公式</li>
                    <li>输入<strong>公式名称</strong>和<strong>表达式</strong>，例如：<code>damage = attack * (1 - defense/100)</code></li>
                    <li>添加<strong>变量</strong>并设置其默认值、最小值、最大值和步长</li>
                    <li>为每个变量添加<strong>描述</strong>，帮助理解变量的作用</li>
                    <li>使用<strong>测试功能</strong>验证公式是否正确，输入不同的变量值查看结果</li>
                    <li>完成后可以<strong>导出公式</strong>或创建模拟配置进行批量测试</li>
                    <li>您可以创建多个公式，用于模拟游戏中的不同系统</li>
                  </ol>
                  <div className="tutorial-tips">
                    <strong>提示：</strong>公式支持基本数学运算符（+, -, *, /, ^）和函数（sin, cos, tan, max, min, sqrt, log, abs等）。您可以使用复杂的数学表达式来模拟游戏中的各种计算，如伤害公式、经验曲线、资源产出等。变量名称区分大小写，请确保在公式中正确引用。
                  </div>
                </div>
              </div>
              
              <div className="tutorial-section">
                <div className="tutorial-content">
                  <h4>模拟面板使用指南</h4>
                  <ol>
                    <li>选择一个已有的<strong>模拟配置</strong>或为公式创建<strong>新配置</strong></li>
                    <li>设置模拟<strong>名称</strong>和<strong>迭代次数</strong>（迭代次数决定了模拟的精度）</li>
                    <li>为每个变量设置<strong>范围</strong>（起始值、结束值和步长），系统将在这些范围内生成变量组合</li>
                    <li>使用<strong>预览功能</strong>查看可能的变量组合数量和结果分布</li>
                    <li>调整变量范围以获得合理的组合数量，避免过多组合导致性能问题</li>
                    <li>点击<strong>运行模拟</strong>按钮执行完整模拟，系统将计算所有变量组合的结果</li>
                    <li>模拟完成后，结果会自动保存并跳转到结果查看器</li>
                  </ol>
                  <div className="tutorial-tips">
                    <strong>提示：</strong>迭代次数越大，模拟结果越准确，但计算时间也会增加。对于复杂的公式或大范围的变量，建议先使用较小的迭代次数进行测试，然后再增加迭代次数获取更精确的结果。变量步长设置对模拟效率有重要影响，步长过小会生成过多的组合，导致计算缓慢。
                  </div>
                </div>
              </div>
              
              <div className="tutorial-section">
                <div className="tutorial-content">
                  <h4>结果查看器使用指南</h4>
                  <ol>
                    <li>选择一个<strong>模拟结果</strong>查看详细数据分析</li>
                    <li>使用不同的<strong>图表类型</strong>分析数据：
                      <ul>
                        <li><strong>直方图</strong>：显示结果分布，帮助识别常见值和异常值</li>
                        <li><strong>散点图</strong>：显示两个变量之间的关系，帮助发现相关性</li>
                        <li><strong>折线图</strong>：显示变量变化对结果的影响趋势</li>
                      </ul>
                    </li>
                    <li>查看<strong>统计数据</strong>，包括最小值、最大值、平均值、中位数和百分位数</li>
                    <li>使用<strong>过滤器</strong>筛选特定范围的数据，快速找出极端值或特定区间</li>
                    <li>分析不同变量对结果的<strong>敏感度</strong>，找出影响最大的因素</li>
                    <li>可以<strong>导出数据</strong>为CSV格式或<strong>导出图表</strong>为图片，用于报告或进一步分析</li>
                  </ol>
                  <div className="tutorial-tips">
                    <strong>提示：</strong>通过调整过滤器，可以快速找出导致极端值的参数组合。这对于平衡游戏数值非常有用，可以帮助您识别可能导致游戏不平衡的参数设置，并进行相应的调整。使用不同的图表类型可以从不同角度分析数据，获得更全面的理解。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="balance-simulator-content">
          {activeTab === 'editor' && (
            <FormulaEditor
              formula={getSelectedFormula()}
              onUpdateFormula={handleUpdateFormula}
              onAddVariable={handleAddVariable}
              onRemoveVariable={handleRemoveVariable}
              onUpdateVariable={handleUpdateVariable}
              onTestFormula={handleTestFormula}
            />
          )}
          
          {activeTab === 'simulation' && (
            <SimulationPanel
              formulas={formulas}
              configs={configs}
              selectedConfigId={selectedConfigId}
              onCreateConfig={handleCreateConfig}
              onUpdateConfig={handleUpdateConfig}
              onDeleteConfig={handleDeleteConfig}
              onRunSimulation={handleRunSimulation}
              onSaveResult={handleSaveResult}
            />
          )}
          
          {activeTab === 'results' && (
            <ResultsViewer
              formulas={formulas}
              configs={configs}
              results={results}
              selectedResultId={selectedResultId}
              onDeleteResult={handleDeleteResult}
              onSelectResult={handleSelectResult}
            />
          )}
        </div>
      </div>
      
      {statusMessage && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}
      
      {importExportModal && importExportModal.isOpen && (
        <div className="import-export-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                {importExportModal.type === 'export' ? '导出数据' : '导入数据'}
              </div>
              <button 
                className="modal-close"
                onClick={() => setImportExportModal(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {importExportModal.type === 'export' ? (
                <textarea 
                  className="modal-textarea"
                  value={importExportModal.data}
                  readOnly
                />
              ) : (
                <textarea 
                  className="modal-textarea"
                  value={importExportModal.data}
                  onChange={(e) => setImportExportModal({
                    ...importExportModal,
                    data: e.target.value
                  })}
                  placeholder="粘贴JSON数据..."
                />
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-button cancel"
                onClick={() => setImportExportModal(null)}
              >
                取消
              </button>
              
              {importExportModal.type === 'export' ? (
                <button 
                  className="modal-button confirm"
                  onClick={() => {
                    navigator.clipboard.writeText(importExportModal.data);
                    showStatusMessage('已复制到剪贴板', 'success');
                    setImportExportModal(null);
                  }}
                >
                  复制到剪贴板
                </button>
              ) : (
                <button 
                  className="modal-button confirm"
                  onClick={handleConfirmImport}
                >
                  导入
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSimulatorTool;