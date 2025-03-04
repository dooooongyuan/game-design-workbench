import React, { useState, useEffect, useRef } from 'react';
import './ResultsViewer.css';

// 定义接口
interface ResultsViewerProps {
  result: any;
  system: any;
  scenario: any;
  onSelectResult?: (resultId: string) => void;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({ result, system, scenario, onSelectResult }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'actors' | 'transactions' | 'timeline'>('overview');
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [timelinePosition, setTimelinePosition] = useState<number>(0);
  
  const resourceChartRef = useRef<HTMLCanvasElement>(null);
  const actorChartRef = useRef<HTMLCanvasElement>(null);
  const timelineChartRef = useRef<HTMLCanvasElement>(null);
  
  // 初始化选择的资源、主体和交易
  useEffect(() => {
    if (system && system.resources && system.resources.length > 0) {
      setSelectedResourceId(system.resources[0].id);
    }
    
    if (system && system.actors && system.actors.length > 0) {
      setSelectedActorId(system.actors[0].id);
    }
    
    if (system && system.transactions && system.transactions.length > 0) {
      setSelectedTransactionId(system.transactions[0].id);
    }
  }, [system]);
  
  // 渲染资源图表
  useEffect(() => {
    if (activeTab === 'resources' && selectedResourceId && resourceChartRef.current) {
      renderResourceChart();
    }
  }, [activeTab, selectedResourceId, resourceChartRef.current]);
  
  // 渲染主体图表
  useEffect(() => {
    if (activeTab === 'actors' && selectedActorId && actorChartRef.current) {
      renderActorChart();
    }
  }, [activeTab, selectedActorId, actorChartRef.current]);
  
  // 渲染时间线图表
  useEffect(() => {
    if (activeTab === 'timeline' && timelineChartRef.current) {
      renderTimelineChart();
    }
  }, [activeTab, timelineChartRef.current]);
  
  // 渲染资源图表
  const renderResourceChart = () => {
    // 这里应该使用Chart.js或其他图表库来渲染图表
    // 为了简化，这里只是一个占位符
    console.log('渲染资源图表:', selectedResourceId);
  };
  
  // 渲染主体图表
  const renderActorChart = () => {
    // 这里应该使用Chart.js或其他图表库来渲染图表
    // 为了简化，这里只是一个占位符
    console.log('渲染主体图表:', selectedActorId);
  };
  
  // 渲染时间线图表
  const renderTimelineChart = () => {
    // 这里应该使用Chart.js或其他图表库来渲染图表
    // 为了简化，这里只是一个占位符
    console.log('渲染时间线图表');
  };
  
  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // 格式化数字
  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals);
  };
  
  // 获取资源名称
  const getResourceName = (resourceId: string) => {
    const resource = system?.resources?.find((r: any) => r.id === resourceId);
    return resource ? resource.name : resourceId;
  };
  
  // 获取主体名称
  const getActorName = (actorId: string) => {
    const actor = system?.actors?.find((a: any) => a.id === actorId);
    return actor ? actor.name : actorId;
  };
  
  // 获取交易名称
  const getTransactionName = (transactionId: string) => {
    const transaction = system?.transactions?.find((t: any) => t.id === transactionId);
    return transaction ? transaction.name : transactionId;
  };
  
  // 时间线控制
  const handleTimelineControl = (action: 'start' | 'prev' | 'next' | 'end') => {
    if (!result || !result.events || result.events.length === 0) return;
    
    const maxPosition = result.events.length - 1;
    
    switch (action) {
      case 'start':
        setTimelinePosition(0);
        break;
      case 'prev':
        setTimelinePosition(Math.max(0, timelinePosition - 1));
        break;
      case 'next':
        setTimelinePosition(Math.min(maxPosition, timelinePosition + 1));
        break;
      case 'end':
        setTimelinePosition(maxPosition);
        break;
    }
  };
  
  // 获取资源变化趋势
  const getResourceTrend = (resourceId: string) => {
    if (!result || !result.summary || !result.summary.resourceStats || !result.summary.resourceStats[resourceId]) {
      return { trend: 'stable', value: 0 };
    }
    
    const stats = result.summary.resourceStats[resourceId];
    const change = stats.end - stats.start;
    const percentChange = stats.start !== 0 ? (change / stats.start) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (percentChange > 5) trend = 'up';
    else if (percentChange < -5) trend = 'down';
    
    return { trend, value: percentChange };
  };
  
  // 获取趋势图标
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '📊';
    }
  };
  
  // 获取趋势颜色
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '#10b981'; // 绿色
      case 'down': return '#ef4444'; // 红色
      case 'stable': return '#3b82f6'; // 蓝色
    }
  };
  
  return (
    <div className="results-viewer">
      <div className="results-header">
        <h3>模拟结果分析</h3>
        <div className="result-meta">
          <span>模拟时间: {formatDate(result.timestamp)}</span>
          <span>持续时间: {result.duration} 单位</span>
          <span>迭代次数: {result.iterations}</span>
        </div>
      </div>
      
      <div className="results-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          总览
        </button>
        <button 
          className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          资源分析
        </button>
        <button 
          className={`tab-button ${activeTab === 'actors' ? 'active' : ''}`}
          onClick={() => setActiveTab('actors')}
        >
          主体分析
        </button>
        <button 
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          交易分析
        </button>
        <button 
          className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          时间线
        </button>
      </div>
      
      <div className="results-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="summary-cards">
              <div className="summary-card">
                <h4>系统稳定性</h4>
                <div className="summary-value">
                  {result.summary && typeof result.summary.systemStability === 'number' 
                    ? formatNumber(result.summary.systemStability) 
                    : 'N/A'}
                </div>
                <div className="summary-description">
                  <p>稳定性指数越高，表示系统越稳定。</p>
                  <p>基于资源波动性计算。</p>
                </div>
              </div>
              
              <div className="summary-card">
                <h4>通货膨胀率</h4>
                <div className="summary-value">
                  {result.summary && typeof result.summary.inflationRate === 'number' 
                    ? formatNumber(result.summary.inflationRate * 100) + '%' 
                    : 'N/A'}
                </div>
                <div className="summary-description">
                  <p>正值表示通货膨胀，负值表示通货紧缩。</p>
                  <p>基于资源数量变化计算。</p>
                </div>
              </div>
              
              <div className="summary-card">
                <h4>不平等指数</h4>
                <div className="summary-value">
                  {result.summary && typeof result.summary.inequalityIndex === 'number' 
                    ? formatNumber(result.summary.inequalityIndex) 
                    : 'N/A'}
                </div>
                <div className="summary-description">
                  <p>值越高，表示财富分配越不平等。</p>
                  <p>基于基尼系数计算。</p>
                </div>
              </div>
            </div>
            
            {system && system.resources && system.resources.length > 0 && (
              <div className="resource-growth">
                <h4>资源变化趋势</h4>
                <div className="growth-list">
                  {system.resources.map((resource: any) => {
                    const { trend, value } = getResourceTrend(resource.id);
                    return (
                      <div key={resource.id} className="growth-item">
                        <div className="growth-label">{resource.name}</div>
                        <div 
                          className="growth-value" 
                          style={{ color: getTrendColor(trend) }}
                        >
                          {getTrendIcon(trend)} {formatNumber(value)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="events-summary">
              <h4>关键事件</h4>
              {Array.isArray(result.events) && result.events.length > 0 ? (
                <div className="events-list">
                  {result.events.map((event: any, index: number) => (
                    <div key={index} className="event-item">
                      <div className="event-time">时间 {event.time || index}</div>
                      <div className="event-description">{event.description || '未命名事件'}</div>
                      <div className="event-type">{event.type || '未知类型'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">无事件记录</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'resources' && (
          <div className="resources-tab">
            <div className="resource-selector">
              <label>选择资源:</label>
              <select 
                value={selectedResourceId || ''}
                onChange={(e) => setSelectedResourceId(e.target.value)}
              >
                {system?.resources?.map((resource: any) => (
                  <option key={resource.id} value={resource.id}>{resource.name}</option>
                ))}
              </select>
            </div>
            
            {selectedResourceId && (
              <>
                <div className="resource-stats">
                  <div className="stat-item">
                    <div className="stat-label">初始值</div>
                    <div className="stat-value">
                      {result.summary && result.summary.resourceStats && selectedResourceId && 
                       result.summary.resourceStats[selectedResourceId] && 
                       typeof result.summary.resourceStats[selectedResourceId].start === 'number' 
                        ? formatNumber(result.summary.resourceStats[selectedResourceId].start) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">最终值</div>
                    <div className="stat-value">
                      {result.summary && result.summary.resourceStats && selectedResourceId && 
                       result.summary.resourceStats[selectedResourceId] && 
                       typeof result.summary.resourceStats[selectedResourceId].end === 'number' 
                        ? formatNumber(result.summary.resourceStats[selectedResourceId].end) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">最小值</div>
                    <div className="stat-value">
                      {result.summary && result.summary.resourceStats && selectedResourceId && 
                       result.summary.resourceStats[selectedResourceId] && 
                       typeof result.summary.resourceStats[selectedResourceId].min === 'number' 
                        ? formatNumber(result.summary.resourceStats[selectedResourceId].min) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">最大值</div>
                    <div className="stat-value">
                      {result.summary && result.summary.resourceStats && selectedResourceId && 
                       result.summary.resourceStats[selectedResourceId] && 
                       typeof result.summary.resourceStats[selectedResourceId].max === 'number' 
                        ? formatNumber(result.summary.resourceStats[selectedResourceId].max) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">平均值</div>
                    <div className="stat-value">
                      {result.summary && result.summary.resourceStats && selectedResourceId && 
                       result.summary.resourceStats[selectedResourceId] && 
                       typeof result.summary.resourceStats[selectedResourceId].avg === 'number' 
                        ? formatNumber(result.summary.resourceStats[selectedResourceId].avg) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">变化率</div>
                    <div className="stat-value">
                      {result.summary && result.summary.resourceStats && selectedResourceId && 
                       result.summary.resourceStats[selectedResourceId] && 
                       typeof result.summary.resourceStats[selectedResourceId].changeRate === 'number' 
                        ? formatNumber(result.summary.resourceStats[selectedResourceId].changeRate * 100) + '%' 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="chart-container">
                  <h4>{getResourceName(selectedResourceId)} 数量变化</h4>
                  <canvas ref={resourceChartRef}></canvas>
                </div>
              </>
            )}
          </div>
        )}
        
        {activeTab === 'actors' && (
          <div className="actors-tab">
            <div className="actor-selector">
              <label>选择主体:</label>
              <select 
                value={selectedActorId || ''}
                onChange={(e) => setSelectedActorId(e.target.value)}
              >
                {system?.actors?.map((actor: any) => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))}
              </select>
            </div>
            
            {selectedActorId && (
              <>
                <div className="actor-stats">
                  <div className="stat-item">
                    <div className="stat-label">资源总量</div>
                    <div className="stat-value">
                      {result.summary && result.summary.actorStats && selectedActorId && 
                       result.summary.actorStats[selectedActorId] && 
                       typeof result.summary.actorStats[selectedActorId].totalResources === 'number' 
                        ? formatNumber(result.summary.actorStats[selectedActorId].totalResources) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">交易次数</div>
                    <div className="stat-value">
                      {result.summary && result.summary.actorStats && selectedActorId && 
                       result.summary.actorStats[selectedActorId] && 
                       typeof result.summary.actorStats[selectedActorId].transactionCount === 'number' 
                        ? result.summary.actorStats[selectedActorId].transactionCount 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">资源增长率</div>
                    <div className="stat-value">
                      {result.summary && result.summary.actorStats && selectedActorId && 
                       result.summary.actorStats[selectedActorId] && 
                       typeof result.summary.actorStats[selectedActorId].resourceGrowthRate === 'number' 
                        ? formatNumber(result.summary.actorStats[selectedActorId].resourceGrowthRate * 100) + '%' 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">市场份额</div>
                    <div className="stat-value">
                      {result.summary && result.summary.actorStats && selectedActorId && 
                       result.summary.actorStats[selectedActorId] && 
                       typeof result.summary.actorStats[selectedActorId].marketShare === 'number' 
                        ? formatNumber(result.summary.actorStats[selectedActorId].marketShare * 100) + '%' 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="chart-container">
                  <h4>{getActorName(selectedActorId)} 资源变化</h4>
                  <canvas ref={actorChartRef}></canvas>
                </div>
                
                {system?.resources?.length > 0 && (
                  <div className="actor-growth">
                    <h4>{getActorName(selectedActorId)} 资源持有</h4>
                    <div className="actor-list">
                      {system.resources.map((resource: any) => {
                        const actorResource = result.summary?.actorStats?.[selectedActorId]?.resources?.[resource.id];
                        return (
                          <div key={resource.id} className="actor-item">
                            <div className="actor-label">{resource.name}</div>
                            <div className="actor-value">
                              {actorResource ? formatNumber(actorResource.amount) : 'N/A'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'transactions' && (
          <div className="transactions-tab">
            <div className="transaction-selector">
              <label>选择交易类型:</label>
              <select 
                value={selectedTransactionId || ''}
                onChange={(e) => setSelectedTransactionId(e.target.value)}
              >
                {system?.transactions?.map((transaction: any) => (
                  <option key={transaction.id} value={transaction.id}>{transaction.name}</option>
                ))}
              </select>
            </div>
            
            {selectedTransactionId && (
              <>
                <div className="transaction-stats">
                  <div className="stat-item">
                    <div className="stat-label">总交易次数</div>
                    <div className="stat-value">
                      {result.summary && result.summary.transactionStats && selectedTransactionId && 
                       result.summary.transactionStats[selectedTransactionId] && 
                       typeof result.summary.transactionStats[selectedTransactionId].count === 'number' 
                        ? result.summary.transactionStats[selectedTransactionId].count 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">平均交易量</div>
                    <div className="stat-value">
                      {result.summary && result.summary.transactionStats && selectedTransactionId && 
                       result.summary.transactionStats[selectedTransactionId] && 
                       typeof result.summary.transactionStats[selectedTransactionId].avgVolume === 'number' 
                        ? formatNumber(result.summary.transactionStats[selectedTransactionId].avgVolume) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">成功率</div>
                    <div className="stat-value">
                      {result.summary && result.summary.transactionStats && selectedTransactionId && 
                       result.summary.transactionStats[selectedTransactionId] && 
                       typeof result.summary.transactionStats[selectedTransactionId].successRate === 'number' 
                        ? formatNumber(result.summary.transactionStats[selectedTransactionId].successRate * 100) + '%' 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">影响指数</div>
                    <div className="stat-value">
                      {result.summary && result.summary.transactionStats && selectedTransactionId && 
                       result.summary.transactionStats[selectedTransactionId] && 
                       typeof result.summary.transactionStats[selectedTransactionId].impactIndex === 'number' 
                        ? formatNumber(result.summary.transactionStats[selectedTransactionId].impactIndex) 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                
                {system?.resources?.length > 0 && (
                  <div className="transaction-growth">
                    <h4>{getTransactionName(selectedTransactionId)} 资源流动</h4>
                    <div className="transaction-list">
                      {system.resources.map((resource: any) => {
                        const transactionResource = result.summary?.transactionStats?.[selectedTransactionId]?.resources?.[resource.id];
                        return (
                          <div key={resource.id} className="transaction-item">
                            <div className="transaction-label">{resource.name}</div>
                            <div className="transaction-value">
                              {transactionResource ? formatNumber(transactionResource.totalAmount) : 'N/A'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'timeline' && (
          <div className="timeline-tab">
            <div className="timeline-controls">
              <button 
                className="control-button"
                onClick={() => handleTimelineControl('start')}
                disabled={!result.events || result.events.length === 0}
              >
                ⏮️ 开始
              </button>
              <button 
                className="control-button"
                onClick={() => handleTimelineControl('prev')}
                disabled={!result.events || result.events.length === 0 || timelinePosition === 0}
              >
                ⏪ 上一步
              </button>
              <button 
                className="control-button"
                onClick={() => handleTimelineControl('next')}
                disabled={!result.events || result.events.length === 0 || timelinePosition === result.events.length - 1}
              >
                下一步 ⏩
              </button>
              <button 
                className="control-button"
                onClick={() => handleTimelineControl('end')}
                disabled={!result.events || result.events.length === 0 || timelinePosition === result.events.length - 1}
              >
                结束 ⏭️
              </button>
            </div>
            
            <div className="chart-container">
              <h4>时间线视图</h4>
              <canvas ref={timelineChartRef}></canvas>
            </div>
            
            <div className="timeline-events">
              <h4>事件时间线</h4>
              {Array.isArray(result.events) && result.events.length > 0 ? (
                <div className="events-timeline">
                  {result.events.map((event: any, index: number) => (
                    <div 
                      key={index} 
                      className="timeline-event"
                      style={{ opacity: index === timelinePosition ? 1 : 0.6 }}
                    >
                      <div className="event-marker">{index + 1}</div>
                      <div className="event-info">
                        <div className="event-time">时间 {event.time || index}</div>
                        <div className="event-description">{event.description || '未命名事件'}</div>
                        <div className="event-type">{event.type || '未知类型'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">无事件记录</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsViewer; 