import React, { useState } from 'react';
import './ScenarioEditor.css';

// 定义接口
interface ScenarioEvent {
  id: string;
  description: string;
  triggerTime: number;
  type: 'resource_shock' | 'actor_behavior_change' | 'transaction_change';
  data: any;
}

interface SimulationScenario {
  id: string;
  name: string;
  economySystemId: string;
  duration: number;
  events: ScenarioEvent[];
  description: string;
}

interface EconomySystem {
  id: string;
  name: string;
  resources: any[];
  actors: any[];
  transactions: any[];
}

// 模拟场景编辑器组件
const ScenarioEditor: React.FC<{
  scenario: SimulationScenario;
  system: EconomySystem;
  onUpdateScenario: (updates: Partial<SimulationScenario>) => void;
}> = ({ scenario, system, onUpdateScenario }) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'events'>('basic');
  
  // 基本信息编辑
  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'duration') {
      onUpdateScenario({ [name]: Number(value) } as any);
    } else {
      onUpdateScenario({ [name]: value } as any);
    }
  };
  
  // 添加新事件
  const handleAddEvent = () => {
    const newEvent: ScenarioEvent = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      triggerTime: Math.floor(scenario.duration / 2), // 默认在中间时间点
      type: 'resource_shock',
      data: {},
      description: '新经济冲击事件'
    };
    
    onUpdateScenario({
      events: [...scenario.events, newEvent]
    });
  };
  
  // 更新事件
  const handleUpdateEvent = (eventId: string, updates: Partial<ScenarioEvent>) => {
    const updatedEvents = scenario.events.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    );
    
    onUpdateScenario({ events: updatedEvents });
  };
  
  // 删除事件
  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('确定要删除这个事件吗？')) {
      onUpdateScenario({
        events: scenario.events.filter(e => e.id !== eventId)
      });
    }
  };
  
  // 获取事件类型的中文名称
  const getEventTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'resource_shock': '资源冲击',
      'actor_behavior_change': '主体行为变化',
      'transaction_change': '交易规则变化'
    };
    
    return typeMap[type] || type;
  };
  
  // 渲染事件数据编辑器
  const renderEventDataEditor = (event: ScenarioEvent) => {
    switch (event.type) {
      case 'resource_shock':
        return (
          <div className="event-data-editor">
            <div className="form-group">
              <label>影响资源</label>
              <select 
                value={event.data.resourceId || ''}
                onChange={(e) => {
                  const updatedData = { ...event.data, resourceId: e.target.value };
                  handleUpdateEvent(event.id, { data: updatedData });
                }}
              >
                <option value="">选择资源</option>
                {system.resources.map((resource: any) => (
                  <option key={resource.id} value={resource.id}>{resource.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>变化百分比</label>
              <input 
                type="number" 
                value={event.data.changePercent || 0}
                onChange={(e) => {
                  const updatedData = { ...event.data, changePercent: Number(e.target.value) };
                  handleUpdateEvent(event.id, { data: updatedData });
                }}
                min="-100"
                max="1000"
                step="5"
              />
              <span className="input-hint">正值表示增加，负值表示减少</span>
            </div>
          </div>
        );
        
      case 'actor_behavior_change':
        return (
          <div className="event-data-editor">
            <div className="form-group">
              <label>影响主体</label>
              <select 
                value={event.data.actorId || ''}
                onChange={(e) => {
                  const updatedData = { ...event.data, actorId: e.target.value };
                  handleUpdateEvent(event.id, { data: updatedData });
                }}
              >
                <option value="">选择主体</option>
                {system.actors.map((actor: any) => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>行为变化类型</label>
              <select 
                value={event.data.behaviorType || 'tradingStrategy'}
                onChange={(e) => {
                  const updatedData = { ...event.data, behaviorType: e.target.value };
                  handleUpdateEvent(event.id, { data: updatedData });
                }}
              >
                <option value="tradingStrategy">交易策略</option>
                <option value="consumptionRate">消费率</option>
                <option value="productionRate">生产率</option>
              </select>
            </div>
            
            {event.data.behaviorType === 'tradingStrategy' && (
              <div className="form-group">
                <label>新交易策略</label>
                <select 
                  value={event.data.newValue || 'balanced'}
                  onChange={(e) => {
                    const updatedData = { ...event.data, newValue: e.target.value };
                    handleUpdateEvent(event.id, { data: updatedData });
                  }}
                >
                  <option value="aggressive">激进</option>
                  <option value="balanced">平衡</option>
                  <option value="conservative">保守</option>
                </select>
              </div>
            )}
            
            {(event.data.behaviorType === 'consumptionRate' || event.data.behaviorType === 'productionRate') && (
              <div className="form-group">
                <label>变化百分比</label>
                <input 
                  type="number" 
                  value={event.data.changePercent || 0}
                  onChange={(e) => {
                    const updatedData = { ...event.data, changePercent: Number(e.target.value) };
                    handleUpdateEvent(event.id, { data: updatedData });
                  }}
                  min="-100"
                  max="1000"
                  step="5"
                />
                <span className="input-hint">正值表示增加，负值表示减少</span>
              </div>
            )}
          </div>
        );
        
      case 'transaction_change':
        return (
          <div className="event-data-editor">
            <div className="form-group">
              <label>影响交易</label>
              <select 
                value={event.data.transactionId || ''}
                onChange={(e) => {
                  const updatedData = { ...event.data, transactionId: e.target.value };
                  handleUpdateEvent(event.id, { data: updatedData });
                }}
              >
                <option value="">选择交易</option>
                {system.transactions.map((transaction: any) => (
                  <option key={transaction.id} value={transaction.id}>{transaction.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>变化类型</label>
              <select 
                value={event.data.changeType || 'probability'}
                onChange={(e) => {
                  const updatedData = { ...event.data, changeType: e.target.value };
                  handleUpdateEvent(event.id, { data: updatedData });
                }}
              >
                <option value="probability">概率</option>
                <option value="cooldown">冷却时间</option>
                <option value="resourceAmount">资源数量</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>变化值</label>
              <input 
                type="number" 
                value={event.data.newValue || 0}
                onChange={(e) => {
                  const updatedData = { ...event.data, newValue: Number(e.target.value) };
                  handleUpdateEvent(event.id, { data: updatedData });
                }}
                step="0.1"
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="event-data-editor">
            <p className="warning-message">暂不支持编辑此类型事件的详细数据</p>
          </div>
        );
    }
  };
  
  return (
    <div className="scenario-editor-container">
      <div className="editor-tabs">
        <button 
          className={`editor-tab-button ${activeSection === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveSection('basic')}
        >
          基本信息
        </button>
        <button 
          className={`editor-tab-button ${activeSection === 'events' ? 'active' : ''}`}
          onClick={() => setActiveSection('events')}
        >
          事件管理
        </button>
      </div>
      
      <div className="editor-content">
        {activeSection === 'basic' && (
          <div className="basic-info-section">
            <div className="form-group">
              <label>场景名称</label>
              <input 
                type="text" 
                name="name" 
                value={scenario.name} 
                onChange={handleBasicInfoChange}
                placeholder="输入模拟场景名称"
              />
            </div>
            
            <div className="form-group">
              <label>场景描述</label>
              <textarea 
                name="description" 
                value={scenario.description} 
                onChange={handleBasicInfoChange}
                placeholder="描述这个模拟场景的目的和预期结果"
                rows={5}
              />
            </div>
            
            <div className="form-group">
              <label>模拟持续时间（天）</label>
              <input 
                type="number" 
                name="duration" 
                value={scenario.duration} 
                onChange={handleBasicInfoChange}
                min="1"
                max="3650"
              />
              <span className="input-hint">建议设置为1年(365天)到10年(3650天)之间</span>
            </div>
            
            <div className="system-info">
              <h4>关联经济系统</h4>
              <div className="system-info-content">
                <p><strong>系统名称:</strong> {system.name}</p>
                <p><strong>资源数量:</strong> {system.resources.length}</p>
                <p><strong>经济主体数量:</strong> {system.actors.length}</p>
                <p><strong>交易规则数量:</strong> {system.transactions.length}</p>
              </div>
            </div>
            
            <div className="scenario-stats">
              <div className="stat-item">
                <span className="stat-label">事件数量:</span>
                <span className="stat-value">{scenario.events.length}</span>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'events' && (
          <div className="events-section">
            <div className="section-header">
              <h4>经济冲击事件管理</h4>
              <button className="add-button" onClick={handleAddEvent}>添加事件</button>
            </div>
            
            {scenario.events.length === 0 ? (
              <div className="empty-section">
                <p>没有事件，点击"添加事件"按钮创建</p>
              </div>
            ) : (
              <div className="events-list">
                {scenario.events
                  .sort((a, b) => a.triggerTime - b.triggerTime)
                  .map(event => (
                    <div key={event.id} className="event-card">
                      <div className="event-header">
                        <input 
                          type="text" 
                          value={event.description} 
                          onChange={(e) => handleUpdateEvent(event.id, { description: e.target.value })}
                          className="event-description-input"
                          placeholder="事件描述"
                        />
                        <button 
                          className="delete-button small"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          删除
                        </button>
                      </div>
                      
                      <div className="event-properties">
                        <div className="form-group small">
                          <label>触发时间</label>
                          <input 
                            type="number" 
                            value={event.triggerTime}
                            onChange={(e) => handleUpdateEvent(event.id, { triggerTime: Number(e.target.value) })}
                            min={0}
                            max={scenario.duration}
                          />
                        </div>
                        <div className="form-group small">
                          <label>事件类型</label>
                          <select 
                            value={event.type}
                            onChange={(e) => handleUpdateEvent(event.id, { 
                              type: e.target.value as 'resource_shock' | 'actor_behavior_change' | 'transaction_change',
                              data: {} // 重置数据，因为不同类型的事件有不同的数据结构
                            })}
                          >
                            <option value="resource_shock">资源冲击</option>
                            <option value="actor_behavior_change">主体行为变化</option>
                            <option value="transaction_change">交易规则变化</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="event-data">
                        <h5>{getEventTypeName(event.type)}详细设置</h5>
                        {renderEventDataEditor(event)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioEditor; 