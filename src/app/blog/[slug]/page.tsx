"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Container, Typography, Skeleton, useTheme } from "@mui/material";
import Link from "next/link";
import { PageSEO } from "@/app/components/PageSEO";
import { seoConfig } from "@/configs/seo";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const theme = useTheme();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    async function fetchPost() {
      try {
        const res = await axios.get(`${API_BASE}/blog/slug/${encodeURIComponent(slug)}`);
        const data = res.data?.data;
        if (cancelled) return;
        setPost(data || null);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPost();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", py: 6 }}>
        <Container maxWidth="md">
          <Skeleton height={48} width="80%" />
          <Skeleton height={24} width="40%" sx={{ mt: 2 }} />
          <Skeleton variant="rectangular" height={320} sx={{ mt: 3 }} />
          <Skeleton height={200} sx={{ mt: 3 }} />
        </Container>
      </Box>
    );
  }

  if (error || !post) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box textAlign="center">
          <Typography variant="h5">Post not found</Typography>
          <Link href="/blog" style={{ color: theme.palette.primary.main, marginTop: 16, display: "inline-block" }}>
            Back to blog
          </Link>
        </Box>
      </Box>
    );
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || post.title;
  const ogImage = post.ogImage || post.featuredImageUrl || seoConfig.ogImage;
  const canonicalPath = `/blog/${post.slug}`;

  return (
    <>
      <PageSEO
        title={`${title} | ${seoConfig.siteName}`}
        description={description}
        path={canonicalPath}
        ogImage={ogImage || undefined}
      />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
          pb: 8,
        }}
      >
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Typography variant="overline" color="text.secondary">
            Blog
          </Typography>
          <Typography variant="h3" component="h1" fontWeight={700} sx={{ mt: 0.5 }}>
            {post.title}
          </Typography>
          {post.publishedAt && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {new Date(post.publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
          )}

          {post.featuredImageUrl && (
            <Box
              sx={{
                mt: 3,
                mb: 3,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "grey.200",
                aspectRatio: "16/9",
                background: `url(${post.featuredImageUrl}) center/cover`,
              }}
            />
          )}

          <Box
            className="blog-content"
            sx={{
              "& .blog-content img": { maxWidth: "100%", height: "auto" },
              "& .blog-content a": { color: "primary.main" },
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <Box mt={4}>
            <Link href="/blog" style={{ color: theme.palette.primary.main, textDecoration: "none" }}>
              ← All posts
            </Link>
          </Box>
        </Container>
      </Box>
    </>
  );
}
