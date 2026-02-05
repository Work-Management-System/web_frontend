"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Chip,
  TablePagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import createAxiosInstance from "@/app/axiosInstance";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";
import toast from "react-hot-toast";

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImageUrl: "",
  metaTitle: "",
  metaDescription: "",
  ogImage: "",
  publishedAt: "",
};

export default function BlogManagementPage() {
  const [rows, setRows] = useState<BlogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const axiosInstance = createAxiosInstance();

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/blog/admin/list", {
        params: { page: page + 1, limit, search: search || undefined },
      });
      const data = res.data?.data;
      if (data?.data) setRows(data.data);
      if (typeof data?.total === "number") setTotal(data.total);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = async (id: string) => {
    try {
      const res = await axiosInstance.get(`/blog/admin/${id}`);
      const b = res.data?.data;
      if (!b) return;
      setForm({
        title: b.title || "",
        slug: b.slug || "",
        excerpt: b.excerpt || "",
        content: b.content || "",
        featuredImageUrl: b.featuredImageUrl || "",
        metaTitle: b.metaTitle || "",
        metaDescription: b.metaDescription || "",
        ogImage: b.ogImage || "",
        publishedAt: b.publishedAt ? b.publishedAt.slice(0, 16) : "",
      });
      setEditingId(id);
      setDialogOpen(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load post");
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      toast.error("Title, slug and content are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        excerpt: form.excerpt.trim() || undefined,
        content: form.content.trim(),
        featuredImageUrl: form.featuredImageUrl.trim() || undefined,
        metaTitle: form.metaTitle.trim() || undefined,
        metaDescription: form.metaDescription.trim() || undefined,
        ogImage: form.ogImage.trim() || undefined,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      };
      if (editingId) {
        await axiosInstance.patch(`/blog/admin/${editingId}`, payload);
        toast.success("Post updated");
      } else {
        await axiosInstance.post("/blog/admin", payload);
        toast.success("Post created");
      }
      setDialogOpen(false);
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/blog/admin/${id}`);
      toast.success("Post deleted");
      setDeleteConfirm(null);
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete");
    }
  };

  const generateSlug = () => {
    const s = form.title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setForm((f) => ({ ...f, slug: s }));
  };

  return (
    <>
      <Breadcrumb title="Blog Management" />
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search by title or slug..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon /></InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New post
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Published</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5}>No posts yet.</TableCell></TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.slug}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.publishedAt && new Date(row.publishedAt) <= new Date() ? "Published" : "Draft"}
                      size="small"
                      color={row.publishedAt ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    {row.publishedAt
                      ? new Date(row.publishedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row.id)} title="Edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteConfirm(row.id)} title="Delete">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={limit}
          rowsPerPageOptions={[limit]}
        />
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit post" : "New post"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Title"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onBlur={!editingId ? generateSlug : undefined}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                label="Slug"
                required
                fullWidth
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
              {!editingId && (
                <Button size="small" onClick={generateSlug}>Generate</Button>
              )}
            </Box>
            <TextField
              label="Excerpt"
              multiline
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            />
            <TextField
              label="Content (HTML)"
              required
              multiline
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <TextField
              label="Featured image URL"
              value={form.featuredImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, featuredImageUrl: e.target.value }))}
            />
            <Typography variant="subtitle2" color="text.secondary">SEO (optional)</Typography>
            <TextField
              label="Meta title"
              value={form.metaTitle}
              onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
            />
            <TextField
              label="Meta description"
              multiline
              rows={2}
              value={form.metaDescription}
              onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
            />
            <TextField
              label="OG image URL"
              value={form.ogImage}
              onChange={(e) => setForm((f) => ({ ...f, ogImage: e.target.value }))}
            />
            <TextField
              label="Publish at (leave empty for draft)"
              type="datetime-local"
              value={form.publishedAt}
              onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete post?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
