import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- DATOS DE CONFIGURACIÓN ---
const GENRES = ["Acción", "Comedia", "Drama", "Ciencia Ficción", "Terror", "Romance", "Suspense", "Animación"];
const PLATFORMS = ["Netflix", "Prime Video", "Disney+", "Max"];
const INTERESTS = ["Viajes", "Música", "Gaming", "Deportes", "Arte", "Cocina", "Libros", "Tecnología", "Moda"];
const EMOJIS = ['😊', '😂', '😍', '🔥', '👍', '🤔', '🎬', '🍿', '🎉', '❤️', '🤯', '😭'];
const TERMS_TEXT = `Última actualización: [Fecha]\n\nBienvenido a Cine Board. Estos términos y condiciones describen las reglas y regulaciones para el uso del sitio web de Cine Board, ubicado en [URL del sitio web].\n\nAl acceder a este sitio web, asumimos que aceptas estos términos y condiciones. No continúes usando Cine Board si no estás de acuerdo con todos los términos y condiciones establecidos en esta página.\n\nLicencia:\nA menos que se indique lo contrario, Cine Board y/o sus licenciantes son dueños de los derechos de propiedad intelectual de todo el material en Cine Board. Todos los derechos de propiedad intelectual están reservados. Puedes acceder a esto desde Cine Board para tu uso personal sujeto a las restricciones establecidas en estos términos y condiciones...`;
const PRIVACY_TEXT = `Última actualización: [Fecha]\n\nCine Board ("nosotros", "nuestro" o "nos") opera el sitio web [URL del sitio web] (el "Servicio").\n\nEsta página te informa de nuestras políticas sobre la recopilación, uso y divulgación de datos personales cuando usas nuestro Servicio y las opciones que has asociado con esos datos.\n\nUsamos tus datos para proporcionar y mejorar el Servicio. Al usar el Servicio, aceptas la recopilación y el uso de información de acuerdo con esta política. A menos que se defina lo contrario en esta Política de Privacidad, los términos utilizados en esta Política de Privacidad tienen el mismo significado que en nuestros Términos y Condiciones...`;


// --- INICIALIZACIÓN DE LA API ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- TIPOS ---
type Movie = { id: number; title: string; poster: string; genres: string[]; platforms: string[]; rating: number; year: number; synopsis: string; };
type UserProfile = { photo: string | null; name: string; bio: string; interests: string[]; favoriteQuote: string; };
type Message = { text: string; sender: 'me' | 'friend'; timestamp: string; };
type Friend = { id: number; name: string; photo: string; likedMovies: number[]; messages: Message[]; bio: string; interests: string[]; };
type MatchNotification = { friendName: string; movieTitle: string; moviePoster: string; friendPhoto: string; } | null;
type Screen = 'login' | 'verification' | 'profilePicture' | 'profileDetails' | 'profileInterests' | 'setup' | 'swipe' | 'myList' | 'profileView' | 'friendsList' | 'chat' | 'friendProfileView' | 'emailLogin';
type UserPreferences = { genres: string[], platforms:string[] };

// --- DATOS INICIALES (SI NO HAY DATOS GUARDADOS) ---
const INITIAL_FRIENDS: Friend[] = [
    { id: 1, name: 'Ana', photo: 'https://i.pravatar.cc/150?u=ana', likedMovies: [787699, 693134, 1022789], messages: [], bio: "Amante del cine de autor y las historias que te hacen pensar.", interests: ["Arte", "Libros", "Viajes"] },
    { id: 2, name: 'Carlos', photo: 'https://i.pravatar.cc/150?u=carlos', likedMovies: [823464, 787699, 940721], messages: [], bio: "Si hay explosiones y persecuciones, cuenta conmigo. Jugador en mi tiempo libre.", interests: ["Deportes", "Gaming", "Acción"] },
    { id: 3, name: 'Sofia', photo: 'https://i.pravatar.cc/150?u=sofia', likedMovies: [693134, 1011985, 572802], messages: [], bio: "Explorando nuevas realidades a través de la ciencia ficción y la tecnología.", interests: ["Tecnología", "Ciencia Ficción", "Música"] },
];


// --- NUEVOS COMPONENTES SOCIALES ---

export const AddFriendModal = ({ onClose }: { onClose: () => void }) => {
    const [copyText, setCopyText] = useState('Copiar');
    const friendLink = `https://cineboard.app/add?user=12345`;

    const handleCopy = () => {
        navigator.clipboard.writeText(friendLink).then(() => {
            setCopyText('¡Copiado!');
            setTimeout(() => setCopyText('Copiar'), 2000);
        });
    };

    return (
        <div className="friend-modal-overlay" onClick={onClose}>
            <div className="friend-modal" onClick={e => e.stopPropagation()}>
                <h3>Comparte para agregar amigos</h3>
                <p>Cualquiera con este enlace podrá enviarte una solicitud de amistad.</p>
                <div className="friend-link-container">
                    <input type="text" readOnly value={friendLink} className="friend-link-input" />
                    <button onClick={handleCopy} className="copy-link-button">{copyText}</button>
                </div>
                <button onClick={onClose} className="close-modal-button">Cerrar</button>
            </div>
        </div>
    );
};

