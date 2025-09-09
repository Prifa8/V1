/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
// FIX: Import Jest globals to resolve test-related errors.
import { describe, it, expect, jest, beforeAll } from '@jest/globals';

import { 
    App,
    LoginScreen, 
    VerificationScreen, 
    ProfilePictureScreen, 
    ProfileDetailsScreen, 
    ProfileInterestsScreen 
} from './index';

// Mocking FileReader which is used in ProfilePictureScreen
beforeAll(() => {
    Object.defineProperty(global, 'FileReader', {
        writable: true,
        value: class {
            result: string | null = null;
            onload: ((this: any, ev: ProgressEvent) => any) | null = null;

            readAsDataURL(file: File) {
                this.result = `data:${file.type};base64,mocked_base64_content`;
                if (this.onload) {
                    // FIX: Cast event object to 'any' to resolve ProgressEvent type mismatch.
                    this.onload({ target: { result: this.result } } as any);
                }
            }
        },
    });
});

describe('Login and Profile Setup Flow', () => {

    describe('LoginScreen', () => {
        it('renders all login options and handles clicks', () => {
            const onSocialLogin = jest.fn();
            const setScreen = jest.fn();
            const setAuthMethod = jest.fn();

            render(<LoginScreen onSocialLogin={onSocialLogin} setScreen={setScreen} setAuthMethod={setAuthMethod} />);

            expect(screen.getByText('CINE BOARD')).toBeInTheDocument();
            
            fireEvent.click(screen.getByText('INICIAR SESIÓN CON GOOGLE'));
            expect(onSocialLogin).toHaveBeenCalledTimes(1);
            
            fireEvent.click(screen.getByText('INICIAR SESIÓN CON FACEBOOK'));
            expect(onSocialLogin).toHaveBeenCalledTimes(2);

            fireEvent.click(screen.getByText('INICIAR SESIÓN CON TELÉFONO'));
            expect(setAuthMethod).toHaveBeenCalledWith('phone');
            expect(setScreen).toHaveBeenCalledWith('verification');
        });
    });

    describe('VerificationScreen', () => {
        it('triggers onVerify when the code is fully entered', async () => {
            const onVerify = jest.fn();
            render(<VerificationScreen authMethod="phone" onVerify={onVerify} />);

            const codeInputs = screen.getAllByRole('textbox');
            expect(codeInputs.length).toBe(6);

            await userEvent.type(codeInputs[0], '1');
            await userEvent.type(codeInputs[1], '2');
            await userEvent.type(codeInputs[2], '3');
            await userEvent.type(codeInputs[3], '4');
            await userEvent.type(codeInputs[4], '5');
            await userEvent.type(codeInputs[5], '6');

            await waitFor(() => {
                expect(onVerify).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('ProfilePictureScreen', () => {
        it('allows uploading a picture and enables continue button', async () => {
            const onContinue = jest.fn();
            const updateProfile = jest.fn();
            const onBack = jest.fn();

            render(<ProfilePictureScreen onContinue={onContinue} updateProfile={updateProfile} onBack={onBack} />);
            
            const continueButton = screen.getByRole('button', { name: /continuar/i });
            expect(continueButton).toBeDisabled();
            
            const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
            const fileInput = screen.getByLabelText('').nextElementSibling as HTMLInputElement; // The input is hidden

            await userEvent.upload(fileInput, file);

            await waitFor(() => {
                expect(screen.getByAltText('Vista previa')).toBeInTheDocument();
                expect(updateProfile).toHaveBeenCalledWith({ photo: expect.stringContaining('data:image/png;base64') });
            });

            expect(continueButton).toBeEnabled();
            fireEvent.click(continueButton);
            expect(onContinue).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByLabelText('Volver'));
            expect(onBack).toHaveBeenCalledTimes(1);
        });
    });

    describe('ProfileDetailsScreen', () => {
        it('enables continue button only when name and bio are filled', async () => {
            const onContinue = jest.fn();
            const updateProfile = jest.fn();

            render(<ProfileDetailsScreen onContinue={onContinue} updateProfile={updateProfile} onBack={() => {}} />);
            
            const continueButton = screen.getByRole('button', { name: /continuar/i });
            const nameInput = screen.getByPlaceholderText('Tu nombre');
            const bioInput = screen.getByPlaceholderText(/Amante del cine/);
            const quoteInput = screen.getByPlaceholderText(/"Que la fuerza te acompañe."/);

            expect(continueButton).toBeDisabled();

            await userEvent.type(nameInput, 'Juan Perez');
            expect(continueButton).toBeDisabled();

            await userEvent.type(bioInput, 'Me encantan las películas.');
            expect(continueButton).toBeEnabled();

            await userEvent.type(quoteInput, 'I am your father.');

            fireEvent.click(continueButton);
            expect(updateProfile).toHaveBeenCalledWith({ name: 'Juan Perez', bio: 'Me encantan las películas.', favoriteQuote: 'I am your father.' });
            expect(onContinue).toHaveBeenCalledTimes(1);
        });
    });

    describe('ProfileInterestsScreen', () => {
        it('allows selecting up to 5 interests', async () => {
            const onFinish = jest.fn();
            const updateProfile = jest.fn();

            render(<ProfileInterestsScreen onFinish={onFinish} updateProfile={updateProfile} onBack={() => {}} />);
            const finishButton = screen.getByRole('button', { name: /finalizar perfil/i });
            const travelButton = screen.getByRole('button', { name: 'Viajes' });
            
            expect(finishButton).toBeDisabled();

            await userEvent.click(travelButton);
            expect(finishButton).toBeEnabled();

            // Select 4 more interests
            await userEvent.click(screen.getByRole('button', { name: 'Música' }));
            await userEvent.click(screen.getByRole('button', { name: 'Gaming' }));
            await userEvent.click(screen.getByRole('button', { name: 'Deportes' }));
            await userEvent.click(screen.getByRole('button', { name: 'Arte' }));

            // 6th interest should not be selectable, but let's check the updateProfile call
            fireEvent.click(finishButton);
            expect(updateProfile).toHaveBeenCalledWith({ interests: ['Viajes', 'Música', 'Gaming', 'Deportes', 'Arte'] });
            expect(onFinish).toHaveBeenCalledTimes(1);
        });
    });

    describe('Full Onboarding Integration Test', () => {
        it('navigates through the entire profile setup flow', async () => {
            render(<App />);

            // 1. Login Screen
            expect(screen.getByText('INICIAR SESIÓN CON GOOGLE')).toBeInTheDocument();
            fireEvent.click(screen.getByText('INICIAR SESIÓN CON GOOGLE'));

            // 2. Loader
            expect(await screen.findByText('Iniciando sesión...')).toBeInTheDocument();
            await waitFor(() => expect(screen.queryByText('Iniciando sesión...')).not.toBeInTheDocument(), { timeout: 2000 });

            // 3. Profile Picture Screen
            expect(await screen.findByText('Añade tu foto de perfil')).toBeInTheDocument();
            const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
            const fileInput = screen.getByLabelText('').nextElementSibling as HTMLInputElement;
            await userEvent.upload(fileInput, file);
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled();
            });
            fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
            
            // 4. Profile Details Screen
            expect(await screen.findByText('Cuéntanos sobre ti')).toBeInTheDocument();
            await userEvent.type(screen.getByPlaceholderText('Tu nombre'), 'Test User');
            await userEvent.type(screen.getByPlaceholderText(/Amante del cine/), 'A bio for testing.');
            fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

            // 5. Profile Interests Screen
            expect(await screen.findByText('Elige tus intereses')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Tecnología' }));
            await userEvent.click(screen.getByRole('button', { name: 'Libros' }));
            fireEvent.click(screen.getByRole('button', { name: /finalizar perfil/i }));

            // 6. Setup Screen (End of profile setup)
            expect(await screen.findByText('Tu próxima película favorita te espera.')).toBeInTheDocument();
        });
    });
});