"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  InputAdornment,
  TextField,
  Pagination,
  Skeleton,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import { PageSEO } from "@/app/components/PageSEO";
import { seoConfig } from "@/configs/seo";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export default function BlogListingPage() {
  const theme = useTheme();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 9;

  useEffect(() => {
    let cancelled = false;
    async function fetchList() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/blog/list`, {
          params: { page, limit, search: search || undefined },
        });
        const data = res.data?.data;
        if (cancelled) return;
        if (data?.data) setPosts(data.data);
        if (typeof data?.total === "number") setTotal(data.total);
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchList();
    return () => { cancelled = true; };
  }, [page, search]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <>
      <PageSEO
        title={`Blog | ${seoConfig.siteName}`}
        description="Tips, product updates, and best practices for work management, team productivity, and project tracking."
        path="/blog"
      />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
          pt: 4,
          pb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={700} gutterBottom textAlign="center">
            Blog
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Tips, updates, and best practices for teams
          </Typography>

          <TextField
            fullWidth
            placeholder="Search posts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400, mx: "auto", display: "block", mb: 4 }}
          />

          {loading ? (
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={3}>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton variant="rectangular" height={180} />
                  <CardContent>
                    <Skeleton height={32} width="80%" />
                    <Skeleton height={20} width="60%" sx={{ mt: 1 }} />
                    <Skeleton height={60} sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : posts.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={6}>
              No posts yet. Check back soon.
            </Typography>
          ) : (
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={3}>
              {posts.map((post) => (
                <Card key={post.id} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardActionArea
                    component={Link}
                    href={`/blog/${post.slug}`}
                    sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
                  >
                    {post.featuredImageUrl ? (
                      <Box
                        sx={{
                          height: 180,
                          background: `url(${post.featuredImageUrl}) center/cover`,
                        }}
                      />
                    ) : (
                      <Box sx={{ height: 180, bgcolor: "grey.200" }} />
                    )}
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.excerpt || "No excerpt."}
                      </Typography>
                      {post.publishedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}

          <Box textAlign="center" mt={4}>
            <Link href="/" style={{ color: theme.palette.primary.main, textDecoration: "none" }}>
              ← Back to home
            </Link>
          </Box>
        </Container>
      </Box>
    </>
  );
}
