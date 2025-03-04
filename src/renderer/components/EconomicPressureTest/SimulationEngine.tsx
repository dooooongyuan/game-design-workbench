import React, { useState, useEffect } from 'react';
import './SimulationEngine.css';

// 定义接口
interface SimulationConfig {
  scenarioId: string;
  systemId: string;
  iterations: number;
  seed: number;
  logLevel: 'debug' | 'info' | 'error';
}

interface SimulationResult {
  id: string;
  scenarioId: string;
  systemId: string;
  timestamp: number;
  duration: number;
  iterations: number;
  seed: number;
  timeSeriesData: TimeSeriesData[];
  events: SimulationEvent[];
  summary: SimulationSummary;
}

interface TimeSeriesData {
  time: number;
  resources: { [resourceId: string]: number };
  actors: { [actorId: string]: ActorState };
  transactions: { [transactionId: string]: number };
}

interface ActorState {
  resources: { [resourceId: string]: number };
  behavior: any;
}

interface SimulationEvent {
  time: number;
  type: string;
  description: string;
  data: any;
}

interface SimulationSummary {
  resourceStats: { [resourceId: string]: ResourceStats };
  actorStats: { [actorId: string]: ActorStats };
  transactionStats: { [transactionId: string]: TransactionStats };
  systemStability: number;
  inflationRate: number;
  inequalityIndex: number;
}

interface ResourceStats {
  min: number;
  max: number;
  average: number;
  finalAmount: number;
  volatility: number;
}

interface ActorStats {
  resourceGrowth: { [resourceId: string]: number };
  transactionCount: number;
  wealthChange: number;
}

interface TransactionStats {
  count: number;
  totalResourcesExchanged: { [resourceId: string]: number };
  averageSize: number;
}

interface SimulationEngineProps {
  scenario: any;
  system: any;
  config: SimulationConfig;
  onProgress: (progress: number) => void;
  onComplete: (result: SimulationResult) => void;
  onError: (error: string) => void;
}

