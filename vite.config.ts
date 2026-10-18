import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 상대 경로로 빌드하므로 GitHub Pages 저장소 이름과 상관없이 동작합니다.
// 라우팅은 HashRouter(#/경로)를 써서 Pages에서 새로고침해도 404가 나지 않습니다.
export default defineConfig({
  base: './',
  plugins: [react()],
});
