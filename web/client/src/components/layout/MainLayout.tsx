import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

interface MainLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Início', href: '/' },
  { name: 'Síntese', href: '/sintese' },
  { name: 'Ementa', href: '/ementa' },
  { name: 'Revisão', href: '/revisao' },
  { name: 'Histórico', href: '/historico' },
  { name: 'Config', href: '/config' },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center font-bold text-primary-900">
                AP
              </div>
              <div>
                <h1 className="text-lg font-bold">APOIA Simulator <span className="font-normal text-sm text-primary-200">by Pedro Borges Mourão</span></h1>
                <p className="text-xs text-primary-200">Sistema de IA Jurídica</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary-600 text-white'
                      : 'text-primary-100 hover:bg-primary-400 hover:text-white'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-primary-400 px-4 py-2 flex overflow-x-auto space-x-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={clsx(
                'px-3 py-1 rounded text-sm whitespace-nowrap',
                location.pathname === item.href
                  ? 'bg-primary-600 text-white'
                  : 'text-primary-200'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            APOIA Simulator - Simulador do Sistema de IA Jurídica do TRF2
          </p>
        </div>
      </footer>
    </div>
  );
}