const SimulationEngine: React.FC<SimulationEngineProps> = ({
  scenario,
  system,
  config,
  onProgress,
  onComplete,
  onError
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // 添加日志
  const addLog = (message: string, level: 'debug' | 'info' | 'error') => {
    if (level === 'error' || config.logLevel === 'debug' || (config.logLevel === 'info' && level !== 'debug')) {
      setLogs(prev => [...prev, `[${level.toUpperCase()}] ${message}`]);
    }
  };

  // 运行模拟
  const runSimulation = async () => {
    console.log('开始运行模拟，检查参数:', { 
      scenario: scenario ? '存在' : '不存在', 
      system: system ? '存在' : '不存在',
      scenarioId: config.scenarioId,
      systemId: config.systemId
    });
    
    if (!scenario || !system) {
      const errorMsg = `模拟场景或经济系统不存在: ${!scenario ? '场景不存在' : ''}${!system ? '系统不存在' : ''}`;
      console.error(errorMsg, { 
        scenarioId: config.scenarioId, 
        systemId: config.systemId,
        scenario,
        system
      });
      onError(errorMsg);
      return;
    }

    // 检查scenario和system对象是否有必要的属性
    if (!scenario.id || !scenario.name || !scenario.duration || !Array.isArray(scenario.events)) {
      onError('模拟场景数据不完整，缺少必要的属性');
      console.error('不完整的场景数据:', scenario);
      return;
    }

    if (!system.id || !system.name || !Array.isArray(system.resources) || !Array.isArray(system.actors) || !Array.isArray(system.transactions)) {
      onError('经济系统数据不完整，缺少必要的属性');
      console.error('不完整的系统数据:', system);
      return;
    }

    try {
      setIsRunning(true);
      setProgress(0);
      setCurrentIteration(0);
      setCurrentTime(0);
      setLogs([]);

      addLog(`开始模拟: ${scenario.name}`, 'info');
      addLog(`基于经济系统: ${system.name}`, 'info');
      addLog(`模拟配置: 迭代次数=${config.iterations}, 随机种子=${config.seed}`, 'debug');

      // 初始化随机数生成器
      const random = seedRandom(config.seed);

      // 初始化结果对象
      const result: SimulationResult = {
        id: Date.now().toString(),
        scenarioId: scenario.id,
        systemId: system.id,
        timestamp: Date.now(),
        duration: scenario.duration,
        iterations: config.iterations,
        seed: config.seed,
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

      // 初始化资源统计
      system.resources.forEach((resource: any) => {
        result.summary.resourceStats[resource.id] = {
          min: Infinity,
          max: -Infinity,
          average: 0,
          finalAmount: 0,
          volatility: 0
        };
      });

      // 初始化主体统计
      system.actors.forEach((actor: any) => {
        result.summary.actorStats[actor.id] = {
          resourceGrowth: {},
          transactionCount: 0,
          wealthChange: 0
        };

        // 初始化每种资源的增长率
        system.resources.forEach((resource: any) => {
          result.summary.actorStats[actor.id].resourceGrowth[resource.id] = 0;
        });
      });

      // 初始化交易统计
      system.transactions.forEach((transaction: any) => {
        result.summary.transactionStats[transaction.id] = {
          count: 0,
          totalResourcesExchanged: {},
          averageSize: 0
        };

        // 初始化每种资源的交换总量
        system.resources.forEach((resource: any) => {
          result.summary.transactionStats[transaction.id].totalResourcesExchanged[resource.id] = 0;
        });
      });

      // 运行多次迭代
      for (let iteration = 0; iteration < config.iterations; iteration++) {
        setCurrentIteration(iteration + 1);
        addLog(`开始迭代 ${iteration + 1}/${config.iterations}`, 'debug');

        // 初始化当前迭代的状态
        const state = initializeState(system);
        
        // 记录初始状态
        if (iteration === 0) {
          result.timeSeriesData.push(cloneState(state, 0));
        }

        // 模拟每个时间步
        for (let time = 1; time <= scenario.duration; time++) {
          setCurrentTime(time);
          
          // 更新进度
          const totalSteps = config.iterations * scenario.duration;
          const currentStep = iteration * scenario.duration + time;
          const newProgress = Math.floor((currentStep / totalSteps) * 100);
          if (newProgress !== progress) {
            setProgress(newProgress);
            onProgress(newProgress);
          }

          // 处理当前时间点的事件
          const timeEvents = Array.isArray(scenario.events) 
            ? scenario.events.filter((event: any) => {
                if (!event || typeof event.triggerTime !== 'number') {
                  return false;
                }
                return event.triggerTime === time;
              })
            : [];

          for (const event of timeEvents) {
            try {
              applyEvent(state, event, time, result);
            } catch (eventError) {
              addLog(`处理事件错误: ${event.description || '未知事件'} - ${eventError}`, 'error');
              console.error('事件处理错误:', eventError, '事件数据:', event);
            }
          }

          // 更新资源再生
          updateResources(state, system);

          // 处理主体行为
          processActorBehaviors(state, system, time, random);

          // 处理交易
          processTransactions(state, system, time, random, result);

          // 记录时间序列数据（每10个时间步记录一次，减少数据量）
          if (time % 10 === 0 || time === scenario.duration) {
            result.timeSeriesData.push(cloneState(state, time));
          }
        }

        // 更新统计数据
        updateStatistics(result, state);
        
        addLog(`完成迭代 ${iteration + 1}/${config.iterations}`, 'debug');
      }

      // 计算最终统计数据
      finalizeStatistics(result);

      addLog('模拟完成', 'info');
      onComplete(result);
    } catch (error) {
      console.error('模拟过程中发生错误:', error);
      addLog(`模拟错误: ${error}`, 'error');
      onError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRunning(false);
    }
  };

  // 初始化模拟状态
  const initializeState = (system: any) => {
    const state = {
      resources: {},
      actors: {},
      transactions: {},
      time: 0
    };

    // 初始化资源
    if (Array.isArray(system.resources)) {
      system.resources.forEach((resource: any) => {
        if (resource && resource.id) {
          state.resources[resource.id] = {
            amount: typeof resource.initialAmount === 'number' ? resource.initialAmount : 0,
            maxAmount: typeof resource.maxAmount === 'number' ? resource.maxAmount : 1000,
            regenerationRate: typeof resource.regenerationRate === 'number' ? resource.regenerationRate : 0
          };
        }
      });
    }

    // 初始化主体
    if (Array.isArray(system.actors)) {
      system.actors.forEach((actor: any) => {
        if (actor && actor.id) {
          state.actors[actor.id] = {
            resources: actor.resources ? { ...actor.resources } : {},
            behavior: actor.behavior ? { ...actor.behavior } : {
              consumptionRate: {},
              productionRate: {},
              tradingStrategy: 'balanced',
              priorityResources: []
            }
          };
        }
      });
    }

    // 初始化交易
    if (Array.isArray(system.transactions)) {
      system.transactions.forEach((transaction: any) => {
        if (transaction && transaction.id) {
          state.transactions[transaction.id] = {
            lastExecuted: -Infinity,
            count: 0
          };
        }
      });
    }

    return state;
  };

  // 克隆状态（用于记录时间序列数据）
  const cloneState = (state: any, time: number) => {
    return {
      time,
      resources: { ...state.resources },
      actors: { ...state.actors },
      transactions: { ...state.transactions }
    };
  };

  // 应用事件
  const applyEvent = (state: any, event: any, time: number, result: SimulationResult) => {
    if (!event || !event.type || !event.data) {
      addLog(`跳过无效事件 (时间: ${time})`, 'error');
      return;
    }

    addLog(`应用事件: ${event.description || '未命名事件'} (时间: ${time})`, 'info');
    
    // 记录事件
    result.events.push({
      time,
      type: event.type,
      description: event.description || '未命名事件',
      data: event.data
    });

    // 根据事件类型应用不同的效果
    switch (event.type) {
      case 'resource_shock':
        if (event.data.resourceId && state.resources[event.data.resourceId]) {
          const resource = state.resources[event.data.resourceId];
          const changePercent = event.data.changePercent || 0;
          const originalAmount = resource.amount;
          
          // 应用百分比变化
          resource.amount = Math.max(0, originalAmount * (1 + changePercent / 100));
          
          addLog(`资源冲击: ${event.data.resourceId} 从 ${originalAmount} 变为 ${resource.amount}`, 'debug');
        }
        break;
        
      case 'actor_behavior_change':
        if (event.data.actorId && state.actors[event.data.actorId]) {
          const actor = state.actors[event.data.actorId];
          
          if (event.data.behaviorType === 'tradingStrategy' && event.data.newValue) {
            actor.behavior.tradingStrategy = event.data.newValue;
            addLog(`主体行为变化: ${event.data.actorId} 交易策略变为 ${event.data.newValue}`, 'debug');
          } 
          else if (event.data.behaviorType === 'consumptionRate' && event.data.changePercent) {
            // 修改消费率
            Object.keys(actor.behavior.consumptionRate).forEach(resourceId => {
              const originalRate = actor.behavior.consumptionRate[resourceId];
              actor.behavior.consumptionRate[resourceId] = Math.max(0, originalRate * (1 + event.data.changePercent / 100));
            });
            addLog(`主体行为变化: ${event.data.actorId} 消费率变化 ${event.data.changePercent}%`, 'debug');
          }
          else if (event.data.behaviorType === 'productionRate' && event.data.changePercent) {
            // 修改生产率
            Object.keys(actor.behavior.productionRate).forEach(resourceId => {
              const originalRate = actor.behavior.productionRate[resourceId];
              actor.behavior.productionRate[resourceId] = Math.max(0, originalRate * (1 + event.data.changePercent / 100));
            });
            addLog(`主体行为变化: ${event.data.actorId} 生产率变化 ${event.data.changePercent}%`, 'debug');
          }
        }
        break;
        
      case 'transaction_change':
        if (event.data.transactionId && state.transactions[event.data.transactionId]) {
          const transaction = state.transactions[event.data.transactionId];
          
          if (event.data.changeType === 'probability' && event.data.newValue !== undefined) {
            // 这里我们需要修改系统中的交易概率，而不是状态中的
            // 在实际应用中，可能需要一个更复杂的机制来处理这种情况
            addLog(`交易规则变化: ${event.data.transactionId} 概率变为 ${event.data.newValue}`, 'debug');
          }
        }
        break;
    }
  };

  // 更新资源再生
  const updateResources = (state: any, system: any) => {
    system.resources.forEach((resource: any) => {
      if (resource.regenerationRate > 0 && state.resources[resource.id]) {
        const currentAmount = state.resources[resource.id].amount;
        const maxAmount = state.resources[resource.id].maxAmount;
        const regenerationRate = state.resources[resource.id].regenerationRate;
        
        // 只有当当前数量小于最大数量时才再生
        if (currentAmount < maxAmount) {
          const newAmount = Math.min(maxAmount, currentAmount + regenerationRate);
          state.resources[resource.id].amount = newAmount;
        }
      }
    });
  };

  // 处理主体行为
  const processActorBehaviors = (state: any, system: any, time: number, random: () => number) => {
    system.actors.forEach((actor: any) => {
      if (state.actors[actor.id]) {
        const actorState = state.actors[actor.id];
        
        // 消费资源
        Object.keys(actorState.behavior.consumptionRate).forEach(resourceId => {
          if (state.resources[resourceId] && actorState.resources[resourceId]) {
            const consumptionRate = actorState.behavior.consumptionRate[resourceId];
            const availableAmount = actorState.resources[resourceId];
            
            // 消费不能超过拥有的数量
            const actualConsumption = Math.min(consumptionRate, availableAmount);
            actorState.resources[resourceId] -= actualConsumption;
          }
        });
        
        // 生产资源
        Object.keys(actorState.behavior.productionRate).forEach(resourceId => {
          if (state.resources[resourceId]) {
            const productionRate = actorState.behavior.productionRate[resourceId];
            
            // 增加主体拥有的资源
            if (!actorState.resources[resourceId]) {
              actorState.resources[resourceId] = 0;
            }
            actorState.resources[resourceId] += productionRate;
          }
        });
      }
    });
  };

  // 处理交易
  const processTransactions = (state: any, system: any, time: number, random: () => number, result: SimulationResult) => {
    system.transactions.forEach((transaction: any) => {
      if (state.transactions[transaction.id]) {
        const transactionState = state.transactions[transaction.id];
        
        // 检查冷却时间
        if (time - transactionState.lastExecuted < transaction.cooldown) {
          return;
        }
        
        // 检查概率
        if (random() > transaction.probability) {
          return;
        }
        
        // 检查条件
        if (!checkTransactionConditions(transaction, state)) {
          return;
        }
        
        // 执行交易
        const sourceActor = state.actors[transaction.sourceActorId];
        const targetActor = state.actors[transaction.targetActorId];
        
        if (sourceActor && targetActor) {
          // 检查源主体是否有足够的资源
          let canExecute = true;
          Object.keys(transaction.resources).forEach(resourceId => {
            const amount = transaction.resources[resourceId];
            if (amount > 0 && (!sourceActor.resources[resourceId] || sourceActor.resources[resourceId] < amount)) {
              canExecute = false;
            }
          });
          
          if (canExecute) {
            // 转移资源
            Object.keys(transaction.resources).forEach(resourceId => {
              const amount = transaction.resources[resourceId];
              
              // 源主体减少资源
              if (amount > 0) {
                sourceActor.resources[resourceId] -= amount;
              }
              
              // 目标主体增加资源
              if (!targetActor.resources[resourceId]) {
                targetActor.resources[resourceId] = 0;
              }
              if (amount > 0) {
                targetActor.resources[resourceId] += amount;
              }
              
              // 更新交易统计
              if (result.summary.transactionStats[transaction.id]) {
                result.summary.transactionStats[transaction.id].count++;
                if (!result.summary.transactionStats[transaction.id].totalResourcesExchanged[resourceId]) {
                  result.summary.transactionStats[transaction.id].totalResourcesExchanged[resourceId] = 0;
                }
                result.summary.transactionStats[transaction.id].totalResourcesExchanged[resourceId] += amount;
              }
            });
            
            // 更新交易状态
            transactionState.lastExecuted = time;
            transactionState.count++;
            
            // 更新主体统计
            if (result.summary.actorStats[transaction.sourceActorId]) {
              result.summary.actorStats[transaction.sourceActorId].transactionCount++;
            }
            if (result.summary.actorStats[transaction.targetActorId]) {
              result.summary.actorStats[transaction.targetActorId].transactionCount++;
            }
          }
        }
      }
    });
  };

  // 检查交易条件
  const checkTransactionConditions = (transaction: any, state: any) => {
    if (!transaction.conditions || transaction.conditions.length === 0) {
      return true;
    }
    
    return transaction.conditions.every((condition: any) => {
      switch (condition.type) {
        case 'resourceAmount':
          if (condition.resourceId && state.resources[condition.resourceId]) {
            const amount = state.resources[condition.resourceId].amount;
            return compareValues(amount, condition.value, condition.operator);
          }
          return false;
          
        case 'actorState':
          // 这里可以实现更复杂的主体状态条件检查
          return true;
          
        case 'timeElapsed':
          return compareValues(state.time, condition.value, condition.operator);
          
        case 'randomChance':
          return Math.random() < condition.value;
          
        default:
          return true;
      }
    });
  };

  // 比较值
  const compareValues = (a: number, b: number, operator: string) => {
    switch (operator) {
      case '>': return a > b;
      case '<': return a < b;
      case '==': return a === b;
      case '>=': return a >= b;
      case '<=': return a <= b;
      default: return false;
    }
  };

  // 更新统计数据
  const updateStatistics = (result: SimulationResult, state: any) => {
    // 更新资源统计
    Object.keys(state.resources).forEach(resourceId => {
      const amount = state.resources[resourceId].amount;
      const stats = result.summary.resourceStats[resourceId];
      
      if (stats) {
        stats.min = Math.min(stats.min, amount);
        stats.max = Math.max(stats.max, amount);
        stats.finalAmount = amount;
      }
    });
    
    // 更新主体统计
    Object.keys(state.actors).forEach(actorId => {
      const actor = state.actors[actorId];
      const stats = result.summary.actorStats[actorId];
      
      if (stats) {
        // 计算财富变化
        let totalWealth = 0;
        Object.keys(actor.resources).forEach(resourceId => {
          totalWealth += actor.resources[resourceId];
        });
        stats.wealthChange = totalWealth;
      }
    });
  };

  // 最终统计计算
  const finalizeStatistics = (result: SimulationResult) => {
    // 计算资源平均值和波动性
    Object.keys(result.summary.resourceStats).forEach(resourceId => {
      const stats = result.summary.resourceStats[resourceId];
      
      // 如果没有数据点，设置默认值
      if (stats.min === Infinity) {
        stats.min = 0;
      }
      if (stats.max === -Infinity) {
        stats.max = 0;
      }
      
      // 计算平均值（简化版，实际应该基于时间序列数据）
      stats.average = (stats.min + stats.max) / 2;
      
      // 计算波动性（最大值和最小值之间的差异百分比）
      if (stats.average > 0) {
        stats.volatility = (stats.max - stats.min) / stats.average;
      } else {
        stats.volatility = 0;
      }
    });
    
    // 计算交易平均规模
    Object.keys(result.summary.transactionStats).forEach(transactionId => {
      const stats = result.summary.transactionStats[transactionId];
      
      if (stats.count > 0) {
        let totalSize = 0;
        Object.values(stats.totalResourcesExchanged).forEach(amount => {
          totalSize += amount as number;
        });
        stats.averageSize = totalSize / stats.count;
      }
    });
    
    // 计算系统稳定性（基于资源波动性的倒数）
    let totalVolatility = 0;
    let resourceCount = 0;
    Object.values(result.summary.resourceStats).forEach(stats => {
      totalVolatility += stats.volatility;
      resourceCount++;
    });
    
    if (resourceCount > 0 && totalVolatility > 0) {
      result.summary.systemStability = 1 / (totalVolatility / resourceCount);
    } else {
      result.summary.systemStability = 1; // 完全稳定
    }
    
    // 计算通货膨胀率（简化版，基于资源最终数量与初始数量的比较）
    // 在实际应用中，这应该基于价格变化而不是数量变化
    let totalInflation = 0;
    resourceCount = 0;
    Object.values(result.timeSeriesData).forEach((timePoint, index) => {
      if (index === 0 || index === result.timeSeriesData.length - 1) {
        const resources = timePoint.resources as any;
        Object.keys(resources).forEach(resourceId => {
          if (index === 0) {
            // 记录初始值
            if (!resources[resourceId].initialAmount) {
              resources[resourceId].initialAmount = resources[resourceId].amount;
            }
          } else {
            // 计算最终值与初始值的比率
            const initialAmount = result.timeSeriesData[0].resources[resourceId].initialAmount;
            const finalAmount = resources[resourceId].amount;
            
            if (initialAmount > 0) {
              const inflation = (finalAmount / initialAmount) - 1;
              totalInflation += inflation;
              resourceCount++;
            }
          }
        });
      }
    });
    
    if (resourceCount > 0) {
      result.summary.inflationRate = totalInflation / resourceCount;
    }
    
    // 计算不平等指数（基于主体之间财富分配的基尼系数）
    // 这是一个简化版，实际计算应该更复杂
    const wealthValues: number[] = [];
    Object.values(result.summary.actorStats).forEach(stats => {
      wealthValues.push(stats.wealthChange);
    });
    
    if (wealthValues.length > 1) {
      result.summary.inequalityIndex = calculateGiniCoefficient(wealthValues);
    }
  };

  // 计算基尼系数
  const calculateGiniCoefficient = (values: number[]) => {
    if (values.length === 0) return 0;
    
    // 确保所有值都是非负的
    const positiveValues = values.map(v => Math.max(0, v));
    
    // 排序
    positiveValues.sort((a, b) => a - b);
    
    let sumOfDifferences = 0;
    let sumOfValues = 0;
    
    for (let i = 0; i < positiveValues.length; i++) {
      for (let j = 0; j < positiveValues.length; j++) {
        sumOfDifferences += Math.abs(positiveValues[i] - positiveValues[j]);
      }
      sumOfValues += positiveValues[i];
    }
    
    if (sumOfValues === 0) return 0;
    
    return sumOfDifferences / (2 * positiveValues.length * sumOfValues);
  };

  // 简单的伪随机数生成器
  const seedRandom = (seed: number) => {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  };

  // 启动模拟
  useEffect(() => {
    if (isRunning) {
      runSimulation();
    }
  }, [isRunning, scenario, system, config, onProgress, onComplete, onError]);

  // 在组件挂载时记录传入的props
  useEffect(() => {
    console.log('SimulationEngine组件接收到的props:', {
      scenario: scenario ? { 
        id: scenario.id,
        name: scenario.name,
        economySystemId: scenario.economySystemId,
        duration: scenario.duration,
        events: Array.isArray(scenario.events) ? `${scenario.events.length}个事件` : '无事件数组',
        description: scenario.description
      } : '无场景',
      system: system ? { 
        id: system.id,
        name: system.name,
        resources: Array.isArray(system.resources) ? `${system.resources.length}个资源` : '无资源数组',
        actors: Array.isArray(system.actors) ? `${system.actors.length}个主体` : '无主体数组',
        transactions: Array.isArray(system.transactions) ? `${system.transactions.length}条交易规则` : '无交易规则数组'
      } : '无系统',
      config
    });
  }, []);

  // 在组件挂载时检查系统和场景
  useEffect(() => {
    // 检查系统和场景是否存在
    if (!scenario) {
      console.error('模拟场景不存在', { scenarioId: config.scenarioId });
      onError('模拟场景不存在，请选择一个有效的场景');
      return;
    }
    
    if (!system) {
      console.error('经济系统不存在', { 
        systemId: config.systemId, 
        scenarioSystemId: scenario?.economySystemId 
      });
      onError('经济系统不存在，请为场景选择一个有效的系统');
      return;
    }
    
    // 检查系统和场景是否匹配
    if (scenario.economySystemId !== system.id) {
      console.warn('场景关联的系统ID与传入的系统ID不匹配', {
        scenarioSystemId: scenario.economySystemId,
        systemId: system.id
      });
    }
    
    console.log('系统和场景检查通过，可以运行模拟');
  }, [scenario, system, config.scenarioId, config.systemId, onError]);

  // 渲染组件
  return (
    <div className="simulation-engine">
      <div className="simulation-status">
        <div className="status-header">
          <h3>模拟状态</h3>
          <button 
            className="run-button"
            onClick={() => setIsRunning(true)}
            disabled={isRunning}
          >
            {isRunning ? '模拟中...' : '开始模拟'}
          </button>
        </div>
        
        <div className="progress-container">
          <div className="progress-info">
            <span>进度: {progress}%</span>
            <span>迭代: {currentIteration}/{config.iterations}</span>
            <span>时间: {currentTime}/{scenario?.duration || 0}</span>
          </div>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
      
      <div className="simulation-logs">
        <h3>模拟日志</h3>
        <div className="logs-container">
          {logs.map((log, index) => (
            <div 
              key={index} 
              className={`log-entry ${log.includes('[ERROR]') ? 'error' : log.includes('[INFO]') ? 'info' : 'debug'}`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulationEngine; 