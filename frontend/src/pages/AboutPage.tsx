import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { useT } from '@/i18n/I18nProvider';

/**
 * Personal "about" page: an editorial masthead (eyebrow + big greeting with the
 * maintainer's handle in a brand gradient + a few manifesto lines), the source
 * attribution, and a single centered WeChat card to connect. The QR image is a
 * static asset at /wechat-qr.png (frontend/public/); a tasteful placeholder
 * shows until it's added.
 */
export function AboutPage(): React.JSX.Element {
  const t = useT();
  const [qrOk, setQrOk] = useState(true);

  return (
    <div className="mx-auto max-w-3xl pb-16">
      {/* Masthead */}
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {t('pages.about.eyebrow')}
      </p>
      <h1 className="mt-4 text-[32px] font-bold leading-tight tracking-tight sm:text-[40px]">
        {t('pages.about.greeting')}{' '}
        <span className="bg-gradient-to-r from-accent to-sky-400 bg-clip-text text-transparent">
          MUZI
        </span>
      </h1>
      <p className="mt-3 text-base text-muted-foreground">{t('pages.about.tagline')}</p>

      {/* Manifesto */}
      <div className="mt-9 space-y-2.5 text-lg leading-relaxed text-foreground/90">
        <p>{t('pages.about.line1')}</p>
        <p>{t('pages.about.line2')}</p>
        <p>{t('pages.about.line3')}</p>
      </div>

      {/* Attribution */}
      <div className="mt-9 space-y-2 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
        <p>{t('pages.about.attribution1')}</p>
        <p>{t('pages.about.attribution2')}</p>
      </div>

      {/* Connect — single centered WeChat card */}
      <p className="mt-16 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('pages.about.joinTitle')}
      </p>
      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-[320px] rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
            {t('pages.about.wechatLabel')}
          </div>
          <div className="mx-auto mt-4 grid h-56 w-56 place-items-center overflow-hidden rounded-xl border border-border bg-white">
            {qrOk ? (
              <img
                src="/wechat-qr.png"
                alt={t('pages.about.wechatLabel')}
                className="h-full w-full object-contain"
                onError={() => setQrOk(false)}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <QrCode className="h-12 w-12" aria-hidden />
                <span className="text-xs">{t('pages.about.wechatLabel')}</span>
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t('pages.about.wechatCaption')}</p>
        </div>
      </div>

      <p className="mt-14 text-center text-xs text-muted-foreground/60">
        {t('pages.about.footer')}
      </p>
    </div>
  );
}
