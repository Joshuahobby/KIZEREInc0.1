import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Lock, User } from "lucide-react";

interface AuthWallProps {
    returnUrl?: string;
    title?: string;
    description?: string;
}

export function AuthWall({ returnUrl, title, description }: AuthWallProps) {
    const { t } = useLanguage();
    const redirectPath = returnUrl || window.location.pathname;

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-[32px] border border-white/5 bg-[#0f1115] p-12 md:p-16 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-purple-500/5 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="h-20 w-20 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-10 relative z-10 shadow-inner">
                    <Lock className="w-8 h-8 text-sky-400" />
                </div>

                <h3 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-white mb-6 relative z-10">
                    {title || "Secure Registry Access"}
                </h3>

                <p className="text-slate-400 text-lg max-w-[480px] mb-10 font-medium leading-relaxed relative z-10">
                    {description || "To protect user privacy and prevent unauthorized data scraping, the Global Search Directory is restricted to verified KIZERE members."}
                </p>

                <div className="flex flex-col sm:flex-row w-full max-w-md gap-4 relative z-10">
                    <Button
                        className="flex-1 h-12 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-lg shadow-sky-500/20 transition-all text-base"
                        onClick={() => window.location.href = `/auth?tab=login&returnUrl=${encodeURIComponent(redirectPath)}`}
                    >
                        {t('auth.signIn') || 'Sign In to Search'}
                    </Button>

                    <Button
                        variant="outline"
                        className="flex-1 h-12 rounded-xl bg-transparent border-white/10 text-white hover:bg-white/5 font-bold transition-all text-base"
                        onClick={() => window.location.href = `/auth?tab=register&returnUrl=${encodeURIComponent(redirectPath)}`}
                    >
                        Create Free Account
                    </Button>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">
                    <ShieldIcon className="w-3.5 h-3.5" />
                    End-to-End Encrypted
                </div>
            </div>
        </div>
    );
}

function ShieldIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
    );
}
