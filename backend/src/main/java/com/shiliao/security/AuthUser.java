package com.shiliao.security;

import java.util.Set;

/**
 * 登录态：放入 SecurityContext
 */
public class AuthUser {
    private final String userId;
    private final String username;
    private final String name;
    private final String roleKey;
    private final Set<String> permissions;

    public AuthUser(String userId, String username, String name, String roleKey, Set<String> permissions) {
        this.userId = userId;
        this.username = username;
        this.name = name;
        this.roleKey = roleKey;
        this.permissions = permissions;
    }

    public boolean can(String code) {
        return permissions != null && permissions.contains(code);
    }

    public String getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getName() {
        return name;
    }

    public String getRoleKey() {
        return roleKey;
    }

    public Set<String> getPermissions() {
        return permissions;
    }
}
