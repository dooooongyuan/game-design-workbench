import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 为Three.js创建别名，解决导入问题
      'three/addons/': path.resolve(__dirname, 'node_modules/three/examples/jsm/'),
      'three/webgpu': path.resolve(__dirname, 'node_modules/three/examples/jsm/renderers/WebGPURenderer.js')
    },
  },
  optimizeDeps: {
    exclude: ['three-render-objects', 'aframe-extras', '3d-force-graph-vr']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    fs: {
      // 允许访问上层目录
      allow: ['../']
    }
  }
});