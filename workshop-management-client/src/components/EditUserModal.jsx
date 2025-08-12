import React, { useState, useEffect } from 'react';

const EditUserModal = ({ user, onSave, onCancel }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState([]); // Keep roles state to display, but not allow editing

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setRoles(user.roles);
    }
  }, [user]);

  const handleSave = () => {
    // Only pass username and email for update, roles remain unchanged
    onSave({ ...user, username, email });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit User</h2>
        <label>
          Username:
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Roles:
          <input type="text" value={roles.join(', ')} disabled /> {/* Disabled input for roles */}
        </label>
        <div className="modal-actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;