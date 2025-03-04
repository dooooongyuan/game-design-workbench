import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ThreeDPreview.css';

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

interface ThreeDPreviewProps {
  levelData: LevelData;
}

const ThreeDPreview: React.FC<ThreeDPreviewProps> = ({ levelData }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const objectsRef = useRef<THREE.Object3D[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('初始化中...');
  const [showDebug, setShowDebug] = useState<boolean>(false);
  
  // 存储2D画布的尺寸信息
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 600,  // 默认值
    height: 600  // 默认值
  });
  
  // 存储坐标映射的调整因子
  const [mappingFactor, setMappingFactor] = useState({
    x: 1.0,  // 默认值
    z: 1.0   // 默认值
  });
  
  // 尝试获取2D画布的实际尺寸
  useEffect(() => {
    // 查找2D画布元素
    const canvasElement = document.querySelector('.level-editor-area') as HTMLElement;
    if (canvasElement) {
      const width = canvasElement.clientWidth;
      const height = canvasElement.clientHeight;
      
      if (width > 0 && height > 0) {
        setCanvasDimensions({ width, height });
        if (showDebug) {
          console.log('检测到2D画布尺寸:', width, 'x', height);
        }
      }
    }
  }, [showDebug]);

  // 添加调试信息更新
  useEffect(() => {
    console.log('ThreeDPreview 接收到新的关卡数据:', levelData);
    console.log('对象数量:', levelData.objects?.length || 0);
    if (levelData.objects?.length > 0) {
      console.log('第一个对象:', levelData.objects[0]);
    }
    
    updateDebugInfo();
  }, [levelData]);
  
  // 更新调试信息
  const updateDebugInfo = () => {
    const objectCount = levelData.objects?.length || 0;
    const validObjects = levelData.objects?.filter(obj => 
      obj && obj.id && obj.type && 
      typeof obj.x === 'number' && typeof obj.y === 'number' &&
      typeof obj.width === 'number' && typeof obj.height === 'number'
    ).length || 0;
    
    let info = `对象总数: ${objectCount}\n`;
    info += `有效对象: ${validObjects}\n`;
    info += `无效对象: ${objectCount - validObjects}\n`;
    info += '场景状态: ' + (sceneRef.current ? '已初始化' : '未初始化') + '\n';
    
    if (objectCount > 0) {
      const types = new Set(levelData.objects.map(obj => obj.type));
      info += `对象类型: ${Array.from(types).join(', ')}`;
    }
    
    setDebugInfo(info);
  };

  // 初始化Three.js场景
  useEffect(() => {
    if (!mountRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用更柔和的阴影
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 添加辅助光源
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // 添加网格地面 - 调整网格大小以匹配2D画布
    const gridSize = 20; // 网格总大小
    const gridHelper = new THREE.GridHelper(gridSize, 20, 0x000000, 0x888888);
    scene.add(gridHelper);

    // 添加坐标轴辅助
    const axesHelper = new THREE.AxesHelper(gridSize / 2);
    scene.add(axesHelper);

    // 添加边界框，显示3D空间的边界
    const boundingBox = new THREE.Box3(
      new THREE.Vector3(-gridSize/2, 0, -gridSize/2),
      new THREE.Vector3(gridSize/2, gridSize/2, gridSize/2)
    );
    const boundingBoxHelper = new THREE.Box3Helper(boundingBox, 0x0088ff);
    scene.add(boundingBoxHelper);

    // 添加中心点标记
    const centerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial);
    centerSphere.position.set(0, 0.1, 0);
    scene.add(centerSphere);

    // 添加参考线 - X轴
    const xLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-gridSize/2, 0.05, 0),
      new THREE.Vector3(gridSize/2, 0.05, 0)
    ]);
    const xLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const xLine = new THREE.Line(xLineGeometry, xLineMaterial);
    scene.add(xLine);

    // 添加参考线 - Z轴
    const zLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, -gridSize/2),
      new THREE.Vector3(0, 0.05, gridSize/2)
    ]);
    const zLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const zLine = new THREE.Line(zLineGeometry, zLineMaterial);
    scene.add(zLine);

    // 添加网格边界指示器
    const edgePoints = [
      new THREE.Vector3(-gridSize/2, 0.1, -gridSize/2),
      new THREE.Vector3(gridSize/2, 0.1, -gridSize/2),
      new THREE.Vector3(gridSize/2, 0.1, gridSize/2),
      new THREE.Vector3(-gridSize/2, 0.1, gridSize/2),
      new THREE.Vector3(-gridSize/2, 0.1, -gridSize/2)
    ];
    const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2 });
    const edgeLine = new THREE.Line(edgeGeometry, edgeMaterial);
    scene.add(edgeLine);

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (sceneRef.current) {
        // 清理场景中的对象
        objectsRef.current.forEach(obj => {
          sceneRef.current?.remove(obj);
        });
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // 根据levelData更新3D场景
  useEffect(() => {
    if (!sceneRef.current) return;

    // 清除之前的对象
    objectsRef.current.forEach(obj => {
      sceneRef.current?.remove(obj);
    });
    objectsRef.current = [];

    // 创建地板
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc, 
      side: THREE.DoubleSide,
      roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    sceneRef.current.add(floor);
    objectsRef.current.push(floor);

    // 根据levelData创建3D对象
    if (levelData.objects && levelData.objects.length > 0) {
      // 获取最后一个对象用于调试显示
      const lastObject = levelData.objects[levelData.objects.length - 1];
      
      levelData.objects.forEach((obj: any) => {
        const object3D = createObject3D(obj);
        if (object3D) {
          sceneRef.current?.add(object3D);
          objectsRef.current.push(object3D);
          
          // 如果是最后一个对象且调试模式开启，更新调试信息
          if (showDebug && obj.id === lastObject.id) {
            updateObjectDebugInfo(obj, object3D);
          }
        }
      });
    } else {
      // 如果没有对象，清空调试信息
      if (showDebug) {
        setDebugInfo('没有对象可显示');
      }
    }
  }, [levelData, showDebug]);

  // 更新对象调试信息的函数
  const updateObjectDebugInfo = (obj: any, mesh: THREE.Mesh) => {
    const gridSize = 20;
    
    // 使用当前设置的画布尺寸和映射因子
    const canvasWidth = canvasDimensions.width;
    const canvasHeight = canvasDimensions.height;
    const factorX = mappingFactor.x;
    const factorZ = mappingFactor.z;
    
    // 计算对象在3D空间中的尺寸
    // 将2D尺寸（像素）映射到3D尺寸（单位）
    const width3d = (obj.width / canvasWidth) * gridSize * factorX;
    const depth3d = (obj.height / canvasHeight) * gridSize * factorZ;
    
    // 获取对象的实际3D位置
    const position = mesh.position.clone();
    
    // 计算2D坐标到3D坐标的映射
    const centerX = obj.x + obj.width / 2;
    const centerZ = obj.y + obj.height / 2;
    const mappedX = ((centerX / canvasWidth) * gridSize) - (gridSize / 2);
    const mappedZ = ((centerZ / canvasHeight) * gridSize) - (gridSize / 2);
    
    const debugData = {
      type: obj.type,
      id: obj.id,
      '2D位置': { x: obj.x, y: obj.y },
      '2D中心点': { x: centerX, y: centerZ },
      '2D尺寸': { width: obj.width, height: obj.height },
      '3D位置': { x: position.x.toFixed(3), y: position.y.toFixed(3), z: position.z.toFixed(3) },
      '3D映射': { x: mappedX.toFixed(3), z: mappedZ.toFixed(3) },
      '3D尺寸': { width: width3d.toFixed(3), height: mesh.geometry.parameters?.height?.toFixed(3) || '未知', depth: depth3d.toFixed(3) },
      '网格大小': gridSize,
      '画布尺寸': `${canvasWidth}x${canvasHeight}`,
      '映射因子': {
        x: factorX,
        z: factorZ
      }
    };
    
    setDebugInfo(JSON.stringify(debugData, null, 2));
  };

  // 根据对象类型获取颜色
  const getObjectColor = (type: string): number => {
    switch (type) {
      // 基础结构
      case '墙': return 0x8B4513;
      case '地板': return 0xA9A9A9;
      case '障碍物': return 0x696969;
      case '门': return 0x8B008B;
      case '窗户': return 0x87CEEB;
      case '楼梯': return 0xCD853F;
      case '平台': return 0xB8860B;
      case '栏杆': return 0x8B7355;
      case '柱子': return 0xD2B48C;
      
      // 角色
      case '玩家': return 0x4169E1;
      case 'NPC': return 0x32CD32;
      case '敌人': return 0xDC143C;
      case '友军': return 0x00BFFF;
      case '中立角色': return 0xFFD700;
      case '动物': return 0xD2691E;
      
      // 交互物品
      case '宝箱': return 0xDAA520;
      case '开关': return 0xFF8C00;
      case '按钮': return 0xFF4500;
      case '杠杆': return 0xA0522D;
      case '传送门': return 0x9932CC;
      case '陷阱': return 0x800000;
      
      // 环境装饰
      case '树木': return 0x228B22;
      case '灌木': return 0x32CD32;
      case '岩石': return 0x708090;
      case '水体': return 0x1E90FF;
      case '火堆': return 0xFF4500;
      case '灯光': return 0xFFFF00;
      case '桌子': return 0x8B4513;
      case '椅子': return 0xA0522D;
      case '床': return 0xCD853F;
      case '书架': return 0x8B4513;
      
      // 道具
      case '武器': return 0x4682B4;
      case '盾牌': return 0xB0C4DE;
      case '药水': return 0xFF69B4;
      case '卷轴': return 0xF5DEB3;
      case '钥匙': return 0xFFD700;
      case '金币': return 0xFFD700;
      case '宝石': return 0x9370DB;
      
      // 特效
      case '光源': return 0xFFFF99;
      case '粒子': return 0x00FFFF;
      case '烟雾': return 0xDCDCDC;
      case '魔法阵': return 0x9370DB;
      
      // 默认颜色
      default: return 0x999999;
    }
  };

  // 根据2D对象创建3D对象
  const createObject3D = (obj: any) => {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let height = 1;
    
    // 定义常量
    const gridSize = 20; // 3D网格总大小（单位）
    
    // 使用当前设置的画布尺寸和映射因子
    const canvasWidth = canvasDimensions.width;
    const canvasHeight = canvasDimensions.height;
    const factorX = mappingFactor.x;
    const factorZ = mappingFactor.z;
    
    // 计算对象在3D空间中的尺寸
    // 将2D尺寸（像素）映射到3D尺寸（单位）
    const width3d = (obj.width / canvasWidth) * gridSize * factorX;
    const depth3d = (obj.height / canvasHeight) * gridSize * factorZ;

    switch (obj.type) {
      case '墙':
        geometry = new THREE.BoxGeometry(width3d, 2, depth3d);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = 2;
        break;
      case '地板':
        geometry = new THREE.BoxGeometry(width3d, 0.1, depth3d);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = 0.1;
        break;
      case '障碍物':
        geometry = new THREE.BoxGeometry(width3d, 1, depth3d);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = 1;
        break;
      case '玩家':
        // 对于角色类对象，使用固定尺寸
        geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 32);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = 1.8;
        break;
      case 'NPC':
        geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.7, 32);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = 1.7;
        break;
      case '敌人':
        geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.7, 32);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = 1.7;
        break;
      case '门':
        geometry = new THREE.BoxGeometry(width3d, 2, 0.1);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = 2;
        break;
      case '宝箱':
        // 对于特殊对象，可以根据2D尺寸进行适当缩放
        const chestSize = Math.min(width3d, depth3d);
        geometry = new THREE.BoxGeometry(chestSize, chestSize * 0.75, chestSize);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = chestSize * 0.75;
        break;
      case '开关':
        const switchSize = Math.min(width3d, depth3d);
        geometry = new THREE.BoxGeometry(switchSize, switchSize, switchSize);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = switchSize;
        break;
      default:
        geometry = new THREE.BoxGeometry(width3d, 1, depth3d);
        material = new THREE.MeshStandardMaterial({ 
          color: getObjectColor(obj.type),
          roughness: 0.7,
          metalness: 0.2
        });
        height = 1;
    }

    const mesh = new THREE.Mesh(geometry, material);
    
    // 计算对象中心点在2D坐标系中的位置（像素）
    const centerX = obj.x + obj.width / 2;
    const centerZ = obj.y + obj.height / 2;
    
    // 将2D坐标（像素）映射到3D坐标（单位）
    // 使用更精确的映射方法，并应用调整因子
    const x3d = ((centerX / canvasWidth) * gridSize * factorX) - (gridSize / 2);
    const z3d = ((centerZ / canvasHeight) * gridSize * factorZ) - (gridSize / 2);
    
    // 设置3D对象位置
    mesh.position.set(x3d, height / 2, z3d);
    
    // 应用旋转
    // 在Three.js中，旋转是围绕Y轴进行的，与2D平面中的旋转对应
    if (obj.rotation) {
      // 将角度转换为弧度
      const rotationRadians = (obj.rotation * Math.PI) / 180;
      mesh.rotation.y = -rotationRadians; // 注意旋转方向可能需要取反
    }
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // 添加调试辅助 - 显示对象的边界框
    if (showDebug) {
      const boxHelper = new THREE.BoxHelper(mesh, 0xff0000);
      mesh.add(boxHelper);
      
      // 添加位置指示器
      const posMarkerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const posMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
      const posMarker = new THREE.Mesh(posMarkerGeometry, posMarkerMaterial);
      posMarker.position.set(0, -height/2, 0); // 放在对象底部中心
      mesh.add(posMarker);
    }

    return mesh;
  };

  // 调整映射因子的函数
  const adjustMappingFactor = (axis: 'x' | 'z', delta: number) => {
    setMappingFactor(prev => ({
      ...prev,
      [axis]: Math.max(0.1, prev[axis] + delta)
    }));
  };

  return (
    <div className="three-d-preview">
      <div className="preview-toolbar">
        <h3>3D预览</h3>
        <div className="preview-controls">
          <button onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.set(10, 10, 10);
              cameraRef.current.lookAt(0, 0, 0);
            }
            if (controlsRef.current) {
              controlsRef.current.update();
            }
          }}>
            重置视图
          </button>
          <button onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.set(0, 20, 0);
              cameraRef.current.lookAt(0, 0, 0);
            }
            if (controlsRef.current) {
              controlsRef.current.update();
            }
          }}>
            俯视图
          </button>
          <button onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.set(20, 5, 0);
              cameraRef.current.lookAt(0, 0, 0);
            }
            if (controlsRef.current) {
              controlsRef.current.update();
            }
          }}>
            侧视图
          </button>
          <button onClick={() => setShowDebug(!showDebug)}>
            {showDebug ? '隐藏调试' : '显示调试'}
          </button>
        </div>
      </div>
      <div ref={mountRef} className="preview-container"></div>
      <div className="control-info">
        <p>鼠标左键：旋转视图 | 鼠标右键：平移视图 | 鼠标滚轮：缩放视图</p>
        <p>坐标系：红色-X轴 | 绿色-Y轴 | 蓝色-Z轴</p>
      </div>
      {showDebug && (
        <div className="debug-info">
          <h4>调试信息</h4>
          <pre>{debugInfo}</pre>
          <div className="debug-controls">
            <h4>调整映射</h4>
            <div className="mapping-control">
              <span>X轴映射: {mappingFactor.x.toFixed(2)}</span>
              <button onClick={() => adjustMappingFactor('x', -0.1)}>-</button>
              <button onClick={() => adjustMappingFactor('x', 0.1)}>+</button>
            </div>
            <div className="mapping-control">
              <span>Z轴映射: {mappingFactor.z.toFixed(2)}</span>
              <button onClick={() => adjustMappingFactor('z', -0.1)}>-</button>
              <button onClick={() => adjustMappingFactor('z', 0.1)}>+</button>
            </div>
            <div className="mapping-control">
              <button onClick={() => setMappingFactor({ x: 1.0, z: 1.0 })}>重置</button>
              <button onClick={() => setCanvasDimensions({ width: 400, height: 400 })}>400x400</button>
              <button onClick={() => setCanvasDimensions({ width: 600, height: 600 })}>600x600</button>
              <button onClick={() => setCanvasDimensions({ width: 800, height: 800 })}>800x800</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeDPreview; 