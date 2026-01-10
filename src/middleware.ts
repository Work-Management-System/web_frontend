import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

const authRoutes = ["/", "/login", "/set-password", "/reset-password"];

const protectedRoutes = [
  "/users",
  "/users/add-new-user",
  "/users/add-new-user/[id]",
  "/tenant-settings",
  "/system-roles",
  "/dashboard",
  "/tenant-settings",
  "/tenant-settings/add-new-tenant",
  "/timeline",
  "/add-report",
  "/project-listing",
  "/project-listing/add-new-project",
  "/project-listing/[id]",
  "/project-listing/[id]/files",
  "/subscriptions-listing",
  "/subscriptions-listing/add-subscription-plan",
  "/user-subscriptions",
  "/my-reports",
  "/all-reports",
  "/tasks",
  "/attendance",
  "/leave-management",
  "/organization",
  "/logout",
  "/profile",
  "/settings",
  "/project-listing/[id]/documents",
  "/project-listing/[id]/documents/[id]",
];

const dynamicRoutePatterns = [
  /^\/tenant-settings\/[a-zA-Z0-9-]+$/,
  /^\/users\/[a-zA-Z0-9-]+$/,
  /^\/project-listing\/[a-zA-Z0-9-]+$/,
  /^\/project-listing\/[a-zA-Z0-9-]+\/files$/,
  /^\/project-listing\/[a-zA-Z0-9-]+\/documents$/,
  /^\/project-listing\/[a-zA-Z0-9-]+\/documents\/[a-zA-Z0-9-]+$/,
];

function normalizePath(pathname: string): string {
  return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
}

function isProtectedRoute(pathname: string): boolean {
  const normalizedPath = normalizePath(pathname);
  const isStaticProtected = protectedRoutes.includes(normalizedPath);
  const isDynamicProtected = dynamicRoutePatterns.some((pattern) =>
    pattern.test(normalizedPath)
  );
  return isStaticProtected || isDynamicProtected;
}

function isAuthRoute(pathname: string): boolean {
  const normalizedPath = normalizePath(pathname);
  return authRoutes.includes(normalizedPath);
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const normalizedPath = normalizePath(pathname);
  const jwtToken = req.cookies.get("access_token")?.value;

  // Block broken image URLs immediately to prevent 404 loops
  if (
    pathname.includes("profilePlaceholder") ||
    pathname.includes("a6143582309785dca610") ||
    pathname.includes("/static/media/profilePlaceholder")
  ) {
    return new NextResponse(null, { status: 404 });
  }

  let isAuthenticated = false;

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (jwtToken) {
    try {
      const decodedToken: any = jwtDecode(jwtToken);
      if (decodedToken?.exp * 1000 > Date.now()) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.error("Invalid JWT token:", error);
    }
  }

  if (isAuthenticated) {
    if (isAuthRoute(normalizedPath)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (isProtectedRoute(normalizedPath)) {
      return NextResponse.next();
    }
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  if (isProtectedRoute(normalizedPath)) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("accessToken", "", { expires: new Date(0), path: "/" });
    return res;
  }

  return NextResponse.next();
}
