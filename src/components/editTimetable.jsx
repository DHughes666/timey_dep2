import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Select, MenuItem, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Paper, Alert, Grid } from '@mui/material';
import Loading from '../pages/loading';
import { times, levels } from '../utils/constants';
import useAuth from '../hooks/useAuth';

const fetchTimetableData = async (selectedLevel) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'timetable'));
    return querySnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .filter(classItem => classItem.level === selectedLevel);
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

const EditTimetable = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('100 Level');
  const [editedClasses, setEditedClasses] = useState({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { role, user } = useAuth();
  const navigation = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchTimetableData(selectedLevel)
      .then(classData => {
        setClasses(classData);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch timetable data.');
        setLoading(false);
      });
  }, [selectedLevel]);

  const handleLevelChange = useCallback((event) => {
    setSelectedLevel(event.target.value);
  }, []);

  const handleClassChange = useCallback((time, day, field, value) => {
    setEditedClasses({
      ...editedClasses,
      [time]: {
        ...editedClasses[time],
        [day]: {
          ...editedClasses[time]?.[day],
          [field]: value,
        },
      },
    });
  }, [editedClasses]);

  const handleSaveChanges = useCallback(async () => {
    if (Object.keys(editedClasses).length === 0) {
      setError('No changes to save.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (role === 'LECTURER') {
        const changes = Object.entries(editedClasses).flatMap(([time, days]) =>
          Object.entries(days).map(([day, change]) => ({
            day,
            startTime: time,
            ...change,
            level: selectedLevel,
            submittedBy: user.uid,
            status: 'pending'
          }))
        );

        await Promise.all(changes.map(change => addDoc(collection(db, 'timetableChanges'), change)));
        setSuccessMessage('Changes submitted for approval.');
      } else {
        const updates = Object.entries(editedClasses).flatMap(([time, days]) =>
          Object.entries(days).map(async ([day, changes]) => {
            const existingClass = classes.find(c => c.day === day && c.startTime === time);
            if (existingClass) {
              const classRef = doc(db, 'timetable', existingClass.id);
              await updateDoc(classRef, changes);
            } else {
              await addDoc(collection(db, 'timetable'), {
                ...changes,
                day,
                startTime: time,
                level: selectedLevel,
              });
            }
          })
        );

        await Promise.all(updates);
        setSuccessMessage('Changes saved successfully.');
      }

      setEditedClasses({});
      fetchTimetableData(selectedLevel).then(classData => {
        setClasses(classData);
        setLoading(false);
      });
      navigation('/timetable');
    } catch (error) {
      setError(`Failed to save changes: ${error.message}`);
      setLoading(false);
    }
  }, [editedClasses, selectedLevel, classes, role, user, navigation]);

  if (loading) {
    return <Loading />;
  }

  if (!(role === 'DEAN' || role === 'LECTURER' || role === 'HOD')) {
    return <Alert severity="error">You do not have permission to edit the timetable.</Alert>;
  }

  return (
    <Grid container spacing={3} justifyContent="center" style={{ margin: '20px auto' }}>
      <Grid item xs={12} md={8}>
        <Select
          value={selectedLevel}
          onChange={handleLevelChange}
          displayEmpty
          fullWidth
          style={{  margin: '5px auto', display: 'block', maxWidth: '12%' }}
        >
          {levels.map(level => (
            <MenuItem key={level} value={level}>
              {level}
            </MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid item xs={12} md={8}>
        {error && <Alert severity="error" style={{ marginBottom: '20px' }}>{error}</Alert>}
        {successMessage && <Alert severity="success" style={{ marginBottom: '20px' }}>{successMessage}</Alert>}
      </Grid>
      <Grid item xs={12} md={8}>
        <Paper style={{ padding: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align='center'>Time</TableCell>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <TableCell key={day} align='center'>{day}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {times.map(time => (
                <TableRow key={time}>
                  <TableCell>{time}</TableCell>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                    const classItem = classes.find(c => c.day === day && c.startTime === time);
                    return (
                      <TableCell key={day} align='center'>
                        <TextField
                          value={editedClasses[time]?.[day]?.subject || classItem?.subject || ''}
                          onChange={(e) => handleClassChange(time, day, 'subject', e.target.value)}
                          placeholder="Subject"
                          fullWidth
                          margin="dense"
                        />
                        <TextField
                          value={editedClasses[time]?.[day]?.teacher || classItem?.teacher || ''}
                          onChange={(e) => handleClassChange(time, day, 'teacher', e.target.value)}
                          placeholder="Teacher"
                          fullWidth
                          margin="dense"
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Grid container justifyContent='center' style={{marginTop: '20px'}}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveChanges}
              style={{ width: '30%' }}
            >
              Save Changes
            </Button>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default EditTimetable;
