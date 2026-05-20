import { createTheme } from "@mui/material/styles";

const muiTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6ee7b7" },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
    },
  },
  typography: {
    fontFamily: "'DM Mono', monospace",
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "1px solid #334155",
          borderRadius: "12px",
          backgroundColor: "#1e293b",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#0f172a",
            borderBottom: "1px solid #334155",
            color: "#6ee7b7",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          },
          "& .MuiDataGrid-cell": {
            borderColor: "#334155",
            color: "#e2e8f0",
            fontSize: "0.875rem",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#273549",
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: "#1a3a2e !important",
          },
          "& .editable-cell": {
            cursor: "cell",
            borderLeft: "2px solid #6ee7b7",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #334155",
            backgroundColor: "#0f172a",
          },
        },
      },
    },
  },
});

export default muiTheme;
