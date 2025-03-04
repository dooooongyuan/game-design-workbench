import React, { useState, useEffect } from 'react';
import './CharacterManager.css';
import './CharacterList.css';
import CharacterAvatar from './CharacterAvatar';
import CharacterRelationshipGraph from './CharacterRelationshipGraph';
import CharacterTags from './CharacterTags';
import CharacterDataIO from './CharacterDataIO';
import './CharacterGrowth.css';

// 属性类别枚举
export enum AttributeCategory {
  BASIC = 'basic',
  COMBAT = 'combat',
  SOCIAL = 'social',
  MENTAL = 'mental',
  SPECIAL = 'special',
  CUSTOM = 'custom'
}

// 属性定义接口
export interface AttributeDefinition {
  id: string;
  name: string;
  description: string;
  category: AttributeCategory;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  isCustom?: boolean;
}

// 属性值接口
export interface AttributeValue {
  definitionId: string;
  value: number;
  // 属性修饰符（如装备、状态效果等带来的加成或减益）
  modifiers?: Array<{
    source: string;
    value: number;
  }>;
}

// 属性关联规则
export interface AttributeRelation {
  sourceAttributeId: string;
  targetAttributeId: string;
  formula: string; // 例如: "source * 0.5 + 2"
  description: string;
}

// 属性成长曲线
export interface AttributeGrowth {
  attributeId: string;
  growthType: 'linear' | 'exponential' | 'logarithmic' | 'custom';
  growthParams: {
    baseValue: number;
    growthRate: number;
    maxLevel: number;
    customFormula?: string; // 自定义公式，如 "baseValue + (level * growthRate)^0.8"
  };
}

interface Character {
  id: string;
  name: string;
  role: string;
  background: string;
  avatarUrl?: string;
  tags: string[];
  // 新的属性系统
  attributeValues: AttributeValue[];
  attributeRelations?: AttributeRelation[];
  attributeGrowth?: AttributeGrowth[];
  level?: number; // 角色等级
  // 保留旧的属性系统以保持兼容性
  attributes: {
    strength: number;
    intelligence: number;
    charisma: number;
    agility: number;
    constitution: number;
  };
  relationships: Array<{
    characterId: string;
    type: string;
    description: string;
  }>;
}

// 默认属性定义
const defaultAttributeDefinitions: AttributeDefinition[] = [
  // 基础属性
  {
    id: 'strength',
    name: '力量',
    description: '影响角色的物理攻击力和负重能力',
    category: AttributeCategory.BASIC,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  },
  {
    id: 'intelligence',
    name: '智力',
    description: '影响角色的魔法能力和学习能力',
    category: AttributeCategory.BASIC,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  },
  {
    id: 'charisma',
    name: '魅力',
    description: '影响角色的社交能力和说服力',
    category: AttributeCategory.BASIC,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  },
  {
    id: 'agility',
    name: '敏捷',
    description: '影响角色的移动速度和闪避能力',
    category: AttributeCategory.BASIC,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  },
  {
    id: 'constitution',
    name: '体质',
    description: '影响角色的生命值和耐力',
    category: AttributeCategory.BASIC,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  },
  // 战斗属性
  {
    id: 'attack',
    name: '攻击力',
    description: '角色的基础物理攻击能力',
    category: AttributeCategory.COMBAT,
    minValue: 1,
    maxValue: 100,
    defaultValue: 20
  },
  {
    id: 'defense',
    name: '防御力',
    description: '角色的基础物理防御能力',
    category: AttributeCategory.COMBAT,
    minValue: 1,
    maxValue: 100,
    defaultValue: 20
  },
  {
    id: 'magicAttack',
    name: '魔法攻击',
    description: '角色的基础魔法攻击能力',
    category: AttributeCategory.COMBAT,
    minValue: 1,
    maxValue: 100,
    defaultValue: 20
  },
  {
    id: 'magicDefense',
    name: '魔法防御',
    description: '角色的基础魔法防御能力',
    category: AttributeCategory.COMBAT,
    minValue: 1,
    maxValue: 100,
    defaultValue: 20
  },
  {
    id: 'speed',
    name: '速度',
    description: '角色的行动速度，影响战斗中的行动顺序',
    category: AttributeCategory.COMBAT,
    minValue: 1,
    maxValue: 100,
    defaultValue: 20
  },
  // 社交属性
  {
    id: 'persuasion',
    name: '说服力',
    description: '影响角色说服他人的能力',
    category: AttributeCategory.SOCIAL,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  },
  {
    id: 'intimidation',
    name: '威慑力',
    description: '影响角色恐吓他人的能力',
    category: AttributeCategory.SOCIAL,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  },
  {
    id: 'deception',
    name: '欺骗',
    description: '影响角色欺骗他人的能力',
    category: AttributeCategory.SOCIAL,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  },
  // 精神属性
  {
    id: 'willpower',
    name: '意志力',
    description: '影响角色抵抗精神攻击的能力',
    category: AttributeCategory.MENTAL,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  },
  {
    id: 'perception',
    name: '感知',
    description: '影响角色发现隐藏物品和陷阱的能力',
    category: AttributeCategory.MENTAL,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  }
];

// 默认属性关联规则
const defaultAttributeRelations: AttributeRelation[] = [
  {
    sourceAttributeId: 'strength',
    targetAttributeId: 'attack',
    formula: 'source * 2 + 10',
    description: '力量影响攻击力'
  },
  {
    sourceAttributeId: 'constitution',
    targetAttributeId: 'defense',
    formula: 'source * 1.5 + 10',
    description: '体质影响防御力'
  },
  {
    sourceAttributeId: 'intelligence',
    targetAttributeId: 'magicAttack',
    formula: 'source * 2.5 + 5',
    description: '智力影响魔法攻击'
  },
  {
    sourceAttributeId: 'intelligence',
    targetAttributeId: 'magicDefense',
    formula: 'source * 1.5 + 8',
    description: '智力影响魔法防御'
  },
  {
    sourceAttributeId: 'agility',
    targetAttributeId: 'speed',
    formula: 'source * 3 + 5',
    description: '敏捷影响速度'
  },
  {
    sourceAttributeId: 'charisma',
    targetAttributeId: 'persuasion',
    formula: 'source * 1.2 + 2',
    description: '魅力影响说服力'
  }
];

