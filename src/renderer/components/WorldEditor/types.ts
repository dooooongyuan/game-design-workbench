/**
 * 世界观编辑器类型定义文件
 */

/**
 * 章节分组接口
 */
export interface SectionGroup {
  id: string;        // 分组唯一标识符
  name: string;      // 分组名称
  type: string;      // 分组类型（用于过滤）
  order?: number;    // 分组排序（可选）
  color?: string;    // 分组颜色（可选）
  expanded?: boolean; // 分组是否展开（可选）
}

/**
 * 世界观构建章节接口
 */
export interface WorldBuildingSection {
  id: string;        // 章节唯一标识符
  title: string;     // 章节标题
  content: string;   // 章节内容（Markdown格式）
  order?: number;    // 章节排序（可选）
  parentId?: string; // 父节点ID（可选，用于构建树状结构）
  type?: 'normal' | 'condition' | 'event'; // 节点类型（普通/条件/事件）
  conditions?: NarrativeCondition[]; // 条件分支（可选）
  eventId?: string;  // 关联游戏事件ID（可选）
  probability?: number; // 概率权重（可选，用于随机分支）
  nodeSize?: { // 节点自定义尺寸（可选）
    radius: number; // 节点半径
  };
  linkLength?: number; // 连接线长度（可选，用于自定义节点间距）
  groupId?: string;   // 所属分组ID（可选）
}

/**
 * 叙事条件接口
 */
export interface NarrativeCondition {
  id: string;        // 条件唯一标识符
  description: string; // 条件描述
  targetSectionId: string; // 满足条件后跳转的章节ID
  expression?: string; // 条件表达式（可选，用于高级逻辑）
}

/**
 * 世界观模板接口
 */
export interface WorldTemplate {
  id: string;                      // 模板唯一标识符
  name: string;                    // 模板名称
  description: string;             // 模板描述
  sections: WorldBuildingSection[]; // 模板包含的章节
  author?: string;                 // 模板作者（可选）
  createdAt?: number;              // 创建时间戳（可选）
  tags?: string[];                 // 模板标签（可选）
}

/**
 * 自定义模板表单接口
 */
export interface TemplateFormData {
  name: string;
  description: string;
  author: string;
  tags: string;
}

/**
 * 世界观数据导出格式接口
 */
export interface WorldExportData {
  title: string;                   // 文档标题
  author?: string;                 // 作者
  createdAt: number;               // 创建时间
  lastModified: number;            // 最后修改时间
  sections: WorldBuildingSection[]; // 章节内容
  metadata?: Record<string, any>;  // 额外元数据
}

/**
 * 引擎导出格式枚举
 */
export enum EngineExportFormat {
  UNITY = 'UNITY',
  UNREAL = 'UNREAL',
  GODOT = 'GODOT'
}