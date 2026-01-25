'use client';

import React from 'react';

/**
 * A simple black box component.
 * This effectively replaces the need to "draw" it using a GUI tool.
 */
export default function BlackBox() {
    return (
        <div
            style={{
                width: '200px',
                height: '200px',
                backgroundColor: '#000000', // Pure black
                border: '1px solid #333',   // Subtle border for visibility on dark backgrounds
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '12px'
            }}
        >
            Black Box
        </div>
    );
}
