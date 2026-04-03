import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatLabel = (str: string) => {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      <Link to="/dashboard" className="text-gray-400 hover:text-primary transition-colors cursor-pointer">
        <i className="ri-home-4-line"></i>
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <div key={name} className="flex items-center gap-2">
            <i className="ri-arrow-right-s-line text-gray-400"></i>
            {isLast ? (
              <span className="text-white font-medium">{formatLabel(name)}</span>
            ) : (
              <Link to={routeTo} className="text-gray-400 hover:text-primary transition-colors cursor-pointer">
                {formatLabel(name)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}