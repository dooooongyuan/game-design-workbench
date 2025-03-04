import React, { useState, useEffect } from 'react';
import './SimulationPanel.css';
import { evaluate } from 'mathjs';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

interface SimulationPanelProps {
  formulas: Formula[];
  configs: SimulationConfig[];
  selectedConfigId: string | null;
  onCreateConfig: (formulaId: string) => void;
  onUpdateConfig: (updatedConfig: Partial<SimulationConfig>) => void;
  onDeleteConfig: (configId: string) => void;
  onRunSimulation: (configId: string) => void;
  onSaveResult: (result: SimulationResult) => void;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({
  formulas,
  configs,
  selectedConfigId,
  onCreateConfig,
  onUpdateConfig,
  onDeleteConfig,
  onRunSimulation,
  onSaveResult
}) => {
  const [selectedFormula, setSelectedFormula] = useState<string>('');
  const [currentConfig, setCurrentConfig] = useState<SimulationConfig | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [previewVariable, setPreviewVariable] = useState<string>('');
  const [previewType, setPreviewType] = useState<'line' | 'heatmap'>('line');

  // 当选中的配置ID变化时，更新当前配置
  useEffect(() => {
    console.log('SimulationPanel: useEffect [selectedConfigId, configs] 被触发');
    console.log('SimulationPanel: selectedConfigId =', selectedConfigId);
    
    if (selectedConfigId) {
      const config = configs.find(c => c.id === selectedConfigId);
      console.log('SimulationPanel: 找到配置:', config);
      
      if (config) {
        setCurrentConfig(config);
        setSelectedFormula(config.formulaId);
        console.log('SimulationPanel: 设置currentConfig和selectedFormula');
      } else {
        console.error('SimulationPanel: 找不到ID为', selectedConfigId, '的配置');
        setError(`找不到ID为 ${selectedConfigId} 的配置`);
      }
    } else {
      console.log('SimulationPanel: 清除当前配置');
      setCurrentConfig(null);
    }
  }, [selectedConfigId, configs]);

  // 获取当前公式
  const getCurrentFormula = (): Formula | undefined => {
    console.log('SimulationPanel: getCurrentFormula被调用');
    console.log('SimulationPanel: currentConfig =', currentConfig);
    
    if (!currentConfig) {
      console.log('SimulationPanel: currentConfig为空，返回undefined');
      return undefined;
    }
    
    console.log('SimulationPanel: 查找公式，formulaId =', currentConfig.formulaId);
    const formula = formulas.find(f => f.id === currentConfig.formulaId);
    
    if (!formula) {
      console.error('SimulationPanel: 找不到ID为', currentConfig.formulaId, '的公式');
      setError(`找不到ID为 ${currentConfig.formulaId} 的公式`);
      return undefined;
    }
    
    console.log('SimulationPanel: 找到公式:', formula);
    return formula;
  };

  // 获取变量名称
  const getVariableName = (variableId: string): string => {
    const formula = getCurrentFormula();
    if (formula) {
      const variable = formula.variables.find(v => v.id === variableId);
      return variable ? variable.name : variableId;
    }
    return variableId;
  };

  // 处理配置名称变更
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentConfig) {
      onUpdateConfig({ name: e.target.value });
    }
  };

  // 处理公式选择变更
  const handleFormulaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formulaId = e.target.value;
    setSelectedFormula(formulaId);
    
    if (currentConfig) {
      // 更新当前配置的公式ID
      const formula = formulas.find(f => f.id === formulaId);
      if (formula) {
        // 创建新的变量范围
        const variableRanges = formula.variables.map(variable => ({
          variableId: variable.id,
          start: variable.defaultValue,
          end: variable.defaultValue,
          step: variable.step || 1
        }));
        
        onUpdateConfig({ 
          formulaId, 
          variableRanges 
        });
      }
    }
  };

  // 处理迭代次数变更
  const handleIterationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentConfig) {
      const iterations = parseInt(e.target.value);
      if (!isNaN(iterations) && iterations > 0) {
        onUpdateConfig({ iterations });
      }
    }
  };

  // 处理变量范围变更
  const handleRangeChange = (variableId: string, field: 'start' | 'end' | 'step', value: number) => {
    if (currentConfig) {
      const updatedRanges = currentConfig.variableRanges.map(range => {
        if (range.variableId === variableId) {
          return { ...range, [field]: value };
        }
        return range;
      });
      
      onUpdateConfig({ variableRanges: updatedRanges });
    }
  };

  // 生成预览数据
  const generatePreviewData = () => {
    const formula = getCurrentFormula();
    if (!formula || !currentConfig) return;

    try {
      // 找到要预览的变量范围
      const variableToPreview = currentConfig.variableRanges.find(
        range => range.variableId === previewVariable
      );
      
      if (!variableToPreview) {
        setError('请选择要预览的变量');
        return;
      }

      // 获取变量名称
      const variableName = getVariableName(variableToPreview.variableId);
      
      // 创建数据点
      const dataPoints: number[] = [];
      const labels: string[] = [];
      const baseValues: Record<string, number> = {};
      
      // 设置基础值
      formula.variables.forEach(variable => {
        const range = currentConfig.variableRanges.find(r => r.variableId === variable.id);
        if (range) {
          baseValues[variable.name] = range.start;
        } else {
          baseValues[variable.name] = variable.defaultValue;
        }
      });
      
      // 计算步数
      const steps = Math.floor((variableToPreview.end - variableToPreview.start) / variableToPreview.step) + 1;
      
      // 生成数据点
      for (let i = 0; i < steps; i++) {
        const value = variableToPreview.start + i * variableToPreview.step;
        const inputValues = { ...baseValues, [variableName]: value };
        
        try {
          const result = evaluate(formula.expression, inputValues);
          dataPoints.push(result);
          labels.push(value.toString());
        } catch (err) {
          console.error('计算错误:', err);
        }
      }
      
      // 创建图表数据
      const chartData = {
        labels,
        datasets: [
          {
            label: `${formula.name} (${variableName}变化)`,
            data: dataPoints,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
        ],
      };
      
      setPreviewData(chartData);
      setError(null);
    } catch (err) {
      setError(`预览生成错误: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 运行模拟
  const runSimulation = async () => {
    console.log('SimulationPanel: runSimulation被调用');
    console.log('SimulationPanel: currentConfig =', currentConfig);
    
    setIsRunning(true);
    setProgress(0);
    setError(null);
    
    try {
      const formula = getCurrentFormula();
      console.log('SimulationPanel: formula =', formula);
      
      if (!formula) {
        throw new Error('找不到当前公式，请确保已选择有效的模拟配置');
      }
      
      if (!currentConfig) {
        throw new Error('未选择模拟配置，请先选择或创建一个配置');
      }

      // 检查公式是否有变量
      if (!formula.variables || formula.variables.length === 0) {
        throw new Error('当前公式没有定义变量，无法进行模拟');
      }

      // 检查公式表达式是否有效
      if (!formula.expression || formula.expression.trim() === '') {
        throw new Error('当前公式表达式为空，无法进行模拟');
      }

      console.log('SimulationPanel: 开始运行模拟:', { formula, config: currentConfig });
      
      // 创建变量组合
      const variableCombinations: Array<Record<string, number>> = [];
      
      // 获取变量名称映射
      const variableNameMap: Record<string, string> = {};
      formula.variables.forEach(variable => {
        const range = currentConfig.variableRanges.find(r => r.variableId === variable.id);
        if (range) {
          variableNameMap[range.variableId] = variable.name;
        }
      });
      
      console.log('变量名称映射:', variableNameMap);
      
      if (Object.keys(variableNameMap).length === 0) {
        throw new Error('没有找到有效的变量范围');
      }
      
      // 生成所有变量组合
      const generateCombinations = (
        index: number, 
        current: Record<string, number>
      ) => {
        if (index >= currentConfig.variableRanges.length) {
          variableCombinations.push({ ...current });
          return;
        }
        
        const range = currentConfig.variableRanges[index];
        const variableName = variableNameMap[range.variableId];
        
        if (!variableName) {
          console.error(`找不到变量ID ${range.variableId} 对应的变量名`);
          return;
        }
        
        // 检查范围参数是否有效
        if (isNaN(range.start) || isNaN(range.end) || isNaN(range.step) || range.step <= 0) {
          console.error(`变量 ${variableName} 的范围参数无效:`, range);
          setError(`变量 ${variableName} 的范围参数无效，请检查`);
          return;
        }
        
        // 如果开始和结束值相同，只有一个值
        if (range.start === range.end) {
          current[variableName] = range.start;
          generateCombinations(index + 1, current);
        } else {
          // 否则生成范围内的所有值
          const steps = Math.floor((range.end - range.start) / range.step) + 1;
          
          // 检查步数是否合理
          if (steps <= 0 || steps > 1000) {
            console.error(`变量 ${variableName} 的步数不合理: ${steps}`);
            setError(`变量 ${variableName} 的步数不合理，请调整范围或步长`);
            return;
          }
          
          for (let i = 0; i < steps; i++) {
            const value = range.start + i * range.step;
            current[variableName] = value;
            generateCombinations(index + 1, { ...current });
          }
        }
      };
      
      generateCombinations(0, {});
      
      console.log(`生成了 ${variableCombinations.length} 个变量组合`);
      
      if (variableCombinations.length === 0) {
        throw new Error('没有生成有效的变量组合');
      }
      
      // 如果组合太多，随机选择一部分
      let selectedCombinations = variableCombinations;
      if (variableCombinations.length > currentConfig.iterations) {
        selectedCombinations = [];
        const indices = new Set<number>();
        while (indices.size < currentConfig.iterations) {
          const index = Math.floor(Math.random() * variableCombinations.length);
          if (!indices.has(index)) {
            indices.add(index);
            selectedCombinations.push(variableCombinations[index]);
          }
        }
      }
      
      console.log(`选择了 ${selectedCombinations.length} 个组合进行计算`);
      
      // 计算结果
      const results: Array<{
        inputs: Record<string, number>;
        output: number;
      }> = [];
      
      // 分批处理以避免UI阻塞
      const batchSize = 100;
      const batches = Math.ceil(selectedCombinations.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, selectedCombinations.length);
        const batch = selectedCombinations.slice(start, end);
        
        console.log(`处理批次 ${i+1}/${batches}, 从 ${start} 到 ${end}`);
        
        // 处理批次
        const batchResults = batch.map(inputs => {
          try {
            console.log('计算公式:', formula.expression, '输入:', inputs);
            const output = evaluate(formula.expression, inputs);
            console.log('计算结果:', output);
            
            // 检查结果是否有效
            if (output === undefined || output === null || isNaN(output)) {
              console.error('计算结果无效:', output);
              return { inputs, output: NaN };
            }
            
            return { inputs, output };
          } catch (err) {
            console.error('计算错误:', err, '输入:', inputs);
            return { inputs, output: NaN };
          }
        });
        
        results.push(...batchResults);
        
        // 更新进度
        setProgress(Math.floor((end / selectedCombinations.length) * 100));
        
        // 让UI有机会更新
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // 创建模拟结果
      const simulationResult: SimulationResult = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        configId: currentConfig.id,
        timestamp: Date.now(),
        data: results.filter(r => !isNaN(r.output)) // 过滤掉无效结果
      };
      
      console.log(`模拟完成，生成了 ${results.length} 个结果数据点，有效数据点: ${simulationResult.data.length}`);
      
      // 检查是否有有效结果
      if (simulationResult.data.length === 0) {
        throw new Error('模拟未产生任何有效结果，请检查公式和变量范围');
      }
      
      // 保存结果前记录日志
      console.log('准备保存结果，调用onSaveResult前:', {
        resultId: simulationResult.id,
        configId: simulationResult.configId,
        dataLength: simulationResult.data.length
      });
      
      // 保存结果
      onSaveResult(simulationResult);
      console.log('结果已保存，ID:', simulationResult.id);
    } catch (err) {
      console.error('模拟过程中出错:', err);
      setError(`模拟错误: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  // 创建新配置
  const handleCreateConfig = () => {
    if (selectedFormula) {
      onCreateConfig(selectedFormula);
    } else {
      setError('请先选择一个公式');
    }
  };

  if (!formulas.length) {
    return (
      <div className="simulation-panel-empty">
        <p>请先创建公式才能进行模拟</p>
      </div>
    );
  }

  return (
    <div className="simulation-panel">
      <div className="simulation-header">
        <div className="config-selector">
          <select 
            value={selectedConfigId || ''} 
            onChange={(e) => {
              console.log('SimulationPanel: 配置选择器onChange被触发，value =', e.target.value);
              
              if (e.target.value) {
                const config = configs.find(c => c.id === e.target.value);
                console.log('SimulationPanel: 找到配置:', config);
                
                // 先设置本地状态
                setCurrentConfig(config || null);
                
                // 如果找到了配置，设置公式ID
                if (config) {
                  setSelectedFormula(config.formulaId);
                  console.log('SimulationPanel: 设置selectedFormula =', config.formulaId);
                }
                
                // 然后通知父组件
                console.log('SimulationPanel: 调用onRunSimulation');
                onRunSimulation(e.target.value);
              } else {
                console.log('SimulationPanel: 清除当前配置');
                setCurrentConfig(null);
                setSelectedFormula('');
              }
            }}
            disabled={isRunning}
          >
            <option value="">选择模拟配置</option>
            {configs.map(config => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
          
          {!currentConfig && (
            <>
              <select
                value={selectedFormula}
                onChange={(e) => setSelectedFormula(e.target.value)}
                disabled={isRunning}
                style={{ marginLeft: '10px' }}
              >
                <option value="">选择公式</option>
                {formulas.map(formula => (
                  <option key={formula.id} value={formula.id}>
                    {formula.name}
                  </option>
                ))}
              </select>
            </>
          )}
          
          <button 
            className="btn-create" 
            onClick={handleCreateConfig}
            disabled={isRunning || (!currentConfig && !selectedFormula)}
          >
            创建新配置
          </button>
        </div>
      </div>

      {currentConfig ? (
        <div className="simulation-body">
          <div className="config-details">
            <div className="form-group">
              <label>配置名称</label>
              <input
                type="text"
                value={currentConfig.name}
                onChange={handleNameChange}
                disabled={isRunning}
              />
            </div>

            <div className="form-group">
              <label>公式</label>
              <select 
                value={currentConfig.formulaId} 
                onChange={handleFormulaChange}
                disabled={isRunning}
              >
                {formulas.map(formula => (
                  <option key={formula.id} value={formula.id}>
                    {formula.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>迭代次数</label>
              <input
                type="number"
                value={currentConfig.iterations}
                onChange={handleIterationsChange}
                min="1"
                max="10000"
                disabled={isRunning}
              />
              <div className="input-hint">
                较大的迭代次数可能会导致性能问题
              </div>
            </div>
          </div>

          <div className="variable-ranges">
            <h3>变量范围</h3>
            {currentConfig.variableRanges.map(range => {
              const variableName = getVariableName(range.variableId);
              return (
                <div key={range.variableId} className="range-item">
                  <div className="range-header">
                    <span className="variable-name">{variableName}</span>
                  </div>
                  <div className="range-inputs">
                    <div className="form-group">
                      <label>开始值</label>
                      <input
                        type="number"
                        value={range.start}
                        onChange={(e) => handleRangeChange(
                          range.variableId, 
                          'start', 
                          parseFloat(e.target.value)
                        )}
                        disabled={isRunning}
                      />
                    </div>
                    <div className="form-group">
                      <label>结束值</label>
                      <input
                        type="number"
                        value={range.end}
                        onChange={(e) => handleRangeChange(
                          range.variableId, 
                          'end', 
                          parseFloat(e.target.value)
                        )}
                        disabled={isRunning}
                      />
                    </div>
                    <div className="form-group">
                      <label>步长</label>
                      <input
                        type="number"
                        value={range.step}
                        onChange={(e) => handleRangeChange(
                          range.variableId, 
                          'step', 
                          parseFloat(e.target.value)
                        )}
                        min="0.01"
                        step="0.01"
                        disabled={isRunning}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="preview-section">
            <h3>预览</h3>
            <div className="preview-controls">
              <div className="form-group">
                <label>预览变量</label>
                <select
                  value={previewVariable}
                  onChange={(e) => setPreviewVariable(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="">选择变量</option>
                  {currentConfig.variableRanges.map(range => (
                    <option key={range.variableId} value={range.variableId}>
                      {getVariableName(range.variableId)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>图表类型</label>
                <select
                  value={previewType}
                  onChange={(e) => setPreviewType(e.target.value as 'line' | 'heatmap')}
                  disabled={isRunning}
                >
                  <option value="line">折线图</option>
                  <option value="heatmap">热力图</option>
                </select>
              </div>
              <button
                className="btn-preview"
                onClick={generatePreviewData}
                disabled={isRunning || !previewVariable}
              >
                生成预览
              </button>
            </div>

            {previewData && (
              <div className="preview-chart">
                <Line data={previewData} />
              </div>
            )}
          </div>

          <div className="simulation-actions">
            <button
              className="btn-run"
              onClick={runSimulation}
              disabled={isRunning}
            >
              {isRunning ? '模拟中...' : '运行模拟'}
            </button>
            <button
              className="btn-delete"
              onClick={() => onDeleteConfig(currentConfig.id)}
              disabled={isRunning}
            >
              删除配置
            </button>
          </div>

          {isRunning && (
            <div className="simulation-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">{progress}%</div>
            </div>
          )}

          {error && (
            <div className="simulation-error">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="no-config-selected">
          <p>请选择或创建一个模拟配置</p>
        </div>
      )}
    </div>
  );
};

export default SimulationPanel; 