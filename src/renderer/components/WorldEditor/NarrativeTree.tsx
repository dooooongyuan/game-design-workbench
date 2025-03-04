import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { WorldBuildingSection } from './types';
import './NarrativeTree.css';

interface NarrativeTreeProps {
  sections: WorldBuildingSection[];
  onNodeClick: (sectionId: string) => void;
  onUpdateSections?: (updatedSections: WorldBuildingSection[]) => void; // 添加更新sections的回调函数
  activeSection?: string; // 添加活动节点ID属性
  searchTerm?: string; // 添加搜索功能
  filter?: 'all' | 'normal' | 'condition' | 'event'; // 添加过滤功能
}

interface TreeNode {
  id: string;
  title: string;
  type?: 'normal' | 'condition' | 'event';
  children?: TreeNode[];
  probability?: number; // 添加概率权重
  eventId?: string; // 添加事件ID
  linkLength?: number; // 新增：存储连接线长度
  nodeSize?: { radius: number }; // 添加节点大小属性
}

const NarrativeTree: React.FC<NarrativeTreeProps> = ({ 
  sections, 
  onNodeClick, 
  onUpdateSections,
  activeSection,
  searchTerm = '',
  filter = 'all'
 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 600 });
  const [tooltip, setTooltip] = useState<{x: number, y: number, content: string} | null>(null);
  const [isDraggingLink, setIsDraggingLink] = useState(false);

  // 添加窗口大小变化监听
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        const { width, height } = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化尺寸

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !sections.length) return;

    // 清除页面上可能存在的所有工具提示
    d3.selectAll('body > div.tree-tooltip').remove();

    // 过滤节点
    const filteredSections = sections.filter(section => {
      // 应用搜索过滤
      const matchesSearch = searchTerm ? 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        section.content.toLowerCase().includes(searchTerm.toLowerCase()) : 
        true;
      
      // 应用类型过滤
      const matchesFilter = filter === 'all' ? true : section.type === filter;
      
      return matchesSearch && matchesFilter;
    });

    // 如果过滤后没有节点，则不渲染
    if (filteredSections.length === 0) {
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    // 清除现有的SVG内容
    d3.select(svgRef.current).selectAll('*').remove();

    // 设置树形图的尺寸
    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };

    // 创建分层数据结构
    const root = d3.hierarchy(buildTreeData(filteredSections));

    // 创建树形布局
    const treeLayout = d3.tree<TreeNode>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right])
      .nodeSize([60, 120]) // 设置固定的节点大小，[高度, 宽度]
      .separation((a, b) => {
        // 获取连接线长度
        let linkLength;
        
        // 优先使用目标节点的linkLength
        if (b.data.linkLength !== undefined) {
          linkLength = b.data.linkLength;
          console.log(`使用节点 ${b.data.id} 的连接线长度: ${linkLength}`);
        } else if (a.data.linkLength !== undefined) {
          linkLength = a.data.linkLength;
          console.log(`使用节点 ${a.data.id} 的连接线长度: ${linkLength}`);
        } else {
          // 默认值设为1
          linkLength = 1;
          console.log(`使用默认连接线长度: ${linkLength}`);
        }
        
        // 增加同级节点之间的间距系数
        // 对于同级节点使用1.5倍系数，不同级节点使用2倍系数
        const siblingFactor = a.parent === b.parent ? 1.5 : 2;
        
        // 计算最终间距
        const finalSeparation = Math.max(0.1, siblingFactor * linkLength);
        console.log(`计算节点间距: ${finalSeparation}`);
        
        return finalSeparation;
      });

    // 应用布局
    const tree = treeLayout(root);

    // 检测并修复节点重叠
    const nodeRadius = 15; // 节点半径加上安全距离
    const minVerticalDistance = 80; // 增加最小垂直距离，从40增加到80
    
    // 对每个节点进行碰撞检测
    tree.descendants().forEach(node => {
      const siblings = node.parent && node.parent.children ? node.parent.children : [];
      
      // 如果有兄弟节点，检查垂直方向的重叠
      if (siblings && siblings.length > 1) {
        siblings.sort((a, b) => a.x - b.x); // 按垂直位置排序
        
        // 确保兄弟节点之间有足够的垂直间距
        for (let i = 1; i < siblings.length; i++) {
          const prevNode = siblings[i-1];
          const currNode = siblings[i];
          if (prevNode && currNode) {
            const actualDistance = currNode.x - prevNode.x;
            
            if (actualDistance < minVerticalDistance) {
              // 调整当前节点及其后续所有兄弟节点的位置
              const adjustment = minVerticalDistance - actualDistance;
              for (let j = i; j < siblings.length; j++) {
                if (siblings[j]) {
                  siblings[j].x += adjustment;
                }
              }
            }
          }
        }
      }
    });

    // 创建SVG容器
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 添加缩放功能
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        svg.attr('transform', event.transform);
      });

    d3.select(svgRef.current).call(zoom as any);

    // 绘制连接线
    const links = svg.selectAll('path.link')
      .data(tree.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d => {
        const linkGenerator = d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
          .x(d => d.y)
          .y(d => d.x);
        return linkGenerator(d) || '';
      })
      .style('cursor', 'col-resize') // 添加调整光标
      .on('mouseover', function() {
        if (!isDraggingLink) {
          d3.select(this).classed('link-hover', true);
        }
      })
      .on('mouseout', function() {
        if (!isDraggingLink) {
          d3.select(this).classed('link-hover', false);
        }
      });

    // 添加连接线拖拽功能 - 全新实现
    links.call(d3.drag<SVGPathElement, d3.HierarchyPointLink<TreeNode>>()
      .on('start', (event, d) => {
        setIsDraggingLink(true);
        console.log('开始拖动连接线');
        
        // 添加拖动状态的视觉反馈
        d3.select(event.sourceEvent.target)
          .classed('link-dragging', true)
          .style('stroke-width', '4px');
      })
      .on('drag', (event, d) => {
        // 获取鼠标拖动距离
        const dx = event.dx;
        
        // 忽略微小的移动
        if (Math.abs(dx) < 1) return;
        
        // 获取目标节点和源节点
        const targetNode = d.target;
        const sourceNode = d.source;
        
        // 计算当前连接线长度
        const currentLength = targetNode.data.linkLength || 1.0;
        
        // 根据拖动方向调整连接线长度
        // 左拖减小，右拖增大
        let newLength = currentLength + (dx > 0 ? 0.2 : -0.2);
        
        // 限制最小和最大长度
        newLength = Math.max(0.1, Math.min(3, newLength));
        
        console.log(`调整连接线长度: ${currentLength} -> ${newLength}`);
        
        // 更新节点的连接线长度属性
        targetNode.data.linkLength = newLength;
        
        // 找到对应的section并更新
        const targetSection = sections.find(s => s.id === targetNode.data.id);
        if (targetSection) {
          targetSection.linkLength = newLength;
        }
        
        // 显示拖动提示
        const tooltip = d3.select('body')
          .selectAll('.drag-tooltip')
          .data([1])
          .join('div')
          .attr('class', 'drag-tooltip')
          .style('position', 'absolute')
          .style('background-color', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '5px 10px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', 1000);
          
        tooltip
          .style('left', (event.sourceEvent.pageX + 15) + 'px')
          .style('top', (event.sourceEvent.pageY - 35) + 'px')
          .html(`连接线长度: ${newLength.toFixed(2)}<br>← 左拖缩短 | 右拖延长 →`);
        
        // 重新应用布局
        treeLayout(root);
        
        // 更新所有节点位置
        svg.selectAll('g.node')
          .attr('transform', function(d) {
            const node = d as unknown as d3.HierarchyPointNode<TreeNode>;
            return `translate(${node.y},${node.x})`;
          });
        
        // 更新所有连接线
        svg.selectAll('path.link')
          .attr('d', function(d) {
            const link = d as unknown as d3.HierarchyPointLink<TreeNode>;
            const linkGenerator = d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
              .x(d => d.y)
              .y(d => d.x);
            return linkGenerator(link) || '';
          });
      })
      .on('end', (event, d) => {
        setIsDraggingLink(false);
        d3.select(event.sourceEvent.target)
          .classed('link-dragging', false)
          .style('stroke-width', null);
          
        // 移除拖动提示
        d3.selectAll('.drag-tooltip').remove();
        
        // 获取目标节点和当前连接线长度
        const targetNode = d.target;
        const currentLength = targetNode.data.linkLength;
        
        // 找到对应的section并确保更新
        const targetSection = sections.find(s => s.id === targetNode.data.id);
        if (targetSection) {
          console.log(`拖动结束，节点 ${targetSection.title} 的连接线长度为 ${currentLength}`);
          targetSection.linkLength = currentLength;
        }
        
        // 保存更改到sections数组，确保状态更新
        const updatedSections = [...sections];
        
        // 如果提供了更新函数，则调用它
        if (onUpdateSections) {
          // 直接调用更新函数
          onUpdateSections(updatedSections);
          
          // 添加调试日志
          console.log('已更新sections数组，共有', updatedSections.length, '个节点');
          console.log('连接线长度已更新的节点:', updatedSections.filter(s => s.linkLength !== undefined).length);
        }
      })
    );

    // 创建节点组
    const nodes = svg.selectAll('g.node')
      .data(tree.descendants())
      .enter()
      .append('g')
      .attr('class', d => {
        const section = sections.find(s => s.id === d.data.id);
        const nodeType = section?.type || 'normal';
        const isActive = activeSection === d.data.id;
        return `node ${nodeType} ${isActive ? 'active' : ''}`;
      })
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // 添加节点圆圈
    nodes.append('circle')
      .attr('r', d => {
        const section = sections.find(s => s.id === d.data.id);
        // 使用自定义尺寸或默认尺寸
        if (section?.nodeSize?.radius) {
          return section.nodeSize.radius;
        }
        const nodeType = section?.type || 'normal';
        // 根据节点类型设置不同大小
        switch (nodeType) {
          case 'condition': return 10;
          case 'event': return 8;
          default: return 6;
        }
      })
      .on('click', (event, d) => {
        event.stopPropagation(); // 阻止事件冒泡
        handleNodeEdit(d.data.id);
      })
      .on('mouseover', (event, d) => {
        const section = sections.find(s => s.id === d.data.id);
        if (!section) return;

        // 构建工具提示内容
        let tooltipContent = `<strong>${section.title}</strong>`;
        
        // 添加节点类型信息
        tooltipContent += `<br>类型: ${section.type === 'condition' ? '条件' : section.type === 'event' ? '事件' : '普通'}`;
        
        // 添加连接线长度信息（如果有）
        if (section.linkLength) {
          tooltipContent += `<br>连接线长度: ${section.linkLength.toFixed(2)}`;
          tooltipContent += `<br><span style="color: #1890ff; font-style: italic;">提示: 拖动连接线可调整长度 (左右拖动)</span>`;
        } else {
          tooltipContent += `<br><span style="color: #1890ff; font-style: italic;">提示: 拖动连接线可调整长度 (左右拖动)</span>`;
        }
        
        // 添加内容预览
        const contentPreview = section.content
          .split('\n')
          .slice(0, 3)
          .join('\n');
        tooltipContent += `<br><br>${contentPreview}...`;
        
        // 如果是条件节点，显示条件信息
        if (section.type === 'condition' && section.conditions?.length) {
          tooltipContent += `<br><br>条件分支: ${section.conditions.length}个`;
          section.conditions.forEach(condition => {
            const targetSection = sections.find(s => s.id === condition.targetSectionId);
            tooltipContent += `<br>→ ${targetSection?.title || '未知节点'}`;
          });
        }
        
        // 如果是事件节点，显示事件ID
        if (section.type === 'event' && section.eventId) {
          tooltipContent += `<br><br>事件ID: ${section.eventId}`;
        }

        // 创建工具提示
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tree-tooltip')
          .style('opacity', 0)
          .style('position', 'absolute')
          .style('background-color', 'rgba(0, 0, 0, 0.85)')
          .style('color', 'white')
          .style('padding', '10px 15px')
          .style('border-radius', '6px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', 1000)
          .style('max-width', '300px')
          .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.15)')
          .style('line-height', '1.5')
          .html(tooltipContent);

        tooltip.transition()
          .duration(200)
          .style('opacity', 1);

        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        d3.selectAll('.tree-tooltip').remove();
      });

    // 添加节点标题
    nodes.append('text')
      .attr('dy', '35px') // 增加与节点的距离
      .attr('x', 0) // 水平居中
      .style('text-anchor', 'middle') // 文本居中对齐
      .style('font-size', '14px') // 增加字体大小
      .style('letter-spacing', '0.5px') // 增加字间距
      .text(d => {
        const section = sections.find(s => s.id === d.data.id);
        return section?.title || '';
      });

    // 为所有节点添加类型标签
    nodes.append('text')
      .attr('class', 'node-weight')
      .attr('dy', '-25px') // 增加与节点的距离
      .attr('text-anchor', 'middle')
      .style('font-size', '12px') // 调整字体大小
      .text(d => {
        const section = sections.find(s => s.id === d.data.id);
        switch(section?.type) {
          case 'condition': return '条件';
          case 'event': return '事件';
          default: return '普通';
        }
      });

    // 为事件节点添加事件ID
    nodes.filter(d => {
      const section = sections.find(s => s.id === d.data.id);
      return !!(section?.type === 'event' && section.eventId);
    }).append('text')
      .attr('class', 'event-id')
      .attr('dy', '-30px')
      .attr('text-anchor', 'middle')
      .text(d => {
        const section = sections.find(s => s.id === d.data.id);
        return section?.eventId ? `#${section.eventId}` : '';
      });

  }, [sections, onNodeClick, activeSection, dimensions, searchTerm, filter, isDraggingLink]);

  // 组件卸载时清除所有工具提示
  useEffect(() => {
    return () => {
      d3.selectAll('body > div.tree-tooltip').remove();
    };
  }, []);

  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editNodeType, setEditNodeType] = useState<'normal' | 'condition' | 'event'>('normal');
  const [editParentId, setEditParentId] = useState<string>('');

  const handleNodeEdit = (nodeId: string) => {
    const section = sections.find(s => s.id === nodeId);
    if (section) {
      setEditingNode(nodeId);
      setEditNodeType(section.type || 'normal');
      setEditParentId(section.parentId || '');
    }
  };

  // 检查是否存在循环引用
  const checkForCircularReference = (nodeId: string, parentId: string): boolean => {
    // 如果父节点ID等于当前节点ID，则存在循环引用
    if (nodeId === parentId) return true;
    
    // 查找父节点的父节点，递归检查
    const parent = sections.find(s => s.id === parentId);
    if (!parent || !parent.parentId) return false;
    
    // 递归检查父节点的父节点
    return checkForCircularReference(nodeId, parent.parentId);
  };

  const handleSaveNodeEdit = () => {
    if (!editingNode) return;

    // 检查是否存在循环引用
    if (editParentId && checkForCircularReference(editingNode, editParentId)) {
      alert('错误：不能将节点设置为其子节点的子节点，这会导致循环引用！');
      return;
    }

    const updatedSections = sections.map(section => {
      if (section.id === editingNode) {
        return {
          ...section,
          type: editNodeType,
          parentId: editParentId === '' ? undefined : editParentId
        };
      }
      return section;
    });

    if (onUpdateSections) {
      onUpdateSections(updatedSections);
    }

    setEditingNode(null);
  };

  return (
    <div className="narrative-tree-container">
      <div className="tree-controls">
        {/* 这里可以添加搜索和过滤控件 */}
      </div>
      <svg ref={svgRef} />
      {tooltip && (
        <div 
          className="tree-tooltip" 
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            position: 'absolute'
          }}
        >
          {tooltip.content}
        </div>
      )}
      {editingNode && (
        <div className="node-edit-modal">
          <div className="node-edit-content">
            <h3>编辑节点</h3>
            <div className="edit-form">
              <div className="form-group">
                <label>节点类型：</label>
                <select
                  value={editNodeType}
                  onChange={(e) => setEditNodeType(e.target.value as 'normal' | 'condition' | 'event')}
                >
                  <option value="normal">普通节点</option>
                  <option value="condition">条件节点</option>
                  <option value="event">事件节点</option>
                </select>
              </div>
              <div className="form-group">
                <label>父节点：</label>
                <select
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                >
                  <option value="">无父节点</option>
                  {sections
                    .filter(s => s.id !== editingNode)
                    .map(section => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                </select>
              </div>
              <div className="edit-actions">
                <button onClick={handleSaveNodeEdit}>保存</button>
                <button onClick={() => setEditingNode(null)}>取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 构建树形数据结构
const buildTreeData = (sections: WorldBuildingSection[]): TreeNode => {
  // 创建节点映射
  const nodeMap = new Map<string, TreeNode>();
  
  // 首先创建所有节点
  sections.forEach(section => {
    nodeMap.set(section.id, {
      id: section.id,
      title: section.title,
      type: section.type,
      probability: section.probability,
      eventId: section.eventId,
      linkLength: section.linkLength, // 添加连接线长度属性
      nodeSize: section.nodeSize,
      children: []
    });
  });
  
  // 然后建立父子关系
  sections.forEach(section => {
    if (section.parentId && nodeMap.has(section.parentId)) {
      const parentNode = nodeMap.get(section.parentId);
      const currentNode = nodeMap.get(section.id);
      
      if (parentNode && currentNode && !parentNode.children?.some(child => child.id === section.id)) {
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push(currentNode);
      }
    }
  });
  
  // 处理条件节点的分支
  sections.forEach(section => {
    if (section.conditions?.length) {
      section.conditions.forEach(condition => {
        if (nodeMap.has(condition.targetSectionId) && nodeMap.has(section.id)) {
          const sourceNode = nodeMap.get(section.id);
          const targetNode = nodeMap.get(condition.targetSectionId);
          
          if (sourceNode && targetNode && !sourceNode.children?.some(child => child.id === condition.targetSectionId)) {
            if (!sourceNode.children) sourceNode.children = [];
            sourceNode.children.push(targetNode);
          }
        }
      });
    }
  });
  
  // 找到根节点（没有父节点的节点）
  const rootNodes = sections.filter(section => !section.parentId);
  
  // 如果有根节点，返回第一个；否则返回第一个章节作为根节点
  if (rootNodes.length > 0) {
    return nodeMap.get(rootNodes[0].id) || {
      id: sections[0].id,
      title: sections[0].title,
      type: sections[0].type,
      probability: sections[0].probability,
      eventId: sections[0].eventId,
      linkLength: sections[0].linkLength // 添加连接线长度属性
    };
  }
  
  return {
    id: sections[0].id,
    title: sections[0].title,
    type: sections[0].type,
    probability: sections[0].probability,
    eventId: sections[0].eventId,
    linkLength: sections[0].linkLength // 添加连接线长度属性
  };
};

export default NarrativeTree;