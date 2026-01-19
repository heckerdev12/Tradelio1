import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toastConfig';

function SupabaseTest() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  // READ
  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading users...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      console.log('Response:', { data, error });
      
      if (error) throw error;
      
      setUsers(data || []);
      console.log('✅ Loaded:', data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // CREATE
  const createUser = async () => {
    if (!username) return alert('Username required!');

    setLoading(true);
    setError('');
    try {
      console.log('Creating user:', { username, bio });
      
      const { data, error } = await supabase
        .from('users')
        .insert([{ username: username, bio: bio }])
        .select();
      
      console.log('Create response:', { data, error });
      
      if (error) throw error;
      
      console.log('✅ Created:', data);
      setUsername('');
      setBio('');
      loadUsers();
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE
  const updateUser = async (id) => {
    const newBio = prompt('Enter new bio:');
    if (!newBio) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: newBio })
        .eq('id', id);
      
      if (error) throw error;
      console.log('✅ Updated');
      loadUsers();
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    }
  };

  // DELETE
  const deleteUser = async (id) => {
    if (!confirm('Delete?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      console.log('✅ Deleted');
      loadUsers();
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase Test</h1>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <h3>Create User</h3>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: 'block', marginBottom: '10px', padding: '5px', width: '200px' }}
        />
        <input
          type="text"
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{ display: 'block', marginBottom: '10px', padding: '5px', width: '200px' }}
        />
        <button onClick={createUser} disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>

      <div>
        <h3>Users ({users.length})</h3>
        <button onClick={loadUsers} disabled={loading}>Refresh</button>
        
        {loading && <p>Loading...</p>}
        
        {users.map((user) => (
          <div key={user.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Bio:</strong> {user.bio || 'No bio'}</p>
            <button onClick={() => updateUser(user.id)}>Update Bio</button>
            {' '}
            <button onClick={() => deleteUser(user.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SupabaseTest;