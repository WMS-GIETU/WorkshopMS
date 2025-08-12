import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import EditUserModal from '../components/EditUserModal';
import './ManageTeam.css';

const ManageTeam = () => {
  const { isAdmin, user, token, isAuthenticated } = useAuth();
  const [team, setTeam] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchTeam = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Fetch team response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('Fetch team response data:', data);
      if (response.ok) {
        setTeam(data);
      } else {
        console.error('Error fetching team:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  }, [token]);

  

  useEffect(() => {
    if (isAuthenticated() && token) {
      fetchTeam();
    }
  }, [isAuthenticated, token, fetchTeam]);

  const handleEdit = (userToEdit) => {
    if (isAdmin()) {
      if (userToEdit.roles.includes('admin')) {
        alert('Cannot edit club admin details.');
        return;
      }
      setEditingUser(userToEdit);
      setIsModalOpen(true);
    } else {
      alert('Only admins can access this feature.');
    }
  };

  const handleDelete = async (userId, username, userRoles) => {
    if (isAdmin()) {
      if (userRoles.includes('admin')) {
        alert('Cannot delete club admin.');
        return;
      }
      const confirmDelete = window.confirm(`Are you sure you want to delete ${username}?`);
      if (confirmDelete) {
        try {
          const response = await fetch(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (response.ok) {
            alert('User deleted successfully');
            // Refresh the team list
            fetchTeam();
          } else {
            alert(`Failed to delete user: ${data.message}`);
          }
        } catch (error) {
          console.error('Failed to delete user:', error);
          alert('An error occurred while deleting the user.');
        }
      }
    } else {
      alert('Only admins can access this feature.');
    }
  };

  const handleSave = async (updatedUser) => {
    try {
      const response = await fetch(`/api/auth/users/${updatedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });
      const data = await response.json();
      if (response.ok) {
        alert('User updated successfully');
        setIsModalOpen(false);
        setEditingUser(null);
        fetchTeam();
      } else {
        alert(`Failed to update user: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('An error occurred while updating the user.');
    }
  };

  return (
    <div className='container'>
      <Sidebar />
      <div className='mt-main-content'>
        <div className='header'>
          <h1>Team Management</h1>
          <div className='user-info'>
            <span className='user-role'>
              Logged in as: {user?.username} ({Array.isArray(user?.roles) && user.roles.includes('admin') ? 'Administrator' : 'Club Member'})
            </span>
          </div>
        </div>
        <div className="table-content">
          <table className="mt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mail</th>
                <th>Role</th>
                {isAdmin() && (
                  <th>
                    Actions
                    {!isAdmin() && <span className="admin-only-badge">Admin Only</span>}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member._id}>
                  <td>{member.username}</td>
                  <td>{member.email}</td>
                  <td>{member.roles.join(', ')}</td>
                  {isAdmin() && (
                    <td>
                      <span
                        className={`icon icon-edit ${!isAdmin() ? 'disabled' : ''}`}
                        aria-label="Edit"
                        onClick={() => handleEdit(member)}
                        title={!isAdmin() ? 'Only admins can edit' : 'Edit member'}
                      ></span>
                      <span
                        className={`icon icon-delete ${!isAdmin() ? 'disabled' : ''}`}
                        aria-label="Delete"
                        onClick={() => handleDelete(member._id, member.username, member.roles)}
                        title={!isAdmin() ? 'Only admins can delete' : 'Delete member'}
                      ></span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isModalOpen && (
          <EditUserModal
            user={editingUser}
            onSave={handleSave}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingUser(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ManageTeam;