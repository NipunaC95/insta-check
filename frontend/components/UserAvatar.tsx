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

  return (
    <img
      src={getSrc()}
      alt={user.username}
      referrerPolicy="no-referrer"
      onError={() => setErrorStep((prev) => prev + 1)}
      className={`${sizeClass} rounded-full object-cover border border-zinc-700/80 shrink-0 ${className}`}
    />
  );
};
