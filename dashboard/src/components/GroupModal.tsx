import { useState, useEffect, FormEvent } from 'react';
import './GroupModal.css';

export interface GroupModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'delete';
  groupName?: string;
  groupDescription?: string;
  projectCount?: number;
  onClose: () => void;
  onSubmit: (data: { name?: string; description?: string }) => void;
}

export function GroupModal({
  isOpen,
  mode,
  groupName = '',
  groupDescription = '',
  projectCount = 0,
  onClose,
  onSubmit
}: GroupModalProps) {
  const [name, setName] = useState(groupName);
  const [description, setDescription] = useState(groupDescription);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setName(groupName);
      setDescription(groupDescription);
      setErrors({});
    }
  }, [isOpen, groupName, groupDescription, mode]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const validate = (): boolean => {
    const newErrors: { name?: string; description?: string } = {};

    if (mode !== 'delete') {
      if (!name.trim()) {
        newErrors.name = 'Group name is required';
      } else if (name.trim().length < 2) {
        newErrors.name = 'Group name must be at least 2 characters';
      } else if (name.trim().length > 50) {
        newErrors.name = 'Group name must not exceed 50 characters';
      } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
        newErrors.name = 'Group name can only contain letters, numbers, spaces, hyphens, and underscores';
      }

      if (description.trim().length > 200) {
        newErrors.description = 'Description must not exceed 200 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (mode === 'delete') {
      onSubmit({});
      return;
    }

    if (!validate()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim()
    });
  };

  if (!isOpen) {
    return null;
  }

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New Group';
      case 'edit':
        return 'Edit Group';
      case 'delete':
        return 'Delete Group';
    }
  };

  const getSubmitText = () => {
    switch (mode) {
      case 'create':
        return 'Create Group';
      case 'edit':
        return 'Save Changes';
      case 'delete':
        return 'Delete Group';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getTitle()}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {mode === 'delete' ? (
              <div className="delete-confirmation">
                <div className="warning-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                </div>
                <p className="warning-text">
                  Are you sure you want to delete the group <strong>"{groupName}"</strong>?
                </p>
                {projectCount > 0 && (
                  <p className="warning-subtext">
                    This group contains {projectCount} {projectCount === 1 ? 'project' : 'projects'}.
                    The projects will not be deleted, but they will be removed from this group.
                  </p>
                )}
                <p className="warning-note">This action cannot be undone.</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="group-name" className="form-label">
                    Group Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="group-name"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter group name"
                    disabled={mode === 'edit'}
                    autoFocus
                    maxLength={50}
                  />
                  {errors.name && <p className="error-message">{errors.name}</p>}
                  {mode === 'edit' && (
                    <p className="form-hint">Group name cannot be changed</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="group-description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="group-description"
                    className={`form-textarea ${errors.description ? 'error' : ''}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter group description (optional)"
                    rows={3}
                    maxLength={200}
                  />
                  {errors.description && <p className="error-message">{errors.description}</p>}
                  <p className="form-hint">
                    {description.length}/200 characters
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-primary ${mode === 'delete' ? 'btn-danger' : ''}`}
            >
              {getSubmitText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


