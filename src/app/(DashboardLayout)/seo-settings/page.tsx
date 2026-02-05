"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import createAxiosInstance from "@/app/axiosInstance";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";
import toast from "react-hot-toast";

interface SeoSettingsForm {
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string;
  defaultOgImage: string;
  twitterHandle: string;
  siteName: string;
  canonicalBaseUrl: string;
}

const emptyForm: SeoSettingsForm = {
  defaultTitle: "",
  defaultDescription: "",
  defaultKeywords: "",
  defaultOgImage: "",
  twitterHandle: "",
  siteName: "",
  canonicalBaseUrl: "",
};

export default function SeoSettingsPage() {
  const [form, setForm] = useState<SeoSettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const axiosInstance = createAxiosInstance();

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/seo-settings");
        const data = res.data?.data;
        if (data) {
          setForm({
            defaultTitle: data.defaultTitle ?? "",
            defaultDescription: data.defaultDescription ?? "",
            defaultKeywords: data.defaultKeywords ?? "",
            defaultOgImage: data.defaultOgImage ?? "",
            twitterHandle: data.twitterHandle ?? "",
            siteName: data.siteName ?? "",
            canonicalBaseUrl: data.canonicalBaseUrl ?? "",
          });
        }
      } catch {
        toast.error("Failed to load SEO settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch("/seo-settings", {
        defaultTitle: form.defaultTitle || undefined,
        defaultDescription: form.defaultDescription || undefined,
        defaultKeywords: form.defaultKeywords || undefined,
        defaultOgImage: form.defaultOgImage || undefined,
        twitterHandle: form.twitterHandle || undefined,
        siteName: form.siteName || undefined,
        canonicalBaseUrl: form.canonicalBaseUrl || undefined,
      });
      toast.success("SEO settings saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Breadcrumb title="SEO Settings" />
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title="SEO Settings" />
      <Alert severity="info" sx={{ mb: 2 }}>
        These values override the default meta tags used across the site (e.g. home, blog). Leave blank to keep app defaults.
      </Alert>
      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Typography variant="h6" gutterBottom>Default meta tags</Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Default title"
            fullWidth
            value={form.defaultTitle}
            onChange={(e) => setForm((f) => ({ ...f, defaultTitle: e.target.value }))}
            placeholder="e.g. Manazeit - Work Management System"
          />
          <TextField
            label="Default description"
            fullWidth
            multiline
            rows={3}
            value={form.defaultDescription}
            onChange={(e) => setForm((f) => ({ ...f, defaultDescription: e.target.value }))}
          />
          <TextField
            label="Default keywords (comma separated)"
            fullWidth
            value={form.defaultKeywords}
            onChange={(e) => setForm((f) => ({ ...f, defaultKeywords: e.target.value }))}
          />
          <TextField
            label="Default OG image URL"
            fullWidth
            value={form.defaultOgImage}
            onChange={(e) => setForm((f) => ({ ...f, defaultOgImage: e.target.value }))}
          />
          <TextField
            label="Twitter handle"
            fullWidth
            value={form.twitterHandle}
            onChange={(e) => setForm((f) => ({ ...f, twitterHandle: e.target.value }))}
            placeholder="e.g. @manazeit"
          />
          <TextField
            label="Site name"
            fullWidth
            value={form.siteName}
            onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
          />
          <TextField
            label="Canonical base URL"
            fullWidth
            value={form.canonicalBaseUrl}
            onChange={(e) => setForm((f) => ({ ...f, canonicalBaseUrl: e.target.value }))}
            placeholder="e.g. https://manazeit.com"
          />
        </Box>
        <Box mt={3}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save SEO settings"}
          </Button>
        </Box>
      </Paper>
    </>
  );
}
