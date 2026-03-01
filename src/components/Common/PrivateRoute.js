import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { isAllowedUser } from '../../config/allowedUsers';
import { LogIn, ShieldOff, Loader2 } from 'lucide-react';

/**
 * PrivateRoute
 * ------------
 * Wraps any page/component and restricts access to allowed Google accounts.
 *
 * Usage in App.js:
 *   <Route path="/private" element={<PrivateRoute><MyPrivatePage /></PrivateRoute>} />
 *
 * Access control is driven by src/config/allowedUsers.js — just add emails there.
 */
const PrivateRoute = ({ children, pageName = 'Private Page' }) => {
    const { user, signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setError(null);
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();
                signIn(profile);
            } catch (err) {
                console.error('Failed to fetch Google profile:', err);
                setError('Failed to sign in. Please try again.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setLoading(false);
            setError('Google sign-in was cancelled or failed.');
        },
    });

    // ── Case 1: not logged in → show login wall ───────────────────────────────
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 pt-24">
                <div className="bg-card-bg border border-card-border rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <LogIn size={32} className="text-primary" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{pageName}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                        This page is restricted. Please sign in with your Google account to continue.
                    </p>

                    {error && (
                        <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>
                    )}

                    <button
                        onClick={() => { setLoading(true); googleLogin(); }}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-primary/70 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin text-primary" />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                        )}
                        {loading ? 'Signing in…' : 'Continue with Google'}
                    </button>
                </div>
            </div>
        );
    }

    // ── Case 2: logged in but not on the whitelist → access denied ────────────
    if (!isAllowedUser(user.email)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 pt-24">
                <div className="bg-card-bg border border-card-border rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldOff size={32} className="text-red-500 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{user.email}</span> does not have permission to view this page.
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">
                        Contact the administrator to request access.
                    </p>
                </div>
            </div>
        );
    }

    // ── Case 3: logged in and allowed → render the page ──────────────────────
    return children;
};

export default PrivateRoute;
