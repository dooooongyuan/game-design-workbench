import React, { useState } from 'react';
import './SystemEditor.css';

// 定义接口
interface Resource {
  id: string;
  name: string;
  initialAmount: number;
  regenerationRate: number;
  maxAmount: number;
  description: string;
}

interface ActorBehavior {
  consumptionRate: { [resourceId: string]: number };
  productionRate: { [resourceId: string]: number };
  tradingStrategy: 'aggressive' | 'balanced' | 'conservative';
  priorityResources: string[];
}

interface Actor {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'system';
  resources: { [resourceId: string]: number };
  behavior: ActorBehavior;
  description: string;
}

interface TransactionCondition {
  type: 'resourceAmount' | 'actorState' | 'timeElapsed' | 'randomChance';
  resourceId?: string;
  operator: '>' | '<' | '==' | '>=' | '<=';
  value: number;
}

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

interface EconomySystem {
  id: string;
  name: string;
  description: string;
  resources: Resource[];
  actors: Actor[];
  transactions: Transaction[];
  lastModified: number;
}

// 系统编辑器组件
const SystemEditor: React.FC<{
  system: EconomySystem;
  onUpdateSystem: (updates: Partial<EconomySystem>) => void;
}> = ({ system, onUpdateSystem }) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'resources' | 'actors' | 'transactions'>('basic');
  
  // 基本信息编辑
  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdateSystem({ [name]: value } as any);
  };
  
  // 添加资源
  const handleAddResource = () => {
    const newResource: Resource = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: '新资源',
      initialAmount: 100,
      regenerationRate: 1,
      maxAmount: 1000,
      description: ''
    };
    
    onUpdateSystem({
      resources: [...system.resources, newResource]
    });
  };
  
  // 更新资源
  const handleUpdateResource = (resourceId: string, updates: Partial<Resource>) => {
    const updatedResources = system.resources.map(resource => 
      resource.id === resourceId ? { ...resource, ...updates } : resource
    );
    
    onUpdateSystem({ resources: updatedResources });
  };
  
  // 删除资源
  const handleDeleteResource = (resourceId: string) => {
    if (window.confirm('确定要删除这个资源吗？')) {
      onUpdateSystem({
        resources: system.resources.filter(r => r.id !== resourceId)
      });
    }
  };
  
  // 添加主体
  const handleAddActor = () => {
    const newActor: Actor = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: '新主体',
      type: 'npc',
      resources: {},
      behavior: {
        consumptionRate: {},
        productionRate: {},
        tradingStrategy: 'balanced',
        priorityResources: []
      },
      description: ''
    };
    
    onUpdateSystem({
      actors: [...system.actors, newActor]
    });
  };
  
  // 更新主体
  const handleUpdateActor = (actorId: string, updates: Partial<Actor>) => {
    const updatedActors = system.actors.map(actor => 
      actor.id === actorId ? { ...actor, ...updates } : actor
    );
    
    onUpdateSystem({ actors: updatedActors });
  };
  
  // 删除主体
  const handleDeleteActor = (actorId: string) => {
    if (window.confirm('确定要删除这个主体吗？')) {
      onUpdateSystem({
        actors: system.actors.filter(a => a.id !== actorId)
      });
    }
  };
  
  // 添加交易
  const handleAddTransaction = () => {
    const newTransaction: Transaction = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: '新交易规则',
      sourceActorId: system.actors.length > 0 ? system.actors[0].id : '',
      targetActorId: system.actors.length > 1 ? system.actors[1].id : (system.actors.length > 0 ? system.actors[0].id : ''),
      resources: {},
      conditions: [],
      probability: 0.5,
      cooldown: 10,
      description: ''
    };
    
    onUpdateSystem({
      transactions: [...system.transactions, newTransaction]
    });
  };
  
  // 更新交易
  const handleUpdateTransaction = (transactionId: string, updates: Partial<Transaction>) => {
    const updatedTransactions = system.transactions.map(transaction => 
      transaction.id === transactionId ? { ...transaction, ...updates } : transaction
    );
    
    onUpdateSystem({ transactions: updatedTransactions });
  };
  
  // 删除交易
  const handleDeleteTransaction = (transactionId: string) => {
    if (window.confirm('确定要删除这个交易规则吗？')) {
      onUpdateSystem({
        transactions: system.transactions.filter(t => t.id !== transactionId)
      });
    }
  };
  
  return (
    <div className="system-editor-container">
      <div className="editor-tabs">
        <button 
          className={`editor-tab-button ${activeSection === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveSection('basic')}
        >
          基本信息
        </button>
        <button 
          className={`editor-tab-button ${activeSection === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveSection('resources')}
        >
          资源管理
        </button>
        <button 
          className={`editor-tab-button ${activeSection === 'actors' ? 'active' : ''}`}
          onClick={() => setActiveSection('actors')}
        >
          主体管理
        </button>
        <button 
          className={`editor-tab-button ${activeSection === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveSection('transactions')}
        >
          交易规则
        </button>
      </div>
      
      <div className="editor-content">
        {activeSection === 'basic' && (
          <div className="basic-info-section">
            <div className="form-group">
              <label>系统名称</label>
              <input 
                type="text" 
                name="name" 
                value={system.name} 
                onChange={handleBasicInfoChange}
                placeholder="输入经济系统名称"
              />
            </div>
            
            <div className="form-group">
              <label>系统描述</label>
              <textarea 
                name="description" 
                value={system.description} 
                onChange={handleBasicInfoChange}
                placeholder="描述这个经济系统的基本情况、目标和特点"
                rows={5}
              />
            </div>
            
            <div className="system-stats">
              <div className="stat-item">
                <div className="stat-label">资源数量</div>
                <div className="stat-value">{system.resources.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">主体数量</div>
                <div className="stat-value">{system.actors.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">交易规则</div>
                <div className="stat-value">{system.transactions.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">最后修改</div>
                <div className="stat-value">{new Date(system.lastModified).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'resources' && (
          <div className="resources-section">
            <div className="section-header">
              <h4>资源管理</h4>
              <button className="add-button" onClick={handleAddResource}>添加资源</button>
            </div>
            
            {system.resources.length === 0 ? (
              <div className="empty-section">
                <p>暂无资源，点击"添加资源"按钮开始</p>
              </div>
            ) : (
              <div className="resources-list">
                {system.resources.map(resource => (
                  <div key={resource.id} className="resource-card">
                    <div className="resource-header">
                      <input 
                        className="resource-name-input"
                        value={resource.name}
                        onChange={(e) => handleUpdateResource(resource.id, { name: e.target.value })}
                        placeholder="资源名称"
                      />
                      <button 
                        className="delete-button small"
                        onClick={() => handleDeleteResource(resource.id)}
                      >
                        删除
                      </button>
                    </div>
                    
                    <div className="resource-properties">
                      <div className="form-group small">
                        <label>初始数量</label>
                        <input 
                          type="number" 
                          value={resource.initialAmount}
                          onChange={(e) => handleUpdateResource(resource.id, { initialAmount: Number(e.target.value) })}
                          min="0"
                        />
                      </div>
                      
                      <div className="form-group small">
                        <label>再生速率</label>
                        <input 
                          type="number" 
                          value={resource.regenerationRate}
                          onChange={(e) => handleUpdateResource(resource.id, { regenerationRate: Number(e.target.value) })}
                          step="0.1"
                        />
                      </div>
                      
                      <div className="form-group small">
                        <label>最大数量</label>
                        <input 
                          type="number" 
                          value={resource.maxAmount}
                          onChange={(e) => handleUpdateResource(resource.id, { maxAmount: Number(e.target.value) })}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group small">
                      <label>描述</label>
                      <textarea 
                        value={resource.description}
                        onChange={(e) => handleUpdateResource(resource.id, { description: e.target.value })}
                        placeholder="描述这个资源的特性和用途"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeSection === 'actors' && (
          <div className="actors-section">
            <div className="section-header">
              <h4>主体管理</h4>
              <button className="add-button" onClick={handleAddActor}>添加主体</button>
            </div>
            
            {system.actors.length === 0 ? (
              <div className="empty-section">
                <p>暂无主体，点击"添加主体"按钮开始</p>
              </div>
            ) : (
              <div className="actors-list">
                {system.actors.map(actor => (
                  <div key={actor.id} className="actor-card">
                    <div className="actor-header">
                      <input 
                        className="actor-name-input"
                        value={actor.name}
                        onChange={(e) => handleUpdateActor(actor.id, { name: e.target.value })}
                        placeholder="主体名称"
                      />
                      <button 
                        className="delete-button small"
                        onClick={() => handleDeleteActor(actor.id)}
                      >
                        删除
                      </button>
                    </div>
                    
                    <div className="actor-properties">
                      <div className="form-group small">
                        <label>类型</label>
                        <select 
                          value={actor.type}
                          onChange={(e) => handleUpdateActor(actor.id, { type: e.target.value as 'player' | 'npc' | 'system' })}
                        >
                          <option value="player">玩家</option>
                          <option value="npc">NPC</option>
                          <option value="system">系统</option>
                        </select>
                      </div>
                      
                      <div className="form-group small">
                        <label>交易策略</label>
                        <select 
                          value={actor.behavior.tradingStrategy}
                          onChange={(e) => handleUpdateActor(actor.id, { 
                            behavior: { 
                              ...actor.behavior, 
                              tradingStrategy: e.target.value as 'aggressive' | 'balanced' | 'conservative' 
                            } 
                          })}
                        >
                          <option value="aggressive">激进</option>
                          <option value="balanced">平衡</option>
                          <option value="conservative">保守</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="actor-resources">
                      <h5>资源配置</h5>
                      {system.resources.length === 0 ? (
                        <div className="no-resources-message">请先添加资源</div>
                      ) : (
                        <div className="actor-resources-grid">
                          {system.resources.map(resource => (
                            <div key={resource.id} className="actor-resource-item">
                              <label>{resource.name}</label>
                              <input 
                                type="number" 
                                value={actor.resources[resource.id] || 0}
                                onChange={(e) => {
                                  const updatedResources = { ...actor.resources };
                                  updatedResources[resource.id] = Number(e.target.value);
                                  handleUpdateActor(actor.id, { resources: updatedResources });
                                }}
                                min="0"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group small">
                      <label>描述</label>
                      <textarea 
                        value={actor.description}
                        onChange={(e) => handleUpdateActor(actor.id, { description: e.target.value })}
                        placeholder="描述这个主体的特性和行为"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeSection === 'transactions' && (
          <div className="transactions-section">
            <div className="section-header">
              <h4>交易规则</h4>
              <button 
                className="add-button" 
                onClick={handleAddTransaction}
                disabled={system.actors.length < 1}
              >
                添加交易规则
              </button>
            </div>
            
            {system.actors.length < 1 && (
              <div className="warning-message">需要至少一个主体才能创建交易规则</div>
            )}
            
            {system.transactions.length === 0 ? (
              <div className="empty-section">
                <p>暂无交易规则，点击"添加交易规则"按钮开始</p>
              </div>
            ) : (
              <div className="transactions-list">
                {system.transactions.map(transaction => (
                  <div key={transaction.id} className="transaction-card">
                    <div className="transaction-header">
                      <input 
                        className="transaction-name-input"
                        value={transaction.name}
                        onChange={(e) => handleUpdateTransaction(transaction.id, { name: e.target.value })}
                        placeholder="交易规则名称"
                      />
                      <button 
                        className="delete-button small"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        删除
                      </button>
                    </div>
                    
                    <div className="transaction-properties">
                      <div className="form-group small">
                        <label>源主体</label>
                        <select 
                          value={transaction.sourceActorId}
                          onChange={(e) => handleUpdateTransaction(transaction.id, { sourceActorId: e.target.value })}
                        >
                          {system.actors.map(actor => (
                            <option key={actor.id} value={actor.id}>{actor.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group small">
                        <label>目标主体</label>
                        <select 
                          value={transaction.targetActorId}
                          onChange={(e) => handleUpdateTransaction(transaction.id, { targetActorId: e.target.value })}
                        >
                          {system.actors.map(actor => (
                            <option key={actor.id} value={actor.id}>{actor.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group small">
                        <label>概率</label>
                        <input 
                          type="number" 
                          value={transaction.probability}
                          onChange={(e) => handleUpdateTransaction(transaction.id, { probability: Number(e.target.value) })}
                          min="0"
                          max="1"
                          step="0.1"
                        />
                      </div>
                      
                      <div className="form-group small">
                        <label>冷却时间</label>
                        <input 
                          type="number" 
                          value={transaction.cooldown}
                          onChange={(e) => handleUpdateTransaction(transaction.id, { cooldown: Number(e.target.value) })}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="transaction-resources">
                      <h5>资源交换</h5>
                      {system.resources.length === 0 ? (
                        <div className="no-resources-message">请先添加资源</div>
                      ) : (
                        <div className="transaction-resources-grid">
                          {system.resources.map(resource => (
                            <div key={resource.id} className="transaction-resource-item">
                              <label>{resource.name}</label>
                              <input 
                                type="number" 
                                value={transaction.resources[resource.id] || 0}
                                onChange={(e) => {
                                  const updatedResources = { ...transaction.resources };
                                  updatedResources[resource.id] = Number(e.target.value);
                                  handleUpdateTransaction(transaction.id, { resources: updatedResources });
                                }}
                              />
                              <span className="resource-direction">
                                {transaction.resources[resource.id] > 0 ? '源 → 目标' : 
                                 transaction.resources[resource.id] < 0 ? '目标 → 源' : '无交换'}
                              </span>
                              <span className="resource-hint">
                                正值表示源主体给予目标主体，负值表示目标主体给予源主体
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group small">
                      <label>描述</label>
                      <textarea 
                        value={transaction.description}
                        onChange={(e) => handleUpdateTransaction(transaction.id, { description: e.target.value })}
                        placeholder="描述这个交易规则的条件和效果"
                        rows={2}
                      />
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

export default SystemEditor; 