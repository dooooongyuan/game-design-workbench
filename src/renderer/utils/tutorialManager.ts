/**
 * 教程管理工具
 * 用于管理各个模块的教程显示状态
 */

/**
 * 获取教程显示状态
 * @param moduleName 模块名称
 * @returns 是否显示教程
 */
export const getTutorialState = (moduleName: string): boolean => {
  try {
    const key = `${moduleName}_showTutorial`;
    const value = localStorage.getItem(key);
    return value === 'true';
  } catch (error) {
    console.error(`获取${moduleName}教程显示状态失败:`, error);
    return false; // 默认不显示
  }
};

/**
 * 设置教程显示状态
 * @param moduleName 模块名称
 * @param show 是否显示教程
 */
export const setTutorialState = (moduleName: string, show: boolean): void => {
  try {
    const key = `${moduleName}_showTutorial`;
    localStorage.setItem(key, String(show));
  } catch (error) {
    console.error(`设置${moduleName}教程显示状态失败:`, error);
  }
};

/**
 * 切换教程显示状态
 * @param moduleName 模块名称
 * @param currentState 当前显示状态
 * @returns 新的显示状态
 */
export const toggleTutorialState = (moduleName: string, currentState: boolean): boolean => {
  const newState = !currentState;
  setTutorialState(moduleName, newState);
  return newState;
};

/**
 * 创建教程钩子
 * @param moduleName 模块名称
 * @param initialState 初始状态
 * @returns 教程状态和切换函数
 */
export const createTutorialHook = (moduleName: string, initialState: boolean = false) => {
  // 获取初始状态
  const storedState = getTutorialState(moduleName);
  const initialShowTutorial = storedState !== null ? storedState : initialState;
  
  return {
    initialShowTutorial,
    toggleTutorial: (currentState: boolean) => toggleTutorialState(moduleName, currentState)
  };
}; 