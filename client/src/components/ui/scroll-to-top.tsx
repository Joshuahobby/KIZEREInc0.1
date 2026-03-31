import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function ScrollToTop({ inline = false }: { inline?: boolean }) {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (inline) return; // No scroll listener needed for inline mode
        
        const toggleVisibility = () => {
            // Show button when page is scrolled down 300px
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [inline]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (inline) {
        return (
            <Button
                variant="outline"
                onClick={scrollToTop}
                className="h-14 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-500 shadow-premium flex items-center gap-2 group"
                aria-label="Scroll to top"
            >
                <ArrowUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />
                {t('common.scrollToTop') || "Back to Top"}
            </Button>
        );
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    className="hidden md:block fixed bottom-6 right-6 z-50"
                >
                    <Button
                        size="icon"
                        onClick={scrollToTop}
                        className="h-14 w-14 rounded-full shadow-premium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-primary/50 hover:-translate-y-1"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp className="h-6 w-6" />
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