const CharacterManager: React.FC = () => {
  // 从localStorage加载角色数据
  const loadCharactersFromStorage = (): Character[] => {
    const savedCharacters = localStorage.getItem('characters');
    if (savedCharacters) {
      try {
        return JSON.parse(savedCharacters);
      } catch (e) {
        console.error('加载角色数据失败:', e);
      }
    }
    return defaultCharacters;
  };

  // 从localStorage加载属性定义
  const loadAttributeDefinitionsFromStorage = (): AttributeDefinition[] => {
    const savedDefinitions = localStorage.getItem('attributeDefinitions');
    if (savedDefinitions) {
      try {
        return JSON.parse(savedDefinitions);
      } catch (e) {
        console.error('加载属性定义失败:', e);
      }
    }
    return defaultAttributeDefinitions;
  };

  // 默认角色数据
  const defaultCharacters: Character[] = [
    {
      id: 'char1',
      name: '艾莉亚',
      role: '主角',
      background: '来自边境小镇的年轻猎人，在一次意外中发现了自己特殊的能力...',
      tags: ['主角', '猎人', '特殊能力'],
      attributes: {
        strength: 7,
        intelligence: 8,
        charisma: 6,
        agility: 9,
        constitution: 7
      },
      // 新的属性系统
      attributeValues: [
        { definitionId: 'strength', value: 7 },
        { definitionId: 'intelligence', value: 8 },
        { definitionId: 'charisma', value: 6 },
        { definitionId: 'agility', value: 9 },
        { definitionId: 'constitution', value: 7 },
        { definitionId: 'attack', value: 24 },
        { definitionId: 'defense', value: 20 },
        { definitionId: 'magicAttack', value: 25 },
        { definitionId: 'magicDefense', value: 20 },
        { definitionId: 'speed', value: 32 },
        { definitionId: 'persuasion', value: 9 },
        { definitionId: 'intimidation', value: 8 },
        { definitionId: 'deception', value: 7 },
        { definitionId: 'willpower', value: 8 },
        { definitionId: 'perception', value: 10 }
      ],
      attributeRelations: [...defaultAttributeRelations],
      attributeGrowth: [
        {
          attributeId: 'strength',
          growthType: 'linear',
          growthParams: {
            baseValue: 7,
            growthRate: 0.5,
            maxLevel: 50
          }
        },
        {
          attributeId: 'intelligence',
          growthType: 'linear',
          growthParams: {
            baseValue: 8,
            growthRate: 0.6,
            maxLevel: 50
          }
        }
      ],
      level: 1,
      relationships: [
        {
          characterId: 'char2',
          type: '导师',
          description: '老猎人马库斯教会了艾莉亚生存技能和战斗技巧'
        }
      ]
    },
    {
      id: 'char2',
      name: '马库斯',
      role: '导师',
      background: '经验丰富的老猎人，曾经是王国的精英卫士，现在隐居在边境...',
      tags: ['导师', '老猎人', '前卫士'],
      attributes: {
        strength: 8,
        intelligence: 9,
        charisma: 7,
        agility: 6,
        constitution: 8
      },
      // 新的属性系统
      attributeValues: [
        { definitionId: 'strength', value: 8 },
        { definitionId: 'intelligence', value: 9 },
        { definitionId: 'charisma', value: 7 },
        { definitionId: 'agility', value: 6 },
        { definitionId: 'constitution', value: 8 },
        { definitionId: 'attack', value: 26 },
        { definitionId: 'defense', value: 22 },
        { definitionId: 'magicAttack', value: 27 },
        { definitionId: 'magicDefense', value: 21 },
        { definitionId: 'speed', value: 23 },
        { definitionId: 'persuasion', value: 10 },
        { definitionId: 'intimidation', value: 12 },
        { definitionId: 'deception', value: 6 },
        { definitionId: 'willpower', value: 12 },
        { definitionId: 'perception', value: 14 }
      ],
      attributeRelations: [...defaultAttributeRelations],
      attributeGrowth: [
        {
          attributeId: 'strength',
          growthType: 'logarithmic',
          growthParams: {
            baseValue: 8,
            growthRate: 0.4,
            maxLevel: 50
          }
        },
        {
          attributeId: 'intelligence',
          growthType: 'logarithmic',
          growthParams: {
            baseValue: 9,
            growthRate: 0.5,
            maxLevel: 50
          }
        }
      ],
      level: 20,
      relationships: [
        {
          characterId: 'char1',
          type: '学徒',
          description: '视艾莉亚为自己从未有过的女儿'
        }
      ]
    }
  ];

  const [characters, setCharacters] = useState<Character[]>(loadCharactersFromStorage());
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(characters[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'info' | 'attributes' | 'relationships' | 'tags' | 'growth'>('info');
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>(
    loadAttributeDefinitionsFromStorage()
  );
  const [selectedAttributeCategory, setSelectedAttributeCategory] = useState<AttributeCategory>(AttributeCategory.BASIC);
  
  // 添加新角色相关状态
  const [showAddCharacterForm, setShowAddCharacterForm] = useState<boolean>(false);
  const [newCharacter, setNewCharacter] = useState<{
    name: string;
    role: string;
  }>({
    name: '',
    role: ''
  });
  
  // 添加关系相关状态
  const [showAddRelationshipForm, setShowAddRelationshipForm] = useState<boolean>(false);
  const [newRelationship, setNewRelationship] = useState<{
    characterId: string;
    type: string;
    description: string;
  }>({
    characterId: '',
    type: '',
    description: ''
  });

  // 添加自定义属性相关状态
  const [showAddAttributeForm, setShowAddAttributeForm] = useState<boolean>(false);
  const [newAttribute, setNewAttribute] = useState<{
    name: string;
    description: string;
    category: AttributeCategory;
    minValue: number;
    maxValue: number;
    defaultValue: number;
  }>({
    name: '',
    description: '',
    category: AttributeCategory.CUSTOM,
    minValue: 1,
    maxValue: 20,
    defaultValue: 10
  });

  // 添加属性关联相关状态
  const [showAddRelationForm, setShowAddRelationForm] = useState<boolean>(false);
  const [newRelation, setNewRelation] = useState<{
    sourceAttributeId: string;
    targetAttributeId: string;
    formula: string;
    description: string;
  }>({
    sourceAttributeId: '',
    targetAttributeId: '',
    formula: 'source * 1',
    description: ''
  });

  // 添加成长曲线编辑状态
  const [editingGrowthIndex, setEditingGrowthIndex] = useState<number | null>(null);
  const [editingGrowthParams, setEditingGrowthParams] = useState<{
    baseValue: number;
    growthRate: number;
    maxLevel: number;
    growthType: 'linear' | 'exponential' | 'logarithmic' | 'custom';
    customFormula?: string;
  }>({
    baseValue: 10,
    growthRate: 0.5,
    maxLevel: 50,
    growthType: 'linear'
  });

  const handleAttributeChange = (attribute: keyof Character['attributes'], value: number) => {
    if (!selectedCharacter) return;
    
    setCharacters(prevCharacters =>
      prevCharacters.map(character =>
        character.id === selectedCharacter
          ? {
              ...character,
              attributes: {
                ...character.attributes,
                [attribute]: Math.max(1, Math.min(10, value))
              }
            }
          : character
      )
    );
  };

  // 处理新属性系统的属性值变更
  const handleAttributeValueChange = (attributeId: string, value: number) => {
    try {
      if (!selectedCharacter || !attributeId) return;
      
      // 查找属性定义
      const attributeDef = attributeDefinitions.find(def => def && def.id === attributeId);
      if (!attributeDef) {
        console.error('找不到属性定义:', attributeId);
        return;
      }
      
      // 确保值在有效范围内
      const newValue = Math.max(
        attributeDef.minValue, 
        Math.min(attributeDef.maxValue, value)
      );
      
      setCharacters(prevCharacters =>
        prevCharacters.map(character => {
          try {
            if (character.id !== selectedCharacter) return character;
            
            // 确保character.attributeValues存在
            if (!character.attributeValues) {
              character.attributeValues = [];
            }
            
            // 查找现有属性值
            const existingValueIndex = character.attributeValues.findIndex(
              av => av && av.definitionId === attributeId
            );
            
            // 更新属性值数组
            const updatedAttributeValues = [...character.attributeValues];
            
            if (existingValueIndex >= 0) {
              // 更新现有属性值
              updatedAttributeValues[existingValueIndex] = {
                ...updatedAttributeValues[existingValueIndex],
                value: newValue
              };
            } else {
              // 添加新属性值
              updatedAttributeValues.push({
                definitionId: attributeId,
                value: newValue
              });
            }
            
            // 更新角色
            const updatedCharacter = {
              ...character,
              attributeValues: updatedAttributeValues
            };
            
            // 更新关联属性
            if (character.attributeRelations && character.attributeRelations.length > 0) {
              return updateRelatedAttributes(updatedCharacter);
            }
            
            return updatedCharacter;
          } catch (error) {
            console.error('更新角色属性时出错:', error);
            return character;
          }
        })
      );
    } catch (error) {
      console.error('处理属性值变更时出错:', error);
    }
  };
  
  // 更新关联属性的值
  const updateRelatedAttributes = (character: Character) => {
    try {
      if (!character || !character.attributeRelations || character.attributeRelations.length === 0) {
        return character;
      }
      
      // 创建一个属性值的映射，方便查找
      const attributeValueMap = new Map<string, number>();
      character.attributeValues.forEach(av => {
        attributeValueMap.set(av.definitionId, av.value);
      });
      
      // 处理每个关联规则
      character.attributeRelations.forEach(relation => {
        try {
          // 获取源属性值
          const sourceValue = attributeValueMap.get(relation.sourceAttributeId);
          if (sourceValue === undefined) return;
          
          // 查找目标属性定义
          const targetDef = attributeDefinitions.find(def => def.id === relation.targetAttributeId);
          if (!targetDef) return;
          
          // 计算目标属性值
          // 使用简单的公式解析，将 'source' 替换为源属性值
          const formula = relation.formula.replace(/source/g, sourceValue.toString());
          let targetValue;
          
          try {
            targetValue = eval(formula);
            
            // 检查计算结果是否有效
            if (isNaN(targetValue) || !isFinite(targetValue)) {
              console.error('计算结果无效:', targetValue);
              return;
            }
          } catch (evalError) {
            console.error('计算公式时出错:', evalError, '公式:', formula);
            return;
          }
          
          // 确保值在有效范围内
          const clampedValue = Math.max(
            targetDef.minValue, 
            Math.min(targetDef.maxValue, Math.round(targetValue))
          );
          
          // 更新目标属性值
          const targetIndex = character.attributeValues.findIndex(
            av => av.definitionId === relation.targetAttributeId
          );
          
          if (targetIndex >= 0) {
            character.attributeValues[targetIndex].value = clampedValue;
          } else {
            character.attributeValues.push({
              definitionId: relation.targetAttributeId,
              value: clampedValue
            });
          }
        } catch (relationError) {
          console.error('处理属性关联时出错:', relationError);
        }
      });
      
      return character;
    } catch (error) {
      console.error('更新关联属性时出错:', error);
      return character;
    }
  };

  // 添加自定义属性
  const handleAddAttribute = () => {
    if (!newAttribute.name.trim()) {
      alert('属性名称不能为空');
      return;
    }
    
    // 生成唯一ID
    const id = `custom_${Date.now()}`;
    
    // 创建新属性定义
    const newAttributeDef: AttributeDefinition = {
      id,
      name: newAttribute.name,
      description: newAttribute.description,
      category: AttributeCategory.CUSTOM,
      minValue: newAttribute.minValue,
      maxValue: newAttribute.maxValue,
      defaultValue: newAttribute.defaultValue,
      isCustom: true
    };
    
    // 更新属性定义列表
    setAttributeDefinitions([...attributeDefinitions, newAttributeDef]);
    
    // 为当前角色添加该属性值
    if (selectedCharacter) {
      setCharacters(prevCharacters =>
        prevCharacters.map(character =>
          character.id === selectedCharacter
            ? {
                ...character,
                attributeValues: [
                  ...character.attributeValues,
                  { definitionId: id, value: newAttribute.defaultValue }
                ]
              }
            : character
        )
      );
    }
    
    // 重置表单
    setNewAttribute({
      name: '',
      description: '',
      category: AttributeCategory.CUSTOM,
      minValue: 1,
      maxValue: 20,
      defaultValue: 10
    });
    setShowAddAttributeForm(false);
  };

  // 添加属性关联
  const handleAddRelation = () => {
    if (!selectedCharacter) return;
    if (!newRelation.sourceAttributeId || !newRelation.targetAttributeId) {
      alert('请选择源属性和目标属性');
      return;
    }
    
    // 检查是否已存在相同的关联
    const character = characters.find(c => c.id === selectedCharacter);
    if (character && character.attributeRelations) {
      const existingRelation = character.attributeRelations.find(
        rel => rel.targetAttributeId === newRelation.targetAttributeId
      );
      
      if (existingRelation) {
        alert('该目标属性已存在关联，请先删除现有关联');
        return;
      }
    }
    
    // 创建新关联
    const relation: AttributeRelation = {
      sourceAttributeId: newRelation.sourceAttributeId,
      targetAttributeId: newRelation.targetAttributeId,
      formula: newRelation.formula,
      description: newRelation.description || `${newRelation.sourceAttributeId} 影响 ${newRelation.targetAttributeId}`
    };
    
    // 更新角色
    setCharacters(prevCharacters =>
      prevCharacters.map(character => {
        if (character.id !== selectedCharacter) return character;
        
        // 添加关联
        const attributeRelations = character.attributeRelations || [];
        const updatedCharacter = {
          ...character,
          attributeRelations: [...attributeRelations, relation]
        };
        
        // 更新关联属性的值
        return updateRelatedAttributes(updatedCharacter);
      })
    );
    
    // 重置表单
    setNewRelation({
      sourceAttributeId: '',
      targetAttributeId: '',
      formula: 'source * 1',
      description: ''
    });
    setShowAddRelationForm(false);
  };

  // 删除属性关联
  const handleDeleteRelation = (index: number) => {
    if (!selectedCharacter) return;
    
    setCharacters(prevCharacters =>
      prevCharacters.map(character => {
        if (character.id !== selectedCharacter || !character.attributeRelations) return character;
        
        // 删除指定索引的关联
        const updatedRelations = [...character.attributeRelations];
        updatedRelations.splice(index, 1);
        
        return {
          ...character,
          attributeRelations: updatedRelations
        };
      })
    );
  };

  // 添加属性成长曲线
  const handleAddGrowthCurve = (attributeId: string, growthType: 'linear' | 'exponential' | 'logarithmic' | 'custom') => {
    if (!selectedCharacter) return;
    
    // 查找属性定义
    const attributeDef = attributeDefinitions.find(def => def.id === attributeId);
    if (!attributeDef) return;
    
    // 查找当前角色的属性值
    const character = characters.find(c => c.id === selectedCharacter);
    if (!character) return;
    
    const attributeValue = character.attributeValues.find(av => av.definitionId === attributeId);
    const baseValue = attributeValue ? attributeValue.value : attributeDef.defaultValue;
    
    // 创建成长曲线
    const growth: AttributeGrowth = {
      attributeId,
      growthType,
      growthParams: {
        baseValue,
        growthRate: 0.5,
        maxLevel: 50
      }
    };
    
    // 更新角色
    setCharacters(prevCharacters =>
      prevCharacters.map(character => {
        if (character.id !== selectedCharacter) return character;
        
        // 查找现有成长曲线
        const existingGrowthIndex = character.attributeGrowth?.findIndex(
          g => g.attributeId === attributeId
        ) ?? -1;
        
        // 更新成长曲线数组
        const attributeGrowth = character.attributeGrowth || [];
        const updatedGrowth = [...attributeGrowth];
        
        if (existingGrowthIndex >= 0) {
          // 更新现有成长曲线
          updatedGrowth[existingGrowthIndex] = growth;
        } else {
          // 添加新成长曲线
          updatedGrowth.push(growth);
        }
        
        return {
          ...character,
          attributeGrowth: updatedGrowth
        };
      })
    );
  };

  // 计算属性在指定等级的值
  const calculateAttributeValueAtLevel = (growth: AttributeGrowth, level: number): number => {
    try {
      if (!growth || !growth.growthParams) {
        console.error('成长曲线或参数为空');
        return 0;
      }
      
      const { baseValue, growthRate, maxLevel, customFormula } = growth.growthParams;
      
      // 确保等级在有效范围内
      const clampedLevel = Math.max(1, Math.min(maxLevel || 50, level));
      
      // 根据成长类型计算值
      switch (growth.growthType) {
        case 'linear':
          return baseValue + (clampedLevel - 1) * growthRate;
        
        case 'exponential':
          return baseValue * Math.pow(1 + growthRate / 10, clampedLevel - 1);
        
        case 'logarithmic':
          // 避免对0或负数取对数
          if (clampedLevel <= 0) return baseValue;
          return baseValue + growthRate * Math.log(clampedLevel);
        
        case 'custom':
          if (customFormula) {
            try {
              // 使用简单的公式解析，将变量替换为实际值
              const formula = customFormula
                .replace(/baseValue/g, baseValue.toString())
                .replace(/level/g, clampedLevel.toString())
                .replace(/growthRate/g, growthRate.toString());
              
              const result = eval(formula);
              return isNaN(result) ? baseValue : result;
            } catch (e) {
              console.error('计算自定义成长公式时出错:', e);
              return baseValue;
            }
          }
          return baseValue;
        
        default:
          return baseValue;
      }
    } catch (error) {
      console.error('计算属性值时出错:', error);
      return 0;
    }
  };

  const handleBackgroundChange = (background: string) => {
    if (!selectedCharacter) return;
    
    setCharacters(prevCharacters =>
      prevCharacters.map(character =>
        character.id === selectedCharacter
          ? { ...character, background }
          : character
      )
    );
  };
  
  // 添加新角色
  const handleAddCharacter = () => {
    if (!newCharacter.name.trim()) {
      alert('角色名称不能为空');
      return;
    }
    
    const newId = `char${Date.now()}`;
    const character: Character = {
      id: newId,
      name: newCharacter.name,
      role: newCharacter.role || '未定义角色',
      background: '',
      tags: [],
      attributes: {
        strength: 5,
        intelligence: 5,
        charisma: 5,
        agility: 5,
        constitution: 5
      },
      attributeValues: [],
      attributeRelations: [],
      attributeGrowth: [],
      level: 1,
      relationships: []
    };
    
    setCharacters([...characters, character]);
    setSelectedCharacter(newId);
    setNewCharacter({ name: '', role: '' });
    setShowAddCharacterForm(false);
  };
  
  // 添加角色关系
  const handleAddRelationship = () => {
    if (!selectedCharacter) return;
    if (!newRelationship.characterId) {
      alert('请选择关联角色');
      return;
    }
    
    setCharacters(prevCharacters =>
      prevCharacters.map(character =>
        character.id === selectedCharacter
          ? {
              ...character,
              relationships: [
                ...character.relationships,
                newRelationship
              ]
            }
          : character
      )
    );
    
    setNewRelationship({
      characterId: '',
      type: '',
      description: ''
    });
    setShowAddRelationshipForm(false);
  };
  
  // 删除角色
  const handleDeleteCharacter = (id: string) => {
    if (characters.length <= 1) {
      alert('至少需要保留一个角色');
      return;
    }
    
    if (window.confirm('确定要删除这个角色吗？此操作不可撤销。')) {
      // 删除角色
      const newCharacters = characters.filter(character => character.id !== id);
      
      // 删除其他角色与该角色的关系
      const updatedCharacters = newCharacters.map(character => ({
        ...character,
        relationships: character.relationships.filter(
          rel => rel.characterId !== id
        )
      }));
      
      setCharacters(updatedCharacters);
      
      // 如果删除的是当前选中的角色，则选择第一个角色
      if (id === selectedCharacter) {
        setSelectedCharacter(updatedCharacters[0]?.id || null);
      }
    }
  };

  const currentCharacter = characters.find(c => c.id === selectedCharacter);

  // 保存角色数据和属性定义到localStorage
  useEffect(() => {
    localStorage.setItem('characters', JSON.stringify(characters));
    localStorage.setItem('attributeDefinitions', JSON.stringify(attributeDefinitions));
  }, [characters, attributeDefinitions]);

  // 处理删除属性
  const handleAttributeDelete = (attributeId: string) => {
    if (!attributeId) return;
    
    // 确认是否删除
    if (!window.confirm('确定要删除这个属性吗？此操作不可撤销。')) return;
    
    try {
      // 从属性定义中删除
      const newAttributeDefinitions = attributeDefinitions.filter(def => def.id !== attributeId);
      
      // 从所有角色的属性值中删除
      const updatedCharacters = characters.map(character => ({
        ...character,
        attributeValues: character.attributeValues?.filter(av => av.definitionId !== attributeId) || [],
        // 同时删除相关的属性关联
        attributeRelations: character.attributeRelations?.filter(
          rel => rel.sourceAttributeId !== attributeId && rel.targetAttributeId !== attributeId
        ) || [],
        // 删除相关的成长曲线
        attributeGrowth: character.attributeGrowth?.filter(
          growth => growth.attributeId !== attributeId
        ) || []
      }));
      
      // 批量更新状态
      setAttributeDefinitions(newAttributeDefinitions);
      setCharacters(updatedCharacters);
      
      // 保存到localStorage
      localStorage.setItem('attributeDefinitions', JSON.stringify(newAttributeDefinitions));
      localStorage.setItem('characters', JSON.stringify(updatedCharacters));
    } catch (error) {
      console.error('删除属性时出错:', error);
      alert('删除属性时出现错误，请刷新页面后重试');
    }
  };

  // 处理标签变更
  const handleTagsChange = (tags: string[]) => {
    if (!selectedCharacter) return;
    
    setCharacters(prevCharacters =>
      prevCharacters.map(character =>
        character.id === selectedCharacter
          ? { ...character, tags }
          : character
      )
    );
  };

  const handleAvatarChange = (file: File) => {
    if (!selectedCharacter) return;
    
    // 将图片转换为Base64格式，这样在页面刷新后仍然可以保持显示
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      
      setCharacters(prevCharacters =>
        prevCharacters.map(character =>
          character.id === selectedCharacter
            ? { ...character, avatarUrl: base64Image }
            : character
        )
      );
    };
    reader.readAsDataURL(file);
  };

  // 处理导入角色数据
  const handleImportCharacters = (importedCharacters: Character[]) => {
    setCharacters(importedCharacters);
    setSelectedCharacter(importedCharacters[0]?.id || null);
  };

  // 处理成长曲线参数更新
  const handleUpdateGrowthParams = () => {
    if (editingGrowthIndex === null || !selectedCharacter) return;
    
    setCharacters(prevCharacters =>
      prevCharacters.map(character => {
        if (character.id !== selectedCharacter || !character.attributeGrowth) return character;
        
        const updatedGrowth = [...character.attributeGrowth];
        if (updatedGrowth[editingGrowthIndex]) {
          updatedGrowth[editingGrowthIndex] = {
            ...updatedGrowth[editingGrowthIndex],
            growthType: editingGrowthParams.growthType,
            growthParams: {
              baseValue: editingGrowthParams.baseValue,
              growthRate: editingGrowthParams.growthRate,
              maxLevel: editingGrowthParams.maxLevel,
              customFormula: editingGrowthParams.customFormula
            }
          };
        }
        
        return {
          ...character,
          attributeGrowth: updatedGrowth
        };
      })
    );
    
    // 重置编辑状态
    setEditingGrowthIndex(null);
  };

  // 取消编辑
  const handleCancelEditGrowth = () => {
    setEditingGrowthIndex(null);
  };

  // 开始编辑成长曲线
  const handleEditGrowth = (index: number) => {
    if (!selectedCharacter) return;
    
    const character = characters.find(c => c.id === selectedCharacter);
    if (!character || !character.attributeGrowth || !character.attributeGrowth[index]) return;
    
    const growth = character.attributeGrowth[index];
    
    setEditingGrowthParams({
      baseValue: growth.growthParams.baseValue,
      growthRate: growth.growthParams.growthRate,
      maxLevel: growth.growthParams.maxLevel || 50,
      growthType: growth.growthType,
      customFormula: growth.growthParams.customFormula
    });
    
    setEditingGrowthIndex(index);
  };

  return (
    <div className="character-manager-container">
      <div className="character-list-sidebar">
        <div className="sidebar-header">
          <h2>角色列表</h2>
        </div>
        
        <div className="character-list">
          {characters.map(character => (
            <div
              key={character.id}
              className={`character-item ${selectedCharacter === character.id ? 'active' : ''}`}
              onClick={() => setSelectedCharacter(character.id)}
            >
              {character.avatarUrl && (
                <div className="character-item-avatar">
                  <img src={character.avatarUrl} alt={character.name} />
                </div>
              )}
              <div className="character-item-info">
                <h3>{character.name}</h3>
                <p>{character.role}</p>
              </div>
              <button 
                className="delete-character-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCharacter(character.id);
                }}
                title="删除角色"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        {showAddCharacterForm ? (
          <div className="add-character-form">
            <input
              type="text"
              placeholder="角色名称"
              value={newCharacter.name}
              onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="角色定位"
              value={newCharacter.role}
              onChange={(e) => setNewCharacter({...newCharacter, role: e.target.value})}
            />
            <div className="form-actions">
              <button onClick={handleAddCharacter}>添加</button>
              <button onClick={() => setShowAddCharacterForm(false)}>取消</button>
            </div>
          </div>
        ) : (
          <button 
            className="add-character-button"
            onClick={() => setShowAddCharacterForm(true)}
          >
            添加新角色
          </button>
        )}
        <div className="sidebar-footer">
          <CharacterDataIO 
            characters={characters} 
            onImport={handleImportCharacters} 
          />
        </div>
      </div>

      {currentCharacter && (
        <div className="character-detail">
          <div className="character-header">
            <CharacterAvatar
              avatarUrl={currentCharacter.avatarUrl}
              onAvatarChange={handleAvatarChange}
            />
            <div className="character-header-info">
              <h2>{currentCharacter.name}</h2>
              <p className="character-role">{currentCharacter.role}</p>
            </div>
          </div>

          <div className="character-tabs">
            <button
              className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              基本信息
            </button>
            <button
              className={`tab-button ${activeTab === 'attributes' ? 'active' : ''}`}
              onClick={() => setActiveTab('attributes')}
            >
              属性
            </button>
            <button
              className={`tab-button ${activeTab === 'tags' ? 'active' : ''}`}
              onClick={() => setActiveTab('tags')}
            >
              标签
            </button>
            <button
              className={`tab-button ${activeTab === 'relationships' ? 'active' : ''}`}
              onClick={() => setActiveTab('relationships')}
            >
              关系网络
            </button>
            <button
              className={`tab-button ${activeTab === 'growth' ? 'active' : ''}`}
              onClick={() => setActiveTab('growth')}
            >
              成长曲线
            </button>
          </div>

          <div className="character-content">
            {activeTab === 'tags' && (
              <div className="character-tags">
                <div className="form-group">
                  <label>角色标签</label>
                  <p className="help-text">双击标签可编辑，点击 × 可删除</p>
                  <CharacterTags 
                    tags={currentCharacter.tags || []} 
                    onChange={handleTagsChange} 
                  />
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="character-info">
                <div className="form-group">
                  <label>背景故事</label>
                  <textarea
                    value={currentCharacter.background}
                    onChange={(e) => handleBackgroundChange(e.target.value)}
                    rows={8}
                    placeholder="描述角色的背景故事、性格特点和动机..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'attributes' && (
              <div className="character-attributes">
                <div className="attribute-categories">
                  <button 
                    className={`category-button ${selectedAttributeCategory === AttributeCategory.BASIC ? 'active' : ''}`}
                    onClick={() => setSelectedAttributeCategory(AttributeCategory.BASIC)}
                  >
                    基础属性
                  </button>
                  <button 
                    className={`category-button ${selectedAttributeCategory === AttributeCategory.COMBAT ? 'active' : ''}`}
                    onClick={() => setSelectedAttributeCategory(AttributeCategory.COMBAT)}
                  >
                    战斗属性
                  </button>
                  <button 
                    className={`category-button ${selectedAttributeCategory === AttributeCategory.SOCIAL ? 'active' : ''}`}
                    onClick={() => setSelectedAttributeCategory(AttributeCategory.SOCIAL)}
                  >
                    社交属性
                  </button>
                  <button 
                    className={`category-button ${selectedAttributeCategory === AttributeCategory.MENTAL ? 'active' : ''}`}
                    onClick={() => setSelectedAttributeCategory(AttributeCategory.MENTAL)}
                  >
                    精神属性
                  </button>
                  <button 
                    className={`category-button ${selectedAttributeCategory === AttributeCategory.CUSTOM ? 'active' : ''}`}
                    onClick={() => setSelectedAttributeCategory(AttributeCategory.CUSTOM)}
                  >
                    自定义属性
                  </button>
                </div>

                <div className="attribute-list">
                  {attributeDefinitions
                    .filter(def => def.category === selectedAttributeCategory)
                    .map(attributeDef => {
                      try {
                        if (!attributeDef || !currentCharacter) {
                          return null;
                        }
                        
                        // 查找当前角色的属性值
                        const attributeValue = currentCharacter.attributeValues?.find(
                          av => av && av.definitionId === attributeDef.id
                        );
                        
                        // 如果没有找到属性值，则使用默认值
                        const value = attributeValue ? attributeValue.value : attributeDef.defaultValue;
                        
                        // 查找是否有关联规则
                        const isTargetInRelation = currentCharacter.attributeRelations?.some(
                          rel => rel && rel.targetAttributeId === attributeDef.id
                        ) || false;
                        
                        // 计算属性条的宽度百分比，确保不会出现负值或NaN
                        let widthPercentage = 0;
                        if (attributeDef.maxValue > attributeDef.minValue && !isNaN(value)) {
                          widthPercentage = ((value - attributeDef.minValue) / (attributeDef.maxValue - attributeDef.minValue)) * 100;
                          widthPercentage = Math.max(0, Math.min(100, widthPercentage)); // 确保在0-100之间
                        }
                  
                  return (
                          <div key={attributeDef.id} className="attribute-item">
                            <div className="attribute-header">
                              <label>{attributeDef.name || '未命名属性'}</label>
                              {isTargetInRelation && (
                                <span className="attribute-relation-badge" title="此属性受其他属性影响">
                                  关联
                                </span>
                              )}
                              <span className="attribute-description-icon" title={attributeDef.description || ''}>
                                ?
                              </span>
                            </div>
                      <div className="attribute-control">
                        <button
                                onClick={() => handleAttributeValueChange(attributeDef.id, value - 1)}
                                disabled={value <= attributeDef.minValue || isTargetInRelation}
                        >
                          -
                        </button>
                        <div className="attribute-bar">
                          <div
                            className="attribute-fill"
                                  style={{ 
                                    width: `${widthPercentage}%`,
                                    backgroundColor: isTargetInRelation ? '#8c8c8c' : undefined
                                  }}
                          ></div>
                          <span className="attribute-value">{value}</span>
                        </div>
                        <button
                                onClick={() => handleAttributeValueChange(attributeDef.id, value + 1)}
                                disabled={value >= attributeDef.maxValue || isTargetInRelation}
                        >
                          +
                        </button>
                        <button
                          className="delete-attribute-button"
                          onClick={() => handleAttributeDelete(attributeDef.id)}
                          title="删除属性"
                          disabled={isTargetInRelation}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                      } catch (error) {
                        console.error('渲染属性项时出错:', error, attributeDef);
                        return null;
                      }
                    })}
                </div>

                {selectedAttributeCategory === AttributeCategory.CUSTOM && (
                  <div className="custom-attribute-controls">
                    {showAddAttributeForm ? (
                      <div className="add-attribute-form">
                        <h4>添加自定义属性</h4>
                        <div className="form-group">
                          <label>属性名称</label>
                          <input
                            type="text"
                            value={newAttribute.name}
                            onChange={(e) => setNewAttribute({...newAttribute, name: e.target.value})}
                            placeholder="例如：魔法亲和力"
                          />
                        </div>
                        <div className="form-group">
                          <label>属性描述</label>
                          <textarea
                            value={newAttribute.description}
                            onChange={(e) => setNewAttribute({...newAttribute, description: e.target.value})}
                            placeholder="描述这个属性的作用..."
                            rows={3}
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>最小值</label>
                            <input
                              type="number"
                              value={newAttribute.minValue}
                              onChange={(e) => setNewAttribute({...newAttribute, minValue: parseInt(e.target.value)})}
                              min={0}
                            />
                          </div>
                          <div className="form-group">
                            <label>最大值</label>
                            <input
                              type="number"
                              value={newAttribute.maxValue}
                              onChange={(e) => setNewAttribute({...newAttribute, maxValue: parseInt(e.target.value)})}
                              min={1}
                            />
                          </div>
                          <div className="form-group">
                            <label>默认值</label>
                            <input
                              type="number"
                              value={newAttribute.defaultValue}
                              onChange={(e) => setNewAttribute({...newAttribute, defaultValue: parseInt(e.target.value)})}
                              min={newAttribute.minValue}
                              max={newAttribute.maxValue}
                            />
                          </div>
                        </div>
                        <div className="form-actions">
                          <button onClick={handleAddAttribute}>添加</button>
                          <button onClick={() => setShowAddAttributeForm(false)}>取消</button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        className="add-attribute-button"
                        onClick={() => setShowAddAttributeForm(true)}
                      >
                        添加自定义属性
                      </button>
                    )}
                  </div>
                )}

                <div className="attribute-relations">
                  <h3>属性关联</h3>
                  <p className="help-text">属性关联允许一个属性影响另一个属性的值</p>
                  
                  {currentCharacter.attributeRelations && currentCharacter.attributeRelations.length > 0 ? (
                    <div className="relation-list">
                      {currentCharacter.attributeRelations.map((relation, index) => {
                        try {
                          if (!relation) return null;
                          
                          const sourceAttr = attributeDefinitions.find(def => def && def.id === relation.sourceAttributeId);
                          const targetAttr = attributeDefinitions.find(def => def && def.id === relation.targetAttributeId);
                          
                          if (!sourceAttr || !targetAttr) return null;
                          
                          return (
                            <div key={index} className="relation-item">
                              <div className="relation-header">
                                <span>{sourceAttr.name} → {targetAttr.name}</span>
                                <button 
                                  className="delete-relation-button"
                                  onClick={() => handleDeleteRelation(index)}
                                  title="删除关联"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="relation-formula">
                                <span>公式: {relation.formula || 'source * 1'}</span>
                              </div>
                              <div className="relation-description">
                                <span>{relation.description || `${sourceAttr.name}影响${targetAttr.name}`}</span>
                              </div>
                            </div>
                          );
                        } catch (error) {
                          console.error('渲染属性关联项时出错:', error, relation);
                          return null;
                        }
                      })}
                    </div>
                  ) : (
                    <p className="no-relations">暂无属性关联</p>
                  )}
                  
                  {showAddRelationForm ? (
                    <div className="add-relation-form">
                      <h4>添加属性关联</h4>
                      <div className="form-group">
                        <label>源属性</label>
                        <select
                          value={newRelation.sourceAttributeId}
                          onChange={(e) => setNewRelation({...newRelation, sourceAttributeId: e.target.value})}
                        >
                          <option value="">选择源属性</option>
                          {attributeDefinitions.filter(def => def).map(def => (
                            <option key={def.id} value={def.id}>{def.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>目标属性</label>
                        <select
                          value={newRelation.targetAttributeId}
                          onChange={(e) => setNewRelation({...newRelation, targetAttributeId: e.target.value})}
                        >
                          <option value="">选择目标属性</option>
                          {attributeDefinitions
                            .filter(def => def && def.id !== newRelation.sourceAttributeId)
                            .map(def => (
                              <option key={def.id} value={def.id}>{def.name}</option>
                            ))
                          }
                        </select>
                      </div>
                      <div className="form-group">
                        <label>公式</label>
                        <input
                          type="text"
                          value={newRelation.formula}
                          onChange={(e) => setNewRelation({...newRelation, formula: e.target.value})}
                          placeholder="例如: source * 2 + 5"
                        />
                        <p className="formula-help">使用 'source' 表示源属性的值</p>
                      </div>
                      <div className="form-group">
                        <label>描述</label>
                        <input
                          type="text"
                          value={newRelation.description}
                          onChange={(e) => setNewRelation({...newRelation, description: e.target.value})}
                          placeholder="例如: 力量影响攻击力"
                        />
                      </div>
                      <div className="form-actions">
                        <button onClick={handleAddRelation}>添加</button>
                        <button onClick={() => setShowAddRelationForm(false)}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="add-relation-button"
                      onClick={() => setShowAddRelationForm(true)}
                    >
                      添加属性关联
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'relationships' && (
              <div className="character-relationships">
                <div className="relationship-graph-section">
                  <h3>角色关系图谱</h3>
                  <CharacterRelationshipGraph 
                    characters={characters} 
                    onNodeClick={(character) => {
                      setSelectedCharacter(character.id);
                    }}
                  />
                </div>
                
                <div className="relationship-list-section">
                  <h3>关系列表</h3>
                  {currentCharacter.relationships.length > 0 ? (
                    currentCharacter.relationships.map((rel, index) => {
                      const relatedCharacter = characters.find(c => c.id === rel.characterId);
                      return (
                        <div key={index} className="relationship-item">
                          <h4>{relatedCharacter?.name} <span>({rel.type})</span></h4>
                          <p>{rel.description}</p>
                          <button 
                            className="delete-relationship-button"
                            onClick={() => {
                              const updatedRelationships = currentCharacter.relationships.filter((_, i) => i !== index);
                              setCharacters(prevCharacters =>
                                prevCharacters.map(character =>
                                  character.id === selectedCharacter
                                    ? { ...character, relationships: updatedRelationships }
                                    : character
                                )
                              );
                            }}
                          >
                            删除
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="no-relationships">暂无关系数据</p>
                  )}
                  
                  {showAddRelationshipForm ? (
                    <div className="add-relationship-form">
                      <select
                        value={newRelationship.characterId}
                        onChange={(e) => setNewRelationship({...newRelationship, characterId: e.target.value})}
                      >
                        <option value="">选择角色</option>
                        {characters
                          .filter(c => c.id !== selectedCharacter)
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                        }
                      </select>
                      <input
                        type="text"
                        placeholder="关系类型"
                        value={newRelationship.type}
                        onChange={(e) => setNewRelationship({...newRelationship, type: e.target.value})}
                      />
                      <textarea
                        placeholder="关系描述"
                        value={newRelationship.description}
                        onChange={(e) => setNewRelationship({...newRelationship, description: e.target.value})}
                        rows={3}
                      />
                      <div className="form-actions">
                        <button onClick={handleAddRelationship}>添加</button>
                        <button onClick={() => setShowAddRelationshipForm(false)}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="add-relationship-button"
                      onClick={() => setShowAddRelationshipForm(true)}
                    >
                      添加关系
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'growth' && (
              <div className="character-growth">
                <h3>角色成长曲线</h3>
                <div className="growth-level-control">
                  <label>角色等级: {currentCharacter.level || 1}</label>
                  <div className="level-slider">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={currentCharacter.level || 1}
                      onChange={(e) => {
                        const newLevel = parseInt(e.target.value);
                        setCharacters(prevCharacters =>
                          prevCharacters.map(character =>
                            character.id === selectedCharacter
                              ? { ...character, level: newLevel }
                              : character
                          )
                        );
                      }}
                    />
                    <span className="level-value">{currentCharacter.level || 1}</span>
                  </div>
                </div>

                <div className="growth-chart">
                  <h4>属性成长预览</h4>
                  <div className="attribute-radar-chart">
                    <div className="radar-placeholder">
                      <svg className="radar-visualization" width="300" height="300" viewBox="0 0 200 200">
                        {/* 添加背景圆环 */}
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#eee" strokeWidth="1" />
                        <circle cx="100" cy="100" r="60" fill="none" stroke="#eee" strokeWidth="1" />
                        <circle cx="100" cy="100" r="40" fill="none" stroke="#eee" strokeWidth="1" />
                        <circle cx="100" cy="100" r="20" fill="none" stroke="#eee" strokeWidth="1" />
                        
                        {/* 绘制雷达图轴线和点 */}
                        {attributeDefinitions
                          .filter(def => def && def.category === AttributeCategory.BASIC)
                          .map((def, index, array) => {
                            if (!array.length) return null;
                            
                            try {
                              const angle = (Math.PI * 2 * index) / array.length;
                              
                              // 查找当前角色的属性值
                              const attributeValue = currentCharacter?.attributeValues?.find(
                                av => av && av.definitionId === def.id
                              );
                              
                              // 如果没有找到属性值，则使用默认值
                              const value = attributeValue ? attributeValue.value : def.defaultValue;
                              
                              // 计算归一化值和半径
                              const normalizedValue = Math.max(0, Math.min(1, 
                                (value - def.minValue) / (def.maxValue - def.minValue || 1)
                              ));
                              const radius = 80 * normalizedValue;
                              
                              // 计算坐标
                              const x = Math.cos(angle) * radius + 100;
                              const y = Math.sin(angle) * radius + 100;
                              
                              return (
                                <React.Fragment key={def.id}>
                                  {/* 轴线 */}
                                  <line
                                    x1="100"
                                    y1="100"
                                    x2={100 + Math.cos(angle) * 80}
                                    y2={100 + Math.sin(angle) * 80}
                                    stroke="#ddd"
                                    strokeWidth="1"
                                  />
                                  
                                  {/* 属性点 */}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#1890ff"
                                    stroke="#fff"
                                    strokeWidth="1"
                                  />
                                  
                                  {/* 属性名称 */}
                                  <text
                                    x={100 + Math.cos(angle) * 95}
                                    y={100 + Math.sin(angle) * 95}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="10"
                                    fill="#333"
                                  >
                                    {def.name}
                                  </text>
                                  
                                  {/* 属性值 */}
                                  <text
                                    x={x}
                                    y={y}
                                    dx={Math.cos(angle) * 10}
                                    dy={Math.sin(angle) * 10}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="9"
                                    fill="#1890ff"
                                    fontWeight="bold"
                                  >
                                    {value}
                                  </text>
                                </React.Fragment>
                              );
                            } catch (error) {
                              console.error('渲染雷达图点时出错:', error, def);
                              return null;
                            }
                          })}
                        
                        {/* 绘制雷达图多边形 */}
                        {(() => {
                          try {
                            const basicAttributes = attributeDefinitions.filter(def => def && def.category === AttributeCategory.BASIC);
                            
                            if (!basicAttributes.length) return null;
                            
                            const points = basicAttributes.map((def, index, array) => {
                              try {
                                const attributeValue = currentCharacter?.attributeValues?.find(
                                  av => av && av.definitionId === def.id
                                );
                                
                                const value = attributeValue ? attributeValue.value : def.defaultValue;
                                
                                const angle = (Math.PI * 2 * index) / array.length;
                                const normalizedValue = Math.max(0, Math.min(1, 
                                  (value - def.minValue) / (def.maxValue - def.minValue || 1)
                                ));
                                const radius = 80 * normalizedValue;
                                
                                const x = Math.cos(angle) * radius + 100;
                                const y = Math.sin(angle) * radius + 100;
                                
                                return `${x},${y}`;
                              } catch (error) {
                                console.error('计算雷达图多边形点时出错:', error, def);
                                return '100,100'; // 出错时返回中心点
                              }
                            }).join(' ');
                            
                            return (
                              <polygon
                                points={points}
                                fill="rgba(24, 144, 255, 0.2)"
                                stroke="#1890ff"
                                strokeWidth="2"
                              />
                            );
                          } catch (error) {
                            console.error('渲染雷达图多边形时出错:', error);
                            return null;
                          }
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="growth-curves">
                  <h4>属性成长曲线</h4>
                  <div className="growth-curves-list">
                    {currentCharacter.attributeGrowth && currentCharacter.attributeGrowth.length > 0 ? (
                      currentCharacter.attributeGrowth.map((growth, index) => {
                        try {
                          const attribute = attributeDefinitions.find(def => def.id === growth.attributeId);
                          if (!attribute) return null;
                          
                          const currentLevel = currentCharacter.level || 1;
                          const currentValue = calculateAttributeValueAtLevel(growth, currentLevel);
                          
                          const maxValue = calculateAttributeValueAtLevel(growth, growth.growthParams.maxLevel || 50);
                          
                          return (
                            <div key={index} className="growth-curve-item">
                              <div className="growth-curve-header">
                                <h5>{attribute.name}</h5>
                                <span className="growth-type-badge">
                                  {growth.growthType === 'linear' ? '线性' : 
                                   growth.growthType === 'exponential' ? '指数' : 
                                   growth.growthType === 'logarithmic' ? '对数' : '自定义'}
                                </span>
                                <button 
                                  className="delete-growth-button"
                                  onClick={() => {
                                    setCharacters(prevCharacters =>
                                      prevCharacters.map(character => {
                                        if (character.id !== selectedCharacter || !character.attributeGrowth) return character;
                                        
                                        return {
                                          ...character,
                                          attributeGrowth: character.attributeGrowth.filter((_, i) => i !== index)
                                        };
                                      })
                                    );
                                  }}
                                  title="删除成长曲线"
                                >
                                  ×
                                </button>
                              </div>
                              
                              <div className="growth-curve-details">
                                <div className="growth-params">
                                  <div className="param-item">
                                    <label>基础值:</label>
                                    <span>{growth.growthParams.baseValue}</span>
                                  </div>
                                  <div className="param-item">
                                    <label>成长率:</label>
                                    <span>{growth.growthParams.growthRate}</span>
                                  </div>
                                  <div className="param-item">
                                    <label>最大等级:</label>
                                    <span>{growth.growthParams.maxLevel || 50}</span>
                                  </div>
                                </div>
                                
                                <div className="growth-preview">
                                  <div className="growth-preview-bar">
                                    <div className="growth-preview-fill" style={{ width: `${(currentValue / attribute.maxValue) * 100}%` }}></div>
                                    <span className="growth-preview-value">当前: {currentValue.toFixed(1)}</span>
                                  </div>
                                  <div className="growth-preview-bar">
                                    <div className="growth-preview-fill growth-preview-max" style={{ width: `${(maxValue / attribute.maxValue) * 100}%` }}></div>
                                    <span className="growth-preview-value">最大: {maxValue.toFixed(1)}</span>
                                  </div>
                                </div>
                                
                                <div className="growth-curve-controls">
                                  <button 
                                    className="edit-growth-button"
                                    onClick={() => handleEditGrowth(index)}
                                  >
                                    编辑参数
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        } catch (error) {
                          console.error('渲染成长曲线项时出错:', error);
                          return null;
                        }
                      })
                    ) : (
                      <p className="no-growth-curves">暂无成长曲线数据</p>
                    )}
                  </div>
                  
                  {/* 编辑成长曲线参数表单 */}
                  {editingGrowthIndex !== null && (
                    <div className="edit-growth-form">
                      <h4>编辑成长曲线参数</h4>
                      <div className="form-group">
                        <label>成长类型</label>
                        <select
                          value={editingGrowthParams.growthType}
                          onChange={(e) => setEditingGrowthParams({
                            ...editingGrowthParams,
                            growthType: e.target.value as 'linear' | 'exponential' | 'logarithmic' | 'custom'
                          })}
                        >
                          <option value="linear">线性成长</option>
                          <option value="exponential">指数成长</option>
                          <option value="logarithmic">对数成长</option>
                          <option value="custom">自定义公式</option>
                        </select>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>基础值</label>
                          <input
                            type="number"
                            value={editingGrowthParams.baseValue}
                            onChange={(e) => setEditingGrowthParams({
                              ...editingGrowthParams,
                              baseValue: parseFloat(e.target.value) || 0
                            })}
                            min="0"
                            step="0.1"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>成长率</label>
                          <input
                            type="number"
                            value={editingGrowthParams.growthRate}
                            onChange={(e) => setEditingGrowthParams({
                              ...editingGrowthParams,
                              growthRate: parseFloat(e.target.value) || 0
                            })}
                            min="0"
                            step="0.1"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>最大等级</label>
                          <input
                            type="number"
                            value={editingGrowthParams.maxLevel}
                            onChange={(e) => setEditingGrowthParams({
                              ...editingGrowthParams,
                              maxLevel: parseInt(e.target.value) || 1
                            })}
                            min="1"
                          />
                        </div>
                      </div>
                      
                      {editingGrowthParams.growthType === 'custom' && (
                        <div className="form-group">
                          <label>自定义公式</label>
                          <input
                            type="text"
                            value={editingGrowthParams.customFormula || ''}
                            onChange={(e) => setEditingGrowthParams({
                              ...editingGrowthParams,
                              customFormula: e.target.value
                            })}
                            placeholder="例如: baseValue + (level * growthRate)"
                          />
                          <p className="formula-help">
                            可用变量: baseValue(基础值), level(等级), growthRate(成长率)
                          </p>
                        </div>
                      )}
                      
                      <div className="form-actions">
                        <button onClick={handleUpdateGrowthParams}>保存</button>
                        <button onClick={handleCancelEditGrowth}>取消</button>
                      </div>
                    </div>
                  )}
                  
                  <div className="add-growth-section">
                    <h4>添加成长曲线</h4>
                    <div className="add-growth-controls">
                      <select
                        className="attribute-select"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddGrowthCurve(e.target.value, 'linear');
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">选择属性</option>
                        {attributeDefinitions
                          .filter(def => {
                            return !currentCharacter.attributeGrowth?.some(g => g.attributeId === def.id);
                          })
                          .map(def => (
                            <option key={def.id} value={def.id}>{def.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterManager;