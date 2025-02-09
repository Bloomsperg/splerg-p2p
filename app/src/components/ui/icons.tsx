import React from 'react';
import { TokenInfo } from '../../model/token';
import { KNOWN_TOKENS } from '../../utils';

export const ArrowIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="size-4"
  >
    <path
      fillRule="evenodd"
      d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Z"
      clipRule="evenodd"
    />
  </svg>
);

export const AddIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="size-6"
  >
    <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
  </svg>
);

export const SwapVerticalIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="size-6 text-sunset"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
    />
  </svg>
);

export const SwapHorizontalIcon: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`${className || ''}`}
    width={24}
    height={24}
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M7.308 18.98L3 14.674l4.308-4.307l.708.713l-3.095 3.094h7.387v1H4.92l3.095 3.094zm9.384-5.365l-.707-.713l3.094-3.094h-7.387v-1h7.387l-3.094-3.094l.707-.714L21 9.308z"
    ></path>
  </svg>
);

export const QuestionIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="size-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
    />
  </svg>
);

export const TokenIcon: React.FC<TokenInfo> = ({ mint }) => {
  if (mint) {
    const tokenInfo = KNOWN_TOKENS[mint];

    if (tokenInfo) {
      return (
        <img
          src={tokenInfo.icon}
          alt={tokenInfo.symbol}
          className="size-5 btn-circle"
        />
      );
    }
  }

  return <QuestionIcon />;
};

export const HomeIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="size-6"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={22}
      viewBox="0 0 22 22"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      >
        <path strokeDasharray={16} strokeDashoffset={16} d="M5 21h14">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            dur="0.2s"
            values="16;0"
          ></animate>
        </path>
        <path
          strokeDasharray={14}
          strokeDashoffset={14}
          d="M5 21v-13M19 21v-13"
        >
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.2s"
            dur="0.2s"
            values="14;0"
          ></animate>
        </path>
        <path strokeDasharray={28} strokeDashoffset={28} d="M2 10l10 -8l10 8">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.4s"
            dur="0.6s"
            values="28;0"
          ></animate>
        </path>
      </g>
    </svg>{' '}
  </svg>
);

export const CancelIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeDasharray={12}
      strokeDashoffset={12}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 12l7 7M12 12l-7 -7M12 12l-7 7M12 12l7 -7"
    >
      <animate
        fill="freeze"
        attributeName="stroke-dashoffset"
        dur="0.3s"
        values="12;0"
      ></animate>
    </path>
  </svg>
);
