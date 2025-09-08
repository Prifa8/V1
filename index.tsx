import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- DATOS DE CONFIGURACIÓN ---
const GENRES = ["Acción", "Comedia", "Drama", "Ciencia Ficción", "Terror", "Romance", "Suspense", "Animación"];
const PLATFORMS = ["Netflix", "Prime Video", "Disney+", "Max"];
const INTERESTS = ["Viajes", "Música", "Gaming", "Deportes", "Arte", "Cocina", "Libros", "Tecnología", "Moda"];

// --- INICIALIZACIÓN DE LA API ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- TIPOS ---
type Movie = { id: number; title: string; poster: string; genres: string[]; platforms: string[]; rating: number; year: number; synopsis: string; };
type UserProfile = { photo: string | null; name: string; bio: string; interests: string[]; };
type Friend = { id: number; name: string; photo: string; likedMovies: number[]; };
type MatchNotification = { friendName: string; movieTitle: string; } | null;
type Screen = 'login' | 'verification' | 'profilePicture' | 'profileDetails' | 'profileInterests' | 'setup' | 'swipe' | 'myList' | 'profileView' | 'friendsList' | 'chat';
type UserPreferences = { genres: string[], platforms:string[] };

// --- DATOS SIMULADOS ---
const MOCK_FRIENDS: Friend[] = [
    { id: 1, name: 'Ana', photo: 'https://i.pravatar.cc/150?u=ana', likedMovies: [787699, 693134, 1022789] },
    { id: 2, name: 'Carlos', photo: 'https://i.pravatar.cc/150?u=carlos', likedMovies: [823464, 787699, 940721] },
    { id: 3, name: 'Sofia', photo: 'https://i.pravatar.cc/150?u=sofia', likedMovies: [693134, 1011985, 572802] },
];

// --- NUEVOS COMPONENTES SOCIALES ---

