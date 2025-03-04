/**
 * 世界观编辑器本地存储服务
 * 用于保存和加载用户的世界观编辑内容
 */

import { WorldBuildingSection, WorldTemplate, SectionGroup } from './types';

// 本地存储键名
const WORLD_DATA_KEY = 'world_editor_data';
const CUSTOM_TEMPLATES_KEY = 'world_editor_custom_templates';

/**
 * 保存世界观数据到本地存储
 * @param sections 章节数据
 * @param activeSection 当前活动章节ID
 */
export const saveWorldData = (
  sections: WorldBuildingSection[], 
  activeSection: string,
  groups?: SectionGroup[]
) => {
  try {
    const data = {
      sections,
      activeSection,
      groups,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(WORLD_DATA_KEY, JSON.stringify(data));
    console.log('世界观数据已保存', data);
    return true;
  } catch (error) {
    console.error('保存世界观数据失败', error);
    return false;
  }
};

/**
 * 从本地存储加载世界观数据
 */
export const loadWorldData = () => {
  try {
    const data = localStorage.getItem(WORLD_DATA_KEY);
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    console.log('加载世界观数据', parsedData);
    return parsedData;
  } catch (error) {
    console.error('加载世界观数据失败', error);
    return null;
  }
};

/**
 * 保存自定义模板到本地存储
 */
export const saveCustomTemplate = (template: WorldTemplate): void => {
  try {
    // 先获取现有的模板
    const existingTemplatesStr = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    const existingTemplates: WorldTemplate[] = existingTemplatesStr 
      ? JSON.parse(existingTemplatesStr) 
      : [];
    
    // 检查是否已存在相同ID的模板
    const templateIndex = existingTemplates.findIndex(t => t.id === template.id);
    
    if (templateIndex >= 0) {
      // 更新现有模板
      existingTemplates[templateIndex] = template;
    } else {
      // 添加新模板
      existingTemplates.push(template);
    }
    
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(existingTemplates));
    console.log('自定义模板已保存');
  } catch (error) {
    console.error('保存自定义模板失败:', error);
  }
};

/**
 * 从本地存储加载自定义模板
 */
export const loadCustomTemplates = (): WorldTemplate[] => {
  try {
    const storedTemplates = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (!storedTemplates) return [];
    
    const parsedTemplates = JSON.parse(storedTemplates) as WorldTemplate[];
    console.log('从本地存储加载了自定义模板');
    return parsedTemplates;
  } catch (error) {
    console.error('加载自定义模板失败:', error);
    return [];
  }
};

/**
 * 删除自定义模板
 */
export const deleteCustomTemplate = (templateId: string): boolean => {
  try {
    const existingTemplatesStr = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (!existingTemplatesStr) return false;
    
    const existingTemplates: WorldTemplate[] = JSON.parse(existingTemplatesStr);
    const filteredTemplates = existingTemplates.filter(t => t.id !== templateId);
    
    if (filteredTemplates.length === existingTemplates.length) {
      return false; // 没有找到要删除的模板
    }
    
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filteredTemplates));
    console.log('自定义模板已删除');
    return true;
  } catch (error) {
    console.error('删除自定义模板失败:', error);
    return false;
  }
};