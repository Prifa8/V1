import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- DATOS DE PRUEBA ---
const GENRES = ["Acción", "Comedia", "Drama", "Ciencia Ficción", "Terror", "Romance", "Suspense", "Animación"];
const PLATFORMS = ["Netflix", "Prime Video", "Disney+", "Max"];
const INTERESTS = ["Viajes", "Música", "Gaming", "Deportes", "Arte", "Cocina", "Libros", "Tecnología", "Moda"];
const MOVIES = [
    { id: 1, title: "Origen", poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", genres: ["Acción", "Ciencia Ficción"], platforms: ["Netflix", "Max"], rating: 8.8, year: 2010 },
    { id: 2, title: "Matrix", poster: "https://image.tmdb.org/t/p/w500/f89JAYsAFSSQd2O2EVyA0loJxgL.jpg", genres: ["Acción", "Ciencia Ficción"], platforms: ["Max"], rating: 8.7, year: 1999 },
    { id: 3, title: "Parásitos", poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", genres: ["Suspense", "Drama"], platforms: ["Prime Video"], rating: 8.6, year: 2019 },
    { id: 4, title: "El Padrino", poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", genres: ["Drama"], platforms: ["Netflix"], rating: 9.2, year: 1972 },
    { id: 5, title: "Pulp Fiction", poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", genres: ["Suspense"], platforms: ["Max"], rating: 8.9, year: 1994 },
    { id: 6, title: "Forrest Gump", poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdSm.jpg", genres: ["Comedia", "Drama", "Romance"], platforms: ["Netflix"], rating: 8.8, year: 1994 },
    { id: 7, title: "El viaje de Chihiro", poster: "https://image.tmdb.org/t/p/w500/39wmItIW2zwAtoO7K4P7rni0e66.jpg", genres: ["Animación", "Romance"], platforms: ["Max"], rating: 8.6, year: 2001 },
    { id: 8, title: "El Caballero Oscuro", poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", genres: ["Acción", "Suspense"], platforms: ["Netflix", "Max"], rating: 9.0, year: 2008 },
    { id: 9, title: "Coco", poster: "https://image.tmdb.org/t/p/w500/gGEsBOfGkYgHGNbb6cicbSpH1rg.jpg", genres: ["Animación", "Comedia"], platforms: ["Disney+"], rating: 8.4, year: 2017 },
    { id: 10, title: "Up", poster: "https://image.tmdb.org/t/p/w500/2k21kC2WCyvQRV55SvsNnS2LpFt.jpg", genres: ["Animación", "Comedia", "Drama"], platforms: ["Disney+"], rating: 8.3, year: 2009 },
    { id: 11, title: "El silencio de los corderos", poster: "https://image.tmdb.org/t/p/w500/uS9m8fcpZNaxg9I3Nso0iYvAQS.jpg", genres: ["Terror", "Suspense"], platforms: ["Prime Video"], rating: 8.6, year: 1991 },
    { id: 12, title: "Déjame salir", poster: "https://image.tmdb.org/t/p/w500/kK9plkI35Q5a3fucK4h2kQv5qC9.jpg", genres: ["Terror", "Suspense"], platforms: ["Netflix"], rating: 7.7, year: 2017 },
    { id: 13, title: "Resacón en Las Vegas", poster: "https://image.tmdb.org/t/p/w500/bCl5Ra12sY1A7iA0S38V2vU2aA.jpg", genres: ["Comedia"], platforms: ["Netflix", "Max"], rating: 7.7, year: 2009 },
    { id: 14, title: "La boda de mi mejor amiga", poster: "https://image.tmdb.org/t/p/w500/2o2d1XKyAYH8tQDP29A6b.jpg", genres: ["Comedia", "Romance"], platforms: ["Prime Video"], rating: 6.8, year: 2011 },
    { id: 15, title: "Blade Runner 2049", poster: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", genres: ["Ciencia Ficción", "Suspense"], platforms: ["Netflix"], rating: 8.0, year: 2017 }
];

// --- INICIALIZACIÓN DE LA API ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- TIPOS ---
type Movie = { id: number; title: string; poster: string; genres: string[]; platforms: string[]; rating: number; year: number; };
type UserProfile = { photo: string | null; name: string; bio: string; interests: string[]; };
type Screen = 'login' | 'verification' | 'profilePicture' | 'profileDetails' | 'profileInterests' | 'setup' | 'swipe' | 'myList' | 'profileView';

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
        if (newCode.every(c => c !== '')) {
            onVerify();
        }
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };
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
                <button className="continue-button" onClick={onVerify} disabled={code.some(c => c === '')}>Verificar</button>
            </div>
            <p className="resend-code">¿No recibiste el código? <span>Reenviar</span></p>
        </div>
    );
};

const ProfilePictureScreen = ({ onContinue, updateProfile }: { onContinue: () => void, updateProfile: (p: Partial<UserProfile>) => void }) => {
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
            <div className="progress-bar"><div className="progress" style={{width: '33%'}}></div></div>
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
    const [synopsis, setSynopsis] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let isCancelled = false;
        const generateSynopsis = async () => {
            setLoading(true);
            try {
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Genera una sinopsis original, divertida y de una sola frase para la película: "${movie.title}".` });
                if (!isCancelled) setSynopsis(response.text);
            } catch (error) {
                console.error("Error al generar sinopsis:", error);
                if (!isCancelled) setSynopsis("No se pudo cargar la sinopsis.");
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };
        generateSynopsis();
        return () => { isCancelled = true; };
    }, [movie]);
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
                    <div className="card-synopsis">{loading ? <div className="skeleton-loader"></div> : synopsis}</div>
                </div>
            </div>
        </div>
    );
};

const SwipeScreen = ({ movies, setSavedList, setScreen, userProfile }: { movies: Movie[], setSavedList: React.Dispatch<React.SetStateAction<Movie[]>>, setScreen: (screen: Screen) => void, userProfile: UserProfile | null }) => {
    const [movieQueue, setMovieQueue] = useState(movies);
    const handleSwipe = (direction: 'left' | 'right' | 'up', movie: Movie) => {
        if (direction === 'up') setSavedList(prev => [...prev, movie]);
        const cardEl = document.querySelector('.movie-card:last-of-type');
        if (cardEl) {
            let transform = '';
            if (direction === 'left') transform = 'translateX(-200%) rotate(-30deg)';
            else if (direction === 'right') transform = 'translateX(200%) rotate(30deg)';
            else if (direction === 'up') transform = 'translateY(-200%) rotate(0deg)';
            (cardEl as HTMLElement).style.transform = transform;
            (cardEl as HTMLElement).style.opacity = '0';
        }
        setTimeout(() => setMovieQueue(prev => prev.slice(0, -1)), 300);
    };
    const currentMovie = movieQueue.length > 0 ? movieQueue[movieQueue.length - 1] : null;
    return (
        <div className="swipe-screen">
            <header className="header">
                <button className="nav-button profile-button" onClick={() => setScreen('profileView')} aria-label="Mi Perfil">
                    {userProfile?.photo ? <img src={userProfile.photo} alt="Perfil"/> : <div className="profile-placeholder-icon"></div>}
                </button>
                <h1 className="header-title" aria-label="Cine Board">CINE BOARD</h1>
                <button className="nav-button" onClick={() => setScreen('myList')} aria-label="Mi Lista">★</button>
            </header>
            <div className="card-container">
                {movieQueue.length > 0 ? (
                    movieQueue.map(movie => <MovieCard key={movie.id} movie={movie} />)
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

const ProfileScreen = ({ userProfile, setScreen, onLogout }: { userProfile: UserProfile, setScreen: (s: Screen) => void, onLogout: () => void }) => (
    <div className="profile-view-screen">
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
            <button className="logout-button" onClick={onLogout}>Cerrar Sesión</button>
        </div>
    </div>
);


const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [screen, setScreen] = useState<Screen>('login');
    const [authMethod, setAuthMethod] = useState('');
    const [userProfile, setUserProfile] = useState<UserProfile>({ photo: null, name: '', bio: '', interests: [] });
    const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
    const [savedList, setSavedList] = useState<Movie[]>([]);

    const handleStart = (genres: string[], platforms: string[]) => {
        const filteredMovies = MOVIES.filter(m => m.genres.some(g => genres.includes(g)) && m.platforms.some(p => platforms.includes(p)));
        setRecommendedMovies(filteredMovies.reverse());
        setScreen('swipe');
    };

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        setScreen('profilePicture');
    };
    
    const handleLogout = () => {
        setIsLoggedIn(false);
        setScreen('login');
        setUserProfile({ photo: null, name: '', bio: '', interests: [] });
        setSavedList([]);
        setRecommendedMovies([]);
    };

    const updateProfile = (data: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...data }));
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
            case 'profilePicture': return <ProfilePictureScreen onContinue={() => setScreen('profileDetails')} updateProfile={updateProfile}/>;
            case 'profileDetails': return <ProfileDetailsScreen onContinue={() => setScreen('profileInterests')} updateProfile={updateProfile} onBack={() => setScreen('profilePicture')}/>;
            case 'profileInterests': return <ProfileInterestsScreen onFinish={() => setScreen('setup')} updateProfile={updateProfile} onBack={() => setScreen('profileDetails')} />;
            case 'setup': return <SetupScreen onStart={handleStart} />;
            case 'swipe': return <SwipeScreen movies={recommendedMovies} setSavedList={setSavedList} setScreen={setScreen} userProfile={userProfile} />;
            case 'myList': return <MyListScreen savedList={savedList} setScreen={setScreen} />;
            case 'profileView': return <ProfileScreen userProfile={userProfile} setScreen={setScreen} onLogout={handleLogout} />;
            default: return <SetupScreen onStart={handleStart} />;
        }
    };

    return (
        <main className="app-container">
            {isLoggedIn ? renderApp() : renderAuth()}
        </main>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);