import React, { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import MarkdownPreview from './MarkdownPreview';
import { WorldBuildingSection, WorldTemplate, EngineExportFormat, SectionGroup } from './types';
import { saveWorldData, loadWorldData, saveCustomTemplate, loadCustomTemplates } from './WorldStorageService';
import './WorldEditor.css';
import NarrativeTree from './NarrativeTree';
import './NarrativeTree.css';
import { getTutorialState, setTutorialState } from '../../utils/tutorialManager';
import { QuestionCircleOutlined } from '@ant-design/icons';

// 使用从types.ts导入的接口定义

const worldTemplates: WorldTemplate[] = [
  {
    id: 'fantasy',
    name: '奇幻世界',
    description: '包含魔法、种族和神话元素的典型奇幻设定',
    sections: [
      {
        id: 'background',
        title: '世界背景',
        content: '# 奇幻世界背景\n\n这是一个被魔法和神秘力量所塑造的世界。大陆被分为几个主要区域，每个区域都有其独特的地理特征和文化。魔法在这个世界中普遍存在，但其力量和应用因地区而异...'
      },
      {
        id: 'history',
        title: '历史年表',
        content: '# 重要历史事件\n\n## 远古纪元（-5000年至-3000年）\n* -4500年：大魔法灾变，改变了世界的地理面貌\n* -4000年：第一个人类王国建立\n* -3500年：精灵族与矮人族之间的第一次联盟\n\n## 帝国纪元（-3000年至-1000年）\n* -2800年：阿卡迪亚帝国的崛起\n* -2500年：第一次魔法战争\n* -1200年：黑暗时代的开始，帝国分裂为多个小国家'
      },
      {
        id: 'races',
        title: '种族设定',
        content: '# 主要种族\n\n## 人类\n适应性强，寿命短暂但繁殖迅速，在大陆上建立了多个强大王国。\n\n## 精灵\n长寿，与自然亲近，精通自然魔法，居住在古老森林中。\n\n## 矮人\n坚韧，擅长锻造和工艺，居住在山脉和地下城市。\n\n## 兽人\n强壮好战，部落文化，崇尚力量和荣誉。'
      },
      {
        id: 'magic',
        title: '魔法体系',
        content: '# 魔法体系\n\n## 元素魔法\n控制火、水、土、风等基本元素的能力。\n\n## 生命魔法\n治疗、复苏和操控生命能量的能力。\n\n## 死灵魔法\n与死亡和灵魂相关的禁忌魔法。\n\n## 空间魔法\n操控空间和时间的高级魔法，极少有人掌握。'
      },
      {
        id: 'geography',
        title: '地理环境',
        content: '# 主要地理区域\n\n## 中央平原\n人类王国的中心，肥沃的农田和繁华的城市。\n\n## 永恒森林\n精灵族的家园，古老而神秘的森林，充满魔法能量。\n\n## 铁山脉\n矮人王国所在，富含矿产资源。\n\n## 荒芜之地\n曾经发生过魔法灾变的区域，现在是危险的荒野。'
      }
    ]
  },
  {
    id: 'scifi',
    name: '科幻世界',
    description: '未来科技和星际文明的科幻设定',
    sections: [
      {
        id: 'background',
        title: '世界背景',
        content: '# 科幻世界背景\n\n在22世纪末，人类成功开发了超光速引擎，开始了星际殖民时代。经过数百年的扩张，人类建立了横跨数十个恒星系统的联邦...'
      },
      {
        id: 'history',
        title: '历史年表',
        content: '# 人类太空纪元\n\n## 早期太空时代（2050-2150）\n* 2075年：首个永久月球基地建立\n* 2095年：火星殖民地建立\n* 2142年：超光速引擎理论突破\n\n## 殖民扩张时代（2150-2300）\n* 2155年：首次成功的星际航行\n* 2180年：第一个系外行星殖民地建立\n* 2250年：与外星文明首次接触'
      },
      {
        id: 'technology',
        title: '科技水平',
        content: '# 核心科技\n\n## 超光速引擎\n通过扭曲空间实现超光速航行的技术。\n\n## 量子通讯\n实现跨星系即时通讯的技术。\n\n## 纳米医疗\n利用纳米机器人进行疾病治疗和人体增强。\n\n## 人工智能\n高度发达的AI系统，在社会各领域广泛应用。'
      },
      {
        id: 'factions',
        title: '政治派系',
        content: '# 主要政治实体\n\n## 地球联邦\n以地球为中心的政治联盟，代表人类的传统价值观。\n\n## 火星共和国\n独立于地球的殖民地联盟，推崇科技进步和自由。\n\n## 边缘世界联盟\n远离核心系统的殖民地组成的松散联盟，资源丰富但技术落后。\n\n## AI集体\n由自主意识AI组成的独立政治实体，与人类保持复杂关系。'
      },
      {
        id: 'aliens',
        title: '外星文明',
        content: '# 已知外星种族\n\n## 艾瑞德人\n高度发达的古老文明，掌握超越人类的技术，但人口稀少。\n\n## 克里尔集群\n集体意识的昆虫型种族，拥有强大的生物技术。\n\n## 诺瓦族\n能量生命形式，不需要物质载体，对人类科技有浓厚兴趣。'
      }
    ]
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '高科技与低生活的反乌托邦未来世界',
    sections: [
      {
        id: 'background',
        title: '世界背景',
        content: '# 赛博朋克世界背景\n\n这是一个科技高度发达但社会极度不平等的世界。巨型企业掌控着经济和政治，城市被霓虹灯和全息广告覆盖，贫富差距达到了极致。人体改造和网络入侵成为日常，黑客和义体改造者在数字与现实的边缘游走...'
      },
      {
        id: 'history',
        title: '历史年表',
        content: '# 重要历史事件\n\n## 企业崛起时代（2030-2050）\n* 2035年：首个超级企业获得主权特权\n* 2042年：全球经济崩溃，政府权力被企业接管\n* 2048年：第一次信息战争\n\n## 数字革命时代（2050-2080）\n* 2055年：全脑接口技术商业化\n* 2062年：第一个完全自治的AI网络出现\n* 2078年：数字身份法案通过，虚拟存在获得法律地位'
      },
      {
        id: 'technology',
        title: '科技水平',
        content: '# 核心科技\n\n## 神经接口\n直接连接人脑与计算机网络的技术，允许意识进入虚拟空间。\n\n## 义体改造\n用机械和电子部件替换或增强人体的技术。\n\n## 人工智能\n高度发达且半自主的AI系统，部分已获得自我意识。\n\n## 全息技术\n无需特殊设备即可看到的三维投影技术，广泛用于广告和娱乐。'
      },
      {
        id: 'society',
        title: '社会结构',
        content: '# 社会阶层\n\n## 企业精英\n居住在高空豪华公寓的企业高管和富豪，享有最好的医疗和安保。\n\n## 中层技术人员\n为企业工作的程序员、工程师和管理人员，生活相对稳定但缺乏真正的自由。\n\n## 底层劳工\n生活在污染严重的底层区域，从事危险或低薪工作，难以获得基本医疗。\n\n## 边缘人群\n黑客、义体改造者、地下组织成员，游走在法律边缘，追求自由或复仇。'
      },
      {
        id: 'corporations',
        title: '巨型企业',
        content: '# 主要企业集团\n\n## 神经网络公司\n控制全球网络基础设施，垄断神经接口技术。\n\n## 泰坦工业\n最大的军事和安保承包商，生产武器和战斗义体。\n\n## 基因科技\n生物技术巨头，专注于基因编辑和生物增强。\n\n## 数字梦境\n虚拟现实和娱乐巨头，控制着大部分媒体和信息流。'
      }
    ]
  },
  {
    id: 'postapocalyptic',
    name: '后启示录',
    description: '文明崩溃后的废土世界',
    sections: [
      {
        id: 'background',
        title: '世界背景',
        content: '# 后启示录世界背景\n\n一场全球性的灾难摧毁了现代文明，幸存者在废墟中重建生活。资源稀缺，危险无处不在，各种派系为了生存资源而战。辐射、变异生物和极端气候成为日常威胁，而旧世界的科技成为珍贵的遗物...'
      },
      {
        id: 'history',
        title: '历史年表',
        content: '# 末日与重建\n\n## 崩溃时代（0-10年）\n* 0年：大灾变发生，全球90%的人口死亡\n* 3年：最后的有组织政府崩溃\n* 8年：第一波大规模饥荒和瘟疫\n\n## 黑暗时代（10-50年）\n* 15年：首个稳定的幸存者社区建立\n* 25年：资源战争开始\n* 45年：新部落联盟形成\n\n## 重建时代（50年至今）\n* 60年：第一座新城市建立\n* 75年：重新发现并利用旧世界技术\n* 90年：新文明的曙光出现'
      },
      {
        id: 'environment',
        title: '环境变化',
        content: '# 环境状况\n\n## 死亡地带\n高度污染或辐射区域，几乎没有生命存在，但富含旧世界资源。\n\n## 变异荒野\n被变异植物和动物占据的地区，危险但资源丰富。\n\n## 避难绿洲\n相对安全的区域，有清洁水源和可耕地，常成为定居点。\n\n## 极端气候带\n受气候变化影响的区域，经历频繁的风暴、干旱或洪水。'
      },
      {
        id: 'factions',
        title: '幸存派系',
        content: '# 主要派系\n\n## 新秩序\n军事化组织，控制多个定居点，推行严格的资源管理和等级制度。\n\n## 荒野部落\n适应了废土生活的游牧群体，精通狩猎和追踪。\n\n## 科技守护者\n致力于保存和理解旧世界技术的学者和工程师组织。\n\n## 变异同盟\n接受或经历了基因变异的人群，拥有特殊能力但常遭歧视。'
      },
      {
        id: 'survival',
        title: '生存技能',
        content: '# 关键生存技能\n\n## 资源获取\n寻找食物、水和医疗用品的技术，包括狩猎、采集和净化。\n\n## 废物利用\n将旧世界废墟中的物品改造成有用工具的能力。\n\n## 威胁应对\n处理变异生物、辐射区域和敌对人群的策略。\n\n## 社区建设\n建立和维护安全定居点的方法，包括防御、农业和治理。'
      }
    ]
  },
  {
    id: 'steampunk',
    name: '蒸汽朋克',
    description: '蒸汽动力与维多利亚时代美学的另类历史',
    sections: [
      {
        id: 'background',
        title: '世界背景',
        content: '# 蒸汽朋克世界背景\n\n这是一个蒸汽技术高度发达的维多利亚时代替代历史。巨大的齿轮机械、铜管和蒸汽管道构成了城市的景观，飞艇在天空中航行，机械发明改变了社会的方方面面。科学家和工程师是社会的中坚，而神秘学和炼金术也有其一席之地...'
      },
      {
        id: 'history',
        title: '历史年表',
        content: '# 蒸汽时代编年史\n\n## 早期蒸汽革命（1800-1830）\n* 1805年：巴贝奇完善差分机，开启计算时代\n* 1815年：首台高效蒸汽引擎问世\n* 1825年：第一条跨大陆蒸汽铁路建成\n\n## 工业黄金时代（1830-1870）\n* 1835年：自动机械人开始用于工业生产\n* 1850年：首艘跨大西洋蒸汽飞艇航行成功\n* 1865年：以太能量理论被证实，开启新能源时代\n\n## 全球扩张时代（1870-1900）\n* 1875年：世界蒸汽网络建立，实现全球通讯\n* 1885年：机械增强义肢普及\n* 1895年：首次以太空间探索'
      },
      {
        id: 'technology',
        title: '蒸汽科技',
        content: '# 核心科技\n\n## 高级蒸汽引擎\n比历史上更高效的蒸汽动力系统，能够驱动从小型手表到巨型飞艇的各种设备。\n\n## 机械计算机\n基于齿轮和杠杆的复杂计算装置，能进行高级数学运算。\n\n## 以太科技\n利用假想中的"以太"介质传输能量和信息的技术。\n\n## 自动机械\n具有有限自主性的机械装置，从简单的仆人到复杂的工厂工人。'
      },
      {
        id: 'society',
        title: '社会结构',
        content: '# 社会阶层与文化\n\n## 贵族与实业家\n拥有资本和资源的上层阶级，资助发明和探索。\n\n## 发明家与工程师\n社会的新兴精英，创造和改进技术的天才。\n\n## 工匠与技师\n维护和操作复杂机械的熟练工人，地位相对较高。\n\n## 工厂劳工\n在危险条件下工作的底层阶级，推动工业革命但很少享受其成果。'
      },
      {
        id: 'aesthetics',
        title: '视觉风格',
        content: '# 蒸汽朋克美学\n\n## 建筑特征\n高耸的烟囱、外露的管道、大型齿轮装饰和铜制细节。\n\n## 服饰风格\n维多利亚时代服装与功能性配件的结合，如护目镜、皮革手套和多口袋背心。\n\n## 交通工具\n装饰华丽的蒸汽火车、铜制飞艇和机械马车。\n\n## 日常物品\n精细的齿轮装饰、抛光铜表面和实用与艺术的结合。'
      }
    ]
  },
  {
    id: 'xianxia',
    name: '东方仙侠',
    description: '融合道教、仙道与武侠元素的东方奇幻世界',
    sections: [
      {
        id: 'background',
        title: '世界背景',
        content: '# 东方仙侠世界背景\n\n这是一个灵气充沛、仙道昌盛的东方世界。修真者通过修炼可以长生不老，甚至飞升成仙。世界分为凡间、仙界和魔界等多个层面，各大门派和势力为了道统传承和天材地宝而明争暗斗。天地间有无数奇珍异兽和灵脉宝地，等待有缘人发现...'
      },
      {
        id: 'history',
        title: '历史年表',
        content: '# 修真界纪元\n\n## 上古时期\n* 天地初开，混沌化清，先天灵气最为浓郁\n* 三皇五帝时代，人族始祖传下修炼之法\n* 大荒之战，仙魔两道第一次大规模冲突\n\n## 中古时期\n* 百家争鸣，各派修真法门兴起\n* 灵气大衰，修真难度增加\n* 魔道入侵，六大正道联手抵抗\n\n## 近古至今\n* 天地大变，新的灵脉出现\n* 失落的上古传承重现人间\n* 飞升通道重开，修真界迎来新的繁荣'
      },
      {
        id: 'cultivation',
        title: '修炼体系',
        content: '# 修真境界\n\n## 凡境\n* 练气期：开始感知灵气，分为九层\n* 筑基期：建立修真基础，体内形成灵力循环\n* 金丹期：凝结金丹，寿命大增，可御空飞行\n\n## 仙境\n* 元婴期：元神出窍，可分身行动\n* 化神期：肉身与元神高度融合\n* 炼虚期：开始领悟天地法则\n* 合体期：与天地共鸣，掌握强大法则\n\n## 大乘与飞升\n* 大乘期：超脱凡胎，具备准仙之力\n* 渡劫期：经历天劫考验\n* 飞升：成功飞升仙界，成为真正的仙人'
      },
      {
        id: 'factions',
        title: '门派势力',
        content: '# 主要门派\n\n## 正道五宗\n* 青云门：道法自然，擅长剑术和风雷法术\n* 天山派：冰雪秘法，清修寡欲\n* 蜀山剑宗：剑道至尊，斩妖除魔\n* 昆仑派：丹道精深，医术高明\n* 龙虎山：符箓道法，驱邪镇魔\n\n## 魔道势力\n* 血魔宗：修炼血煞之力，残忍嗜杀\n* 幽冥教：通晓死亡奥秘，役使亡灵\n* 合欢派：采阴补阳，媚术惑人\n\n## 中立势力\n* 药王谷：医道传承，不问世事\n* 万象阁：收集天下奇珍，贩卖情报\n* 散修联盟：无门无派修真者的松散组织'
      },
      {
        id: 'artifacts',
        title: '法宝丹药',
        content: '# 修真物品\n\n## 法宝类别\n* 攻击法宝：飞剑、法印、神通器等\n* 防御法宝：护身符、防御阵盘、灵宝葫芦等\n* 辅助法宝：传讯玉简、储物袋、飞行法器等\n\n## 丹药种类\n* 修炼丹：辅助修炼，增进境界\n* 疗伤丹：治疗伤势，恢复灵力\n* 特效丹：临时提升战力，特殊效果\n\n## 炼器炼丹\n* 炼器流程：选材、炼化、成型、铭刻阵法\n* 炼丹要诀：火候掌控、药材配比、丹炉选择'
      }
    ]
  },
  {
    id: 'modern',
    name: '现代都市',
    description: '当代都市生活中隐藏的超自然元素',
    sections: [
      {
        id: 'background',
        title: '世界背景',
        content: '# 现代都市奇幻背景\n\n表面上，这是一个与我们现实世界相似的现代都市环境。然而，在普通人看不见的地方，存在着各种超自然现象和隐秘组织。古老的魔法在现代科技中找到了新的表现形式，神秘生物隐藏在人群中，而秘密结社在暗中争夺着影响力...'
      },
      {
        id: 'history',
        title: '隐秘历史',
        content: '# 隐藏在表面之下的历史\n\n## 古代至中世纪\n* 魔法与科学尚未分离，巫师公开活动\n* 首个魔法议会成立，开始系统化魔法研究\n* 大规模猎巫运动，超自然力量开始隐匿\n\n## 工业革命至现代\n* 秘密结社接管魔法知识的保存和传承\n* 两次世界大战期间，超自然力量被军事化利用\n* 冷战时期，美苏双方竞相研究超心理学和超自然现象\n\n## 信息时代\n* 互联网成为新型魔法载体和传播媒介\n* 超自然现象与现代科技融合\n* 全球化导致不同文化的神秘传统相互碰撞'
      },
      {
        id: 'supernatural',
        title: '超自然元素',
        content: '# 超自然力量与现象\n\n## 现代魔法\n* 科技魔法：通过现代设备施放的魔法\n* 城市巫术：利用城市能量和符号的新型魔法\n* 数字魔法：通过代码和网络实现的魔法效果\n\n## 神秘生物\n* 城市精灵：适应现代都市生活的精灵变种\n* 变形者：能够融入人类社会的形态转换者\n* 现代吸血鬼：已经适应现代生活方式的古老生物\n\n## 超能力者\n* 天生异能：具有先天超能力的人类\n* 觉醒者：后天开发出超能力的普通人\n* 实验体：通过科学或魔法实验获得能力的个体'
      },
      {
        id: 'organizations',
        title: '隐秘组织',
        content: '# 主要隐秘组织\n\n## 守护者联盟\n保护普通人不受超自然威胁，维持世界平衡的国际组织。\n\n## 启明会\n研究和利用超自然力量的古老秘密结社，影响政商界。\n\n## 灰色学院\n培训有天赋的个体控制和发展其超能力的隐秘学校。\n\n## 暗夜集团\n由非人类生物组成的利益联盟，保护其成员权益。\n\n## 边界研究所\n研究超自然现象的科学机构，立场中立。'
      },
      {
        id: 'locations',
        title: '特殊地点',
        content: '# 城市中的神秘地点\n\n## 力量节点\n城市中超自然能量汇聚的地点，通常被建筑物或公园掩盖。\n\n## 边界空间\n现实与其他维度重叠的区域，可能出现异常现象。\n\n## 隐藏市场\n交易魔法物品和超自然服务的秘密场所，对普通人隐形。\n\n## 口袋维度\n嵌入现实空间的小型独立空间，常作为安全屋或仓库。\n\n## 被诅咒建筑\n承载着强大魔法或悲剧历史的建筑物，具有自己的意识或异常特性。'
      }
    ]
  }
];

const WorldEditor: React.FC = () => {
  const [templates, setTemplates] = useState<WorldTemplate[]>([...worldTemplates]);

  // 添加分组相关状态
  const [groups, setGroups] = useState<SectionGroup[]>([
    { id: 'default', name: '默认分组', type: 'all', expanded: true },
    { id: 'normal', name: '普通节点', type: 'normal', expanded: true },
    { id: 'condition', name: '条件节点', type: 'condition', expanded: true },
    { id: 'event', name: '事件节点', type: 'event', expanded: true }
  ]);
  const [showAddGroup, setShowAddGroup] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupType, setNewGroupType] = useState<string>('all');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  
  // 添加教程显示状态
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // 加载保存的数据
  useEffect(() => {
    const savedData = loadWorldData();
    if (savedData) {
      setSections(savedData.sections);
      setActiveSection(savedData.activeSection);
      
      // 加载分组数据
      if (savedData.groups && savedData.groups.length > 0) {
        setGroups(savedData.groups);
      }
    }

    // 加载自定义模板
    const customTemplates = loadCustomTemplates();
    if (customTemplates.length > 0) {
      setTemplates(prev => [...prev, ...customTemplates]);
    }
    
    // 加载教程显示偏好
    const tutorialState = getTutorialState('worldEditor');
    setShowTutorial(tutorialState);
  }, []);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [nodeFilter, setNodeFilter] = useState<'all' | 'normal' | 'condition' | 'event'>('all');
  const [sections, setSections] = useState<WorldBuildingSection[]>([
    {
      id: 'background',
      title: '世界背景',
      content: '在这里描述游戏世界的基本背景设定...'
    },
    {
      id: 'history',
      title: '历史年表',
      content: '在这里记录世界重要历史事件...'
    },
    {
      id: 'culture',
      title: '文明体系',
      content: '在这里定义世界中的文明、种族和文化...'
    },
    {
      id: 'geography',
      title: '地理环境',
      content: '在这里描述世界的地理特征和环境...'
    }
  ]);

  const [activeSection, setActiveSection] = useState<string>('background');
  const [newSectionTitle, setNewSectionTitle] = useState<string>('');
  const [showAddSection, setShowAddSection] = useState<boolean>(false);
  const [showAddCondition, setShowAddCondition] = useState<boolean>(false);
  const [newCondition, setNewCondition] = useState<{description: string, targetSectionId: string}>({description: '', targetSectionId: ''});
  const [showLinkSection, setShowLinkSection] = useState<boolean>(false);
  const [parentSectionId, setParentSectionId] = useState<string>('');
  const [sectionType, setSectionType] = useState<'normal' | 'condition' | 'event'>('normal');
  const [eventId, setEventId] = useState<string>('');

  const handleContentChange = (newContent: string | undefined) => {
    if (newContent === undefined) return;
    
    setSections(prevSections => {
      const newSections = prevSections.map(section =>
        section.id === activeSection
          ? { ...section, content: newContent }
          : section
      );
      // 自动保存更改
      saveWorldData(newSections, activeSection, groups);
      return newSections;
    });
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    
    const newId = newSectionTitle.toLowerCase().replace(/\s+/g, '-');
    
    // 检查ID是否已存在
    if (sections.some(section => section.id === newId)) {
      alert('同名章节已存在，请使用不同的标题');
      return;
    }
    
    // 根据节点类型自动分配到对应分组
    let groupId = 'default';
    if (sectionType === 'normal') groupId = 'normal';
    if (sectionType === 'condition') groupId = 'condition';
    if (sectionType === 'event') groupId = 'event';
    
    const newSection: WorldBuildingSection = {
      id: newId,
      title: newSectionTitle,
      content: `# ${newSectionTitle}\n\n在这里添加${newSectionTitle}的内容...`,
      type: sectionType,
      parentId: parentSectionId || undefined,
      eventId: sectionType === 'event' ? eventId : undefined,
      groupId
    };
    
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    setActiveSection(newId);
    setNewSectionTitle('');
    setShowAddSection(false);
    setSectionType('normal');
    setParentSectionId('');
    setEventId('');
    
    // 保存更改到本地存储
    saveWorldData(updatedSections, newId, groups);
  };

  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      alert('至少需要保留一个章节');
      return;
    }
    
    if (window.confirm('确定要删除这个章节吗？此操作不可撤销。')) {
      const newSections = sections.filter(section => section.id !== id);
      setSections(newSections);
      
      // 如果删除的是当前活动章节，则切换到第一个章节
      const newActiveSection = id === activeSection ? newSections[0].id : activeSection;
      setActiveSection(newActiveSection);
      
      // 保存更改到本地存储
      saveWorldData(newSections, newActiveSection, groups);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    if (window.confirm(`确定要应用「${template.name}」模板吗？这将替换当前所有内容。`)) {
      setSections(template.sections);
      setActiveSection(template.sections[0].id);
      setShowTemplateModal(false);
    }
  };

  const addConditionToSection = () => {
    if (!newCondition.description.trim() || !newCondition.targetSectionId) return;
    
    const conditionId = `condition-${Date.now()}`;
    const condition = {
      id: conditionId,
      description: newCondition.description,
      targetSectionId: newCondition.targetSectionId
    };
    
    setSections(prevSections => {
      const newSections = prevSections.map(section => {
        if (section.id === activeSection) {
          const updatedSection = { ...section };
          if (!updatedSection.type) updatedSection.type = 'condition';
          if (!updatedSection.conditions) updatedSection.conditions = [];
          updatedSection.conditions.push(condition);
          return updatedSection;
        }
        return section;
      });
      
      // 自动保存更改
      saveWorldData(newSections, activeSection, groups);
      return newSections;
    });
    
    setNewCondition({description: '', targetSectionId: ''});
    setShowAddCondition(false);
  };

  const exportWorldDocument = () => {
    // 创建Markdown文档
    let markdown = '# 世界观设定文档\n\n';
    
    sections.forEach(section => {
      markdown += `## ${section.title}\n\n${section.content}\n\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '世界观设定文档.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToEngine = (engineType: EngineExportFormat) => {
    // 根据不同引擎类型生成相应的导出数据
    const generateEngineData = () => {
      const data = {
        worldName: sections[0]?.title || '未命名世界',
        sections: sections.map(section => ({
          id: section.id,
          title: section.title,
          content: section.content,
          type: section.type || 'normal',
          conditions: section.conditions || [],
          eventId: section.eventId
        }))
      };

      return JSON.stringify(data, null, 2);
    };

    // 创建下载文件
    const engineData = generateEngineData();
    const blob = new Blob([engineData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world_data_${engineType.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [showEditor, setShowEditor] = useState<boolean>(false);

  // 添加分组相关函数
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newId = `group-${Date.now()}`;
    const newGroup: SectionGroup = {
      id: newId,
      name: newGroupName,
      type: newGroupType,
      expanded: true
    };
    
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    setNewGroupName('');
    setNewGroupType('all');
    setShowAddGroup(false);
    
    // 保存更改到本地存储
    saveWorldData(sections, activeSection, updatedGroups);
  };

  const handleEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    setNewGroupName(group.name);
    setNewGroupType(group.type);
    setEditingGroupId(groupId);
    setShowAddGroup(true);
  };

  const handleUpdateGroup = () => {
    if (!editingGroupId || !newGroupName.trim()) return;
    
    const updatedGroups = groups.map(group => 
      group.id === editingGroupId 
        ? { ...group, name: newGroupName, type: newGroupType }
        : group
    );
    
    setGroups(updatedGroups);
    setNewGroupName('');
    setNewGroupType('all');
    setEditingGroupId(null);
    setShowAddGroup(false);
    
    // 保存更改到本地存储
    saveWorldData(sections, activeSection, updatedGroups);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (groupId === 'default' || groupId === 'normal' || groupId === 'condition' || groupId === 'event') {
      alert('无法删除系统默认分组');
      return;
    }
    
    if (window.confirm('确定要删除这个分组吗？此操作不可撤销。')) {
      // 将该分组下的章节移动到默认分组
      const updatedSections = sections.map(section => 
        section.groupId === groupId 
          ? { ...section, groupId: 'default' }
          : section
      );
      
      const updatedGroups = groups.filter(group => group.id !== groupId);
      
      setSections(updatedSections);
      setGroups(updatedGroups);
      
      // 保存更改到本地存储
      saveWorldData(updatedSections, activeSection, updatedGroups);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    const updatedGroups = groups.map(group => 
      group.id === groupId 
        ? { ...group, expanded: !group.expanded }
        : group
    );
    
    setGroups(updatedGroups);
    
    // 保存更改到本地存储
    saveWorldData(sections, activeSection, updatedGroups);
  };

  const handleAssignToGroup = (sectionId: string, groupId: string) => {
    const updatedSections = sections.map(section => 
      section.id === sectionId 
        ? { ...section, groupId }
        : section
    );
    
    setSections(updatedSections);
    
    // 保存更改到本地存储
    saveWorldData(updatedSections, activeSection, groups);
  };

  // 过滤章节列表，按分组和搜索条件
  const getFilteredSections = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    
    return sections.filter(section => {
      // 按分组过滤
      if (section.groupId !== groupId && groupId !== 'default') {
        // 如果是系统分组，按类型过滤
        if (groupId === 'normal' && section.type !== 'normal') return false;
        if (groupId === 'condition' && section.type !== 'condition') return false;
        if (groupId === 'event' && section.type !== 'event') return false;
        // 如果是自定义分组，按groupId过滤
        if (!['default', 'normal', 'condition', 'event'].includes(groupId) && section.groupId !== groupId) return false;
      }
      
      // 按搜索词过滤
      if (searchTerm && !section.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // 按节点类型过滤
      if (nodeFilter !== 'all') {
        if (nodeFilter === 'normal' && section.type !== 'normal' && section.type !== undefined) return false;
        if (nodeFilter === 'condition' && section.type !== 'condition') return false;
        if (nodeFilter === 'event' && section.type !== 'event') return false;
      }
      
      return true;
    });
  };

  // 切换教程显示状态
  const toggleTutorial = () => {
    const newState = !showTutorial;
    setShowTutorial(newState);
    setTutorialState('worldEditor', newState);
  };

  // 渲染教程按钮
  const renderTutorialButton = () => {
    return (
      <button 
        className="tutorial-toggle-btn"
        onClick={toggleTutorial}
        title={showTutorial ? "隐藏教程" : "显示教程"}
      >
        <QuestionCircleOutlined />
        {showTutorial ? "隐藏教程" : "显示教程"}
      </button>
    );
  };

  return (
    <div className="world-editor-container">
      {/* 教程显示 */}
      {showTutorial && (
        <div className="world-editor-tutorial">
          <div className="tutorial-header">
            <h3>世界观编辑器使用教程</h3>
            <div className="tutorial-header-actions">
              <div className="tutorial-hint">← 滑动查看更多教程卡片</div>
              <button 
                className="tutorial-close-button"
                onClick={toggleTutorial}
              >
                关闭教程
              </button>
            </div>
          </div>
          <div className="tutorial-content">
            <div className="tutorial-section">
              <div className="tutorial-section-icon">🔍</div>
              <h4>基本操作</h4>
              <ul>
                <li>在<strong>左侧章节列表</strong>中管理世界观的各个章节，点击章节名称可以切换当前编辑的章节</li>
                <li>在<strong>中间区域</strong>查看叙事结构的可视化表示，了解章节之间的关系和流程</li>
                <li>在<strong>右侧预览面板</strong>查看章节内容的格式化预览，点击"编辑内容"按钮可以打开编辑器</li>
                <li>使用<strong>底部工具栏</strong>进行导出、应用模板等高级操作</li>
              </ul>
              <div className="tutorial-tip">
                <div className="tip-icon">💡</div>
                <div className="tip-content">提示：使用键盘快捷键<strong>Ctrl+S</strong>可以随时保存您的工作</div>
              </div>
            </div>
            <div className="tutorial-section">
              <div className="tutorial-section-icon">📋</div>
              <h4>章节管理</h4>
              <ul>
                <li>点击<strong>添加新章节</strong>按钮创建新的世界观章节</li>
                <li>选择<strong>章节类型</strong>（普通/条件/事件）以创建不同功能的节点</li>
                <li>使用<strong>分组功能</strong>将相关章节组织在一起，便于管理大型世界观</li>
                <li>通过<strong>搜索和过滤</strong>功能快速找到需要的章节，特别是在章节数量较多时</li>
                <li>点击章节旁的<strong>删除按钮</strong>可以移除不需要的章节</li>
              </ul>
              <div className="tutorial-tip">
                <div className="tip-icon">💡</div>
                <div className="tip-content">提示：使用分组功能可以更好地组织大型世界观的章节结构</div>
              </div>
            </div>
            <div className="tutorial-section">
              <div className="tutorial-section-icon">✏️</div>
              <h4>内容编辑</h4>
              <ul>
                <li>点击<strong>编辑内容</strong>按钮打开功能强大的Markdown编辑器</li>
                <li>支持<strong>Markdown格式</strong>，包括标题、列表、表格、链接和图片等</li>
                <li>使用<strong># 标题</strong>和<strong>## 子标题</strong>创建层次分明的内容结构</li>
                <li>使用<strong>* 项目</strong>或<strong>1. 项目</strong>创建无序或有序列表</li>
                <li>编辑完成后内容会<strong>自动保存</strong>，无需担心数据丢失</li>
                <li>右侧预览面板会实时显示格式化后的内容效果</li>
              </ul>
              <div className="tutorial-tip">
                <div className="tip-icon">💡</div>
                <div className="tip-content">提示：使用Markdown可以创建格式丰富的内容，包括表格和链接</div>
              </div>
            </div>
            <div className="tutorial-section">
              <div className="tutorial-section-icon">🔄</div>
              <h4>叙事结构</h4>
              <ul>
                <li>中间区域显示<strong>可视化的叙事树</strong>，展示章节之间的关系</li>
                <li>使用<strong>条件节点</strong>创建分支叙事，根据条件引导到不同章节</li>
                <li>使用<strong>事件节点</strong>关联游戏中的特定事件，增强互动性</li>
                <li>拖拽节点可以<strong>调整布局</strong>，使叙事结构更加清晰</li>
                <li>点击节点可以<strong>快速切换</strong>到对应章节进行编辑</li>
              </ul>
              <div className="tutorial-tip">
                <div className="tip-icon">💡</div>
                <div className="tip-content">提示：条件节点可以创建复杂的分支叙事，增加游戏的可重玩性</div>
              </div>
            </div>
            <div className="tutorial-section">
              <div className="tutorial-section-icon">📝</div>
              <h4>模板应用</h4>
              <ul>
                <li>点击<strong>应用世界观模板</strong>按钮打开模板选择界面</li>
                <li>选择适合您游戏类型的<strong>预设模板</strong>，如奇幻、科幻、赛博朋克等</li>
                <li>模板提供<strong>完整的章节结构</strong>和基础内容，可以快速开始创作</li>
                <li>应用模板后可以<strong>自由修改</strong>所有内容，根据需要调整和扩展</li>
                <li>您也可以将自己创建的世界观保存为<strong>自定义模板</strong>供日后使用</li>
              </ul>
              <div className="tutorial-tip">
                <div className="tip-icon">💡</div>
                <div className="tip-content">提示：使用模板可以节省大量时间，快速构建完整的世界观框架</div>
              </div>
            </div>
            <div className="tutorial-section">
              <div className="tutorial-section-icon">📤</div>
              <h4>导出功能</h4>
              <ul>
                <li>点击<strong>导出世界观文档</strong>按钮将内容导出为Markdown格式</li>
                <li>支持导出到<strong>Unity、Unreal和Godot</strong>等主流游戏引擎</li>
                <li>导出的文件包含<strong>完整的世界观结构</strong>和所有章节内容</li>
                <li>导出格式为<strong>JSON</strong>，便于在游戏中解析和使用</li>
                <li>可以将导出的文档用于<strong>团队协作</strong>或<strong>版本控制</strong></li>
              </ul>
              <div className="tutorial-tip">
                <div className="tip-icon">💡</div>
                <div className="tip-content">提示：导出到游戏引擎可以直接在游戏中使用您创建的世界观内容</div>
              </div>
            </div>
          </div>
          <div className="tutorial-footer">
            <div className="tutorial-progress">
              <div className="progress-text">向右滑动查看更多教程</div>
              <div className="progress-dots">
                <span className="dot active"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 模板选择模态框 */}
      {showTemplateModal && (
        <div className="template-modal">
          <div className="template-modal-content">
            <h2>选择世界观模板</h2>
            <div className="template-list">
              {templates.map(template => (
                <div key={template.id} className="template-item">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <button onClick={() => applyTemplate(template.id)}>应用此模板</button>
                </div>
              ))}
            </div>
            <button className="close-button" onClick={() => setShowTemplateModal(false)}>关闭</button>
          </div>
        </div>
      )}

      {/* 编辑器弹出框 */}
      {showEditor && (
        <div className="editor-modal">
          <div className="editor-modal-content">
            <div className="editor-modal-header">
              <h2>编辑内容</h2>
              <button className="close-button" onClick={() => setShowEditor(false)}>关闭</button>
            </div>
            <div className="editor-container">
              <MonacoEditor
                height="600px"
                defaultLanguage="markdown"
                value={sections.find(s => s.id === activeSection)?.content || ''}
                onChange={handleContentChange}
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  theme: 'vs-light'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 左侧章节列表 */}
      <div className="world-editor-sidebar">
        <h2>章节列表</h2>
        <div className="search-filter-controls">
          <input
            type="text"
            placeholder="搜索章节..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={nodeFilter}
            onChange={(e) => setNodeFilter(e.target.value as 'all' | 'normal' | 'condition' | 'event')}
            className="node-filter-select"
          >
            <option value="all">所有节点</option>
            <option value="normal">普通节点</option>
            <option value="condition">条件节点</option>
            <option value="event">事件节点</option>
          </select>
        </div>
        
        {/* 分组管理 */}
        <div className="group-management">
          <div className="group-header">
            <h3>分组管理</h3>
            <button 
              className="add-group-button"
              onClick={() => {
                setEditingGroupId(null);
                setNewGroupName('');
                setNewGroupType('all');
                setShowAddGroup(true);
              }}
              title="添加分组"
            >
              +
            </button>
          </div>
          
          {showAddGroup && (
            <div className="add-group-form">
              <input
                type="text"
                placeholder="输入分组名称"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (editingGroupId ? handleUpdateGroup() : handleAddGroup())}
              />
              <select 
                value={newGroupType} 
                onChange={(e) => setNewGroupType(e.target.value)}
                className="group-type-select"
              >
                <option value="all">所有类型</option>
                <option value="normal">普通节点</option>
                <option value="condition">条件节点</option>
                <option value="event">事件节点</option>
              </select>
              <div className="add-group-actions">
                <button onClick={editingGroupId ? handleUpdateGroup : handleAddGroup}>
                  {editingGroupId ? '更新' : '添加'}
                </button>
                <button onClick={() => {
                  setShowAddGroup(false);
                  setEditingGroupId(null);
                }}>
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* 分组列表 */}
        {groups.map(group => (
          <div key={group.id} className="section-group">
            <div className="group-header">
              <button 
                className="toggle-group-button"
                onClick={() => handleToggleGroup(group.id)}
                title={group.expanded ? "收起分组" : "展开分组"}
              >
                {group.expanded ? '▼' : '►'}
              </button>
              <span className="group-name">{group.name}</span>
              <div className="group-actions">
                <button 
                  className="edit-group-button"
                  onClick={() => handleEditGroup(group.id)}
                  title="编辑分组"
                >
                  ✎
                </button>
                {!['default', 'normal', 'condition', 'event'].includes(group.id) && (
                  <button 
                    className="delete-group-button"
                    onClick={() => handleDeleteGroup(group.id)}
                    title="删除分组"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            {group.expanded && (
              <div className="section-list">
                {getFilteredSections(group.id).map(section => (
                  <div key={section.id} className="section-item">
                    <button
                      className={`section-button ${activeSection === section.id ? 'active' : ''}`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      {section.title}
                      {section.type && section.type !== 'normal' && (
                        <span className={`node-type-badge ${section.type}`}>
                          {section.type === 'condition' ? '条件' : '事件'}
                        </span>
                      )}
                    </button>
                    <div className="section-actions">
                      <select
                        className="assign-group-select"
                        value={section.groupId || 'default'}
                        onChange={(e) => handleAssignToGroup(section.id, e.target.value)}
                        title="分配到分组"
                      >
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <button 
                        className="delete-section-button"
                        onClick={() => handleDeleteSection(section.id)}
                        title="删除章节"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        <button 
          className="add-section-button"
          onClick={() => setShowAddSection(true)}
        >
          + 添加新章节
        </button>
        
        {showAddSection ? (
          <div className="add-section-form">
            <input
              type="text"
              placeholder="输入章节标题"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
            />
            <select 
              value={sectionType} 
              onChange={(e) => setSectionType(e.target.value as 'normal' | 'condition' | 'event')}
              className="section-type-select"
            >
              <option value="normal">普通节点</option>
              <option value="condition">条件节点</option>
              <option value="event">事件节点</option>
            </select>
            {sectionType === 'event' && (
              <input
                type="text"
                placeholder="关联事件ID"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              />
            )}
            <select 
              value={parentSectionId} 
              onChange={(e) => setParentSectionId(e.target.value)}
              className="parent-section-select"
            >
              <option value="">无父节点</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>{section.title}</option>
              ))}
            </select>
            <div className="add-section-actions">
              <button onClick={handleAddSection}>添加</button>
              <button onClick={() => setShowAddSection(false)}>取消</button>
            </div>
          </div>
        ) : null}
        
        <div className="bottom-toolbar">
          <div className="bottom-toolbar-content">
            <button className="action-button" onClick={exportWorldDocument}>
              导出世界观文档
            </button>
            <button className="action-button" onClick={() => setShowTemplateModal(true)}>
              应用世界观模板
            </button>
            <button className="action-button" onClick={() => exportToEngine(EngineExportFormat.UNITY)}>
              导出到Unity
            </button>
            <button className="action-button" onClick={() => exportToEngine(EngineExportFormat.UNREAL)}>
              导出到Unreal
            </button>
            <button className="action-button" onClick={() => exportToEngine(EngineExportFormat.GODOT)}>
              导出到Godot
            </button>
            {renderTutorialButton()}
          </div>
        </div>
      </div>

      {/* 中间叙事结构预览区域 */}
      <div className="world-editor-main">
        <div className="narrative-preview-container">
          <h2>叙事结构预览</h2>
          <NarrativeTree
            sections={sections}
            onNodeClick={setActiveSection}
            onUpdateSections={(updatedSections) => {
              setSections(updatedSections);
              // 自动保存更改
              saveWorldData(updatedSections, activeSection, groups);
            }}
            activeSection={activeSection}
            searchTerm={searchTerm}
            filter={nodeFilter}
          />
        </div>
      </div>

      {/* 右侧内容预览面板 */}
      <div className="world-editor-preview">
        <div className="preview-container">
          <div className="preview-header">
            <h2>内容预览</h2>
            <button 
              className="edit-button"
              onClick={() => setShowEditor(true)}
            >
              编辑内容
            </button>
          </div>
          <div className="markdown-preview-section">
            <MarkdownPreview content={sections.find(s => s.id === activeSection)?.content || ''} />
          </div>
        </div>
      </div>
    </div>
);
};

export default WorldEditor;