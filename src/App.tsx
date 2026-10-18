import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Diagnosis from './pages/Diagnosis';
import Result from './pages/Result';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetail';
import ChecklistIndex from './pages/ChecklistIndex';
import ChecklistDetail from './pages/ChecklistDetail';
import Changes from './pages/Changes';
import NotFound from './pages/NotFound';

// GitHub Pages는 서버 라우팅을 지원하지 않으므로 HashRouter(#/경로)를 씁니다.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="diagnosis" element={<Diagnosis />} />
          <Route path="result" element={<Result />} />
          <Route path="programs" element={<Programs />} />
          <Route path="programs/:id" element={<ProgramDetail />} />
          <Route path="checklist" element={<ChecklistIndex />} />
          <Route path="checklist/:id" element={<ChecklistDetail />} />
          <Route path="changes" element={<Changes />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
