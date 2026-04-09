import React, { useState } from 'react';

const WHATSAPP_NUMBER = '34605889938';
const WHATSAPP_MESSAGE = '¡Hola! Me gustaría obtener más información.';

const WhatsAppButton = () => {
    const [hovered, setHovered] = useState(false);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

    return (
        <>
            <style>{`
                @keyframes wa-pulse {
                    0%   { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55); }
                    70%  { box-shadow: 0 0 0 14px rgba(37, 211, 102, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
                }
                .wa-btn {
                    position: fixed;
                    bottom: 28px;
                    right: 28px;
                    width: 62px;
                    height: 62px;
                    background-color: #25D366;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 20px rgba(37,211,102,0.45);
                    cursor: pointer;
                    z-index: 9999;
                    text-decoration: none;
                    animation: wa-pulse 2.2s infinite;
                    transition: transform 0.2s ease, background-color 0.2s ease;
                }
                .wa-btn:hover {
                    transform: scale(1.12);
                    background-color: #20ba5a;
                }
                .wa-tooltip {
                    position: fixed;
                    bottom: 38px;
                    right: 100px;
                    background: #fff;
                    color: #1a1a1a;
                    padding: 9px 16px;
                    border-radius: 10px;
                    font-size: 0.88rem;
                    font-weight: 500;
                    box-shadow: 0 4px 18px rgba(0,0,0,0.13);
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transform: translateX(8px);
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    z-index: 9998;
                    font-family: sans-serif;
                }
                .wa-tooltip.visible {
                    opacity: 1;
                    transform: translateX(0);
                }
                .wa-tooltip::after {
                    content: '';
                    position: absolute;
                    right: -7px;
                    top: 50%;
                    transform: translateY(-50%);
                    border-width: 7px 0 7px 7px;
                    border-style: solid;
                    border-color: transparent transparent transparent #fff;
                }
            `}</style>

            <div
                className={`wa-tooltip${hovered ? ' visible' : ''}`}
                aria-hidden="true"
            >
                💬 Habla con nosotras
            </div>

            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-btn"
                aria-label="Contactar por WhatsApp"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    width="38"
                    height="38"
                    aria-hidden="true"
                >
                    <path
                        fill="#fff"
                        d="M24 4C13 4 4 13 4 24c0 3.9 1.1 7.5 3 10.6L4 44l9.7-2.5c3 1.6 6.4 2.5 10.3 2.5 11 0 20-9 20-20S35 4 24 4z"
                    />
                    <path
                        fill="#25D366"
                        d="M24 6.5C14.3 6.5 6.5 14.3 6.5 24c0 3.4.9 6.6 2.6 9.3l-2.1 7.7 7.9-2.1c2.6 1.5 5.5 2.4 8.6 2.4 9.7 0 17.5-7.8 17.5-17.5S33.7 6.5 24 6.5z"
                    />
                    <path
                        fill="#fff"
                        d="M19.3 16.3c-.3-.7-.6-.7-1-.7-.2 0-.5 0-.8 0s-.7.1-1.1.5c-.4.4-1.5 1.5-1.5 3.5s1.5 4.1 1.7 4.4c.2.3 2.9 4.7 7.2 6.4 3.6 1.4 4.3 1.1 5.1 1.1s2.5-1 2.9-2c.4-1 .4-1.8.2-2s-.4-.3-.8-.5-2.5-1.2-2.9-1.4c-.4-.1-.7-.2-1.1.2-.4.4-1.5 1.7-1.8 2.1-.3.4-.6.3-1 .1-.5-.2-1.9-.7-3.7-2.3-1.4-1.2-2.3-2.7-2.5-3.2-.3-.5 0-.7.2-.9.2-.2.5-.5.7-.8.2-.3.3-.5.4-.7s.1-.5 0-.7-1.1-2.6-1.5-3.5z"
                    />
                </svg>
            </a>
        </>
    );
};

export default WhatsAppButton;
