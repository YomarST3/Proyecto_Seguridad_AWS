import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface VoiceAssistantContextType {
  isEnabled: boolean;
  volume: number;
  isPlaying: boolean;
  toggleEnabled: () => void;
  setVolume: (vol: number) => void;
  playLoginAudio: () => void;
  playDashboardWelcome: (userName: string, companyStat?: string) => void;
  stopAll: () => void;
  replayLast: () => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined);

const AUDIO_PATH = encodeURI('/audio/Voz Proyecto.mp3');

export const VoiceAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('salesia_voice_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('salesia_voice_volume');
    return saved !== null ? Number(saved) : 0.85;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Referencias para control de audio y reproducción única
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedLoginRef = useRef<boolean>(false);
  const hasPlayedDashboardRef = useRef<boolean>(false);
  const lastGreetingRef = useRef<{ type: 'login' | 'dashboard'; name?: string; stat?: string } | null>(null);

  // Inicializar elemento de audio
  useEffect(() => {
    const audio = new Audio(AUDIO_PATH);
    audio.preload = 'auto';
    audio.volume = volume;

    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => {
      // Solo cambiar si no hay TTS hablando
      if (!window.speechSynthesis?.speaking) {
        setIsPlaying(false);
      }
    };
    audio.onerror = () => {
      console.warn('No se pudo cargar el archivo de voz:', AUDIO_PATH);
      setIsPlaying(false);
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Actualizar volumen cuando cambia
  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    localStorage.setItem('salesia_voice_volume', clamped.toString());
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  // Detener todos los audios y síntesis de voz inmediatamente
  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  // Alternar encendido / apagado de la voz
  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('salesia_voice_enabled', next.toString());
      if (!next) {
        stopAll();
      }
      return next;
    });
  }, [stopAll]);

  // Reproducir audio MP3 de bienvenida en el Login (Solo una vez)
  const playLoginAudio = useCallback(() => {
    if (!isEnabled || hasPlayedLoginRef.current) return;

    hasPlayedLoginRef.current = true;
    lastGreetingRef.current = { type: 'login' };
    stopAll();

    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.volume = volume;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // Bloqueo de autoplay por políticas del navegador: reanudar al primer clic o interacción
          const onFirstInteraction = () => {
            if (audioRef.current && isEnabled) {
              audioRef.current.currentTime = 0;
              audioRef.current.volume = volume;
              audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(() => {});
            }
            window.removeEventListener('click', onFirstInteraction);
            window.removeEventListener('keydown', onFirstInteraction);
            window.removeEventListener('touchstart', onFirstInteraction);
          };

          window.addEventListener('click', onFirstInteraction, { once: true });
          window.addEventListener('keydown', onFirstInteraction, { once: true });
          window.addEventListener('touchstart', onFirstInteraction, { once: true });
        });
    }
  }, [isEnabled, volume, stopAll]);

  // Reproducir bienvenida al Dashboard con nombre de usuario y dato de la empresa (Solo una vez)
  const playDashboardWelcome = useCallback(
    (userName: string, companyStat?: string) => {
      // 1. Inmediatamente silenciar cualquier audio previo de login
      stopAll();

      if (!isEnabled || hasPlayedDashboardRef.current) return;

      hasPlayedDashboardRef.current = true;
      lastGreetingRef.current = { type: 'dashboard', name: userName, stat: companyStat };

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const statText = companyStat || 'Las métricas y operaciones del sistema se encuentran actualizadas.';
      const mensaje = `Bienvenido al panel principal de control, ${userName}. ${statText}`;

      const utterance = new SpeechSynthesisUtterance(mensaje);
      utterance.volume = volume;
      utterance.rate = 0.96;
      utterance.pitch = 1.0;

      // Seleccionar voz en español preferida
      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(
          (v) => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Sabina') || v.name.includes('Alvaro') || v.name.includes('Helena'))
        ) || voices.find((v) => v.lang.startsWith('es'));

        if (spanishVoice) {
          utterance.voice = spanishVoice;
          utterance.lang = spanishVoice.lang;
        } else {
          utterance.lang = 'es-ES';
        }

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        setVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
    },
    [isEnabled, volume, stopAll]
  );

  // Permitir al usuario repetir voluntariamente el último audio escuchado
  const replayLast = useCallback(() => {
    if (!lastGreetingRef.current) return;
    if (lastGreetingRef.current.type === 'login') {
      hasPlayedLoginRef.current = false;
      playLoginAudio();
    } else if (lastGreetingRef.current.type === 'dashboard') {
      hasPlayedDashboardRef.current = false;
      playDashboardWelcome(
        lastGreetingRef.current.name || 'Usuario',
        lastGreetingRef.current.stat
      );
    }
  }, [playLoginAudio, playDashboardWelcome]);

  return (
    <VoiceAssistantContext.Provider
      value={{
        isEnabled,
        volume,
        isPlaying,
        toggleEnabled,
        setVolume,
        playLoginAudio,
        playDashboardWelcome,
        stopAll,
        replayLast
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export const useVoiceAssistant = (): VoiceAssistantContextType => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant debe ser usado dentro de un VoiceAssistantProvider');
  }
  return context;
};
