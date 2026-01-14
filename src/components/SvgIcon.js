import React from 'react';

const ICONS = {
  dashboard: {
    viewBox: '0 0 24 24',
    path: 'M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM13 10h8v11h-8V10ZM3 13h8v8H3v-8Z'
  },
  users: {
    viewBox: '0 0 24 24',
    path: 'M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4ZM8 11c1.657 0 3-1.79 3-4S9.657 3 8 3 5 4.79 5 7s1.343 4 3 4Zm0 2c-2.761 0-5 1.567-5 3.5V20h10v-3.5C13 14.567 10.761 13 8 13Zm8 0c-.34 0-.668.03-.98.083 1.21.62 1.98 1.595 1.98 2.667V20h6v-3.25C23 14.679 19.866 13 16 13Z'
  },
  user: {
    viewBox: '0 0 24 24',
    path: 'M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v3h16v-3c0-2.761-3.582-5-8-5Z'
  },
  doctor: {
    viewBox: '0 0 24 24',
    path: 'M7 2h10v2h-2v6a4 4 0 1 1-6 0V4H7V2Zm3 2v5.268a2.5 2.5 0 1 0 4 0V4h-4Zm-5 18c0-3.314 3.134-6 7-6s7 2.686 7 6H5Z'
  },
  hospital: {
    viewBox: '0 0 24 24',
    path: 'M4 21V3h16v18h-2v-4h-3v4H9v-4H6v4H4Zm4-6h2v-2H8v2Zm0-4h2V9H8v2Zm0-4h2V5H8v2Zm6 8h2v-2h-2v2Zm0-4h2V9h-2v2Zm0-4h2V5h-2v2Z'
  },
  clipboard: {
    viewBox: '0 0 24 24',
    path: 'M9 2h6v2h3a2 2 0 0 1 2 2v16H4V6a2 2 0 0 1 2-2h3V2Zm2 2h2V3h-2v1Zm-4 4h10V6H7v2Zm0 4h10v-2H7v2Zm0 4h6v-2H7v2Z'
  },
  calendar: {
    viewBox: '0 0 24 24',
    path: 'M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v16H2V6a2 2 0 0 1 2-2h3V2Zm15 8H4v10h18V10ZM4 8h18V6H4v2Z'
  },
  building: {
    viewBox: '0 0 24 24',
    path: 'M4 22V2h16v20h-2v-3h-3v3H9v-3H6v3H4Zm3-15h2V5H7v2Zm0 4h2V9H7v2Zm0 4h2v-2H7v2Zm6-8h2V5h-2v2Zm0 4h2V9h-2v2Zm0 4h2v-2h-2v2Z'
  },
  shield: {
    viewBox: '0 0 24 24',
    path: 'M12 2 20 5v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3Zm0 4.2L6 8.3V11c0 3.7 2.4 7 6 8.6 3.6-1.6 6-4.9 6-8.6V8.3l-6-2.1Z'
  },
  bell: {
    viewBox: '0 0 24 24',
    path: 'M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.7V3a2 2 0 1 0-4 0v1.3A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z'
  },
  mail: {
    viewBox: '0 0 24 24',
    path: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z'
  },
  chat: {
    viewBox: '0 0 24 24',
    path: 'M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8l-4 4V4a2 2 0 0 1 2-2Zm2 5h12v2H6V7Zm0 4h10v2H6v-2Z'
  },
  lock: {
    viewBox: '0 0 24 24',
    path: 'M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Zm3 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'
  },
  file: {
    viewBox: '0 0 24 24',
    path: 'M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Z'
  },
  refresh: {
    viewBox: '0 0 24 24',
    path: 'M12 6V3l4 4-4 4V8a4 4 0 1 0 4 4h2a6 6 0 1 1-6-6Z'
  },
  chart: {
    viewBox: '0 0 24 24',
    path: 'M4 19V5h2v12h14v2H4Zm4-2V9h2v8H8Zm4 0V7h2v10h-2Zm4 0v-6h2v6h-2Z'
  },
  logout: {
    viewBox: '0 0 24 24',
    path: 'M10 17v-2h4v-6h-4V7l-5 5 5 5Zm9 4H11v-2h8V5h-8V3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2Z'
  },
  heart: {
    viewBox: '0 0 24 24',
    path: 'M12 21s-7-4.35-9.33-8.36C.82 9.12 2.06 5.9 5.2 4.6c1.75-.72 3.76-.25 5.03 1.05L12 7.42l1.77-1.77c1.27-1.3 3.28-1.77 5.03-1.05 3.14 1.3 4.38 4.52 2.53 8.04C19 16.65 12 21 12 21Z'
  },
  phone: {
    viewBox: '0 0 24 24',
    path: 'M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.85 21 3 13.15 3 3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.24 1.01l-2.2 2.2Z'
  },
  location: {
    viewBox: '0 0 24 24',
    path: 'M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 9.5A2.5 2.5 0 1 0 12 6a2.5 2.5 0 0 0 0 5.5Z'
  },
  bone: {
    viewBox: '0 0 24 24',
    path: 'M19 10.5a2.5 2.5 0 0 0-2.12 1.18L9.7 18.86a2.5 2.5 0 1 1-3.56-3.56l1.06-1.06a2.5 2.5 0 1 1 3.56-3.56l1.06-1.06a2.5 2.5 0 1 1 3.56-3.56l1.48 1.48A2.5 2.5 0 0 0 19 10.5Z'
  },
  activity: {
    viewBox: '0 0 24 24',
    path: 'M13 3h-2v8H6l-3 10h2l2.2-7.3H11V21h2v-8h4l3-10h-2l-2.2 7.3H13V3Z'
  },
  wheelchair: {
    viewBox: '0 0 24 24',
    path: 'M10 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm1 6h4v2h-3v3.5a3.5 3.5 0 1 0 3.5 3.5h2A5.5 5.5 0 1 1 12 12.5V9Zm6.5 3H22v2h-2.2l-1.6 5H16l1.5-5H17.5Z'
  },
  baby: {
    viewBox: '0 0 24 24',
    path: 'M12 3a4 4 0 0 1 4 4v1h1a4 4 0 0 1 0 8h-1.3A6 6 0 0 1 6 16H5a4 4 0 1 1 0-8h1V7a4 4 0 0 1 4-4h2Zm-3 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-5 5h4v-1H10v1Z'
  },
  foot: {
    viewBox: '0 0 24 24',
    path: 'M9 3c1.1 0 2 .9 2 2v7c0 1.66-1.34 3-3 3H6v2h10v2H4v-6h4a1 1 0 0 0 1-1V5c0-1.1.9-2 2-2Zm7 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm2 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm0 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z'
  },
  microscope: {
    viewBox: '0 0 24 24',
    path: 'M7 2h4l1 2v6a3 3 0 0 1-6 0V4l1-2Zm2 2v6a1 1 0 1 0 2 0V4H9Zm8 6a5 5 0 0 1-5 5H9v2h9v2H6v-4h2.1A7 7 0 0 0 17 8h2a7 7 0 0 0 1 3.5V13h-2v-1.5Z'
  }
};

export default function SvgIcon({ name, size = 18, className = '', title }) {
  const icon = ICONS[name];
  if (!icon) return null;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : 'presentation'}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <path d={icon.path} />
    </svg>
  );
}