export const FriendsListScreen = ({ friends, onViewProfile }: { friends: Friend[], onViewProfile: (friend: Friend) => void }) => (
    <div className="list-container">
        <header className="header">
            <h2 className="header-title" style={{textAlign: 'center', width: '100%'}}>Amigos</h2>
        </header>
        <div className="friends-list-screen">
            {friends.map(friend => (
                <div key={friend.id} className="friend-item" onClick={() => onViewProfile(friend)}>
                    <img src={friend.photo} alt={friend.name} className="friend-photo" />
                    <span className="friend-name">{friend.name}</span>
                    <span className="chat-arrow">›</span>
                </div>
            ))}
        </div>
    </div>
);

export const FriendProfileScreen = ({ friend, onBack, onChat }: { friend: Friend; onBack: () => void; onChat: () => void; }) => {
    return (
        <div className="profile-view-screen">
            <header className="header">
                <button className="nav-button" onClick={onBack} aria-label="Volver">‹</button>
                <h2 className="header-title">Perfil de {friend.name}</h2>
                <div style={{width: '40px'}}></div>
            </header>
            <div className="profile-content">
                <div className="profile-card">
                    <img src={friend.photo} alt={friend.name} className="profile-photo"/>
                    <h2>{friend.name}</h2>
                    <p className="profile-bio">{friend.bio}</p>
                    <div className="profile-interests">
                        <h3>Intereses</h3>
                        <div className="interests-tags">
                            {friend.interests.map(interest => <span key={interest} className="interest-tag">{interest}</span>)}
                        </div>
                    </div>
                </div>
                <div className="profile-actions">
                    <button className="add-friend-button" onClick={onChat}>Enviar Mensaje</button>
                </div>
            </div>
        </div>
    );
};


