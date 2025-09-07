import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  CircularProgress,
  Typography,
  Alert,
} from "@mui/material";
import axios from "axios";

const AdminAgents = () => {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    mountedRef.current = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Ensure Authorization header is set (fallback to token in localStorage)
        const token = localStorage.getItem("token");
        if (token && !axios.defaults.headers.common["Authorization"]) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        const res = await axios.get("/api/admin/agents", {
          params: { q: debouncedQ, page, limit },
        });
        if (mountedRef.current && res.data && res.data.success) {
          setItems(res.data.data.items || []);
          setTotal(res.data.data.total || 0);
        } else if (mountedRef.current) {
          setItems([]);
          setTotal(0);
        }
      } catch (err) {
        console.error("Failed to fetch agents", err);
        if (mountedRef.current)
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to fetch agents"
          );
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [debouncedQ, page, limit]);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <TextField
          fullWidth
          label="Search agents"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: "100%", boxShadow: "none" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 3 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2 }}
                    >
                      No agents found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((i) => (
                  <TableRow key={i._id}>
                    <TableCell>{i.firstName}</TableCell>
                    <TableCell>{i.lastName}</TableCell>
                    <TableCell>{i.email}</TableCell>
                    <TableCell>{i.phone}</TableCell>
                    <TableCell>
                      {i.createdAt
                        ? new Date(i.createdAt).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          count={pageCount}
          page={page}
          onChange={(e, v) => setPage(v)}
        />
      </Box>
    </Box>
  );
};

export default AdminAgents;
