import React, { useState, useEffect } from 'react';
import './ResultsViewer.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
} from 'chart.js';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { saveAs } from 'file-saver';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
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

// 定义统计数据类型
interface StatisticsData {
  min: number;
  max: number;
  average: number;
  median: number;
  standardDeviation: number;
  percentiles: {
    p10: number;
    p25: number;
    p75: number;
    p90: number;
  };
}

interface ResultsViewerProps {
  formulas: Formula[];
  configs: SimulationConfig[];
  results: SimulationResult[];
  selectedResultId: string | null;
  onDeleteResult: (resultId: string) => void;
  onSelectResult?: (resultId: string) => void;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({
  formulas,
  configs,
  results,
  selectedResultId,
  onDeleteResult,
  onSelectResult
}) => {
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [currentConfig, setCurrentConfig] = useState<SimulationConfig | null>(null);
  const [currentFormula, setCurrentFormula] = useState<Formula | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [chartType, setChartType] = useState<'histogram' | 'scatter' | 'line'>('histogram');
  const [xAxisVariable, setXAxisVariable] = useState<string>('');
  const [yAxisVariable, setYAxisVariable] = useState<string>('output');
  const [chartData, setChartData] = useState<any>(null);
  const [dataView, setDataView] = useState<'chart' | 'table' | 'statistics'>('chart');
  const [filteredData, setFilteredData] = useState<Array<{
    inputs: Record<string, number>;
    output: number;
  }>>([]);
  const [filters, setFilters] = useState<Record<string, [number, number]>>({});

  // 当选中的结果ID变化时，更新当前结果
  useEffect(() => {
    if (selectedResultId) {
      const result = results.find(r => r.id === selectedResultId);
      if (result) {
        setCurrentResult(result);
        
        // 查找对应的配置
        const config = configs.find(c => c.id === result.configId);
        if (config) {
          setCurrentConfig(config);
          
          // 查找对应的公式
          const formula = formulas.find(f => f.id === config.formulaId);
          if (formula) {
            setCurrentFormula(formula);
            
            // 重置过滤器
            const initialFilters: Record<string, [number, number]> = {};
            formula.variables.forEach(variable => {
              const values = result.data.map(d => d.inputs[variable.name]);
              const min = Math.min(...values);
              const max = Math.max(...values);
              initialFilters[variable.name] = [min, max];
            });
            setFilters(initialFilters);
            
            // 设置默认X轴变量
            if (formula.variables.length > 0) {
              setXAxisVariable(formula.variables[0].name);
            }
          }
        }
        
        // 应用过滤器
        applyFilters(result.data, {});
      }
    } else {
      setCurrentResult(null);
      setCurrentConfig(null);
      setCurrentFormula(null);
      setStatistics(null);
      setChartData(null);
      setFilteredData([]);
    }
  }, [selectedResultId, results, configs, formulas]);

  // 当过滤器或当前结果变化时，应用过滤器
  useEffect(() => {
    if (currentResult) {
      applyFilters(currentResult.data, filters);
    }
  }, [filters, currentResult]);

  // 当过滤后的数据、图表类型或轴变量变化时，更新图表
  useEffect(() => {
    console.log(`useEffect [filteredData, chartType, xAxisVariable, yAxisVariable] 被触发，filteredData.length=${filteredData.length}`);
    
    if (filteredData.length > 0 && currentFormula) {
      console.log('有数据和公式，更新图表和统计信息');
      updateChart();
      calculateStatistics();
    } else {
      console.log('没有数据或公式，清除图表和统计信息');
      setChartData(null);
      setStatistics(null);
    }
  }, [filteredData, chartType, xAxisVariable, yAxisVariable, currentFormula]);

  // 应用过滤器
  const applyFilters = (data: Array<{
    inputs: Record<string, number>;
    output: number;
  }>, currentFilters: Record<string, [number, number]>) => {
    console.log(`applyFilters: 开始应用过滤器，数据点数量=${data.length}，过滤器数量=${Object.keys(currentFilters).length}`);
    
    // 如果没有过滤器，直接使用所有数据
    if (Object.keys(currentFilters).length === 0) {
      console.log('applyFilters: 没有过滤器，使用所有数据');
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter(item => {
      for (const [variable, [min, max]] of Object.entries(currentFilters)) {
        // 检查输入变量是否存在
        if (item.inputs[variable] === undefined) {
          console.warn(`applyFilters: 数据点缺少变量 ${variable}`);
          return false;
        }
        
        // 检查值是否在范围内
        if (item.inputs[variable] < min || item.inputs[variable] > max) {
          return false;
        }
      }
      return true;
    });
    
    console.log(`applyFilters: 过滤后的数据点数量=${filtered.length}`);
    setFilteredData(filtered);
  };

  // 更新过滤器
  const updateFilter = (variable: string, range: [number, number]) => {
    console.log(`updateFilter: 更新变量 ${variable} 的过滤范围为 [${range[0]}, ${range[1]}]`);
    
    // 确保范围值是有效的数字
    if (isNaN(range[0]) || isNaN(range[1])) {
      console.error(`updateFilter: 范围值无效 - [${range[0]}, ${range[1]}]`);
      return;
    }
    
    // 确保最小值不大于最大值
    const validRange: [number, number] = [
      Math.min(range[0], range[1]),
      Math.max(range[0], range[1])
    ];
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [variable]: validRange
      };
      console.log('updateFilter: 新的过滤器状态', newFilters);
      return newFilters;
    });
  };

  // 计算统计数据
  const calculateStatistics = () => {
    if (filteredData.length === 0) {
      console.log('calculateStatistics: 没有数据可以计算统计信息');
      setStatistics(null);
      return;
    }
    
    console.log(`calculateStatistics: 开始计算统计信息，数据点数量=${filteredData.length}`);
    
    // 获取输出值
    const outputs = filteredData.map(d => d.output);
    
    // 排序输出值
    const sortedOutputs = [...outputs].sort((a, b) => a - b);
    
    // 计算基本统计量
    const min = sortedOutputs[0];
    const max = sortedOutputs[sortedOutputs.length - 1];
    const sum = sortedOutputs.reduce((acc, val) => acc + val, 0);
    const average = sum / sortedOutputs.length;
    
    // 计算中位数
    const median = calculatePercentile(sortedOutputs, 0.5);
    
    // 计算标准差
    const squaredDiffs = sortedOutputs.map(val => Math.pow(val - average, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / sortedOutputs.length;
    const standardDeviation = Math.sqrt(variance);
    
    // 计算百分位数
    const p10 = calculatePercentile(sortedOutputs, 0.1);
    const p25 = calculatePercentile(sortedOutputs, 0.25);
    const p75 = calculatePercentile(sortedOutputs, 0.75);
    const p90 = calculatePercentile(sortedOutputs, 0.9);
    
    setStatistics({
      min,
      max,
      average,
      median,
      standardDeviation,
      percentiles: {
        p10,
        p25,
        p75,
        p90
      }
    });
    
    console.log('calculateStatistics: 统计信息计算完成');
  };

  // 计算百分位数
  const calculatePercentile = (sortedData: number[], percentile: number) => {
    if (sortedData.length === 0) return 0;
    
    const index = Math.ceil(sortedData.length * percentile) - 1;
    return sortedData[Math.max(0, Math.min(sortedData.length - 1, index))];
  };

  // 更新图表
  const updateChart = () => {
    if (!currentFormula) {
      console.log('updateChart: 当前公式为空，无法更新图表');
      return;
    }
    
    if (filteredData.length === 0) {
      console.log('updateChart: 过滤后的数据为空，无法更新图表');
      setChartData(null);
      return;
    }
    
    console.log(`updateChart: 开始更新图表，类型=${chartType}，数据点数量=${filteredData.length}`);
    
    switch (chartType) {
      case 'histogram':
        createHistogram();
        break;
      case 'scatter':
        createScatterPlot();
        break;
      case 'line':
        createLinePlot();
        break;
    }
  };

  // 创建直方图
  const createHistogram = () => {
    const outputs = filteredData.map(d => d.output);
    
    // 如果没有数据，不创建图表
    if (outputs.length === 0) {
      console.error('没有有效的输出数据来创建直方图');
      setChartData(null);
      return;
    }
    
    // 计算直方图的区间
    const min = Math.min(...outputs);
    const max = Math.max(...outputs);
    
    // 处理所有值相等的情况
    if (min === max) {
      console.log('所有输出值都相等，创建单一区间直方图');
      // 创建单一区间的直方图
      const data = {
        labels: [`${min.toFixed(2)}`],
        datasets: [
          {
            label: '结果分布',
            data: [outputs.length],
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1
          }
        ]
      };
      
      setChartData(data);
      return;
    }
    
    const binCount = 10;
    const binWidth = (max - min) / binCount;
    
    // 创建区间
    const bins = Array.from({ length: binCount }, (_, i) => ({
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth,
      count: 0
    }));
    
    // 统计每个区间的数量
    outputs.forEach(value => {
      const binIndex = Math.min(binCount - 1, Math.floor((value - min) / binWidth));
      bins[binIndex].count++;
    });
    
    // 创建图表数据
    const data = {
      labels: bins.map(bin => `${bin.start.toFixed(2)} - ${bin.end.toFixed(2)}`),
      datasets: [
        {
          label: '结果分布',
          data: bins.map(bin => bin.count),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1
        }
      ]
    };
    
    setChartData(data);
  };

  // 创建散点图
  const createScatterPlot = () => {
    if (!currentFormula || filteredData.length === 0) {
      console.error('没有有效的数据来创建散点图');
      setChartData(null);
      return;
    }
    
    // 获取X轴和Y轴的数据
    const xData = xAxisVariable === 'output' 
      ? filteredData.map(d => d.output)
      : filteredData.map(d => d.inputs[xAxisVariable]);
    
    const yData = yAxisVariable === 'output'
      ? filteredData.map(d => d.output)
      : filteredData.map(d => d.inputs[yAxisVariable]);
    
    // 创建图表数据
    const data = {
      labels: Array(filteredData.length).fill(''),
      datasets: [
        {
          label: `${xAxisVariable} vs ${yAxisVariable}`,
          data: filteredData.map((_, i) => ({ x: xData[i], y: yData[i] })),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
    
    setChartData(data);
  };

  // 创建折线图
  const createLinePlot = () => {
    if (!currentFormula || filteredData.length === 0) {
      console.error('没有有效的数据来创建折线图');
      setChartData(null);
      return;
    }
    
    // 获取X轴数据
    const xData = xAxisVariable === 'output'
      ? filteredData.map(d => d.output)
      : filteredData.map(d => d.inputs[xAxisVariable]);
    
    // 按X轴数据排序
    const sortedIndices = Array.from({ length: filteredData.length }, (_, i) => i)
      .sort((a, b) => xData[a] - xData[b]);
    
    const sortedXData = sortedIndices.map(i => xData[i]);
    
    // 获取Y轴数据
    const yData = yAxisVariable === 'output'
      ? filteredData.map(d => d.output)
      : filteredData.map(d => d.inputs[yAxisVariable]);
    
    const sortedYData = sortedIndices.map(i => yData[i]);
    
    // 创建图表数据
    const data = {
      labels: sortedXData.map(x => x.toFixed(2)),
      datasets: [
        {
          label: `${yAxisVariable} vs ${xAxisVariable}`,
          data: sortedYData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
      ],
    };
    
    setChartData(data);
  };

  // 导出数据为CSV
  const exportToCsv = () => {
    if (!filteredData.length || !currentFormula) return;
    
    // 创建CSV头
    const headers = [
      ...currentFormula.variables.map(v => v.name),
      'output'
    ];
    
    // 创建CSV行
    const rows = filteredData.map(d => [
      ...currentFormula.variables.map(v => d.inputs[v.name]),
      d.output
    ]);
    
    // 合并成CSV文本
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // 创建Blob并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `simulation_result_${currentResult?.id}.csv`);
  };

  // 导出图表为图片
  const exportChart = () => {
    if (!chartData) return;
    
    const canvas = document.querySelector('.chart-container canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.toBlob(blob => {
        if (blob) {
          saveAs(blob, `chart_${currentResult?.id}.png`);
        }
      });
    }
  };

  if (!results.length) {
    return (
      <div className="results-viewer-empty">
        <p>还没有模拟结果</p>
      </div>
    );
  }

  return (
    <div className="results-viewer">
      <div className="results-header">
        <div className="result-selector">
          <select 
            value={selectedResultId || ''} 
            onChange={(e) => {
              if (onSelectResult) {
                onSelectResult(e.target.value);
              } else {
                console.warn('ResultsViewer: onSelectResult属性未提供，使用onDeleteResult作为后备');
                onDeleteResult(e.target.value);
              }
            }}
          >
            <option value="">选择模拟结果</option>
            {results.map(result => {
              const config = configs.find(c => c.id === result.configId);
              const formula = config ? formulas.find(f => f.id === config.formulaId) : null;
              const timestamp = new Date(result.timestamp).toLocaleString();
              
              return (
                <option key={result.id} value={result.id}>
                  {formula?.name || '未知公式'} - {config?.name || '未知配置'} ({timestamp})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {currentResult && currentConfig && currentFormula ? (
        <div className="results-body">
          <div className="results-info">
            <div className="info-item">
              <span className="info-label">公式:</span>
              <span className="info-value">{currentFormula.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">配置:</span>
              <span className="info-value">{currentConfig.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">时间:</span>
              <span className="info-value">
                {new Date(currentResult.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">数据点:</span>
              <span className="info-value">{currentResult.data.length}</span>
            </div>
            <div className="info-item">
              <span className="info-label">过滤后:</span>
              <span className="info-value">{filteredData.length}</span>
            </div>
          </div>

          <div className="view-tabs">
            <button 
              className={`tab-button ${dataView === 'chart' ? 'active' : ''}`}
              onClick={() => setDataView('chart')}
            >
              图表
            </button>
            <button 
              className={`tab-button ${dataView === 'statistics' ? 'active' : ''}`}
              onClick={() => setDataView('statistics')}
            >
              统计
            </button>
            <button 
              className={`tab-button ${dataView === 'table' ? 'active' : ''}`}
              onClick={() => setDataView('table')}
            >
              数据表
            </button>
          </div>

          {dataView === 'chart' && (
            <div className="chart-view">
              <div className="chart-controls">
                <div className="form-group">
                  <label>图表类型</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as any)}
                  >
                    <option value="histogram">直方图</option>
                    <option value="scatter">散点图</option>
                    <option value="line">折线图</option>
                  </select>
                </div>

                {(chartType === 'scatter' || chartType === 'line') && (
                  <>
                    <div className="form-group">
                      <label>X轴变量</label>
                      <select
                        value={xAxisVariable}
                        onChange={(e) => setXAxisVariable(e.target.value)}
                      >
                        {currentFormula.variables.map(variable => (
                          <option key={variable.id} value={variable.name}>
                            {variable.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Y轴变量</label>
                      <select
                        value={yAxisVariable}
                        onChange={(e) => setYAxisVariable(e.target.value)}
                      >
                        <option value="output">输出值</option>
                        {currentFormula.variables.map(variable => (
                          <option key={variable.id} value={variable.name}>
                            {variable.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="chart-actions">
                  <button className="btn-export" onClick={exportChart}>
                    导出图表
                  </button>
                </div>
              </div>

              <div className="chart-container">
                {chartData && (
                  <>
                    {chartType === 'histogram' && <Bar data={chartData} />}
                    {chartType === 'scatter' && <Scatter data={chartData} />}
                    {chartType === 'line' && <Line data={chartData} />}
                  </>
                )}
              </div>
            </div>
          )}

          {dataView === 'statistics' && statistics && (
            <div className="statistics-view">
              <div className="statistics-card">
                <h3>基本统计</h3>
                <div className="stat-item">
                  <span className="stat-label">最小值:</span>
                  <span className="stat-value">{statistics.min.toFixed(4)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">最大值:</span>
                  <span className="stat-value">{statistics.max.toFixed(4)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">平均值:</span>
                  <span className="stat-value">{statistics.average.toFixed(4)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">中位数:</span>
                  <span className="stat-value">{statistics.median.toFixed(4)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">标准差:</span>
                  <span className="stat-value">{statistics.standardDeviation.toFixed(4)}</span>
                </div>
              </div>

              <div className="statistics-card">
                <h3>百分位数</h3>
                <div className="stat-item">
                  <span className="stat-label">10%:</span>
                  <span className="stat-value">{statistics.percentiles.p10.toFixed(4)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">25%:</span>
                  <span className="stat-value">{statistics.percentiles.p25.toFixed(4)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">75%:</span>
                  <span className="stat-value">{statistics.percentiles.p75.toFixed(4)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">90%:</span>
                  <span className="stat-value">{statistics.percentiles.p90.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}

          {dataView === 'table' && (
            <div className="table-view">
              <div className="table-actions">
                <button className="btn-export" onClick={exportToCsv}>
                  导出CSV
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {currentFormula.variables.map(variable => (
                        <th key={variable.id}>{variable.name}</th>
                      ))}
                      <th>输出值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 100).map((item, index) => (
                      <tr key={index}>
                        {currentFormula.variables.map(variable => (
                          <td key={variable.id}>{item.inputs[variable.name]}</td>
                        ))}
                        <td>{item.output}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length > 100 && (
                  <div className="table-note">
                    显示前100条记录，共{filteredData.length}条
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="filters-section">
            <h3>数据过滤器</h3>
            <div className="filters-list">
              {currentFormula.variables.map(variable => {
                const filter = filters[variable.name] || [0, 0];
                const allValues = currentResult.data.map(d => d.inputs[variable.name]);
                const min = Math.min(...allValues);
                const max = Math.max(...allValues);
                
                return (
                  <div key={variable.id} className="filter-item">
                    <div className="filter-header">
                      <span className="filter-name">{variable.name}</span>
                      <span className="filter-range">
                        {filter[0].toFixed(2)} - {filter[1].toFixed(2)}
                      </span>
                    </div>
                    <div className="filter-slider">
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={(max - min) / 100}
                        value={filter[0]}
                        onChange={(e) => {
                          console.log(`滑块1变化: ${e.target.value}`);
                          updateFilter(
                            variable.name, 
                            [parseFloat(e.target.value), filter[1]]
                          );
                        }}
                      />
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={(max - min) / 100}
                        value={filter[1]}
                        onChange={(e) => {
                          console.log(`滑块2变化: ${e.target.value}`);
                          updateFilter(
                            variable.name, 
                            [filter[0], parseFloat(e.target.value)]
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="results-actions">
            <button
              className="btn-delete"
              onClick={() => onDeleteResult(currentResult.id)}
            >
              删除结果
            </button>
          </div>
        </div>
      ) : (
        <div className="no-result-selected">
          <p>请选择一个模拟结果</p>
        </div>
      )}
    </div>
  );
};

export default ResultsViewer; 