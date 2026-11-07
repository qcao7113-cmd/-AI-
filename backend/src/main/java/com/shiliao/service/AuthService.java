package com.shiliao.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shiliao.common.BizException;
import com.shiliao.common.R;
import com.shiliao.common.Converters;
import com.shiliao.dto.LoginResponse;
import com.shiliao.dto.Views;
import com.shiliao.entity.AuditLog;
import com.shiliao.entity.Role;
import com.shiliao.entity.User;
import com.shiliao.repository.AuditLogMapper;
import com.shiliao.repository.RoleMapper;
import com.shiliao.repository.UserMapper;
import com.shiliao.security.AuthUser;
import com.shiliao.security.JwtTool;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 认证、角色与审计日志
 */
@Service
public class AuthService {

    public AuthService(UserMapper userMapper, RoleMapper roleMapper, AuditLogMapper auditLogMapper, JwtTool jwtTool, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.auditLogMapper = auditLogMapper;
        this.jwtTool = jwtTool;
        this.passwordEncoder = passwordEncoder;
    }

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final AuditLogMapper auditLogMapper;
    private final JwtTool jwtTool;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(String username, String password) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user == null) {
            throw new BizException(401, "账号不存在");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            log(user.getName(), "login", "认证中心", "账号 " + username + " 密码错误", "fail");
            throw new BizException(401, "密码错误");
        }
        if (!"active".equals(user.getStatus())) {
            throw new BizException(403, "该账号已被停用，请联系管理员");
        }
        user.setLastLoginAt(LocalDateTime.now());
        userMapper.updateById(user);
        log(user.getName(), "login", "认证中心", "账号 " + username + " 登录成功", "success");

        String token = jwtTool.issue(user.getId(), user.getUsername(), user.getRoleKey());
        long expiresAt = System.currentTimeMillis() + jwtTool.getExpireMillis();
        return new LoginResponse(token,
                new LoginResponse.SessionUser(user.getId(), user.getName(), user.getUsername(),
                        user.getRoleKey(), user.getAvatarColor()),
                expiresAt);
    }

    public AuthUser profile(AuthUser current) {
        if (current == null) throw new BizException(401, "未登录");
        return current;
    }

    public List<Views.RoleView> listRoles() {
        return roleMapper.selectList(null).stream()
                .map(r -> new Views.RoleView(r.getId(), r.getRoleKey(), r.getName(), r.getDescription(),
                        Converters.split(r.getPermissions()), Boolean.TRUE.equals(r.getBuiltin()),
                        Converters.ts(r.getCreatedAt())))
                .toList();
    }

    @Transactional
    public Views.RoleView updateRolePermissions(String id, List<String> permissions, AuthUser operator) {
        Role role = roleMapper.selectById(id);
        if (role == null) throw new BizException(404, "角色不存在");
        if ("admin".equals(role.getRoleKey())) throw new BizException(403, "超级管理员权限不可修改");
        role.setPermissions(Converters.join(permissions));
        roleMapper.updateById(role);
        log(operator.getName(), "update", "角色 " + role.getName(), "权限变更：" + role.getPermissions(), "success");
        return new Views.RoleView(role.getId(), role.getRoleKey(), role.getName(), role.getDescription(),
                Converters.split(role.getPermissions()), Boolean.TRUE.equals(role.getBuiltin()),
                Converters.ts(role.getCreatedAt()));
    }

    public R.PageResult<AuditLog> pageLogs(int page, int pageSize, String keyword, String action) {
        LambdaQueryWrapper<AuditLog> qw = new LambdaQueryWrapper<AuditLog>()
                .eq(action != null && !action.isBlank(), AuditLog::getAction, action)
                .and(keyword != null && !keyword.isBlank(), w -> w
                        .like(AuditLog::getOperator, keyword)
                        .or().like(AuditLog::getTarget, keyword)
                        .or().like(AuditLog::getDetail, keyword))
                .orderByDesc(AuditLog::getCreatedAt);
        Page<AuditLog> p = auditLogMapper.selectPage(new Page<>(page, pageSize), qw);
        return R.PageResult.of(p.getRecords(), p.getTotal(), page, pageSize);
    }

    public void log(String operator, String action, String target, String detail, String result) {
        AuditLog log = new AuditLog();
        log.setId(UUID.randomUUID().toString().replace("-", ""));
        log.setOperator(operator);
        log.setAction(action);
        log.setTarget(target);
        log.setDetail(detail);
        log.setIp("127.0.0.1");
        log.setResult(result);
        log.setCreatedAt(LocalDateTime.now());
        auditLogMapper.insert(log);
    }
}
