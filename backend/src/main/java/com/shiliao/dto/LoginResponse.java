package com.shiliao.dto;

import java.util.List;

/** 登录响应：与前端 Session 结构对齐 */
public record LoginResponse(String token, SessionUser user, long expiresAt) {

    public record SessionUser(String id, String name, String username, String roleKey, String avatarColor) {
    }

    public record RoleView(String id, String roleKey, String name, String description,
                           List<String> permissions, boolean builtin, String createdAt) {
    }
}
