import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('auth_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const signIn = (googleUser) => {
        const profile = {
            name: googleUser.name,
            email: googleUser.email,
            picture: googleUser.picture,
            given_name: googleUser.given_name,
        };
        setUser(profile);
        localStorage.setItem('auth_user', JSON.stringify(profile));
    };

    const signOut = () => {
        setUser(null);
        localStorage.removeItem('auth_user');
    };

    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
