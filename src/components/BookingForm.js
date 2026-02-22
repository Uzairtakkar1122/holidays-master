import React from 'react';
import { Calendar, Users, Home } from 'lucide-react';

const BookingForm = () => {
    const styles = {
        container: {
            backgroundColor: 'var(--surface-color)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            maxWidth: '400px',
            width: '100%'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            textAlign: 'center'
        },
        group: {
            marginBottom: '1rem'
        },
        label: {
            display: 'block',
            fontWeight: '500',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-primary)'
        },
        inputWrapper: {
            position: 'relative'
        },
        icon: {
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)'
        },
        inputWithIcon: {
            paddingLeft: '2.75rem'
        }
    };

    return (
        <form style={styles.container} onSubmit={(e) => e.preventDefault()}>
            <h2 style={styles.title}>Find Your Stay</h2>

            <div style={styles.group}>
                <label style={styles.label}>Destination</label>
                <div style={styles.inputWrapper}>
                    <Home style={styles.icon} size={20} />
                    <input
                        type="text"
                        placeholder="Where are you going?"
                        className="input-field"
                        style={styles.inputWithIcon}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={styles.group}>
                    <label style={styles.label}>Check-in</label>
                    <div style={styles.inputWrapper}>
                        <Calendar style={styles.icon} size={18} />
                        <input
                            type="date"
                            className="input-field"
                            style={styles.inputWithIcon}
                        />
                    </div>
                </div>
                <div style={styles.group}>
                    <label style={styles.label}>Check-out</label>
                    <div style={styles.inputWrapper}>
                        <Calendar style={styles.icon} size={18} />
                        <input
                            type="date"
                            className="input-field"
                            style={styles.inputWithIcon}
                        />
                    </div>
                </div>
            </div>

            <div style={styles.group}>
                <label style={styles.label}>Guests</label>
                <div style={styles.inputWrapper}>
                    <Users style={styles.icon} size={20} />
                    <select className="input-field" style={styles.inputWithIcon}>
                        <option>1 Adult, 0 Children</option>
                        <option>2 Adults, 0 Children</option>
                        <option>2 Adults, 1 Child</option>
                    </select>
                </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Search Hotels
            </button>
        </form>
    );
};

export default BookingForm;
