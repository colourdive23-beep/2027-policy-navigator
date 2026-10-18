import { Link } from 'react-router-dom';
import Art from '../components/Art';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container empty">
        <Art name="squiggle" className="empty__art empty__art--sm" />
        <p className="section-label">404</p>
        <h1 className="section-title">페이지를 찾을 수 없어요</h1>
        <Link to="/" className="btn btn--primary">
          홈으로
        </Link>
      </div>
    </section>
  );
}
