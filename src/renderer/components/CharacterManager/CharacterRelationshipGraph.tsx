// 禁用WebGPU渲染器，强制使用WebGL
if (typeof window !== 'undefined') {
  // 设置全局变量禁用WebGPU
  window.WebGPU = undefined;
  
  // 尝试拦截模块加载请求
  const originalImport = window.importScripts;
  if (typeof originalImport === 'function') {
    window.importScripts = function(...args) {
      const filteredArgs = args.filter(url => !url.includes('WebGPURenderer'));
      if (filteredArgs.length > 0) {
        return originalImport.apply(this, filteredArgs);
      }
      return Promise.resolve();
    };
  }
}

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './CharacterRelationshipGraph.css';
import './node-tooltip.css';

interface Character {
  id: string;
  name: string;
  role: string;
  relationships: Array<{
    characterId: string;
    type: string;
    description: string;
  }>;
}

interface CharacterRelationshipGraphProps {
  characters: Character[];
  onNodeClick?: (character: Character) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  role: string;
  color?: string;
  selected?: boolean;
  x?: number;
  y?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  color?: string;
}

const CharacterRelationshipGraph: React.FC<CharacterRelationshipGraphProps> = ({ characters, onNodeClick }) => {
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<{ x: number; y: number; content: string } | null>(null);
  const [zoom, setZoom] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 将角色数据转换为图形数据
  const graphData = useMemo(() => {
    // 角色类型对应的颜色
    const roleColors: { [key: string]: string } = {
      '主角': '#f5222d',
      '导师': '#1890ff',
      '反派': '#722ed1',
      '盟友': '#52c41a',
      '配角': '#fa8c16'
    };

    // 关系类型对应的颜色
    const relationshipColors: { [key: string]: string } = {
      '导师': '#1890ff',
      '学徒': '#52c41a',
      '敌对': '#f5222d',
      '友好': '#13c2c2',
      '家人': '#eb2f96'
    };

    // 获取容器宽度，如果容器还未渲染，使用默认值
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = 600;
    
    // 计算合适的分散范围
    const radius = Math.min(containerWidth, containerHeight) * 0.4;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    const nodes: GraphNode[] = characters.map((character, index) => {
      // 使用极坐标系统计算初始位置，使节点均匀分布在圆周上
      const angle = (index / characters.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      return {
      id: character.id,
      name: character.name,
      role: character.role,
      color: roleColors[character.role] || '#666',
        selected: character.id === selectedNode,
        x: x,  // 设置初始x坐标
        y: y   // 设置初始y坐标
      };
    });

    const links: GraphLink[] = [];
    characters.forEach(character => {
      character.relationships.forEach(rel => {
        links.push({
          source: character.id,
          target: rel.characterId,
          type: rel.type,
          color: relationshipColors[rel.type] || '#aaa'
        });
      });
    });

    return { nodes, links };
  }, [characters, selectedNode, containerRef]);

  // 处理节点点击事件
  const handleNodeClick = useCallback((event: any, node: GraphNode) => {
    // 确保事件对象是有效的
    if (!event) return;
    
    // 阻止默认行为和事件冒泡
    if (event.preventDefault) event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
    
    // 更新选中的节点
    setSelectedNode(node.id);
    
    // 查找当前角色，确保使用正确的ID
    const character = characters.find(c => c.id === node.id);
    if (character) {
      // 关系类型对应的颜色
      const relationshipColors: { [key: string]: string } = {
        '导师': '#1890ff',
        '学徒': '#52c41a',
        '敌对': '#f5222d',
        '友好': '#13c2c2',
        '家人': '#eb2f96'
      };
      
      // 创建工具提示内容
      const content = `
        <div class="node-tooltip" style="font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;">
          <div class="node-tooltip-header" style="
            margin-bottom: 16px; 
            padding-bottom: 12px; 
            border-bottom: 1px solid rgba(255,255,255,0.15);
            position: relative;
          ">
            <div style="
              position: absolute; 
              top: -8px; 
              left: -8px; 
              width: 4px; 
              height: 40px; 
              background: ${node.color || '#666'};
              border-radius: 2px;
            "></div>
            <h3 style="
              margin: 0 0 6px 0; 
              color: ${node.color || '#666'};
              font-size: 18px;
              font-weight: 600;
              letter-spacing: 0.5px;
            ">${character.name}</h3>
            <div style="
              font-size: 12px; 
              color: rgba(255,255,255,0.7);
              display: inline-block;
              padding: 2px 8px;
              background: rgba(255,255,255,0.08);
              border-radius: 10px;
              margin-top: 4px;
            ">${character.role}</div>
          </div>
          
          ${character.background ? `
            <div class="node-tooltip-background" style="
              margin-bottom: 16px; 
              font-size: 13px; 
              line-height: 1.6;
              color: rgba(255,255,255,0.85);
              background: rgba(255,255,255,0.03);
              padding: 10px 12px;
              border-radius: 6px;
              border-left: 3px solid rgba(255,255,255,0.1);
            ">
              ${character.background.length > 100 ? character.background.slice(0, 100) + '...' : character.background}
            </div>
          ` : ''}
          
          ${character.tags && character.tags.length > 0 ? `
            <div class="node-tooltip-tags" style="margin-bottom: 16px;">
              <div style="
                font-size: 13px; 
                color: rgba(255,255,255,0.85);
                margin-bottom: 8px;
                font-weight: 500;
                display: flex;
                align-items: center;
              ">
                <span style="
                  display: inline-block;
                  width: 14px;
                  height: 14px;
                  background: rgba(255,255,255,0.1);
                  margin-right: 6px;
                  border-radius: 3px;
                "></span>
                标签
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${character.tags.map(tag => `
                  <span style="
                    padding: 3px 10px;
                    background: rgba(${node.color ? hexToRgb(node.color) : '102, 102, 102'}, 0.15);
                    border: 1px solid rgba(${node.color ? hexToRgb(node.color) : '102, 102, 102'}, 0.3);
                    border-radius: 12px;
                    font-size: 11px;
                    color: rgba(255,255,255,0.9);
                    letter-spacing: 0.3px;
                    transition: all 0.2s ease;
                  ">${tag}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="node-tooltip-relationships">
            <div style="
              font-size: 13px; 
              color: rgba(255,255,255,0.85);
              margin-bottom: 8px;
              font-weight: 500;
              display: flex;
              align-items: center;
            ">
              <span style="
                display: inline-block;
                width: 14px;
                height: 14px;
                background: rgba(255,255,255,0.1);
                margin-right: 6px;
                border-radius: 3px;
              "></span>
              关系 (${character.relationships.length})
            </div>
            ${character.relationships.length > 0 ? `
              <div style="
                max-height: 180px; 
                overflow-y: auto;
                background: rgba(0,0,0,0.2);
                border-radius: 6px;
                padding: 8px;
              ">
                ${character.relationships.map(rel => {
                  const relatedChar = characters.find(c => c.id === rel.characterId);
                  const relColor = relationshipColors[rel.type] || '#aaa';
                  return `
                    <div style="
                      padding: 10px;
                      margin-bottom: 8px;
                      background: rgba(255,255,255,0.05);
                      border-radius: 6px;
                      border-left: 3px solid ${relColor};
                      transition: all 0.2s ease;
                    ">
                      <div style="
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center;
                        margin-bottom: 6px;
                      ">
                        <span style="
                          font-weight: 600; 
                          color: ${relColor};
                          font-size: 14px;
                        ">
                          ${relatedChar?.name || '未知'}
                        </span>
                        <span style="
                          font-size: 11px; 
                          color: rgba(255,255,255,0.6);
                          background: rgba(${hexToRgb(relColor)}, 0.15);
                          padding: 2px 8px;
                          border-radius: 10px;
                        ">${rel.type}</span>
                      </div>
                      <div style="
                        font-size: 12px; 
                        color: rgba(255,255,255,0.75);
                        line-height: 1.5;
                      ">${rel.description}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : '<p style="color: rgba(255,255,255,0.5); font-size: 12px; text-align: center; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 6px;">暂无关系数据</p>'}
          </div>
        </div>
      `;

      // 设置工具提示位置和内容，智能调整位置确保完全可见
      const tooltipWidth = 300;
      const tooltipHeight = Math.min(500, window.innerHeight * 0.8);
      const padding = 20;
      
      // 默认显示在点击位置上方
      let tooltipX = event.pageX + 15;
      let tooltipY = event.pageY - tooltipHeight - 30;
      
      // 如果上方空间不足，则尝试显示在下方
      if (tooltipY < padding) {
        tooltipY = event.pageY + 30;
        
        // 如果下方空间也不足，则显示在视口中间
        if (tooltipY + tooltipHeight + padding > window.innerHeight) {
          tooltipY = Math.max(padding, (window.innerHeight - tooltipHeight) / 2);
        }
      }
      
      // 检查右边界
      if (tooltipX + tooltipWidth + padding > window.innerWidth) {
        tooltipX = event.pageX - tooltipWidth - 15;
      }
      
      // 确保不超出左边界
      tooltipX = Math.max(padding, tooltipX);
      
      setTooltipContent({
        x: tooltipX,
        y: tooltipY,
        content
      });

      // 调用传入的点击回调
      if (onNodeClick) {
        onNodeClick(character);
      }
    }

    // 辅助函数：将十六进制颜色转换为RGB
    function hexToRgb(hex: string) {
      // 移除#号
      hex = hex.replace('#', '');
      
      // 解析RGB值
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      return `${r}, ${g}, ${b}`;
    }

    // 辅助函数：根据属性类型获取颜色
    function getAttributeColor(attrKey: string, baseColor: string) {
      const attrColors: {[key: string]: string} = {
        strength: '#f5222d',     // 力量：红色
        intelligence: '#1890ff', // 智力：蓝色
        charisma: '#eb2f96',     // 魅力：粉色
        agility: '#52c41a',      // 敏捷：绿色
        constitution: '#fa8c16'  // 体质：橙色
      };
      
      return attrColors[attrKey] || baseColor;
    }
  }, [characters, onNodeClick]);

  // 使用D3.js创建力导向图
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return;

    try {
      // 清除之前的图形
      d3.select(svgRef.current).selectAll("*").remove();

      const width = containerRef.current.clientWidth;
      const height = 600;

      // 创建力导向模拟
      const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
        .force("link", d3.forceLink<GraphNode, GraphLink>(graphData.links)
          .id(d => d.id)
          .distance(200)) // 增加连接线的默认长度
        .force("charge", d3.forceManyBody()
          .strength(-1000) // 大幅增加节点间的斥力
          .distanceMin(100) // 增加最小距离
          .distanceMax(500)) // 增加最大距离
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(80).strength(1)) // 增强碰撞检测和强度
        .alphaDecay(0.01) // 减小alpha衰减速率，使模拟更慢收敛
        .velocityDecay(0.3); // 减小速度衰减，增加节点活动性
      
      // 减少预先迭代次数，让节点有更多机会分散
      for (let i = 0; i < 50; i++) {
        simulation.tick();
      }
      
      // 不立即停止模拟，让节点继续移动一段时间
      simulation.alpha(0.3);

      // 拖拽函数
      function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
        if (!event.active) simulation.alphaTarget(0);
        // 保持节点固定在拖动位置，不释放fx和fy
        // 注释掉以下两行，使节点保持在用户拖动的位置
        // event.subject.fx = null;
        // event.subject.fy = null;
      }

      // 创建SVG元素
      const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .on("click", (event) => {
          // 点击空白区域时关闭工具提示
          if (event.target === svgRef.current) {
            setTooltipContent(null);
            setSelectedNode(null);
          }
        })
        .call(d3.zoom<SVGSVGElement, unknown>()
          .extent([[0, 0], [width, height]])
          .scaleExtent([0.1, 4])
          .on("zoom", (event) => {
            setZoom(event.transform);
            // 应用缩放和平移变换
            svg.attr("transform", event.transform);
          })
        )
        .append("g");

      // 创建箭头标记
      svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", d => d)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "#999")
        .attr("d", "M0,-5L10,0L0,5");

      // 创建连接线
      const link = svg.append("g")
        .selectAll(".link")
        .data(graphData.links)
        .enter().append("path") // 使用path替代line
        .attr("class", "link")
        .attr("stroke", d => d.color || "#aaa")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#end)")
        .attr("stroke-opacity", 0.6)
        .attr("fill", "none") // 确保path不被填充
        .style("cursor", "pointer"); // 添加鼠标指针样式

      // 添加连接线标签
      const linkLabelGroups = svg.append("g")
        .selectAll(".link-label-group")
        .data(graphData.links)
        .enter().append("g")
        .attr("class", "link-label-group");
      
      // 添加标签背景
      linkLabelGroups.append("rect")
        .attr("class", "link-label-bg")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", "rgba(255, 255, 255, 0.95)")
        .attr("stroke", d => d.color || "#aaa")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.6)
        .style("filter", "drop-shadow(0px 1px 2px rgba(0,0,0,0.15))");
      
      // 添加标签文本
      linkLabelGroups.append("text")
        .attr("class", "link-label")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("font-size", "10px")
        .attr("fill", d => d.color || "#666")
        .text(d => d.type);

      // 更新模拟
      simulation.on("tick", () => {
        // 更新连接线路径
        link.attr("d", d => {
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dr = Math.sqrt(dx * dx + dy * dy) * 2; // 控制曲线弧度
          return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
        });
      
        // 更新节点位置 - 移除过渡动画
        nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
      
        // 更新连接线标签位置和背景
        linkLabelGroups.each(function(d) {
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
          const x = (source.x! + target.x!) / 2;
          const y = (source.y! + target.y!) / 2;
          
          // 获取文本元素和背景
          const group = d3.select(this);
          const text = group.select('text');
          const background = group.select('rect');
          
          // 设置文本位置
          text.attr('x', x).attr('y', y);
          
          // 获取文本尺寸并设置背景矩形
          setTimeout(() => {
            const bbox = (text.node() as SVGTextElement)?.getBBox();
            if (bbox) {
          background
                .attr('x', bbox.x - 6)
                .attr('y', bbox.y - 4)
                .attr('width', bbox.width + 12)
                .attr('height', bbox.height + 8);
            }
          }, 0);
          
          // 设置组的变换
          group.attr("transform", `translate(0,0)`);
        });
      
        // 应用缩放和平移
        svg.attr("transform", zoom.toString());
      });

      // 创建节点组
      const nodeGroup = svg.append("g")
        .selectAll(".node-group")
        .data(graphData.nodes)
        .enter().append("g")
        .attr("class", "node-group")
        .on("click", function(event, d) {
          event.preventDefault();
          event.stopPropagation();
          handleNodeClick(event, d);
        })
        .call(d3.drag<SVGGElement, GraphNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      // 创建节点圆形
      nodeGroup.append("circle")
        .attr("r", d => d.selected ? 16 : 12) // 选中的节点更大
        .attr("fill", d => d.color || "#666")
        .attr("stroke", d => d.selected ? "#000" : "#fff")
        .attr("stroke-width", d => d.selected ? 3 : 2)
        .attr("filter", "url(#glow)")
        .transition() // 添加过渡动画
        .duration(300)
        .ease(d3.easeElastic); // 使用弹性过渡效果

      // 添加发光效果
      svg.append("defs").append("filter")
        .attr("id", "glow")
        .append("feGaussianBlur")
        .attr("stdDeviation", "2.5")
        .attr("result", "coloredBlur");

      const feMerge = svg.select("#glow").append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");

      // 为选中的节点添加发光效果
      nodeGroup.filter(d => d.selected)
        .append("circle")
        .attr("r", 12)
        .attr("fill", "none")
        .attr("stroke", d => d.color || "#666")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.5);

      // 添加角色名称标签
      nodeGroup.append("text")
        .attr("dy", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .attr("font-size", "12px")
        .text(d => d.name);

      // 添加角色类型标签
      nodeGroup.append("text")
        .attr("dy", -12)
        .attr("text-anchor", "middle")
        .attr("fill", d => d.color || "#666")
        .attr("font-size", "10px")
        .text(d => d.role);

      // 移除之前的工具提示
      d3.selectAll('.tree-tooltip').remove();

      // 创建工具提示
      if (tooltipContent) {
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tree-tooltip')
          .style('opacity', 0)
          .style('position', 'absolute')
          .style('background-color', 'rgba(0, 0, 0, 0.85)')
          .style('color', 'white')
          .style('padding', '15px 20px')
          .style('border-radius', '8px')
          .style('font-size', '13px')
          .style('pointer-events', 'none')
          .style('z-index', 1000)
          .style('max-width', '320px')
          .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.25)')
          .style('line-height', '1.6')
          .style('backdrop-filter', 'blur(8px)')
          .html(tooltipContent.content);

        tooltip.transition()
          .duration(200)
          .style('opacity', 1);

        tooltip
          .style('left', `${tooltipContent.x}px`)
          .style('top', `${tooltipContent.y}px`);
      }

      // 添加背景点击处理
      svg.on("click", (event) => {
        if (event.target === svgRef.current) {
          setSelectedNode(null);
          setTooltipContent(null);
        }
      });

    } catch (err) {
      console.error('图形渲染错误:', err);
      setError('渲染图形时发生错误，请刷新页面重试');
    }
  }, [graphData, handleNodeClick]);

  if (error) {
    return (
      <div className="graph-error">
        <p>图形渲染出错: {error}</p>
        <button onClick={() => setError(null)}>重试</button>
      </div>
    );
  }

  return (
    <div className="relationship-graph-container">
      {graphData.nodes.length > 0 ? (
        <div 
          ref={containerRef}
          style={{ width: '100%', height: '600px', position: 'relative' }}
        >
          {tooltipContent && (
            <div
              className="node-tooltip-container"
              style={{
                position: 'fixed',
                left: `${tooltipContent.x}px`,
                top: `${tooltipContent.y}px`,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '10px',
                borderRadius: '4px',
                zIndex: 1000,
                maxWidth: '300px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                pointerEvents: 'auto',
                backdropFilter: 'blur(2px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              dangerouslySetInnerHTML={{ __html: tooltipContent.content }}
            />
          )}
          <svg ref={svgRef} className="relationship-graph"></svg>
        </div>
      ) : (
        <div className="no-data-message">没有足够的角色关系数据来生成图谱</div>
      )}
    </div>
  );
};

export default CharacterRelationshipGraph;