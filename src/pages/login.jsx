// Login.js
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, CircularProgress, Typography, Box, Alert } from '@mui/material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous error
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate('/');
    } catch (err) {
      setLoading(false);
      setError(err.message); // Store the error message
    }
  };

  return (
    <Container maxWidth="sm" style={{minHeight: '70vh'}}>
      <Box my={4}>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" gutterBottom>Login</Typography>
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login;
