import React, { useRef, useEffect, useState } from 'react';
import './TwoDLayoutEditor.css';

interface LevelObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  properties: Record<string, any>;
}

interface LevelData {
  name: string;
  objects: LevelObject[];
  terrain: any[];
  properties: Record<string, any>;
}

interface TwoDLayoutEditorProps {
  levelData: LevelData;
  onLevelDataChange: (newData: Partial<LevelData>) => void;
}

interface GridObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  properties: Record<string, any>;
}

const TwoDLayoutEditor: React.FC<TwoDLayoutEditorProps> = ({ levelData, onLevelDataChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [objects, setObjects] = useState<GridObject[]>(
    levelData.objects.map(obj => ({
      ...obj,
      rotation: obj.rotation || 0
    }))
  );
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [isEditingProperty, setIsEditingProperty] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [isUpdatingFromParent, setIsUpdatingFromParent] = useState<boolean>(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // 添加调试日志
  useEffect(() => {
    console.log('TwoDLayoutEditor 接收到新的关卡数据:', levelData);
    console.log('对象数量:', levelData.objects?.length || 0);
    if (levelData.objects?.length > 0) {
      console.log('第一个对象:', levelData.objects[0]);
    }
    
    // 不要在这里调用updateDebugInfo，避免重复更新
  }, [levelData]);
  
  // 更新调试信息
  const updateDebugInfo = () => {
    // 如果调试面板未显示，不更新调试信息
    if (!showDebugPanel) return;
    
    try {
      const objectCount = objects.length;
      const validObjects = objects.filter(obj => 
        obj && obj.id && obj.type && 
        typeof obj.x === 'number' && typeof obj.y === 'number' &&
        typeof obj.width === 'number' && typeof obj.height === 'number'
      ).length;
      
      let info = `对象总数: ${objectCount}\n`;
      info += `有效对象: ${validObjects}\n`;
      info += `无效对象: ${objectCount - validObjects}\n`;
      
      if (objectCount > 0) {
        const types = new Set(objects.map(obj => obj.type));
        info += `对象类型: ${Array.from(types).join(', ')}`;
      }
      
      setDebugInfo(info);
    } catch (error) {
      console.error('更新调试信息时出错:', error);
    }
  };

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // 绘制画布内容
    drawCanvas();
  }, [objects, scale, offset, showGrid, gridSize]); // 使用objects而不是levelData

  // 同步对象数据到父组件 - 修改为只在本地状态变化且不是从父组件更新时才同步
  useEffect(() => {
    // 只有当不是从父组件更新时，才将本地状态同步到父组件
    if (!isUpdatingFromParent) {
      console.log('将本地objects同步到父组件, 对象数量:', objects.length);
      onLevelDataChange({ objects });
    }
  }, [objects, onLevelDataChange, isUpdatingFromParent]);

  // 从父组件同步数据到本地状态 - 修改为设置标志防止循环更新
  useEffect(() => {
    console.log('从父组件同步数据到本地, 对象数量:', levelData.objects?.length || 0);
    
    // 检查是否真的有变化，避免不必要的更新
    const currentIds = new Set(objects.map(obj => obj.id));
    const newIds = new Set(levelData.objects.map(obj => obj.id));
    
    // 检查ID集合是否相同
    const idsChanged = currentIds.size !== newIds.size || 
      [...currentIds].some(id => !newIds.has(id)) ||
      [...newIds].some(id => !currentIds.has(id));
    
    // 检查对象属性是否有变化
    const objectsChanged = idsChanged || levelData.objects.some((newObj, index) => {
      if (index >= objects.length) return true;
      const oldObj = objects.find(o => o.id === newObj.id);
      if (!oldObj) return true;
      
      return (
        oldObj.x !== newObj.x ||
        oldObj.y !== newObj.y ||
        oldObj.width !== newObj.width ||
        oldObj.height !== newObj.height ||
        oldObj.type !== newObj.type ||
        oldObj.rotation !== (newObj.rotation || 0)
      );
    });
    
    if (objectsChanged) {
      // 设置标志，表示正在从父组件更新
      setIsUpdatingFromParent(true);
      
      setObjects(levelData.objects.map(obj => ({
        ...obj,
        rotation: obj.rotation || 0
      })));
      
      // 使用setTimeout确保在状态更新后再重置标志
      setTimeout(() => {
        setIsUpdatingFromParent(false);
      }, 0);
    }
  }, [levelData.objects]); // 只依赖于levelData.objects，而不是整个levelData
  
  // 更新调试信息
  useEffect(() => {
    // 只在调试面板显示时更新调试信息
    if (showDebugPanel) {
      updateDebugInfo();
    }
  }, [objects, showDebugPanel]); // 只在objects或showDebugPanel变化时更新
  
  // 在组件挂载时添加日志
  useEffect(() => {
    console.log("TwoDLayoutEditor 组件挂载，初始对象数:", objects.length);
    
    return () => {
      console.log("TwoDLayoutEditor 组件卸载");
    };
  }, []);

  // 绘制画布内容
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // 绘制对象
    drawObjects(ctx);
  };

  // 绘制网格
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    const scaledGridSize = gridSize * scale;
    const offsetX = offset.x % scaledGridSize;
    const offsetY = offset.y % scaledGridSize;

    // 绘制垂直线
    for (let x = offsetX; x < width; x += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = offsetY; y < height; y += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  // 绘制对象
  const drawObjects = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    // 应用缩放和偏移
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 绘制所有对象
    objects.forEach(obj => {
      const isSelected = obj.id === selectedObject;
      
      // 设置对象样式
      ctx.fillStyle = isSelected ? '#4a90e2' : '#8bc34a';
      ctx.strokeStyle = isSelected ? '#2c6cb9' : '#689f38';
      ctx.lineWidth = isSelected ? 2 / scale : 1 / scale;

      // 绘制对象
      ctx.beginPath();
      ctx.rect(obj.x, obj.y, obj.width, obj.height);
      ctx.fill();
      ctx.stroke();

      // 绘制对象类型文本
      ctx.fillStyle = '#fff';
      ctx.font = `${12 / scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.type, obj.x + obj.width / 2, obj.y + obj.height / 2);
    });

    ctx.restore();
  };

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 如果点击的是对象或调整大小的控件，不要触发画布拖动
    const target = e.target as HTMLElement;
    if (target.className.includes('grid-object') || target.className.includes('resize-handle')) {
      return;
    }

    // 开始拖动画布
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setSelectedObject(null);
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || isResizing || selectedObject) return;

    // 只有在拖动画布时才执行这个逻辑
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // 更新偏移和拖动起点
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // 处理鼠标松开事件
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // 处理鼠标滚轮事件
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 计算鼠标位置相对于画布的位置（考虑当前偏移和缩放）
    const canvasX = (mouseX - offset.x) / scale;
    const canvasY = (mouseY - offset.y) / scale;

    // 计算新的缩放比例
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * delta));

    // 计算新的偏移量，使鼠标指向的点保持不变
    const newOffsetX = mouseX - canvasX * newScale;
    const newOffsetY = mouseY - canvasY * newScale;

    // 更新缩放和偏移
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // 查找指定位置的对象
  const findObjectAtPosition = (x: number, y: number): string | null => {
    // 转换为画布坐标
    const canvasX = (x - offset.x) / scale;
    const canvasY = (y - offset.y) / scale;

    // 从后向前检查（后绘制的对象在上层）
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (
        canvasX >= obj.x &&
        canvasX <= obj.x + obj.width &&
        canvasY >= obj.y &&
        canvasY <= obj.y + obj.height
      ) {
        return obj.id;
      }
    }

    return null;
  };

  // 添加新对象
  const addObject = (type: string) => {
    const newObject: GridObject = {
      id: `obj_${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      rotation: 0,
      properties: {}
    };

    setObjects(prev => [...prev, newObject]);
    setSelectedObject(newObject.id);
  };

  // 处理拖放事件
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log('拖放事件触发');
    
    try {
      const objectType = e.dataTransfer.getData('text/plain');
      console.log('接收到拖放事件，对象类型:', objectType);
      
      if (!objectType) {
        console.warn('拖放事件没有对象类型数据');
        return;
      }

      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) {
        console.warn('无法获取网格元素位置');
        return;
      }

      // 计算网格坐标 - 修复计算方法
      const canvasX = (e.clientX - rect.left - offset.x) / scale;
      const canvasY = (e.clientY - rect.top - offset.y) / scale;
      
      // 对齐到网格
      const x = Math.floor(canvasX / gridSize) * gridSize;
      const y = Math.floor(canvasY / gridSize) * gridSize;

      console.log('拖放位置:', { clientX: e.clientX, clientY: e.clientY, canvasX, canvasY, x, y });

      // 创建新对象
      const newObject: GridObject = {
        id: `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`, // 添加随机数，确保ID唯一
        type: objectType,
        x,
        y,
        width: gridSize * 2, // 默认大小为两个网格
        height: gridSize * 2,
        rotation: 0,
        properties: {}
      };

      console.log('准备添加新对象:', newObject);
      
      // 设置标志，防止循环更新
      setIsUpdatingFromParent(true);
      
      // 使用函数式更新，避免依赖于先前的状态
      setObjects(prev => {
        const newObjects = [...prev, newObject];
        console.log(`更新后对象数量: ${newObjects.length}`);
        return newObjects;
      });
      
      setSelectedObject(newObject.id);
      
      // 使用setTimeout确保在状态更新后再重置标志
      setTimeout(() => {
        setIsUpdatingFromParent(false);
      }, 0);
      
      // 添加成功提示
      console.log('成功添加新对象:', newObject);
      
      // 移除拖动样式
      document.body.classList.remove('dragging');
      gridRef.current?.classList.remove('drag-over');
    } catch (error) {
      console.error('拖放对象时出错:', error);
    }
  };

  // 处理拖放进入事件
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // 添加视觉反馈
    gridRef.current?.classList.add('drag-over');
  };
  
  // 处理拖放离开事件
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // 移除视觉反馈
    gridRef.current?.classList.remove('drag-over');
  };

  // 处理对象选择
  const handleObjectClick = (e: React.MouseEvent, objectId: string) => {
    e.stopPropagation();
    setSelectedObject(objectId);
  };

  // 处理对象移动
  const handleObjectDragStart = (e: React.MouseEvent, objectId: string) => {
    e.stopPropagation();
    
    const selectedObj = objects.find(obj => obj.id === objectId);
    if (!selectedObj) return;

    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;

    // 计算鼠标相对于对象的偏移量
    const mouseX = (e.clientX - rect.left - offset.x) / scale;
    const mouseY = (e.clientY - rect.top - offset.y) / scale;
    
    setSelectedObject(objectId);
    setIsDragging(true);
    setDragStart({
      x: mouseX - selectedObj.x,
      y: mouseY - selectedObj.y
    });
  };

  const handleObjectDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedObject || isResizing) return;

    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;

    // 计算鼠标在画布上的实际位置
    const mouseX = (e.clientX - rect.left - offset.x) / scale;
    const mouseY = (e.clientY - rect.top - offset.y) / scale;

    // 考虑鼠标相对于对象的偏移量
    const newX = Math.round((mouseX - dragStart.x) / gridSize) * gridSize;
    const newY = Math.round((mouseY - dragStart.y) / gridSize) * gridSize;
    
    // 使用函数式更新，确保基于最新状态
    setObjects(prev => {
      return prev.map(obj => {
        if (obj.id === selectedObject) {
          return { 
            ...obj, 
            x: newX,
            y: newY
          };
        }
        return obj;
      });
    });
  };

  // 处理对象调整大小
  const handleResizeStart = (e: React.MouseEvent, objectId: string, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    setSelectedObject(objectId);
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!isResizing || !selectedObject) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // 计算网格对齐的调整量
    const gridDx = Math.round(dx / (gridSize * scale)) * gridSize;
    const gridDy = Math.round(dy / (gridSize * scale)) * gridSize;
    
    if (gridDx !== 0 || gridDy !== 0) {
      // 使用函数式更新，确保基于最新状态
      setObjects(prev => {
        // 创建一个新数组，避免直接修改原数组
        return prev.map(obj => {
          if (obj.id === selectedObject) {
            // 创建对象的副本
            const newObj = { ...obj };
            
            if (resizeDirection.includes('e')) {
              newObj.width = Math.max(gridSize, obj.width + gridDx);
            }
            if (resizeDirection.includes('w')) {
              const newWidth = Math.max(gridSize, obj.width - gridDx);
              if (newWidth !== obj.width) {
                newObj.x = obj.x - (newWidth - obj.width);
                newObj.width = newWidth;
              }
            }
            if (resizeDirection.includes('s')) {
              newObj.height = Math.max(gridSize, obj.height + gridDy);
            }
            if (resizeDirection.includes('n')) {
              const newHeight = Math.max(gridSize, obj.height - gridDy);
              if (newHeight !== obj.height) {
                newObj.y = obj.y - (newHeight - obj.height);
                newObj.height = newHeight;
              }
            }
            
            return newObj;
          }
          return obj;
        });
      });
      
      // 更新拖动起点
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // 处理对象删除
  const handleDeleteObject = () => {
    if (selectedObject) {
      setObjects(prev => prev.filter(obj => obj.id !== selectedObject));
      setSelectedObject(null);
    }
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 删除对象
      if (e.key === 'Delete' && selectedObject) {
        handleDeleteObject();
      }
      
      // 复制对象 (Ctrl+C)
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedObject) {
        const objToCopy = objects.find(obj => obj.id === selectedObject);
        if (objToCopy) {
          localStorage.setItem('copiedObject', JSON.stringify(objToCopy));
        }
      }
      
      // 粘贴对象 (Ctrl+V)
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        const copiedObjectStr = localStorage.getItem('copiedObject');
        if (copiedObjectStr) {
          try {
            const copiedObject = JSON.parse(copiedObjectStr) as GridObject;
            const newObject: GridObject = {
              ...copiedObject,
              id: `obj_${Date.now()}`,
              x: copiedObject.x + gridSize,
              y: copiedObject.y + gridSize
            };
            
            setObjects(prev => [...prev, newObject]);
            setSelectedObject(newObject.id);
          } catch (error) {
            console.error('Failed to paste object:', error);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedObject, objects, gridSize]);

  // 渲染网格
  const renderGrid = () => {
    // 预先计算网格样式，避免在渲染时使用useMemo
    const gridStyle = {
      backgroundSize: `${gridSize * scale}px ${gridSize * scale}px`,
      transform: `translate(${offset.x}px, ${offset.y}px)`,
    };

    return (
      <div 
        ref={gridRef}
        className="grid-container" 
        style={gridStyle}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => setSelectedObject(null)}
      >
        {objects.map(obj => (
          <GridObjectComponent 
            key={obj.id}
            object={obj}
            scale={scale}
            isSelected={obj.id === selectedObject}
            onObjectClick={handleObjectClick}
            onObjectDragStart={handleObjectDragStart}
            onResizeStart={handleResizeStart}
            getObjectColor={getObjectColor}
          />
        ))}
      </div>
    );
  };

  // 使用React.memo包装的对象组件，减少不必要的重渲染
  const GridObjectComponent = React.memo(({ 
    object, 
    scale, 
    isSelected, 
    onObjectClick, 
    onObjectDragStart, 
    onResizeStart,
    getObjectColor
  }: {
    object: GridObject;
    scale: number;
    isSelected: boolean;
    onObjectClick: (e: React.MouseEvent, objectId: string) => void;
    onObjectDragStart: (e: React.MouseEvent, objectId: string) => void;
    onResizeStart: (e: React.MouseEvent, objectId: string, direction: string) => void;
    getObjectColor: (type: string) => string;
  }) => {
    // 预先计算对象样式
    const objectStyle = {
      left: `${object.x * scale}px`,
      top: `${object.y * scale}px`,
      width: `${object.width * scale}px`,
      height: `${object.height * scale}px`,
      backgroundColor: getObjectColor(object.type),
      border: isSelected ? '2px solid #00f' : '1px solid #333',
      transform: object.rotation ? `rotate(${object.rotation}deg)` : undefined,
      transformOrigin: 'center center'
    };

    return (
      <div 
        className={`grid-object ${isSelected ? 'selected' : ''}`}
        style={objectStyle}
        onClick={(e) => onObjectClick(e, object.id)}
        onMouseDown={(e) => {
          // 只有在不是调整大小的控件时才开始拖动
          const target = e.target as HTMLElement;
          if (!target.className.includes('resize-handle')) {
            onObjectDragStart(e, object.id);
          }
        }}
      >
        <div className="object-label">{object.type}</div>
        
        {isSelected && (
          <>
            <div 
              className="resize-handle ne" 
              onMouseDown={(e) => onResizeStart(e, object.id, 'ne')}
            />
            <div 
              className="resize-handle nw" 
              onMouseDown={(e) => onResizeStart(e, object.id, 'nw')}
            />
            <div 
              className="resize-handle se" 
              onMouseDown={(e) => onResizeStart(e, object.id, 'se')}
            />
            <div 
              className="resize-handle sw" 
              onMouseDown={(e) => onResizeStart(e, object.id, 'sw')}
            />
            <div 
              className="resize-handle e" 
              onMouseDown={(e) => onResizeStart(e, object.id, 'e')}
            />
            <div 
              className="resize-handle w" 
              onMouseDown={(e) => onResizeStart(e, object.id, 'w')}
            />
            <div 
              className="resize-handle s" 
              onMouseDown={(e) => onResizeStart(e, object.id, 's')}
            />
            <div 
              className="resize-handle n" 
              onMouseDown={(e) => onResizeStart(e, object.id, 'n')}
            />
          </>
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // 自定义比较函数，只有在这些属性变化时才重新渲染
    return (
      prevProps.object.id === nextProps.object.id &&
      prevProps.object.x === nextProps.object.x &&
      prevProps.object.y === nextProps.object.y &&
      prevProps.object.width === nextProps.object.width &&
      prevProps.object.height === nextProps.object.height &&
      prevProps.object.rotation === nextProps.object.rotation &&
      prevProps.object.type === nextProps.object.type &&
      prevProps.scale === nextProps.scale &&
      prevProps.isSelected === nextProps.isSelected
    );
  });

  // 获取对象颜色
  const getObjectColor = (type: string) => {
    const colors: Record<string, string> = {
      '墙': '#8B4513',
      '地板': '#A9A9A9',
      '障碍物': '#696969',
      '玩家': '#4169E1',
      'NPC': '#32CD32',
      '敌人': '#DC143C',
      '门': '#8B008B',
      '宝箱': '#DAA520',
      '开关': '#FF8C00',
    };
    
    return colors[type] || '#999';
  };

  // 渲染属性编辑器
  const renderPropertyEditor = () => {
    if (!selectedObject) return null;
    
    const object = objects.find(obj => obj.id === selectedObject);
    if (!object) return null;

    return (
      <div className="property-editor">
        <h3>对象属性</h3>
        <div className="property-group">
          <label>类型</label>
          <input type="text" value={object.type} readOnly />
        </div>
        <div className="property-group">
          <label>位置 X</label>
          <input 
            type="number" 
            value={object.x} 
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setObjects(prev => prev.map(obj => 
                obj.id === selectedObject ? { ...obj, x: value } : obj
              ));
            }}
          />
        </div>
        <div className="property-group">
          <label>位置 Y</label>
          <input 
            type="number" 
            value={object.y} 
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setObjects(prev => prev.map(obj => 
                obj.id === selectedObject ? { ...obj, y: value } : obj
              ));
            }}
          />
        </div>
        <div className="property-group">
          <label>宽度</label>
          <input 
            type="number" 
            value={object.width} 
            onChange={(e) => {
              const value = Math.max(gridSize, parseInt(e.target.value));
              setObjects(prev => prev.map(obj => 
                obj.id === selectedObject ? { ...obj, width: value } : obj
              ));
            }}
          />
        </div>
        <div className="property-group">
          <label>高度</label>
          <input 
            type="number" 
            value={object.height} 
            onChange={(e) => {
              const value = Math.max(gridSize, parseInt(e.target.value));
              setObjects(prev => prev.map(obj => 
                obj.id === selectedObject ? { ...obj, height: value } : obj
              ));
            }}
          />
        </div>
        <div className="property-group">
          <label>旋转角度</label>
          <div className="rotation-control">
            <input 
              type="range" 
              min="0" 
              max="359" 
              value={object.rotation || 0} 
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setObjects(prev => prev.map(obj => 
                  obj.id === selectedObject ? { ...obj, rotation: value } : obj
                ));
              }}
            />
            <input 
              type="number" 
              min="0" 
              max="359" 
              value={object.rotation || 0} 
              onChange={(e) => {
                const value = parseInt(e.target.value) % 360;
                setObjects(prev => prev.map(obj => 
                  obj.id === selectedObject ? { ...obj, rotation: value } : obj
                ));
              }}
            />
          </div>
        </div>
        <button 
          className="btn-delete" 
          onClick={handleDeleteObject}
        >
          删除对象
        </button>
      </div>
    );
  };

  return (
    <div className="two-d-layout-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button onClick={() => setShowGrid(!showGrid)}>
            {showGrid ? '隐藏网格' : '显示网格'}
          </button>
          <div className="grid-size-control">
            <label>网格大小:</label>
            <input 
              type="range" 
              min="10"
              max="50"
              step="5"
              value={gridSize} 
              onChange={(e) => setGridSize(parseInt(e.target.value))} 
            />
            <span>{gridSize}px</span>
          </div>
        </div>
        <div className="toolbar-group">
          <button onClick={() => setScale(prev => Math.min(5, prev * 1.1))}>放大</button>
          <button onClick={() => setScale(prev => Math.max(0.1, prev * 0.9))}>缩小</button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}>重置视图</button>
          <button onClick={() => setShowDebugPanel(!showDebugPanel)}>
            {showDebugPanel ? '隐藏调试' : '显示调试'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div 
          ref={editorRef}
          className="editor-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            if (isResizing) {
              handleResizeMove(e);
            } else if (isDragging && selectedObject) {
              handleObjectDragMove(e);
            } else if (isDragging) {
              handleMouseMove(e);
            }
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {showDebugPanel && (
            <div className="debug-panel">
              <h4>调试信息</h4>
              <pre>{debugInfo}</pre>
              <div>
                <h4>对象列表</h4>
                <table className="debug-objects-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>类型</th>
                      <th>位置 (x,y)</th>
                      <th>尺寸 (w×h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objects.map(obj => (
                      <tr key={obj.id} className={selectedObject === obj.id ? 'selected' : ''}>
                        <td>{obj.id}</td>
                        <td>{obj.type}</td>
                        <td>{obj.x.toFixed(0)},{obj.y.toFixed(0)}</td>
                        <td>{obj.width.toFixed(0)}×{obj.height.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {renderGrid()}
        </div>

        {renderPropertyEditor()}
      </div>
    </div>
  );
};

export default TwoDLayoutEditor;