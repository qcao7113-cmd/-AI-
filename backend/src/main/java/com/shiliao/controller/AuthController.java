package com.shiliao.controller;

import com.shiliao.common.R;
import com.shiliao.dto.LoginRequest;
import com.shiliao.dto.LoginResponse;
import com.shiliao.entity.AuditLog;
import com.shiliao.security.AuthUser;
import com.shiliao.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** 认证：登录、当前用户、角色、审计日志 */
@RestController
@RequestMapping("/api")
public class AuthController {

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private final AuthService authService;

    @PostMapping("/auth/login")
    public R<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return R.ok(authService.login(req.username(), req.password()));
    }

    @GetMapping("/auth/me")
    public R<Map<String, Object>> me(@AuthenticationPrincipal AuthUser user) {
        AuthUser u = authService.profile(user);
        return R.ok(Map.of(
                "id", u.getUserId(),
                "username", u.getUsername(),
                "name", u.getName(),
                "roleKey", u.getRoleKey(),
                "permissions", u.getPermissions()));
    }

    @GetMapping("/roles")
    public R<List<com.shiliao.dto.Views.RoleView>> roles() {
        return R.ok(authService.listRoles());
    }

    @PutMapping("/roles/{id}/permissions")
    public R<com.shiliao.dto.Views.RoleView> updatePermissions(@PathVariable String id,
                                                              @RequestBody List<String> permissions,
                                                              @AuthenticationPrincipal AuthUser user) {
        return R.ok(authService.updateRolePermissions(id, permissions, user));
    }

    @GetMapping("/logs")
    public R<R.PageResult<AuditLog>> logs(@RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "12") int pageSize,
                                          @RequestParam(required = false) String keyword,
                                          @RequestParam(required = false) String action) {
        return R.ok(authService.pageLogs(page, pageSize, keyword, action));
    }
}