const AddFriendModal = ({ onClose }: { onClose: () => void }) => {
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

const FriendsListScreen = ({ friends, setScreen, onSelectFriend }: { friends: Friend[], setScreen: (s: Screen) => void, onSelectFriend: (friend: Friend) => void }) => (
    <div className="list-container">
        <header className="header">
            <button className="nav-button" onClick={() => setScreen('swipe')} aria-label="Volver">‹</button>
            <h2 className="header-title">Amigos</h2>
            <div style={{width: '36px'}}></div>
        </header>
        <div className="friends-list-screen">
            {friends.map(friend => (
                <div key={friend.id} className="friend-item" onClick={() => onSelectFriend(friend)}>
                    <img src={friend.photo} alt={friend.name} className="friend-photo" />
                    <span className="friend-name">{friend.name}</span>
                    <span className="chat-arrow">›</span>
                </div>
            ))}
        </div>
    </div>
);

const ChatScreen = ({ friend, onBack }: { friend: Friend | null, onBack: () => void }) => (
    <div className="chat-screen-container">
        <header className="header">
            <button className="nav-button" onClick={onBack} aria-label="Volver">‹</button>
            <div className="chat-header-info">
                <img src={friend?.photo} alt={friend?.name} />
                <h2 className="header-title">{friend?.name}</h2>
            </div>
            <div style={{width: '36px'}}></div>
        </header>
        <div className="messages-container">
            <div className="message-bubble friend">¡Hey! ¿Viste la última de ciencia ficción?</div>
            <div className="message-bubble me">¡Claro! Me encantó. Justo te iba a escribir.</div>
            <div className="message-bubble me">Tenemos que ver la próxima juntos.</div>
            <div className="message-bubble friend">¡Totalmente! 🔥</div>
        </div>
        <div className="chat-input-area">
            <input type="text" placeholder="Escribe un mensaje..." />
            <button>Enviar</button>
        </div>
    </div>
);


// --- COMPONENTES DE AUTENTICACIÓN Y PERFIL ---
const LoginScreen = ({ setScreen, setAuthMethod, onSocialLogin }: { setScreen: (s: Screen) => void, setAuthMethod: (m: string) => void, onSocialLogin: () => void }) => {
    const [identifier, setIdentifier] = useState('');
    const handleContinue = () => {
        if (identifier.trim()) {
            setAuthMethod(identifier);
            setScreen('verification');
        }
    };
    return (
        <div className="auth-screen">
            <header>
                <h1>CINE BOARD</h1>
                <p>Inicia sesión para descubrir tu próxima película favorita.</p>
            </header>
            <div className="social-login">
                <button className="social-button google" onClick={onSocialLogin}><svg viewBox="0 0 24 24" width="24" height="24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.386-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.85l3.25-3.138C18.182 1.186 15.473 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.957 0 12.02-4.815 12.02-12.24h-.015v-1.955h-12.005z" transform="translate(0 .002)"></path></svg>Continuar con Google</button>
                <button className="social-button facebook" onClick={onSocialLogin}><svg viewBox="0 0 24 24" width="24" height="24"><path fill="#1877F2" d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.732 0 1.325-.593 1.325-1.325V1.325C24 .593 23.407 0 22.675 0z"></path></svg>Continuar con Facebook</button>
            </div>
            <div className="divider">O</div>
            <div className="input-group">
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Email o número de teléfono" />
                <button className="continue-button" onClick={handleContinue} disabled={!identifier.trim()}>Continuar</button>
            </div>
            <p className="terms">Al continuar, aceptas nuestros <span>Términos de Servicio</span> y <span>Política de Privacidad</span>.</p>
        </div>
    );
};

const VerificationScreen = ({ authMethod, onVerify }: { authMethod: string, onVerify: () => void }) => {
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

const ProfilePictureScreen = ({ onContinue, updateProfile, onBack }: { onContinue: () => void, updateProfile: (p: Partial<UserProfile>) => void, onBack: () => void }) => {
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

const ProfileDetailsScreen = ({ onContinue, updateProfile, onBack }: { onContinue: () => void, updateProfile: (p: Partial<UserProfile>) => void, onBack: () => void }) => {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');

    const handleContinue = () => {
        updateProfile({ name, bio });
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
            </div>
            <button className="continue-button" onClick={handleContinue} disabled={!name.trim() || !bio.trim()}>Continuar</button>
        </div>
    );
};

const ProfileInterestsScreen = ({ onFinish, updateProfile, onBack }: { onFinish: () => void, updateProfile: (p: Partial<UserProfile>) => void, onBack: () => void }) => {
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
const SetupScreen = ({ onStart }: { onStart: (genres: string[], platforms: string[]) => void }) => {
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

const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => {
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

const SwipeScreen = ({ movies, setSavedList, setScreen, userProfile, isLoading, isLoadingMore, loadMoreMovies, setHasShownGenreWarning, friends, setMatchNotification, userLikedMovies, setUserLikedMovies, matchNotification }: {
    movies: Movie[],
    setSavedList: React.Dispatch<React.SetStateAction<Movie[]>>,
    setScreen: (screen: Screen) => void,
    userProfile: UserProfile | null,
    isLoading: boolean,
    isLoadingMore: boolean,
    loadMoreMovies: () => void,
    setHasShownGenreWarning: (value: boolean) => void,
    friends: Friend[],
    setMatchNotification: (notification: MatchNotification) => void,
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
                    setMatchNotification({ friendName: friend.name, movieTitle: movie.title });
                    setTimeout(() => setMatchNotification(null), 4000); // Hide after 4s
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
             {matchNotification && (
                <div className="match-notification">
                    <p>A <strong>{matchNotification.friendName}</strong> también le interesa este título.</p>
                </div>
            )}
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

const MyListScreen = ({ savedList, setScreen }: { savedList: Movie[], setScreen: (screen: Screen) => void }) => (
    <div className="list-container">
        <header className="header">
            <button className="nav-button" onClick={() => setScreen('swipe')} aria-label="Volver">‹</button>
            <h2 className="header-title">Mi Lista</h2>
            <div style={{width: '36px'}}></div>
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

const ProfileScreen = ({ userProfile, setScreen, onLogout }: { userProfile: UserProfile, setScreen: (s: Screen) => void, onLogout: () => void }) => {
    const [showModal, setShowModal] = useState(false);
    return (
        <div className="profile-view-screen">
             {showModal && <AddFriendModal onClose={() => setShowModal(false)} />}
            <header className="header">
                <button className="nav-button" onClick={() => setScreen('swipe')} aria-label="Volver">‹</button>
                <h2 className="header-title">Mi Perfil</h2>
                <div style={{width: '36px'}}></div>
            </header>
            <div className="profile-content">
                <div className="profile-card">
                    <img src={userProfile.photo!} alt={userProfile.name} className="profile-photo"/>
                    <h2>{userProfile.name}</h2>
                    <p className="profile-bio">"{userProfile.bio}"</p>
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


const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [screen, setScreen] = useState<Screen>('login');
    const [authMethod, setAuthMethod] = useState('');
    const [userProfile, setUserProfile] = useState<UserProfile>({ photo: null, name: '', bio: '', interests: [] });
    const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
    const [savedList, setSavedList] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [allShownMovieTitles, setAllShownMovieTitles] = useState<Set<string>>(new Set());
    const [hasShownGenreWarning, setHasShownGenreWarning] = useState(false);
    const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
    
    // Social State
    const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
    const [userLikedMovies, setUserLikedMovies] = useState<Set<number>>(new Set());
    const [matchNotification, setMatchNotification] = useState<MatchNotification>(null);
    const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);

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
            synopsis: { type: Type.STRING, description: "A concise and engaging synopsis of the movie, in Spanish." },
        },
        required: ["id", "title", "poster", "genres", "platforms", "rating", "year", "synopsis"]
    };

    const fetchMovies = useCallback(async (count: number, preferences: UserPreferences, exclude: string[]) => {
        const useExpandedSearch = allShownMovieTitles.size >= 15;

        let prompt;
        if (useExpandedSearch) {
             prompt = `Recomiéndame ${count} películas de cualquier género. Sorpréndeme con una mezcla de películas populares, clásicos de culto, y joyas ocultas o cine indie. Proporciona IDs reales de TMDb. Evita estas películas que ya han sido mostradas: ${exclude.join(', ')}.`;
        } else {
            prompt = `Recomiéndame ${count} películas de los géneros: ${preferences.genres.join(', ')}. Deben estar disponibles en estas plataformas de streaming: ${preferences.platforms.join(', ')}. Sorpréndeme con una mezcla de películas populares, clásicos de culto, y joyas ocultas o cine indie. Proporciona IDs reales de TMDb. Evita estas películas que ya han sido mostradas: ${exclude.join(', ')}.`;
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
        setUserProfile({ photo: null, name: '', bio: '', interests: [] });
        setSavedList([]);
        setRecommendedMovies([]);
        setAllShownMovieTitles(new Set());
        setHasShownGenreWarning(false);
        setUserPreferences(null);
        setUserLikedMovies(new Set());
    };

    const updateProfile = (data: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...data }));
    };

    const handleSelectFriend = (friend: Friend) => {
        setActiveChatFriend(friend);
        setScreen('chat');
    };

    const renderAuth = () => {
        switch (screen) {
            case 'login': return <LoginScreen setScreen={setScreen} setAuthMethod={setAuthMethod} onSocialLogin={handleLoginSuccess} />;
            case 'verification': return <VerificationScreen authMethod={authMethod} onVerify={handleLoginSuccess} />;
            default: return <LoginScreen setScreen={setScreen} setAuthMethod={setAuthMethod} onSocialLogin={handleLoginSuccess} />;
        }
    }

    const renderApp = () => {
        switch (screen) {
            case 'profilePicture': return <ProfilePictureScreen onContinue={() => setScreen('profileDetails')} updateProfile={updateProfile} onBack={handleLogout}/>;
            case 'profileDetails': return <ProfileDetailsScreen onContinue={() => setScreen('profileInterests')} updateProfile={updateProfile} onBack={() => setScreen('profilePicture')}/>;
            case 'profileInterests': return <ProfileInterestsScreen onFinish={() => setScreen('setup')} updateProfile={updateProfile} onBack={() => setScreen('profileDetails')} />;
            case 'setup': return <SetupScreen onStart={handleStart} />;
            case 'swipe': return <SwipeScreen movies={recommendedMovies} setSavedList={setSavedList} setScreen={setScreen} userProfile={userProfile} isLoading={isLoading} isLoadingMore={isLoadingMore} loadMoreMovies={loadMoreMovies} setHasShownGenreWarning={setHasShownGenreWarning} friends={friends} setMatchNotification={setMatchNotification} userLikedMovies={userLikedMovies} setUserLikedMovies={setUserLikedMovies} matchNotification={matchNotification} />;
            case 'myList': return <MyListScreen savedList={savedList} setScreen={setScreen} />;
            case 'profileView': return <ProfileScreen userProfile={userProfile} setScreen={setScreen} onLogout={handleLogout} />;
            case 'friendsList': return <FriendsListScreen friends={friends} setScreen={setScreen} onSelectFriend={handleSelectFriend} />;
            case 'chat': return <ChatScreen friend={activeChatFriend} onBack={() => setScreen('friendsList')} />;
            default: return <SetupScreen onStart={handleStart} />;
        }
    };

    return (
        <main className="app-container">
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