export const ChatScreen = ({ friend, onBack, onSendMessage }: { friend: Friend; onBack: () => void; onSendMessage: (friendId: number, messageText: string) => void; }) => {
    const [inputValue, setInputValue] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isFriendTyping, setIsFriendTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessage = friend.messages[friend.messages.length - 1];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [friend.messages, isFriendTyping]);
    
    useEffect(() => {
      // Muestra el indicador de escritura cuando el último mensaje es del usuario.
      if (lastMessage && lastMessage.sender === 'me') {
          setIsFriendTyping(true);
          // Oculta el indicador después de un tiempo, justo antes de que llegue la respuesta.
          const timer = setTimeout(() => {
              setIsFriendTyping(false);
          }, 1800);
          return () => clearTimeout(timer);
      } else {
          setIsFriendTyping(false);
      }
    }, [lastMessage]);


    const handleSend = () => {
        if (inputValue.trim()) {
            onSendMessage(friend.id, inputValue.trim());
            setInputValue('');
            setShowEmojiPicker(false);
        }
    };
    
    const handleEmojiClick = (emoji: string) => {
        setInputValue(prev => prev + emoji);
    };

    return (
        <div className="chat-screen-container">
            <header className="header">
                <button className="nav-button" onClick={onBack} aria-label="Volver">‹</button>
                <div className="chat-header-info">
                    <img src={friend?.photo} alt={friend?.name} />
                    <h2 className="header-title">{friend?.name}</h2>
                </div>
                <div style={{ width: '40px' }}></div>
            </header>
            <div className="messages-container">
                {friend.messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.sender}`}>
                        <div className={`message-bubble ${msg.sender}`}>{msg.text}</div>
                        <span className="message-timestamp">{msg.timestamp}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            {isFriendTyping && (
                <div className="typing-indicator-bar">
                    <div className="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            )}
             {showEmojiPicker && (
                <div className="emoji-picker">
                    {EMOJIS.map(emoji => (
                        <button key={emoji} className="emoji-item" onClick={() => handleEmojiClick(emoji)}>{emoji}</button>
                    ))}
                </div>
            )}
            <div className="chat-input-area">
                <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <button className="emoji-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                <button onClick={handleSend}>Enviar</button>
            </div>
        </div>
    );
};

export const MatchScreen = ({ match, onContinue, onChat }: { match: MatchNotification, onContinue: () => void, onChat: () => void }) => {
    if (!match) return null;
    return (
        <div className="match-screen-overlay">
            <div className="match-content">
                <div className="match-header">
                    <h2>¡Es un Match!</h2>
                    <p>A ti y a {match.friendName} les gusta <strong>{match.movieTitle}</strong></p>
                </div>
                <div className="match-visuals">
                    <img src="https://i.pravatar.cc/150?u=me" alt="Tu perfil" className="match-profile-pic my-pic" />
                    <img src={match.moviePoster} alt={match.movieTitle} className="match-movie-poster" />
                    <img src={match.friendPhoto} alt={match.friendName} className="match-profile-pic friend-pic" />
                </div>
                <div className="match-actions">
                    <button className="match-button chat" onClick={onChat}>Enviar Mensaje</button>
                    <button className="match-button continue" onClick={onContinue}>Seguir Buscando</button>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTES DE UTILIDAD ---
export const InfoModal = ({ title, text, onClose }: { title: string; text: string; onClose: () => void; }) => (
    <div className="info-modal-overlay" onClick={onClose}>
        <div className="info-modal" onClick={e => e.stopPropagation()}>
            <h3>{title}</h3>
            <div className="modal-text-content">
                <p>{text.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
            </div>
            <button onClick={onClose} className="close-modal-button">Cerrar</button>
        </div>
    </div>
);

// --- COMPONENTES DE AUTENTICACIÓN Y PERFIL ---
export const LoginScreen = ({ setScreen, setAuthMethod, onSocialLogin }: { setScreen: (s: Screen) => void, setAuthMethod: (m: string) => void, onSocialLogin: () => void }) => {
    const [modalContent, setModalContent] = useState<{ title: string; text: string; } | null>(null);

    return (
        <div className="auth-screen tinder-style">
            {modalContent && <InfoModal title={modalContent.title} text={modalContent.text} onClose={() => setModalContent(null)} />}
            <div className="logo-container">
                <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                    <line x1="7" y1="2" x2="7" y2="22"></line>
                    <line x1="17" y1="2" x2="17" y2="22"></line>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <line x1="2" y1="7" x2="7" y2="7"></line>
                    <line x1="2" y1="17" x2="7" y2="17"></line>
                    <line x1="17" y1="17" x2="22" y2="17"></line>
                    <line x1="17" y1="7" x2="22" y2="7"></line>
                </svg>
                <h1 className="header-title">CINE BOARD</h1>
            </div>

            <div className="auth-actions-container">
                <p className="terms">Al continuar, aceptas nuestros <button className="link-button" onClick={() => setModalContent({ title: 'Términos de Servicio', text: TERMS_TEXT })}>Términos</button> y <button className="link-button" onClick={() => setModalContent({ title: 'Política de Privacidad', text: PRIVACY_TEXT })}>Política de Privacidad</button>.</p>
                <div className="login-actions">
                    <button className="auth-button" onClick={onSocialLogin}>
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.386-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.85l3.25-3.138C18.182 1.186 15.473 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.957 0 12.02-4.815 12.02-12.24h-.015v-1.955h-12.005z" transform="translate(0 .002)"></path></svg>
                        <span>Continuar con Google</span>
                    </button>
                     <button className="auth-button" onClick={onSocialLogin}>
                         <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#000000" d="M12.024,1.636c-2.95,0-5.435,2.155-5.435,2.155c-0.229,0.198-0.233,0.31-0.233,0.31c2.109-0.015,4.332,1.348,5.435,1.348c1.103,0,3.311-1.348,5.42-1.348c0,0-0.004-0.112-0.233-0.31C17.459,3.791,14.974,1.636,12.024,1.636z M18.189,6.209c-2.035,0.015-4.232,1.259-5.321,1.259c-1.09,0-3.286-1.259-5.321-1.259c-2.846,0-5.213,2.367-5.213,5.213c0,3.614,2.986,6.33,5.904,6.33c1.943,0,3.854-1.56,5.321-1.56c1.467,0,3.378,1.56,5.321,1.56c2.918,0,5.904-2.716,5.904-6.33C23.402,8.576,21.035,6.209,18.189,6.209z"/></svg>
                        <span>Continuar con Apple</span>
                    </button>
                    <button className="auth-button" onClick={onSocialLogin}>
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#1877F2" d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.732 0 1.325-.593 1.325-1.325V1.325C24 .593 23.407 0 22.675 0z"></path></svg>
                        <span>Continuar con Facebook</span>
                    </button>
                     <div className="auth-divider"><span>O</span></div>
                    <button className="auth-button auth-button-secondary" onClick={() => { setAuthMethod('email'); setScreen('emailLogin'); }}>
                        <span>Continuar con Correo</span>
                    </button>
                    <button className="auth-button auth-button-secondary" onClick={() => { setAuthMethod('phone'); setScreen('verification'); }}>
                        <span>Continuar con Teléfono</span>
                    </button>
                </div>
                <p className="trouble-logging-in">¿Problemas para iniciar sesión?</p>
            </div>
        </div>
    );
};

export const EmailLoginScreen = ({ onLogin, onBack }: { onLogin: () => void, onBack: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

    const handleLoginClick = () => {
        if (!validateEmail(email)) {
            setError('Por favor, introduce un email válido.');
            return;
        }
        if (!password) {
            setError('Por favor, introduce tu contraseña.');
            return;
        }
        setError('');
        // Simular llamada a la API
        if (email.toLowerCase() === 'test@cineboard.com' && password === 'password123') {
            onLogin();
        } else {
            setError('El email o la contraseña son incorrectos.');
        }
    };

    return (
        <div className="auth-screen email-login-screen">
             <button onClick={onBack} className="back-button" aria-label="Volver">‹</button>
            <header>
                <h2>Inicia sesión con tu correo</h2>
            </header>
            <div className="profile-form">
                <div className="input-group">
                    <label>Correo Electrónico</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"/>
                </div>
                 <div className="input-group">
                    <label>Contraseña</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/>
                </div>
                {error && <p className="error-message">{error}</p>}
            </div>
            <div>
                <button className="continue-button" onClick={handleLoginClick}>Iniciar Sesión</button>
                <p className="forgot-password">¿Has olvidado tu contraseña?</p>
            </div>
        </div>
    );
};


export const VerificationScreen = ({ authMethod, onVerify }: { authMethod: string, onVerify: () => void }) => {
    const [code, setCode] = useState(new Array(6).fill(""));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return;
        const newCode = [...code];
        newCode[index] = element.value;
        setCode(newCode);
        if (element.value !== "" && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };
    
    useEffect(() => {
        if (code.every(c => c !== '')) {
            onVerify();
        }
    }, [code, onVerify]);

    return (
        <div className="auth-screen">
            <header>
                <h1>Verifica tu cuenta</h1>
                <p>Introduce el código de 6 dígitos enviado a <br/><strong>{authMethod}</strong></p>
            </header>
            <div className="verification-group">
                <div className="code-inputs">
                    {code.map((data, index) => (
                        <input key={index} ref={el => { inputsRef.current[index] = el; }} type="text" maxLength={1} value={data} onChange={e => handleChange(e.target, index)} onKeyDown={e => handleKeyDown(e, index)} className="code-input" />
                    ))}
                </div>
            </div>
            <p className="resend-code">¿No recibiste el código? <span>Reenviar</span></p>
        </div>
    );
};

export const ProfilePictureScreen = ({ onContinue, updateProfile, onBack }: { onContinue: () => void, updateProfile: (p: Partial<UserProfile>) => void, onBack: () => void }) => {
    const [photo, setPhoto] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPhoto(result);
                updateProfile({ photo: result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="profile-setup-screen">
             <button onClick={onBack} className="back-button" aria-label="Volver">‹</button>
            <header>
                <h2>Añade tu foto de perfil</h2>
                <p>¡Muéstranos tu mejor sonrisa!</p>
            </header>
            <div className="photo-uploader" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                {photo ? <img src={photo} alt="Vista previa" className="photo-preview" /> : <div className="photo-placeholder">+</div>}
            </div>
            <button className="continue-button" onClick={onContinue} disabled={!photo}>Continuar</button>
        </div>
    );
};

export const ProfileDetailsScreen = ({ onContinue, updateProfile, onBack }: { onContinue: () => void, updateProfile: (p: Partial<UserProfile>) => void, onBack: () => void }) => {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [favoriteQuote, setFavoriteQuote] = useState('');

    const handleContinue = () => {
        updateProfile({ name, bio, favoriteQuote });
        onContinue();
    };

    return (
        <div className="profile-setup-screen">
            <button onClick={onBack} className="back-button" aria-label="Volver">‹</button>
            <div className="progress-bar"><div className="progress" style={{width: '66%'}}></div></div>
            <header>
                <h2>Cuéntanos sobre ti</h2>
                <p>¿Cómo te llamas y qué te apasiona?</p>
            </header>
            <div className="profile-form">
                <div className="input-group">
                    <label>Nombre</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={30} placeholder="Tu nombre"/>
                    <span className="char-counter">{name.length} / 30</span>
                </div>
                 <div className="input-group">
                    <label>Tu descripción</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={150} placeholder="Amante del cine de autor y las palomitas con extra mantequilla..."/>
                    <span className="char-counter">{bio.length} / 150</span>
                </div>
                 <div className="input-group">
                    <label>Cita de película favorita (opcional)</label>
                    <textarea value={favoriteQuote} onChange={e => setFavoriteQuote(e.target.value)} maxLength={100} placeholder='"Que la fuerza te acompañe." - Star Wars' className="quote-input"/>
                    <span className="char-counter">{favoriteQuote.length} / 100</span>
                </div>
            </div>
            <button className="continue-button" onClick={handleContinue} disabled={!name.trim() || !bio.trim()}>Continuar</button>
        </div>
    );
};

export const ProfileInterestsScreen = ({ onFinish, updateProfile, onBack }: { onFinish: () => void, updateProfile: (p: Partial<UserProfile>) => void, onBack: () => void }) => {
    const [interests, setInterests] = useState<Set<string>>(new Set());
    
    const toggleInterest = (interest: string) => {
        const newInterests = new Set(interests);
        if (newInterests.has(interest)) {
            newInterests.delete(interest);
        } else {
            if (newInterests.size < 5) newInterests.add(interest);
        }
        setInterests(newInterests);
    };

    const handleFinish = () => {
        updateProfile({ interests: Array.from(interests) });
        onFinish();
    }

    return (
        <div className="profile-setup-screen">
             <button onClick={onBack} className="back-button" aria-label="Volver">‹</button>
             <div className="progress-bar"><div className="progress" style={{width: '100%'}}></div></div>
            <header>
                <h2>Elige tus intereses</h2>
                <p>Selecciona hasta 5 que te representen.</p>
            </header>
            <div className="interests-grid">
                {INTERESTS.map(interest => (
                    <button key={interest} onClick={() => toggleInterest(interest)} className={`grid-button ${interests.has(interest) ? 'selected' : ''}`}>
                        {interest}
                    </button>
                ))}
            </div>
            <button className="start-button" onClick={handleFinish} disabled={interests.size === 0}>Finalizar Perfil</button>
        </div>
    );
};

// --- COMPONENTES PRINCIPALES ---
export const SetupScreen = ({ onStart }: { onStart: (genres: string[], platforms: string[]) => void }) => {
    const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
    const toggleSelection = (set: Set<string>, item: string, update: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        const newSet = new Set(set);
        newSet.has(item) ? newSet.delete(item) : newSet.add(item);
        update(newSet);
    };
    return (
        <div className="setup-screen">
            <header>
                <h1>CINE BOARD</h1>
                <p>Tu próxima película favorita te espera.</p>
            </header>
            <section>
                <h2>Selecciona tus géneros favoritos:</h2>
                <div className="selection-grid">
                    {GENRES.map(genre => <button key={genre} onClick={() => toggleSelection(selectedGenres, genre, setSelectedGenres)} className={`grid-button ${selectedGenres.has(genre) ? 'selected' : ''}`}>{genre}</button>)}
                </div>
            </section>
            <section>
                <h2>¿Qué plataformas de streaming usas?</h2>
                <div className="selection-grid">
                    {PLATFORMS.map(platform => <button key={platform} onClick={() => toggleSelection(selectedPlatforms, platform, setSelectedPlatforms)} className={`grid-button ${selectedPlatforms.has(platform) ? 'selected' : ''}`}>{platform}</button>)}
                </div>
            </section>
            <button className="start-button" onClick={() => onStart(Array.from(selectedGenres), Array.from(selectedPlatforms))} disabled={selectedGenres.size === 0 || selectedPlatforms.size === 0}>Empezar a Descubrir</button>
        </div>
    );
};

export const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => {
    return (
        <div className="movie-card" style={{ backgroundImage: `url(${movie.poster})` }}>
            <div className="card-content">
                <div>
                    <h3 className="card-title">{movie.title}</h3>
                    <div className="card-meta">
                         <span className="card-meta-item rating">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                            {movie.rating.toFixed(1)}
                        </span>
                        <span className="card-meta-item year">{movie.year}</span>
                    </div>
                </div>
                <div className="card-synopsis-container">
                    <p className="synopsis-label">Sinopsis:</p>
                    <div className="card-synopsis">{movie.synopsis || "No hay sinopsis disponible."}</div>
                </div>
            </div>
        </div>
    );
};

export const SwipeScreen = ({ movies, setSavedList, setScreen, userProfile, isLoading, isLoadingMore, loadMoreMovies, setHasShownGenreWarning, friends, setMatch, userLikedMovies, setUserLikedMovies, matchNotification }: {
    movies: Movie[],
    setSavedList: React.Dispatch<React.SetStateAction<Movie[]>>,
    setScreen: (screen: Screen) => void,
    userProfile: UserProfile | null,
    isLoading: boolean,
    isLoadingMore: boolean,
    loadMoreMovies: () => void,
    setHasShownGenreWarning: (value: boolean) => void,
    friends: Friend[],
    setMatch: (notification: MatchNotification) => void,
    userLikedMovies: Set<number>,
    setUserLikedMovies: React.Dispatch<React.SetStateAction<Set<number>>>,
    matchNotification: MatchNotification,
}) => {
    const [movieQueue, setMovieQueue] = useState(movies);
    const isLoadingMoreRef = useRef(false);

    useEffect(() => {
        setMovieQueue(movies);
    }, [movies]);

    const handleSwipe = (direction: 'left' | 'right' | 'up', movie: Movie) => {
        if (direction === 'right') { // LIKE
            const newLikedMovies = new Set(userLikedMovies).add(movie.id);
            setUserLikedMovies(newLikedMovies);
            // Check for match
            for (const friend of friends) {
                if (friend.likedMovies.includes(movie.id)) {
                    setMatch({ friendName: friend.name, movieTitle: movie.title, moviePoster: movie.poster, friendPhoto: friend.photo });
                    break; // Only show one match notification
                }
            }
        } else if (movie.id === -1) {
            setHasShownGenreWarning(true);
        } else if (direction === 'up') {
            setSavedList(prev => [...prev, movie]);
        }
        
        const cardEl = document.querySelector('.movie-card:last-of-type, .genre-warning-card:last-of-type');
        if (cardEl) {
            let transform = '';
            if (direction === 'left') transform = 'translateX(-200%) rotate(-30deg)';
            else if (direction === 'right') transform = 'translateX(200%) rotate(30deg)';
            else if (direction === 'up') transform = 'translateY(-200%) rotate(0deg)';
            (cardEl as HTMLElement).style.transform = transform;
            (cardEl as HTMLElement).style.opacity = '0';
        }

        setTimeout(() => {
            setMovieQueue(prev => {
                const newQueue = prev.slice(0, -1);
                if (!isLoadingMoreRef.current && newQueue.length <= 3) {
                    isLoadingMoreRef.current = true;
                    loadMoreMovies();
                    setTimeout(() => { isLoadingMoreRef.current = false; }, 2000);
                }
                return newQueue;
            });
        }, 300);
    };

    const currentMovie = movieQueue.length > 0 ? movieQueue[movieQueue.length - 1] : null;
    return (
        <div className="swipe-screen">
            <header className="header">
                <button className="nav-button profile-button" onClick={() => setScreen('profileView')} aria-label="Mi Perfil">
                    {userProfile?.photo ? <img src={userProfile.photo} alt="Perfil"/> : <div className="profile-placeholder-icon"></div>}
                </button>
                <h1 className="header-title" aria-label="Cine Board">CINE BOARD</h1>
                 <button className="nav-button friends-button" onClick={() => setScreen('friendsList')} aria-label="Amigos">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                </button>
                <button className="nav-button" onClick={() => setScreen('myList')} aria-label="Mi Lista">★</button>
            </header>
            <div className="card-container">
                {isLoading ? (
                    <div className="loading-spinner"></div>
                ) : movieQueue.length > 0 ? (
                    movieQueue.map(movie =>
                        movie.id === -1 ? (
                            <div key={movie.id} className="genre-warning-card">
                                <h3>¡Nuevos Horizontes!</h3>
                                <p>{movie.synopsis}</p>
                            </div>
                        ) : (
                            <MovieCard key={movie.id} movie={movie} />
                        )
                    )
                ) : isLoadingMore ? (
                    <div className="loading-spinner"></div>
                ) : (
                    <div className="no-more-cards"><h3>¡Eso es todo por ahora!</h3><p>Vuelve más tarde para más recomendaciones.</p></div>
                )}
            </div>
            {currentMovie && (
              <div className="action-buttons">
                  <button className="action-button dislike" onClick={() => handleSwipe('left', currentMovie)} aria-label="No me interesa"><svg viewBox="0 0 24 24"><path d="M18.36 5.64a9 9 0 10-12.72 12.72 9 9 0 0012.72-12.72zM12 21a9 9 0 110-18 9 9 0 010 18zm-1.41-11.59L12 10.83l1.41-1.42L14.83 12l-1.42 1.41L12 12.24l-1.41 1.42L9.17 12l1.42-1.41z"/></svg></button>
                  <button className="action-button save" onClick={() => handleSwipe('up', currentMovie)} aria-label="Guardar en mi lista"><svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/></svg></button>
                  <button className="action-button like" onClick={() => handleSwipe('right', currentMovie)} aria-label="Me gusta"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
              </div>
            )}
        </div>
    );
};

export const MyListScreen = ({ savedList, setScreen }: { savedList: Movie[], setScreen: (screen: Screen) => void }) => (
    <div className="list-container">
        <header className="header">
            <button className="nav-button" onClick={() => setScreen('swipe')} aria-label="Volver">‹</button>
            <h2 className="header-title">Mi Lista</h2>
            <div style={{width: '40px'}}></div>
        </header>
        <div className="my-list-screen">
            {savedList.length > 0 ? (
                <div className="list-grid">{savedList.map(movie => <div key={movie.id} className="list-item"><img src={movie.poster} alt={movie.title} /></div>)}</div>
            ) : (
                <div className="empty-list"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--secondary-text)'}}><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg><p>Aún no has guardado ninguna película.<br/>¡Desliza hacia arriba para añadirla a tu lista!</p></div>
            )}
        </div>
    </div>
);

export const ProfileScreen = ({ userProfile, setScreen, onLogout }: { userProfile: UserProfile, setScreen: (s: Screen) => void, onLogout: () => void }) => {
    const [showModal, setShowModal] = useState(false);
    return (
        <div className="profile-view-screen">
             {showModal && <AddFriendModal onClose={() => setShowModal(false)} />}
            <header className="header">
                <button className="nav-button" onClick={() => setScreen('swipe')} aria-label="Volver">‹</button>
                <h2 className="header-title">Mi Perfil</h2>
                <div style={{width: '40px'}}></div>
            </header>
            <div className="profile-content">
                <div className="profile-card">
                    <img src={userProfile.photo!} alt={userProfile.name} className="profile-photo"/>
                    <h2>{userProfile.name}</h2>
                    <p className="profile-bio">{userProfile.bio}</p>
                    {userProfile.favoriteQuote && <p className="profile-quote">"{userProfile.favoriteQuote}"</p>}
                    <div className="profile-interests">
                        <h3>Intereses</h3>
                        <div className="interests-tags">
                            {userProfile.interests.map(interest => <span key={interest} className="interest-tag">{interest}</span>)}
                        </div>
                    </div>
                </div>
                <div className="profile-actions">
                    <button className="add-friend-button" onClick={() => setShowModal(true)}>Agregar Amigos</button>
                    <button className="logout-button" onClick={onLogout}>Cerrar Sesión</button>
                </div>
            </div>
        </div>
    );
};


export const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [screen, setScreen] = useState<Screen>('login');
    const [authMethod, setAuthMethod] = useState('');
    const [userProfile, setUserProfile] = useState<UserProfile>({ photo: null, name: '', bio: '', interests: [], favoriteQuote: '' });
    const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
    const [savedList, setSavedList] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allShownMovieTitles, setAllShownMovieTitles] = useState<Set<string>>(new Set());
    const [hasShownGenreWarning, setHasShownGenreWarning] = useState(false);
    const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
    
    // Social State
    const [friends, setFriends] = useState<Friend[]>(() => {
        try {
            const savedFriends = localStorage.getItem('cineboard_friends');
            return savedFriends ? JSON.parse(savedFriends) : INITIAL_FRIENDS;
        } catch (error) {
            console.error("No se pudieron cargar los amigos del almacenamiento local", error);
            return INITIAL_FRIENDS;
        }
    });
    const [userLikedMovies, setUserLikedMovies] = useState<Set<number>>(new Set());
    const [match, setMatch] = useState<MatchNotification>(null);
    const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);
    const [viewingFriend, setViewingFriend] = useState<Friend | null>(null);

    // Persistir amigos en el almacenamiento local
    useEffect(() => {
        try {
            localStorage.setItem('cineboard_friends', JSON.stringify(friends));
        } catch (error) {
            console.error("No se pudieron guardar los amigos en el almacenamiento local", error);
        }
    }, [friends]);

    const movieSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.NUMBER, description: "A unique integer ID for the movie from an external database like TMDb." },
            title: { type: Type.STRING },
            poster: { type: Type.STRING, description: "URL of a high-quality movie poster." },
            genres: { type: Type.ARRAY, items: { type: Type.STRING } },
            platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
            rating: { type: Type.NUMBER },
            year: { type: Type.NUMBER },
            synopsis: { type: Type.STRING, description: "A concise and engaging synopsis of the movie, in Spanish, between 2 and 3 sentences long, without revealing major spoilers." },
        },
        required: ["id", "title", "poster", "genres", "platforms", "rating", "year", "synopsis"]
    };

    const fetchMovies = useCallback(async (count: number, preferences: UserPreferences, exclude: string[]) => {
        const useExpandedSearch = allShownMovieTitles.size >= 15;

        let prompt;
        if (useExpandedSearch) {
             prompt = `Recomiéndame ${count} películas de cualquier género. Sorpréndeme con una mezcla de películas populares, clásicos de culto, y joyas ocultas o cine indie. Proporciona IDs reales de TMDb. Para cada película, escribe una sinopsis de alta calidad en español, de 2 a 3 frases, que sea informativa y no contenga spoilers. Evita estas películas que ya han sido mostradas: ${exclude.join(', ')}.`;
        } else {
            prompt = `Recomiéndame ${count} películas de los géneros: ${preferences.genres.join(', ')}. Deben estar disponibles en estas plataformas de streaming: ${preferences.platforms.join(', ')}. Sorpréndeme con una mezcla de películas populares, clásicos de culto, y joyas ocultas o cine indie. Proporciona IDs reales de TMDb. Para cada película, escribe una sinopsis de alta calidad en español, de 2 a 3 frases, que sea informativa y no contenga spoilers. Evita estas películas que ya han sido mostradas: ${exclude.join(', ')}.`;
        }

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: movieSchema },
                }
            });
            const newMovies: Movie[] = JSON.parse(response.text);
            const uniqueNewMovies = newMovies.filter(movie => movie.title && !allShownMovieTitles.has(movie.title));
            return uniqueNewMovies;
        } catch (error) {
            console.error("Error fetching movies:", error);
            return [];
        }
    }, [allShownMovieTitles]);
    
    const handleStart = async (genres: string[], platforms: string[]) => {
        const prefs = { genres, platforms };
        setUserPreferences(prefs);
        setIsLoading(true);
        setScreen('swipe');
        const initialMovies = await fetchMovies(10, prefs, []);
        if (initialMovies) {
            setRecommendedMovies(initialMovies.reverse());
            setAllShownMovieTitles(new Set(initialMovies.map(m => m.title)));
        }
        setIsLoading(false);
    };
    
    const loadMoreMovies = useCallback(async () => {
        if (!userPreferences || isLoadingMore) return;
        setIsLoadingMore(true);
        const newMovies = await fetchMovies(5, userPreferences, Array.from(allShownMovieTitles));
        if (newMovies && newMovies.length > 0) {
            const newTitles = newMovies.map(m => m.title);
            const shouldShowWarning = allShownMovieTitles.size >= 15 && !hasShownGenreWarning;
            
            if (shouldShowWarning) {
                const warningCard: Movie = {
                    id: -1, title: 'Nuevos Horizontes', poster: '', genres: [], platforms: [], rating: 0, year: 0,
                    synopsis: '¡Exploremos más allá! A partir de ahora, verás recomendaciones de otros géneros que podrían encantarte.'
                };
                setRecommendedMovies(prev => [...prev, warningCard, ...newMovies.reverse()]);
            } else {
                setRecommendedMovies(prev => [...prev, ...newMovies.reverse()]);
            }
            setAllShownMovieTitles(prev => new Set([...prev, ...newTitles]));
        }
        setIsLoadingMore(false);
    }, [userPreferences, allShownMovieTitles, hasShownGenreWarning, fetchMovies, isLoadingMore]);

    const handleLoginSuccess = () => {
        setIsLoggingIn(true);
        setTimeout(() => {
            setIsLoggedIn(true);
            setScreen('profilePicture');
            setIsLoggingIn(false);
        }, 1500);
    };
    
    const handleLogout = () => {
        setIsLoggedIn(false);
        setScreen('login');
        setUserProfile({ photo: null, name: '', bio: '', interests: [], favoriteQuote: '' });
        setSavedList([]);
        setRecommendedMovies([]);
        setAllShownMovieTitles(new Set());
        setHasShownGenreWarning(false);
        setUserPreferences(null);
        setUserLikedMovies(new Set());
        localStorage.removeItem('cineboard_friends');
        setFriends(INITIAL_FRIENDS);
    };

    const updateProfile = (data: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...data }));
    };

    const handleStartChat = (friend: Friend) => {
        const friendInState = friends.find(f => f.id === friend.id);
        if (friendInState && friendInState.messages.length === 0) {
            const welcomeMessage: Message = {
                text: `¡Hola! ¿Listo para hablar de películas? 🎬`,
                sender: 'friend',
                timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            };
            setFriends(currentFriends =>
                currentFriends.map(f =>
                    f.id === friend.id ? { ...f, messages: [welcomeMessage] } : f
                )
            );
        }
        setActiveChatFriend(friend);
        setScreen('chat');
    };

    const handleSendMessage = (friendId: number, messageText: string) => {
        const newMessage: Message = {
            text: messageText,
            sender: 'me',
            timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };

        setFriends(currentFriends =>
            currentFriends.map(f =>
                f.id === friendId ? { ...f, messages: [...f.messages, newMessage] } : f
            )
        );

        setTimeout(() => {
            const replyMessage: Message = {
                text: '¡Totalmente de acuerdo! 🍿',
                sender: 'friend',
                timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            };
             setFriends(currentFriends =>
                currentFriends.map(f =>
                    f.id === friendId ? { ...f, messages: [...f.messages, replyMessage] } : f
                )
            );
        }, 2000);
    };

    const renderAuth = () => {
        switch (screen) {
            case 'login': return <LoginScreen setScreen={setScreen} setAuthMethod={setAuthMethod} onSocialLogin={handleLoginSuccess} />;
            case 'verification': return <VerificationScreen authMethod={authMethod} onVerify={handleLoginSuccess} />;
            case 'emailLogin': return <EmailLoginScreen onLogin={handleLoginSuccess} onBack={() => setScreen('login')} />;
            default: return <LoginScreen setScreen={setScreen} setAuthMethod={setAuthMethod} onSocialLogin={handleLoginSuccess} />;
        }
    }

    const renderApp = () => {
        switch (screen) {
            case 'profilePicture': return <ProfilePictureScreen onContinue={() => setScreen('profileDetails')} updateProfile={updateProfile} onBack={handleLogout}/>;
            case 'profileDetails': return <ProfileDetailsScreen onContinue={() => setScreen('profileInterests')} updateProfile={updateProfile} onBack={() => setScreen('profilePicture')}/>;
            case 'profileInterests': return <ProfileInterestsScreen onFinish={() => setScreen('setup')} updateProfile={updateProfile} onBack={() => setScreen('profileDetails')} />;
            case 'setup': return <SetupScreen onStart={handleStart} />;
            case 'swipe': return <SwipeScreen movies={recommendedMovies} setSavedList={setSavedList} setScreen={setScreen} userProfile={userProfile} isLoading={isLoading} isLoadingMore={isLoadingMore} loadMoreMovies={loadMoreMovies} setHasShownGenreWarning={setHasShownGenreWarning} friends={friends} setMatch={setMatch} userLikedMovies={userLikedMovies} setUserLikedMovies={setUserLikedMovies} matchNotification={match} />;
            case 'myList': return <MyListScreen savedList={savedList} setScreen={setScreen} />;
            case 'profileView': return <ProfileScreen userProfile={userProfile} setScreen={setScreen} onLogout={handleLogout} />;
            case 'friendsList': return <FriendsListScreen friends={friends} onViewProfile={(friend) => { setViewingFriend(friend); setScreen('friendProfileView'); }} />;
            case 'friendProfileView': return viewingFriend ? <FriendProfileScreen friend={viewingFriend} onBack={() => setScreen('friendsList')} onChat={() => handleStartChat(viewingFriend)} /> : null;
            case 'chat': return activeChatFriend ? <ChatScreen friend={activeChatFriend} onBack={() => setScreen('friendsList')} onSendMessage={handleSendMessage} /> : null;
            default: return <SetupScreen onStart={handleStart} />;
        }
    };
    
    useEffect(() => {
        if(activeChatFriend) {
            const updatedFriendData = friends.find(f => f.id === activeChatFriend.id);
            if(updatedFriendData) {
                setActiveChatFriend(updatedFriendData);
            }
        }
    }, [friends, activeChatFriend?.id]);


    return (
        <main className="app-container">
            {match && <MatchScreen match={match} onContinue={() => setMatch(null)} onChat={() => {
                const friendToChat = friends.find(f => f.name === match.friendName);
                if (friendToChat) handleStartChat(friendToChat);
                setMatch(null);
             }} />}
            {isLoggingIn && (
                <div className="auth-loader-overlay">
                    <div className="loading-spinner"></div>
                    <p>Iniciando sesión...</p>
                </div>
            )}
            {isLoggedIn ? renderApp() : renderAuth()}
        </main>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);