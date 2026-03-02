import * as React from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTranslation } from "react-i18next";

interface VoiceHelperProps {
    audioSrc?: string;
    text?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function VoiceHelper({ audioSrc, text, className, size = "sm" }: VoiceHelperProps) {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const { language } = useLanguage();
    const { t } = useTranslation();

    const togglePlayback = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!audioRef.current && audioSrc) {
            audioRef.current = new Audio(audioSrc);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
        } else if (text) {
            // Fallback to Speech Synthesis if no audio file provided
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'rw' ? 'sw' : language; // RW usually doesn't have good TTS, fallback to SW or EN
            utterance.onend = () => setIsPlaying(false);
            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        }
    };

    const iconSize = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                "rounded-full transition-all duration-300",
                isPlaying ? "bg-primary/20 text-primary animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                className
            )}
            onClick={togglePlayback}
            title={isPlaying ? t("common.stopVoice") : t("common.voiceInstructions")}
        >
            {isPlaying ? (
                <VolumeX className={iconSize} />
            ) : (
                <Volume2 className={iconSize} />
            )}
        </Button>
    );
}
