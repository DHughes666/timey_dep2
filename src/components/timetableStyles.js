import styled from "styled-components";
import { TableContainer, Table, TableCell, TableRow } from '@mui/material';

const StyledTableContainer = styled(TableContainer)`
  width: 80%;
  margin: 10px auto; /* Center the table on the page */
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const StyledTable = styled(Table)`
  min-width: 650px;
  border-collapse: collapse;
  width: 100%;
  @media (max-width: 600px) {
    min-width: 100%;
  }
`;

const StyledTableHeader = styled(TableRow)`
  background-color: #f4f4f4;
`;

const StyledTableHeaderCell = styled(TableCell)`
  padding: 16px;
  text-align: center;
  font-weight: bold;
  @media (max-width: 600px) {
    padding: 8px;
  }
`;

const StyledTableCell = styled(TableCell)`
  height: 50px;
  text-align: center;
  padding: 16px;
  border: 1px solid #ddd;
  @media (max-width: 600px) {
    padding: 8px;
  }
`;

const ClassSlotRow = styled(TableRow)`
  background-color: #e0f7fa;
`;

export { ClassSlotRow, StyledTable, StyledTableCell, 
  StyledTableHeaderCell, StyledTableContainer, StyledTableHeader };
