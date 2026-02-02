/**
 * Authentication and authorization utilities
 * Placeholder for auth implementation
 */

export type Role = 'BUYER' | 'SELLER' | 'OPERATOR' | 'INSPECTOR';

/**
 * Get current user role
 * TODO: Implement with actual auth system
 */
export function getCurrentUserRole(): Role {
  // Placeholder - in production, get from auth context/JWT
  if (typeof window === 'undefined') {
    return 'BUYER'; // Server-side default
  }

  // Check localStorage or cookie for role
  const storedRole = localStorage.getItem('userRole');
  if (storedRole && ['BUYER', 'SELLER', 'OPERATOR', 'INSPECTOR'].includes(storedRole)) {
    return storedRole as Role;
  }

  return 'BUYER'; // Default
}

/**
 * Check if user has required role
 */
export function hasRole(requiredRole: Role | Role[]): boolean {
  const userRole = getCurrentUserRole();
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
}

/**
 * Check if route requires admin (OPERATOR role)
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Protect route based on role
 */
export function requireRole(requiredRole: Role | Role[]): boolean {
  if (!hasRole(requiredRole)) {
    // In production, redirect to unauthorized page
    console.warn(`Access denied: Required role ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}`);
    return false;
  }
  return true;
}
