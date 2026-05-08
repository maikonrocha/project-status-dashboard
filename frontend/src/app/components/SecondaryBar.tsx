import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface SecondaryBarProps {
  breadcrumbs: Breadcrumb[];
  badge?: string;
}

export function SecondaryBar({ breadcrumbs, badge }: SecondaryBarProps) {
  return (
    <div className="border-b border-white/10 bg-slate-900/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-3">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-sm"
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                )}
                {isLast || !crumb.href ? (
                  <span className="text-white/70 font-medium">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-blue-300/60 hover:text-blue-200 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        {/* Badge */}
        {badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-400/20">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
