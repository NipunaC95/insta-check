import React, { useState } from 'react';
import { UserRecord } from '../types/index.ts';

interface UserAvatarProps {
  user: UserRecord;
  className?: string;
  sizeClass?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  className = '',
  sizeClass = 'w-7 h-7',
}) => {
  const [errorStep, setErrorStep] = useState<number>(0);

  const getSrc = () => {
    if (errorStep === 0 && user.profile_pic_url) {
      return user.profile_pic_url;
    }
    if (errorStep <= 1) {
      return `https://unavatar.io/instagram/${user.username}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=18181b&color=e4e4e7&bold=true`;
  };

  // For debugging: log chosen src and error step to console when in dev
  const src = getSrc();
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[UserAvatar] src chosen:', { username: user.username, profile_pic_url: user.profile_pic_url, src, errorStep });
  }

  return (
    <img
      src={src}
      alt={user.username}
      onError={() => {
        // eslint-disable-next-line no-console
        if (process.env.NODE_ENV !== 'production') console.warn('[UserAvatar] image load error, incrementing errorStep', { username: user.username, src, errorStep });
        setErrorStep((prev) => prev + 1);
      }}
      className={`${sizeClass} rounded-full object-cover border border-zinc-700/80 shrink-0 ${className}`}
    />
  );
};
