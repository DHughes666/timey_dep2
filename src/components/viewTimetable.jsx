import React, { useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { TableBody, TableHead, TableRow, Paper, Button, 
  Select, MenuItem, Alert, Grid, useMediaQuery } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useReactToPrint } from 'react-to-print';
import {
  StyledTable, StyledTableCell, StyledTableContainer,
  StyledTableHeader, StyledTableHeaderCell
} from './timetableStyles';
import Loading from '../pages/loading';
import { times, levels } from '../utils/constants';

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const fetchTimetableData = async (selectedLevel) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'timetable'));
    return querySnapshot.docs
      .map(doc => doc.data())
      .filter(classItem => classItem.level === selectedLevel);
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

const LevelSelector = ({ selectedLevel, onLevelChange }) => (
  <Select
    value={selectedLevel}
    onChange={onLevelChange}
    displayEmpty
    style={{ margin: '20px auto', display: 'block', maxWidth: '12%' }}
  >
    {levels.map(level => (
      <MenuItem key={level} value={level}>
        {level}
      </MenuItem>
    ))}
  </Select>
);

const initialState = {
  classes: [],
  loading: true,
  error: null,
  selectedLevel: '100 Level',
};

const timetableReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CLASSES':
      return { ...state, classes: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_SELECTED_LEVEL':
      return { ...state, selectedLevel: action.payload, loading: true, error: null };
    default:
      return state;
  }
};

const Timetable = () => {
  const [state, dispatch] = useReducer(timetableReducer, initialState);
  const tableRef = useRef();
  const { role } = useAuth();
  const isSmallScreen = useMediaQuery('(max-width:600px)');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchClasses = useCallback(debounce(async (level) => {
    try {
      const classData = await fetchTimetableData(level);
      dispatch({ type: 'SET_CLASSES', payload: classData });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch timetable data. Please try again later.' });
    }
  }, 300), []);

  useEffect(() => {
    fetchClasses(state.selectedLevel);
  }, [state.selectedLevel, fetchClasses]);

  const classSlots = useMemo(() => times.map(time => ({
    time,
    slots: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
      const classItem = state.classes.find(c => c.day === day && c.startTime === time);
      return { day, classItem };
    })
  })), [state.classes]);

  const handlePrint = useReactToPrint({
    content: () => tableRef.current,
  });

  const handleLevelChange = (event) => {
    dispatch({ type: 'SET_SELECTED_LEVEL', payload: event.target.value });
  };

  if (state.loading) {
    return <Loading />;
  }

  return (
    <Grid container spacing={3} justifyContent="center" style={{ margin: '20px auto' }}>
      {(role === 'LECTURER' || role === 'HOD' || role === 'DEAN') && (
        <Grid item container justifyContent="center" spacing={1}>
          <Grid item>
            <Button variant="contained" color="inherit" onClick={handlePrint}>
              Export as PDF
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="inherit" component={Link} to="/editTimetable">
              Edit Timetable
            </Button>
          </Grid>
          {(role === 'HOD' || role === 'DEAN') && (
            <Grid item>
              <Button variant="contained" color="inherit" component={Link} to="/approveTimetable">
                Approve Changes
              </Button>
            </Grid>
          )}
        </Grid>
      )}
      <Grid item xs={12} md={8}>
        <LevelSelector selectedLevel={state.selectedLevel} onLevelChange={handleLevelChange} />
      </Grid>
      {state.error && (
        <Grid item xs={12} md={8}>
          <Alert severity="error" style={{ width: '80%', margin: '20px auto' }}>{state.error}</Alert>
        </Grid>
      )}
      <Grid item style={{ width: '100%', overflowX: 'auto' }}>
        <StyledTableContainer component={Paper} style={{ width: isSmallScreen ? '100%' : '80%', margin: '20px auto' }} ref={tableRef}>
          <StyledTable aria-label="timetable">
            <TableHead>
              <StyledTableHeader>
                <StyledTableHeaderCell align='center'>Time</StyledTableHeaderCell>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <StyledTableHeaderCell key={day} align='center'>{day}</StyledTableHeaderCell>
                ))}
              </StyledTableHeader>
            </TableHead>
            <TableBody>
              {classSlots.map(({ time, slots }) => (
                <TableRow key={time}>
                  <StyledTableCell style={{ width: '13%', margin: '2px auto' }}>{time}</StyledTableCell>
                  {slots.map(({ day, classItem }) => (
                    <StyledTableCell key={day} className={classItem ? 'class-slot-row' : ''}>
                      {classItem ? (
                        <>
                          <strong>{classItem.subject}</strong>
                          <br />
                          {classItem.teacher}
                        </>
                      ) : null}
                    </StyledTableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </StyledTable>
        </StyledTableContainer>
      </Grid>
    </Grid>
  );
};

export default Timetable;
