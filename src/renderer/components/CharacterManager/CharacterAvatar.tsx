import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { message } from 'antd';
import './CharacterAvatar.css';

interface CharacterAvatarProps {
  avatarUrl?: string;
  onAvatarChange: (file: File) => void;
}

const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ avatarUrl, onAvatarChange }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 2 * 1024 * 1024) {
        message.error('图片大小不能超过2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        message.error('请上传图片文件');
        return;
      }
      onAvatarChange(file);
    }
  }, [onAvatarChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  return (
    <div className="character-avatar-container">
      <div
        {...getRootProps()}
        className={`avatar-dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {avatarUrl ? (
          <img src={avatarUrl} alt="角色头像" className="avatar-image" />
        ) : (
          <div className="avatar-placeholder">
            <i className="avatar-icon">+</i>
            <p>点击或拖拽上传头像</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterAvatar;